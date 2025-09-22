// components/PTTButton.tsx
import React, { useState } from "react";
import { Pressable, Text, View, TextInput } from "react-native";
import { type Intent, handleIntent, type EngineAPI } from "../audio/VoiceIntents";

type Props = { engine: EngineAPI; voiceId: string };

export default function PTTButton({ engine, voiceId }: Props) {
  const [last, setLast] = useState<string>("-");
  const [text, setText] = useState<string>("");

  async function send(t: Intent) {                 // ← string ではなく Intent
    const res = await handleIntent(t, engine, voiceId);
    setLast(res.spoken ?? "-");
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Pressable onPress={() => send("pause")}  style={{ padding: 10, backgroundColor: "#1e90ff", borderRadius: 8 }}>
          <Text style={{ color: "#fff" }}>Pause</Text>
        </Pressable>
        <Pressable onPress={() => send("resume")} style={{ padding: 10, backgroundColor: "#1e90ff", borderRadius: 8 }}>
          <Text style={{ color: "#fff" }}>Resume</Text>
        </Pressable>
        <Pressable onPress={() => send("skip")}   style={{ padding: 10, backgroundColor: "#1e90ff", borderRadius: 8 }}>
          <Text style={{ color: "#fff" }}>Skip</Text>
        </Pressable>
        <Pressable onPress={() => send("time")}   style={{ padding: 10, backgroundColor: "#1e90ff", borderRadius: 8 }}>
          <Text style={{ color: "#fff" }}>Time</Text>
        </Pressable>
        <Pressable onPress={() => send("slower")} style={{ padding: 10, backgroundColor: "#1e90ff", borderRadius: 8 }}>
          <Text style={{ color: "#fff" }}>Slower</Text>
        </Pressable>
        <Pressable onPress={() => send("faster")} style={{ padding: 10, backgroundColor: "#1e90ff", borderRadius: 8 }}>
          <Text style={{ color: "#fff" }}>Faster</Text>
        </Pressable>
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="(optional) text"
        style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 8 }}
      />

      <Text>Last: {last}</Text>
    </View>
  );
}
