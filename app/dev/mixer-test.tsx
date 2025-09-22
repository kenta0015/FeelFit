// app/dev/mixer-test.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { Link } from "expo-router";
import { useAudioMixer } from "@/hooks/useAudioMixer";

type Track = { uri: string };

function Btn({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: () => void | Promise<void>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#1e90ff",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginRight: 12,
        marginBottom: 12,
      }}
    >
      <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
        {children}
      </Text>
    </Pressable>
  );
}

export default function MixerTest() {
  const mixer = useAudioMixer();
  const [u1, setU1] = useState("https://example.com/ocean.mp3");
  const [u2, setU2] = useState("https://example.com/forest.mp3");
  const [shuffle, setShuffle] = useState(true);

  // --- テスト中はアンマウントで stop しない（←ポイント）
  useEffect(() => {
    // ここでの return は何も返さない＝クリーンアップ無し
    return;
  }, []);

  const stateJson = useMemo(
    () => JSON.stringify(mixer.state, null, 2),
    [mixer.state]
  );

  async function setTracks() {
    const tracks: Track[] = [
      u1.trim() ? { uri: u1.trim() } : undefined,
      u2.trim() ? { uri: u2.trim() } : undefined,
    ].filter(Boolean) as Track[];
    mixer.setTracks({ tracks, shuffle });
  }

  async function playHealing() {
    await mixer.start();
  }
  async function stopHealing() {
    await mixer.stop();
  }

  function setTier(tier: number) {
    mixer.setBpmTier(tier);
  }

  // 音声開始/終了のダッキング確認ボタン
  async function voiceStart() {
    mixer.setDucking(true);
  }
  async function voiceEnd() {
    mixer.setDucking(false);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
      <Text style={{ fontSize: 28, fontWeight: "800", marginBottom: 8 }}>
        Mixer Test
      </Text>

      <Text style={{ fontSize: 16, marginBottom: 6 }}>Healing Track URL #1</Text>
      <TextInput
        value={u1}
        onChangeText={setU1}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          padding: 12,
          borderRadius: 8,
          fontSize: 16,
        }}
      />

      <Text style={{ fontSize: 16, marginTop: 14, marginBottom: 6 }}>
        Healing Track URL #2
      </Text>
      <TextInput
        value={u2}
        onChangeText={setU2}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          borderWidth: 1,
          borderColor: "#ddd",
          padding: 12,
          borderRadius: 8,
          fontSize: 16,
        }}
      />

      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12 }}>
        <Btn onPress={setTracks}>SET TRACKS</Btn>
        <Btn onPress={playHealing}>PLAY HEALING</Btn>
        <Btn onPress={stopHealing}>STOP HEALING</Btn>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <Btn onPress={voiceStart}>VOICE START (DUCK)</Btn>
        <Btn onPress={voiceEnd}>VOICE END (RESTORE)</Btn>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        <Btn onPress={() => setTier(90)}>TIER 90</Btn>
        <Btn onPress={() => setTier(110)}>110</Btn>
        <Btn onPress={() => setTier(130)}>130</Btn>
        <Btn onPress={() => setTier(150)}>150</Btn>
      </View>

      <Text style={{ marginTop: 8, fontSize: 16 }}>
        Shuffle: {shuffle ? "ON" : "OFF"}
      </Text>

      <View style={{ marginTop: 8 }}>
        <Text style={{ fontSize: 16, marginBottom: 6 }}>State:</Text>
        <View
          style={{
            backgroundColor: "#fafafa",
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 8,
            padding: 12,
          }}
        >
          <Text style={{ fontFamily: "monospace", fontSize: 14 }}>
            {stateJson}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 16, flexDirection: "row", flexWrap: "wrap" }}>
        <Link
          href="/dev/micro-test"
          style={{
            backgroundColor: "#6b7280",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
            Go to /dev/micro-test
          </Text>
        </Link>
      </View>
    </ScrollView>
  );
}
