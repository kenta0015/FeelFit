// app/dev/micro-test.tsx
import React from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { useVoiceIntents } from "../../hooks/useVoiceIntents";
import { useAudioMixer } from "../../hooks/useAudioMixer";

type Intent = "pause" | "resume" | "skip" | "time" | "slower" | "faster";

function Button({
  title,
  onPress,
  disabled,
  tone = "dark",
}: {
  title: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  tone?: "dark" | "blue";
}) {
  const bg = tone === "blue" ? "#2563EB" : "#111827";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        backgroundColor: bg,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginVertical: 6,
        marginRight: 10,
      })}
    >
      <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>{title}</Text>
    </Pressable>
  );
}

export default function MicroTestScreen() {
  // 実コントロール + 音声ダック
  const intents = useVoiceIntents();
  // ミキサーのスナップショット（他画面での変更も反映）
  const mixer = useAudioMixer();
  const { coachBusy, rampTo, slower, faster } = intents;

  const handle = (i: Intent) => {
    switch (i) {
      case "pause": return intents.pause();
      case "resume": return intents.resume();
      case "skip": return intents.skip();
      case "time": return intents.time();
      case "slower": return slower();
      case "faster": return faster();
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 8 }}>Micro Commands (Web)</Text>
      <Text style={{ color: "#4B5563", marginBottom: 8 }}>
        Buttons call real controls (if available) and speak with automatic ducking.
      </Text>

      {/* --- Intents --- */}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <Button title="Pause" onPress={() => handle("pause")} disabled={coachBusy} />
        <Button title="Resume" onPress={() => handle("resume")} disabled={coachBusy} />
        <Button title="Skip" onPress={() => handle("skip")} disabled={coachBusy} />
        <Button title="Time" onPress={() => handle("time")} disabled={coachBusy} />
        <Button title="Slower (-5)" onPress={() => handle("slower")} disabled={coachBusy} />
        <Button title="Faster (+5)" onPress={() => handle("faster")} disabled={coachBusy} />
      </View>

      {/* --- BPM Presets (UI tier) --- */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
        <Button title="Tempo 90" onPress={() => rampTo(90)} disabled={coachBusy} tone="blue" />
        <Button title="Tempo 110" onPress={() => rampTo(110)} disabled={coachBusy} tone="blue" />
        <Button title="Tempo 130" onPress={() => rampTo(130)} disabled={coachBusy} tone="blue" />
        <Button title="Tempo 150" onPress={() => rampTo(150)} disabled={coachBusy} tone="blue" />
      </View>

      {/* --- Mixer snapshot --- */}
      <View style={{ marginTop: 16, padding: 12, backgroundColor: "#F3F4F6", borderRadius: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 6 }}>Mixer State (snapshot)</Text>
        <Text style={{ fontFamily: "monospace" }}>
          {JSON.stringify(
            {
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

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
        {coachBusy && <ActivityIndicator />}
        <Text style={{ color: coachBusy ? "#EF4444" : "#10B981" }}>
          {coachBusy ? "Speaking… (ducking ON)" : "Idle (ducking OFF)"}
        </Text>
      </View>

      <View style={{ height: 12 }} />
      <Link href="/dev/mixer-test" style={{ color: "#2563EB", fontWeight: "700" }}>
        ↩ Go to /dev/mixer-test
      </Link>
      <Text />
      <Link href="/dev/interval-timer-test" style={{ color: "#2563EB", fontWeight: "700" }}>
        ↩ Go to /dev/interval-timer-test
      </Link>
    </ScrollView>
  );
}
