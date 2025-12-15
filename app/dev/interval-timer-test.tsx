// app/dev/interval-timer-test.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { useVoiceDuck } from "../../hooks/useVoiceDuck";
import { useAudioMixer } from "../../hooks/useAudioMixer";
import { setEngine, clearEngine, CoachEngine } from "../../lib/engineRegistry";

function Button({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        backgroundColor: "#111827",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginVertical: 6,
      })}
    >
      <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>{title}</Text>
    </Pressable>
  );
}

type Phase = "idle" | "running" | "paused" | "finished";

export default function IntervalTimerTest() {
  const mixer = useAudioMixer();
  const { sayWithDuck, busy } = useVoiceDuck({ timeoutMs: 10000, minGapMs: 300 });
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0); // elapsed
  const total = 90; // 90s demo
  const tickRef = useRef<NodeJS.Timer | number | null>(null);
  const lastCueRef = useRef<number>(-1);

  const clearTick = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current as number);
      tickRef.current = null;
    }
  };

  const start = useCallback(async () => {
    if (phase === "running") return;
    setSeconds(0);
    setPhase("running");
    lastCueRef.current = -1;
    await sayWithDuck("Interval timer test. Ninety seconds.");
    tickRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, [phase, sayWithDuck]);

  const pause = useCallback(async () => {
    if (phase !== "running") return;
    clearTick();
    setPhase("paused");
    await sayWithDuck("Paused.");
  }, [phase, sayWithDuck]);

  const resume = useCallback(async () => {
    if (phase !== "paused") return;
    setPhase("running");
    await sayWithDuck("Resumed.");
    tickRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, [phase, sayWithDuck]);

  const stop = useCallback(async () => {
    if (phase === "idle") return;
    clearTick();
    setPhase("finished");
    await sayWithDuck("Stopped. Test complete.");
  }, [phase, sayWithDuck]);

  // expose engine to voice intents (micro-test)
  useEffect(() => {
    const engine: CoachEngine = {
      pause,
      resume,
      skip: stop,
      getRemainingSeconds: () => Math.max(0, total - seconds),
    };
    setEngine(engine);
    return () => {
      clearEngine();
    };
  }, [pause, resume, stop, seconds]);

  // timed cues
  useEffect(() => {
    if (phase !== "running") return;
    const s = seconds;

    if (s >= total) {
      void stop();
      return;
    }

    const cue = async (mark: number, text: string) => {
      if (s === mark && lastCueRef.current !== mark) {
        lastCueRef.current = mark;
        await sayWithDuck(text);
      }
    };

    void cue(0, "Warm up begins. Easy pace.");
    void cue(15, "Fifteen seconds. Prepare to push.");
    void cue(30, "Go hard for thirty seconds.");
    void cue(60, "Recover. Nice and easy.");
    void cue(80, "Final ten seconds.");
  }, [seconds, phase, sayWithDuck, stop]);

  useEffect(() => {
    return () => {
      clearTick();
    };
  }, []);

  const remaining = Math.max(0, total - seconds);
  const pct = Math.min(100, Math.round((seconds / total) * 100));

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>Interval Timer Test (Web)</Text>
      <Text style={{ color: "#4B5563", marginBottom: 8 }}>
        Auto voice cues with music ducking at milestones. Also registers a control engine for Micro screen.
      </Text>

      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        <Button title="Start" onPress={start} disabled={busy || phase === "running"} />
        <Button title="Pause" onPress={pause} disabled={busy || phase !== "running"} />
        <Button title="Resume" onPress={resume} disabled={busy || phase !== "paused"} />
        <Button title="Stop" onPress={stop} disabled={busy || phase === "idle"} />
      </View>

      <View style={{ marginTop: 12, padding: 12, backgroundColor: "#F3F4F6", borderRadius: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 6 }}>Status</Text>
        <Text>Phase: {phase}</Text>
        <Text>Elapsed: {seconds}s / {total}s</Text>
        <Text>Remaining: {remaining}s</Text>
        <View style={{ height: 8 }} />
        <View style={{ width: "100%", height: 10, backgroundColor: "#E5E7EB", borderRadius: 6, overflow: "hidden" }}>
          <View style={{ width: `${pct}%`, height: "100%", backgroundColor: "#2563EB" }} />
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
        {(busy || phase === "running") && <ActivityIndicator />}
        <Text style={{ color: busy ? "#EF4444" : "#10B981" }}>
          {busy ? "Speaking… (ducking ON)" : "Idle"}
        </Text>
      </View>

      <View style={{ marginTop: 12, padding: 12, backgroundColor: "#F3F4F6", borderRadius: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 6 }}>Mixer (snapshot)</Text>
        <Text style={{ fontFamily: "monospace" }}>
          {JSON.stringify(
            {
              isReady: mixer.state.isReady,
              isPlayingA: mixer.state.isPlayingA,
              ducking: mixer.state.ducking,
              bpmTier: mixer.state.bpmTier,
              volumeA: mixer.state.volumeA,
            },
            null,
            2
          )}
        </Text>
      </View>

      <View style={{ height: 12 }} />
      <Link href="/dev/micro-test" style={{ color: "#2563EB", fontWeight: "700" }}>
        ↩ Go to /dev/micro-test
      </Link>
      <Text />
      <Link href="/dev/mixer-test" style={{ color: "#2563EB", fontWeight: "700" }}>
        ↩ Go to /dev/mixer-test
      </Link>
      <Text />
      <Link href="/dev/coach-test" style={{ color: "#2563EB", fontWeight: "700" }}>
        ↩ Go to /dev/coach-test
      </Link>
    </ScrollView>
  );
}
