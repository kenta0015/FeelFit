// app/dev/tts-test.tsx
// Web/Native-compatible TTS test screen.
// Uses audio/TTSService (web/native specific files). On web, synthesize()
// may return a blob URL or fallback to device speech automatically.

import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, Pressable } from "react-native";
import { synthesize, clearOne, purgeAll, type TTSResult } from "../../audio/TTSService";
import { Link } from "expo-router";

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
        opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
        backgroundColor: "#4F46E5",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginVertical: 6,
        alignItems: "center",
      })}
    >
      <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>{title}</Text>
    </Pressable>
  );
}

async function playWebAudio(uri: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const a = new Audio();
    a.src = uri;
    a.onended = () => resolve();
    a.onerror = () => resolve(); // fail-safe
    a.play().catch(() => resolve());
  });
}

export default function TTSTest() {
  const [voiceId, setVoiceId] = useState<string>("");
  const [text, setText] = useState<string>("Hi! This is the energetic coach. Let’s get moving!");
  const [status, setStatus] = useState<string>("");

  const doSpeak = async () => {
    if (!text.trim()) return;
    setStatus("Synthesizing...");
    try {
      const res: TTSResult = await synthesize(text, voiceId);
      if (res?.uri) {
        setStatus("Playing (mp3)...");
        await playWebAudio(res.uri);
        setStatus("Done.");
      } else {
        // On web, the service already triggered device TTS fallback when uri is null.
        setStatus(res?.fallbackUsed ? "Spoken via device TTS." : "No audio produced.");
      }
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    }
  };

  const doClearThis = async () => {
    try {
      await clearOne(text, voiceId);
      setStatus("Cache cleared for this script/voice.");
    } catch {
      setStatus("Clear failed.");
    }
  };

  const doPurgeAll = async () => {
    try {
      await purgeAll();
      setStatus("All cache purged.");
    } catch {
      setStatus("Purge failed.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>TTS Test</Text>

      <Text style={{ marginTop: 8, color: "#374151" }}>Voice ID</Text>
      <TextInput
        value={voiceId}
        onChangeText={setVoiceId}
        placeholder="e.g. <your-elevenlabs-voice-id>"
        style={{
          borderWidth: 1,
          borderColor: "#E5E7EB",
          padding: 12,
          borderRadius: 10,
          backgroundColor: "white",
        }}
      />

      <Text style={{ marginTop: 8, color: "#374151" }}>Script</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={4}
        style={{
          borderWidth: 1,
          borderColor: "#E5E7EB",
          padding: 12,
          borderRadius: 10,
          backgroundColor: "white",
          minHeight: 100,
          textAlignVertical: "top",
        }}
      />

      <Button title="Synthesize & Play" onPress={doSpeak} />
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Button title="Clear This Cache" onPress={doClearThis} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Purge All" onPress={doPurgeAll} />
        </View>
      </View>

      <Button title="Logs" onPress={() => setStatus("See console.")} />

      <Text style={{ marginTop: 12, color: "#6B7280" }}>Status:</Text>
      <Text style={{ fontFamily: "monospace" }}>{status || "-"}</Text>

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
