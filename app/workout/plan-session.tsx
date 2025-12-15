// app/workout/plan-session.tsx
// Plan Runner (Step 1): sequentially run Plan.blocks with optional rest between blocks.
// Route: /workout/plan-session
// Optional params:
//  - plan: JSON stringified Plan (for debug only)
// Storage (optional):
//  - AsyncStorage key: feel_fit_active_plan_v1

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeft, Play, Pause, SkipForward, Square, RotateCcw } from "lucide-react-native";

import type { Plan, PlanBlock } from "@/types/plan";

type Phase = "work" | "rest";

const ACTIVE_PLAN_KEY = "feel_fit_active_plan_v1";
const REST_DEFAULT_SECONDS = 60;

function showAlert(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMMSS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function safeParsePlan(json: string): Plan | null {
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return null;
    if (!Array.isArray((obj as any).blocks)) return null;
    if (typeof (obj as any).title !== "string") return null;
    if (typeof (obj as any).totalTime !== "number") return null;

    const blocks = (obj as any).blocks as any[];
    for (const b of blocks) {
      if (!b || typeof b !== "object") return null;
      if (typeof b.id !== "string") return null;
      if (typeof b.title !== "string") return null;
      if (typeof b.duration !== "number") return null;
    }

    return obj as Plan;
  } catch {
    return null;
  }
}

function createDemoPlan(): Plan {
  const blocks: PlanBlock[] = [
    {
      id: "demo-1",
      title: "Mindful Breathing",
      duration: 10,
      met: 1.0,
      intensity: "low",
      category: "mindfulness",
    },
    {
      id: "demo-2",
      title: "Push-ups (light)",
      duration: 10,
      met: 4.0,
      intensity: "med",
      category: "strength",
    },
    {
      id: "demo-3",
      title: "Easy Jog (indoor/outdoor)",
      duration: 10,
      met: 6.0,
      intensity: "med",
      category: "cardio",
    },
  ];

  return {
    title: "Demo Plan (30 min)",
    blocks,
    totalTime: 30,
    why: ["Demo plan for Plan Runner Step 1."],
  };
}

export default function PlanSessionScreen() {
  const params = useLocalSearchParams<{ plan?: string }>();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [phase, setPhase] = useState<Phase>("work");
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const intervalRef = useRef<any>(null);

  const blocks = plan?.blocks ?? [];

  const currentBlock = useMemo(() => {
    if (!plan) return null;
    return plan.blocks[currentIndex] ?? null;
  }, [plan, currentIndex]);

  const nextBlock = useMemo(() => {
    if (!plan) return null;
    return plan.blocks[currentIndex + 1] ?? null;
  }, [plan, currentIndex]);

  const workTotalSeconds = useMemo(() => {
    if (!currentBlock) return 0;
    const minutes = Number(currentBlock.duration ?? 0);
    if (!Number.isFinite(minutes) || minutes <= 0) return 0;
    return Math.round(minutes * 60);
  }, [currentBlock]);

  const restTotalSeconds = REST_DEFAULT_SECONDS;

  const phaseTotalSeconds = useMemo(() => {
    return phase === "work" ? workTotalSeconds : restTotalSeconds;
  }, [phase, workTotalSeconds, restTotalSeconds]);

  const phaseProgressPercent = useMemo(() => {
    if (!phaseTotalSeconds) return 0;
    const done = clamp(phaseTotalSeconds - secondsLeft, 0, phaseTotalSeconds);
    return Math.round((done / phaseTotalSeconds) * 100);
  }, [phaseTotalSeconds, secondsLeft]);

  const overallProgressPercent = useMemo(() => {
    if (!plan || plan.blocks.length === 0) return 0;

    const totalPlanSeconds = plan.blocks.reduce((sum, b) => sum + Math.max(0, Math.round((b.duration ?? 0) * 60)), 0);
    if (totalPlanSeconds <= 0) return 0;

    const secondsCompletedFromPastBlocks = plan.blocks
      .slice(0, currentIndex)
      .reduce((sum, b) => sum + Math.max(0, Math.round((b.duration ?? 0) * 60)), 0);

    const currentWorkDone = phase === "work" ? clamp(workTotalSeconds - secondsLeft, 0, workTotalSeconds) : workTotalSeconds;

    const totalDone = clamp(secondsCompletedFromPastBlocks + currentWorkDone, 0, totalPlanSeconds);
    return Math.round((totalDone / totalPlanSeconds) * 100);
  }, [plan, currentIndex, phase, workTotalSeconds, secondsLeft]);

  const initForNewPlan = useCallback((p: Plan) => {
    setPlan(p);
    setPhase("work");
    setCurrentIndex(0);
    const first = p.blocks?.[0];
    const firstSec = Math.max(1, Math.round((first?.duration ?? 1) * 60));
    setSecondsLeft(firstSec);
    setIsRunning(false);

    // eslint-disable-next-line no-console
    console.log("[PlanSession] init plan", {
      title: p.title,
      blocks: p.blocks.length,
      first: first?.title,
      firstSec,
    });
  }, []);

  const loadPlan = useCallback(async () => {
    // 1) params.plan (debug)
    if (typeof params.plan === "string" && params.plan.trim().length > 0) {
      const parsed = safeParsePlan(params.plan);
      if (parsed) {
        initForNewPlan(parsed);
        return;
      }
    }

    // 2) AsyncStorage active plan
    try {
      const raw = await AsyncStorage.getItem(ACTIVE_PLAN_KEY);
      if (raw) {
        const parsed = safeParsePlan(raw);
        if (parsed) {
          initForNewPlan(parsed);
          return;
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("[PlanSession] failed to read active plan from storage", e);
    }

    // No plan found
    setPlan(null);
    setIsRunning(false);
    setSecondsLeft(0);
    setCurrentIndex(0);
    setPhase("work");
  }, [params.plan, initForNewPlan]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  // Timer loop
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const goNextPhase = useCallback(
    (workCompletionPercent?: number) => {
      if (!plan || plan.blocks.length === 0) return;

      if (phase === "work") {
        const completion = typeof workCompletionPercent === "number" ? clamp(Math.round(workCompletionPercent), 0, 100) : 100;

        // eslint-disable-next-line no-console
        console.log("[PlanSession] block complete", {
          blockIndex: currentIndex,
          blockTitle: currentBlock?.title,
          completion,
        });

        const hasNext = currentIndex < plan.blocks.length - 1;
        if (hasNext) {
          setPhase("rest");
          setSecondsLeft(restTotalSeconds);
          setIsRunning(true);
        } else {
          setIsRunning(false);
          showAlert("Completed", "You completed the plan.");
          router.replace("/(tabs)");
        }
        return;
      }

      // phase === "rest"
      const nextIdx = currentIndex + 1;
      const next = plan.blocks[nextIdx];
      if (!next) {
        setIsRunning(false);
        router.replace("/(tabs)");
        return;
      }

      setCurrentIndex(nextIdx);
      setPhase("work");
      setSecondsLeft(Math.max(1, Math.round((next.duration ?? 1) * 60)));
      setIsRunning(true);
    },
    [plan, phase, currentIndex, currentBlock, restTotalSeconds]
  );

  // Auto-advance when timer hits 0
  useEffect(() => {
    if (!plan) return;
    if (secondsLeft !== 0) return;

    if (phaseTotalSeconds <= 0) return;

    if (phase === "work") {
      setIsRunning(false);
      goNextPhase(100);
    } else {
      setIsRunning(false);
      goNextPhase();
    }
  }, [plan, secondsLeft, phase, phaseTotalSeconds, goNextPhase]);

  const onToggleRun = useCallback(() => {
    if (!plan || plan.blocks.length === 0) return;
    if (secondsLeft <= 0) return;
    setIsRunning((v) => !v);
  }, [plan, secondsLeft]);

  const onSkipRest = useCallback(() => {
    if (!plan) return;
    if (phase !== "rest") return;
    // eslint-disable-next-line no-console
    console.log("[PlanSession] rest skipped", { blockIndex: currentIndex });
    setIsRunning(false);
    goNextPhase();
  }, [plan, phase, currentIndex, goNextPhase]);

  const onFinishBlockNow = useCallback(() => {
    if (!plan) return;
    if (phase !== "work") return;

    const total = workTotalSeconds;
    if (total <= 0) return;

    const done = clamp(total - secondsLeft, 0, total);
    const percent = Math.round((done / total) * 100);

    showAlert(
      "Finish this block?",
      `This will mark the current block as complete.\n\nCurrent progress: ${percent}%`
    );

    setIsRunning(false);
    goNextPhase(percent);
  }, [plan, phase, workTotalSeconds, secondsLeft, goNextPhase]);

  const onCancel = useCallback(() => {
    const message = "Exit the plan session?\n\nYour progress will not be saved yet (save/resume will be added in a later step).";
    if (Platform.OS === "web" && typeof window !== "undefined" && typeof window.confirm === "function") {
      const ok = window.confirm(message);
      if (!ok) return;
      if (router.canGoBack()) router.back();
      else router.replace("/(tabs)");
      return;
    }

    Alert.alert("Exit", message, [
      { text: "Stay", style: "cancel" },
      {
        text: "Exit",
        style: "destructive",
        onPress: () => {
          if (router.canGoBack()) router.back();
          else router.replace("/(tabs)");
        },
      },
    ]);
  }, []);

  const onReset = useCallback(() => {
    if (!plan) return;
    if (plan.blocks.length === 0) return;

    Alert.alert("Restart", "Restart from the first block?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restart",
        style: "destructive",
        onPress: () => initForNewPlan(plan),
      },
    ]);
  }, [plan, initForNewPlan]);

  const onLoadDemo = useCallback(() => {
    const demo = createDemoPlan();
    initForNewPlan(demo);
  }, [initForNewPlan]);

  const headerSubtitle = useMemo(() => {
    if (!plan) return "No active plan";
    if (!currentBlock) return plan.title;
    const idx = currentIndex + 1;
    const total = plan.blocks.length;
    if (phase === "work") return `Block ${idx}/${total}`;
    return `Rest (${idx}/${total})`;
  }, [plan, currentBlock, currentIndex, phase]);

  const mainTitle = useMemo(() => {
    if (!plan) return "Plan Session";
    if (phase === "rest") return "Rest";
    return currentBlock?.title ?? "Workout";
  }, [plan, phase, currentBlock]);

  const descriptionLine = useMemo(() => {
    if (!plan) return "Load a plan to start.";
    if (phase === "rest") return "Take a short break. You can skip anytime.";
    if (!currentBlock) return "";
    const bits: string[] = [];
    if (currentBlock.category) bits.push(String(currentBlock.category));
    if (currentBlock.intensity) bits.push(String(currentBlock.intensity));
    if (Number.isFinite(currentBlock.met)) bits.push(`MET ${Number(currentBlock.met).toFixed(1)}`);
    return bits.join(" • ");
  }, [plan, phase, currentBlock]);

  const nextUpLine = useMemo(() => {
    if (!plan) return "";
    if (phase === "rest") return nextBlock ? `Next: ${nextBlock.title}` : "";
    return nextBlock ? `Up next (after rest): ${nextBlock.title}` : "Final block";
  }, [plan, phase, nextBlock]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onCancel}>
          <ArrowLeft size={24} color="#6366f1" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.appTitle}>FEEL FIT</Text>
          <Text style={styles.subtitle}>{headerSubtitle}</Text>
        </View>
        <TouchableOpacity style={styles.resetButton} onPress={onReset} disabled={!plan}>
          <RotateCcw size={20} color={plan ? "#6366f1" : "#9ca3af"} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {!plan ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No plan found</Text>
            <Text style={styles.emptyText}>
              This screen expects an active plan (Step 2 will connect Suggestion → Plan Session).
            </Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={onLoadDemo}>
              <Text style={styles.primaryBtnText}>Load Demo Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>{mainTitle}</Text>
            <Text style={styles.desc}>{descriptionLine}</Text>

            <View style={styles.timerBox}>
              <Text style={styles.timerText}>{formatMMSS(secondsLeft)}</Text>
              <Text style={styles.progressText}>
                Phase {phaseProgressPercent}% • Overall {overallProgressPercent}%
              </Text>
            </View>

            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.controlBtn} onPress={onToggleRun} disabled={secondsLeft <= 0}>
                {isRunning ? <Pause size={18} color="#111827" /> : <Play size={18} color="#111827" />}
                <Text style={styles.controlBtnText}>{isRunning ? "Pause" : "Start"}</Text>
              </TouchableOpacity>

              {phase === "rest" ? (
                <TouchableOpacity style={styles.controlBtn} onPress={onSkipRest}>
                  <SkipForward size={18} color="#111827" />
                  <Text style={styles.controlBtnText}>Skip</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.controlBtn} onPress={onFinishBlockNow}>
                  <Square size={18} color="#111827" />
                  <Text style={styles.controlBtnText}>Finish</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.metaBox}>
              <Text style={styles.metaTitle}>Plan</Text>
              <Text style={styles.metaText}>{plan.title}</Text>

              <View style={styles.divider} />

              <Text style={styles.metaTitle}>Next</Text>
              <Text style={styles.metaText}>{nextUpLine}</Text>
            </View>
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: { padding: 8, width: 40 },
  resetButton: { padding: 8, width: 40, alignItems: "flex-end" },
  headerCenter: { alignItems: "center", flex: 1 },
  appTitle: { fontSize: 20, fontWeight: "800", color: "#6366f1", letterSpacing: 1 },
  subtitle: { marginTop: 2, fontSize: 12, color: "#6b7280", fontWeight: "700" },

  body: { padding: 16 },

  emptyBox: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 6 },
  emptyText: { fontSize: 14, color: "#4b5563", lineHeight: 20, marginBottom: 12 },

  primaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#6366f1",
    alignItems: "center",
  },
  primaryBtnText: { color: "#ffffff", fontWeight: "800" },

  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 20, fontWeight: "900", color: "#111827", marginBottom: 6 },
  desc: { fontSize: 13, color: "#6b7280", marginBottom: 14 },

  timerBox: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    marginBottom: 14,
  },
  timerText: { fontSize: 44, fontWeight: "900", color: "#111827" },
  progressText: { marginTop: 6, fontSize: 12, color: "#374151", fontWeight: "700" },

  controlsRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginBottom: 14 },
  controlBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  controlBtnText: { fontWeight: "800", color: "#111827" },

  metaBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  metaTitle: { fontSize: 12, fontWeight: "900", color: "#111827" },
  metaText: { marginTop: 4, fontSize: 13, color: "#374151", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 12 },
}); 
