// app/workout/session.tsx
// Unified Workout Session screen with safe finish emission.
// Route: /workout/session?duration=600&exerciseId=xxx&style=female&mode=recovery
// Changes:
// - Emit workout-start with explicit exerciseId, name, and inferred audioType (healing/motivational).
// - Guard against duplicate start emissions.
// - Keep WorkoutTimer minutes logic intact; orchestrator receives seconds.

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import WorkoutTimer from "@/components/WorkoutTimer";
import { EXERCISES } from "@/data/exercises";
import { ArrowLeft } from "lucide-react-native";
import { getUser, createUser } from "@/utils/storage";

type Exercise = (typeof EXERCISES)[number];

function dispatchGlobalEvent(type: string, detail?: Record<string, any>) {
  const target: any = typeof window !== "undefined" ? window : globalThis;
  try {
    const evt =
      typeof CustomEvent !== "undefined"
        ? new CustomEvent(type, { detail })
        : { type, detail };
    target.dispatchEvent?.(evt as any);
  } catch {}
}

// Heuristic classification for BGM kind (fallback if exercise.audioType is absent)
type ContentKind = "healing" | "motivational";
const HEALING_HINTS = ["breath", "breathing", "medit", "yoga", "stretch", "calm", "relax", "recovery"];
const MOTIVE_HINTS = ["hiit", "run", "cardio", "strength", "power", "workout", "motive", "speed", "intense"];

function classifyContentKind(ex?: Exercise): ContentKind | null {
  // 1) explicit field on exercise if present
  const at = (ex as any)?.audioType as string | undefined;
  if (at === "healing" || at === "motivational") return at;

  // 2) fuzzy by id/name/category
  const seed = `${ex?.id ?? ""}|${ex?.name ?? ""}|${(ex as any)?.category ?? ""}`.toLowerCase();
  if (!seed) return null;
  if (HEALING_HINTS.some((k) => seed.includes(k))) return "healing";
  if (MOTIVE_HINTS.some((k) => seed.includes(k))) return "motivational";
  return null;
}

export default function WorkoutSessionScreen() {
  const params = useLocalSearchParams<{
    duration?: string;   // seconds
    exerciseId?: string;
    style?: string;      // "male" | "female" | etc.
    mode?: string;       // "recovery" | undefined
  }>();

  const [voicePreference, setVoicePreference] = useState<"male" | "female">(
    (params.style as "male" | "female") || "female"
  );

  // Load persisted voice preference (local storage layer)
  useEffect(() => {
    (async () => {
      const u = await getUser();
      if (!u) {
        const created = await createUser("User");
        if (created?.audioVoicePreference === "male" || created?.audioVoicePreference === "female") {
          setVoicePreference(created.audioVoicePreference);
        }
      } else if (u?.audioVoicePreference === "male" || u?.audioVoicePreference === "female") {
        setVoicePreference(u.audioVoicePreference);
      }
    })();
  }, []);

  const baseExercise: Exercise | undefined = useMemo(() => {
    const id = params.exerciseId;
    if (id) {
      const found = EXERCISES.find((ex) => ex.id === id);
      if (found) return found;
      // fallback by loose match on name
      const loose = EXERCISES.find((ex) => ex.name?.toLowerCase?.() === id.toLowerCase());
      if (loose) return loose;
    }
    return EXERCISES[0];
  }, [params.exerciseId]);

  // Convert duration (seconds query) -> minutes for WorkoutTimer/exercise.duration
  const exerciseWithDuration: Exercise | undefined = useMemo(() => {
    if (!baseExercise) return undefined;
    const sec = Number(params.duration);
    if (Number.isFinite(sec) && sec > 0) {
      const minutes = Math.max(1, Math.round(sec / 60));
      return { ...baseExercise, duration: minutes } as Exercise;
    }
    return baseExercise;
  }, [baseExercise, params.duration]);

  // Emit workout-start exactly once per screen mount with seconds
  const startedRef = useRef(false);
  useEffect(() => {
    if (!exerciseWithDuration || startedRef.current) return;

    const secFromQuery = Number(params.duration);
    const durationSec =
      Number.isFinite(secFromQuery) && secFromQuery > 0
        ? Math.round(secFromQuery)
        : Math.max(1, Math.round((exerciseWithDuration.duration || 0) * 60));

    const kind = classifyContentKind(exerciseWithDuration);

    // Emit with rich detail so the Player can route BGM reliably
    dispatchGlobalEvent("feelFit:workout-start", {
      duration: durationSec,
      exerciseId: exerciseWithDuration.id,              // exact id for EXERCISES lookup on Player
      workout: exerciseWithDuration.name ?? exerciseWithDuration.id, // heuristic seed ("yoga", etc.)
      type: kind ?? (exerciseWithDuration as any)?.category ?? "",    // extra hint for fuzzy fallback
      audioType: kind ?? "",                             // explicit for any future consumers
      mode: params.mode,
      origin: "workout/session",
      platform: Platform.OS,
    });

    startedRef.current = true;

    return () => {
      dispatchGlobalEvent("feelFit:workout-finish", { origin: "session:unmount" });
    };
  }, [exerciseWithDuration, params.duration, params.mode]);

  const onComplete = useCallback((completionPercentage: number) => {
    dispatchGlobalEvent("feelFit:workout-finish", {
      origin: "session:complete",
      completion: completionPercentage,
    });
    router.replace("/(tabs)");
  }, []);

  const onCancel = useCallback(() => {
    dispatchGlobalEvent("feelFit:workout-finish", { origin: "session:cancel" });
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, []);

  if (!exerciseWithDuration) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onCancel}>
            <ArrowLeft size={24} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.appTitle}>FEEL FIT</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>No exercise available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onCancel}>
          <ArrowLeft size={24} color="#6366f1" />
        </TouchableOpacity>
        <Text style={styles.appTitle}>FEEL FIT</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <WorkoutTimer
            exercise={exerciseWithDuration}
            onComplete={onComplete}
            onCancel={onCancel}
            voicePreference={voicePreference}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: { padding: 8, width: 40 },
  appTitle: { fontSize: 24, fontWeight: "bold", color: "#6366f1", letterSpacing: 1 },
  spacer: { width: 40 },
  body: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#ef4444", fontSize: 16, fontWeight: "600" },
});
