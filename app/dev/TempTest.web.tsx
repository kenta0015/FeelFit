// app/dev/TempTest.web.tsx
import React from "react";
import { View, Text, Button, Alert } from "react-native";
import { useAudioMixer } from "../../hooks/useAudioMixer"; // ← 波括弧で

export default function TempTest() {
  const mixer = useAudioMixer();

  const onStart = async () => {
    try {
      await mixer.start();
    } catch (e: any) {
      Alert.alert("Mixer error", String(e?.message ?? e));
    }
  };

  const onStop = async () => {
    try {
      await mixer.stop();
    } catch (e: any) {
      Alert.alert("Mixer error", String(e?.message ?? e));
    }
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: "800" }}>Temp Test (Web)</Text>
      <Text>
        Mixer: ready={String(mixer.state.isReady)}{" "}
        playing={String(mixer.state.isPlayingA)}{" "}
        ducking={String(mixer.state.ducking)} bpmTier={mixer.state.bpmTier}{" "}
        volumeA={mixer.state.volumeA}
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title="Start" onPress={onStart} />
        <Button title="Stop" onPress={onStop} />
      </View>
    </View>
  );
}
