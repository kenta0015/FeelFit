// app/dev/mixer-test.tsx
// Simple dev screen for the web mixer.
// Open: /dev/mixer-test

import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput } from "react-native";
import { useAudioMixer } from "../../hooks/useAudioMixer.web";

function mm(n: number) { return Math.round(n * 100) / 100; }

export default function MixerTestScreen() {
  const mx = useAudioMixer();
  const s = mx.state;

  const [ids, setIds] = useState<string>("song1");
  const [shuffle, setShuffle] = useState<boolean>(false);

  const current = useMemo(() => {
    const u = mx.getCurrentTrackUri?.();
    if (!u) return "-";
    try { return u.split("/").pop() || u; } catch { return u; }
  }, [s.isPlayingA, s.isReady]);

  const setTracksFromIds = async () => {
    const list = ids.split(",").map(x => x.trim()).filter(Boolean);
    await mx.setTracks({ tracks: list, shuffle });
  };

  const unlock = async () => {
    try { await (mx as any).actx?.resume?.(); } catch {}
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Mixer Dev</Text>

      <View style={styles.row}>
        <Text style={styles.label}>IDs (comma)</Text>
        <TextInput
          value={ids}
          onChangeText={setIds}
          style={styles.input}
          placeholder="song1, song2"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Shuffle</Text>
        <Pressable style={[styles.btn, shuffle && styles.btnActive]} onPress={() => setShuffle(!shuffle)}>
          <Text style={styles.btnText}>{shuffle ? "ON" : "OFF"}</Text>
        </Pressable>
      </View>

      <View style={styles.btnRow}>
        <Pressable style={styles.btn} onPress={unlock}><Text style={styles.btnText}>Unlock</Text></Pressable>
        <Pressable style={styles.btn} onPress={setTracksFromIds}><Text style={styles.btnText}>Set Tracks</Text></Pressable>
        <Pressable style={styles.btn} onPress={() => mx.play()}><Text style={styles.btnText}>Play</Text></Pressable>
        <Pressable style={styles.btn} onPress={() => mx.pause()}><Text style={styles.btnText}>Pause</Text></Pressable>
        <Pressable style={styles.btn} onPress={() => mx.stop()}><Text style={styles.btnText}>Stop</Text></Pressable>
      </View>

      <View style={styles.card}>
        <Text>Ready: {String(s.isReady)}</Text>
        <Text>Playing: {String(s.isPlayingA)}</Text>
        <Text>Current: {current}</Text>
        <Text>Volume: {mm(s.volumeA)}</Text>
      </View>

      <View style={styles.btnRow}>
        <Pressable style={styles.btn} onPress={() => mx.setVolumeA(Math.max(0, s.volumeA - 0.05))}><Text style={styles.btnText}>Vol -0.05</Text></Pressable>
        <Pressable style={styles.btn} onPress={() => mx.setVolumeA(Math.min(1, s.volumeA + 0.05))}><Text style={styles.btnText}>Vol +0.05</Text></Pressable>
      </View>

      <Text style={styles.note}>Open this screen at /dev/mixer-test</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  h1: { fontSize: 22, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { width: 110, color: "#374151", fontWeight: "700" },
  input: { flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  btn: { backgroundColor: "#2563eb", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnActive: { backgroundColor: "#1d4ed8" },
  btnText: { color: "white", fontWeight: "700" },
  card: { padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, backgroundColor: "#f9fafb", gap: 4 },
  note: { marginTop: 8, color: "#6b7280" },
});
