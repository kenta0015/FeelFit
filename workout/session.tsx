// app/workout/session.tsx
// Unified Workout Session screen with safe finish emission.
// Route: /workout/session?duration=600&exerciseId=xxx&style=female&mode=recovery

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
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
    }
    return EXERCISES[0];
  }, [params.exerciseId]);

  const exerciseWithDuration: Exercise | undefined = useMemo(() => {
    if (!baseExercise) return undefined;
    const dur = Number(params.duration ?? baseExercise.duration);
    if (!Number.isFinite(dur) || dur <= 0) return baseExercise;
    return { ...baseExercise, duration: Math.round(dur) } as Exercise;
  }, [baseExercise, params.duration]);

  // Fire start once on mount
  useEffect(() => {
    if (!exerciseWithDuration) return;
    const durationSec = Number(params.duration ?? exerciseWithDuration.duration) || 0;
    dispatchGlobalEvent("feelFit:workout-start", {
      duration: durationSec,
      exerciseId: exerciseWithDuration.id,
      mode: params.mode,
      origin: "workout/session",
      platform: Platform.OS,
    });
    return () => {
      // Defensive finish if user leaves the screen
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

      <View style={styles.body}>
        <WorkoutTimer
          exercise={exerciseWithDuration}
          onComplete={onComplete}
          onCancel={onCancel}
          voicePreference={voicePreference}
        />
      </View>
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
