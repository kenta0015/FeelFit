// app/dev/tts-test.tsx
import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, Pressable } from "react-native";
import { synthesize, playUri } from "../../audio/TTSService";
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

function resolveUri(res: any): string | null {
  if (!res) return null;
  if (typeof res === "string") return res;
  return res.uri ?? res.url ?? res.path ?? null;
}

export default function TTSTest() {
  const [voiceId, setVoiceId] = useState<string>("");
  const [text, setText] = useState<string>("Hi! This is the energetic coach. Let’s get moving!");
  const [status, setStatus] = useState<string>("");

  const doSpeak = async () => {
    setStatus("Synthesizing...");
    try {
      // 1) ElevenLabs（またはサーバ）→ mp3/uri を想定
      const res: any = await synthesize(text, voiceId); // TTSService 側が voiceId 無視でもOK
      const uri = resolveUri(res);
      if (uri) {
        setStatus("Playing (mp3)...");
        await playUri(uri);
        setStatus("Done.");
        return;
      }
      // 2) フォールバック（Web Speech）
      if (typeof window !== "undefined" && (window as any).speechSynthesis) {
        setStatus("Speaking (Web Speech)...");
        await new Promise<void>((resolve) => {
          const u = new (window as any).SpeechSynthesisUtterance(text);
          u.onend = () => resolve();
          u.onerror = () => resolve();
          (window as any).speechSynthesis.speak(u);
        });
        setStatus("Done.");
        return;
      }
      setStatus("No TTS backend available.");
    } catch (e: any) {
      // 失敗しても Web Speech にフォールバック
      if (typeof window !== "undefined" && (window as any).speechSynthesis) {
        setStatus("Fallback speaking (Web Speech)...");
        await new Promise<void>((resolve) => {
          const u = new (window as any).SpeechSynthesisUtterance(text);
          u.onend = () => resolve();
          u.onerror = () => resolve();
          (window as any).speechSynthesis.speak(u);
        });
        setStatus("Done.");
      } else {
        setStatus(`Error: ${e?.message ?? e}`);
      }
    }
  };

  const clearCache = async () => {
    try {
      // 任意：TTSService にキャッシュがある場合のみ呼ぶ
      const anyTTS: any = { synthesize, playUri };
      await anyTTS?.clearCache?.();
      setStatus("Cache cleared.");
    } catch {
      setStatus("No cache API.");
    }
  };

  const purgeAll = async () => {
    try {
      const anyTTS: any = { synthesize, playUri };
      await anyTTS?.purgeAll?.();
      setStatus("Purged.");
    } catch {
      setStatus("No purge API.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>TTS Test</Text>

      <Text style={{ marginTop: 8, color: "#374151" }}>Voice ID</Text>
      <TextInput
        value={voiceId}
        onChangeText={setVoiceId}
        placeholder="e.g. &lt;your-elevenlabs-voice-id&gt;"
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
          <Button title="Clear This Cache" onPress={clearCache} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Purge All" onPress={purgeAll} />
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
