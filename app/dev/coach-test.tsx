// app/dev/coach-test.tsx
import React, { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { useVoiceDuck } from "../../hooks/useVoiceDuck";

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

export default function CoachTestScreen() {
  const { sayWithDuck, busy, mixerState } = useVoiceDuck({ timeoutMs: 10000 });
  const [seqBusy, setSeqBusy] = useState(false);

  const playWarmupSequence = useCallback(async () => {
    if (seqBusy) return;
    setSeqBusy(true);
    try {
      await sayWithDuck("Warm up begins. Nice and easy.");
      await sayWithDuck("Thirty seconds easy jog.");
      await sayWithDuck("Get ready to switch.");
      await sayWithDuck("Switch. Increase your pace slightly.");
      await sayWithDuck("Great job. Warm up complete.");
    } finally {
      setSeqBusy(false);
    }
  }, [sayWithDuck, seqBusy]);

  const playIntervalBlock = useCallback(async () => {
    if (seqBusy) return;
    setSeqBusy(true);
    try {
      await sayWithDuck("Interval block. Two rounds.");
      await sayWithDuck("Round one. Go hard for thirty seconds.");
      await sayWithDuck("Recover for thirty seconds.");
      await sayWithDuck("Round two. Go hard for thirty seconds.");
      await sayWithDuck("Recover for thirty seconds. Block complete.");
    } finally {
      setSeqBusy(false);
    }
  }, [sayWithDuck, seqBusy]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>Coach Test (Web)</Text>
      <Text style={{ color: "#4B5563", marginBottom: 8 }}>
        Sequenced voice guidance with automatic music ducking.
      </Text>

      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
        <Button title="Warm-up Sequence" onPress={playWarmupSequence} disabled={busy || seqBusy} />
        <Button title="Interval Block" onPress={playIntervalBlock} disabled={busy || seqBusy} />
        <Button title="Single Cue: Hydrate" onPress={() => sayWithDuck("Hydrate now.")} disabled={busy || seqBusy} />
      </View>

      <View style={{ marginTop: 20, padding: 12, backgroundColor: "#F3F4F6", borderRadius: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 6 }}>Mixer State (snapshot)</Text>
        <Text style={{ fontFamily: "monospace" }}>
          {JSON.stringify(
            {
              isReady: mixerState.isReady,
              isPlayingA: mixerState.isPlayingA,
              ducking: mixerState.ducking,
              bpmTier: mixerState.bpmTier,
              volumeA: mixerState.volumeA,
            },
            null,
            2
          )}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 }}>
        {(busy || seqBusy) && <ActivityIndicator />}
        <Text style={{ color: busy || seqBusy ? "#EF4444" : "#10B981" }}>
          {busy || seqBusy ? "Speaking… (ducking ON)" : "Idle (ducking OFF)"}
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
    </ScrollView>
  );
}
