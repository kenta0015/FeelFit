// app/dev/mixer-test.tsx
// Minimal mixer test screen (web-first) + Hard Reset.
// - Uses hooks/useAudioMixer.web to verify playback & voice ducking.
// - Adds navigation to Player HUD tab.
// - "Hard Reset": stop voice/mixer, clear LS keys, and reload.

import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { Volume2, Play, Pause, Square, Shuffle, Music2, Mic, ArrowRight, RotateCcw } from "lucide-react-native";
import { useAudioMixer } from "@/hooks/useAudioMixer.web";
import { emitFeelFit } from "@/utils/feelFitEvents";
import { stopAudio } from "@/utils/audio";
import { router } from "expo-router";

export default function MixerTest() {
  const mixer = useAudioMixer();
  const [input, setInput] = useState<string>("song1, song2");
  const [shuffle, setShuffle] = useState<boolean>(() => {
    try {
      return localStorage.getItem("healing.shuffle.v1") === "true";
    } catch {
      return false;
    }
  });
  const [vol, setVol] = useState<number>(mixer.state.volumeA);

  const tracks = useMemo(
    () =>
      input
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [input]
  );

  const applyTracks = () => {
    mixer.setTracks({ tracks, shuffle });
  };

  const onPlay = async () => {
    await mixer.play();
  };

  const onPause = () => {
    mixer.pause();
  };

  const onStop = () => {
    mixer.stop();
  };

  const onVolChange = (v: string) => {
    const num = Math.max(0, Math.min(1, parseFloat(v) || 0));
    setVol(num);
    mixer.setVolumeA(num);
  };

  const triggerVoiceStart = () => emitFeelFit("voice-start", { origin: "tts", test: true });
  const triggerVoiceEnd = () => emitFeelFit("voice-end", { origin: "tts", test: true });

  const openPlayerHere = () => router.push("/(tabs)/player");
  const openPlayerNewTab = () => {
    if (typeof window !== "undefined") window.open("/(tabs)/player", "_blank");
  };

  const hardReset = () => {
    const doReset = () => {
      try {
        // Stop voice + mixer
        stopAudio();
        mixer.stop();
        mixer.setTracks({ tracks: [], shuffle: false });
      } catch {}
      // Clear localStorage keys
      const KEYS = [
        "mixer.volumeA.v1",
        "healing.selection.v1",
        "healing.shuffle.v1",
        "tts.style.v1",
        "tts.gender.v1",
        "tts.voiceId.v1",
      ];
      try {
        KEYS.forEach((k) => localStorage.removeItem(k));
      } catch {}
      // Reload to ensure clean state
      if (typeof window !== "undefined") setTimeout(() => window.location.reload(), 200);
    };

    if (Platform.OS === "web") {
      doReset();
    } else {
      Alert.alert("Hard Reset", "Clear saved settings and stop playback?", [
        { text: "Cancel", style: "cancel" },
        { text: "OK", style: "destructive", onPress: doReset },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mixer Test</Text>
        <View style={styles.navRow}>
          <TouchableOpacity style={[styles.btn, styles.primary]} onPress={openPlayerHere}>
            <ArrowRight size={18} color="#fff" />
            <Text style={styles.btnText}>Go to Player</Text>
          </TouchableOpacity>
          {Platform.OS === "web" && (
            <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={openPlayerNewTab}>
              <ArrowRight size={18} color="#fff" />
              <Text style={styles.btnText}>Open Player (new tab)</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tracks (IDs or URLs, comma separated)</Text>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="e.g. song1, song2 or https://example.com/music.mp3"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Shuffle size={18} color="#111827" />
            <Text style={styles.rowLabel}>Shuffle</Text>
          </View>
          <Switch value={shuffle} onValueChange={setShuffle} />
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Volume2 size={18} color="#111827" />
            <Text style={styles.rowLabel}>Volume</Text>
          </View>
          <TextInput
            style={styles.numInput}
            value={String(vol)}
            onChangeText={onVolChange}
            keyboardType="numeric"
            placeholder="0..1"
          />
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={applyTracks}>
            <Music2 size={18} color="#fff" />
            <Text style={styles.btnText}>Set Tracks</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.primary]} onPress={onPlay}>
            <Play size={18} color="#fff" />
            <Text style={styles.btnText}>Play</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.warn]} onPress={onPause}>
            <Pause size={18} color="#fff" />
            <Text style={styles.btnText}>Pause</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.danger]} onPress={onStop}>
            <Square size={18} color="#fff" />
            <Text style={styles.btnText}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Voice Ducking (manual trigger)</Text>
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btn, styles.primary]} onPress={triggerVoiceStart}>
            <Mic size={18} color="#fff" />
            <Text style={styles.btnText}>VOICE START</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={triggerVoiceEnd}>
            <Mic size={18} color="#fff" />
            <Text style={styles.btnText}>VOICE END</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>State</Text>
        <View style={styles.stateRow}>
          <Text style={styles.kv}>
            Playing: <Text style={styles.bold}>{mixer.state.isPlayingA ? "YES" : "NO"}</Text>
          </Text>
          <Text style={styles.kv}>
            Ready: <Text style={styles.bold}>{mixer.state.isReady ? "YES" : "NO"}</Text>
          </Text>
          <Text style={styles.kv}>
            Ducking: <Text style={styles.bold}>{mixer.state.ducking ? "YES" : "NO"}</Text>
          </Text>
        </View>
        <Text style={styles.kv}>
          Current URI: <Text style={styles.mono}>{mixer.getCurrentTrackUri() || "-"}</Text>
        </Text>
        <Text style={styles.kv}>
          Tracks: <Text style={styles.mono}>{(mixer.tracks || []).join(", ") || "-"}</Text>
        </Text>
        <Text style={styles.kv}>
          Volume: <Text style={styles.bold}>{mixer.state.volumeA}</Text>
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Maintenance</Text>
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.btn, styles.danger]} onPress={hardReset}>
            <RotateCcw size={18} color="#fff" />
            <Text style={styles.btnText}>Hard Reset</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.help}>Stops voice/mixer, clears saved prefs, then reloads.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6", padding: 16, gap: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  navRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 10,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#111827" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
  },
  numInput: {
    width: 80,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f9fafb",
    textAlign: "right",
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowLabel: { fontSize: 14, color: "#111827", fontWeight: "600" },
  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  primary: { backgroundColor: "#2563eb" },
  secondary: { backgroundColor: "#4b5563" },
  warn: { backgroundColor: "#f59e0b" },
  danger: { backgroundColor: "#dc2626" },
  btnText: { color: "#fff", fontWeight: "700" },
  stateRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  kv: { fontSize: 13, color: "#111827" },
  bold: { fontWeight: "700", color: "#111827" },
  mono: {
    fontFamily: Platform.select({ web: "ui-monospace, Menlo, monospace", default: "monospace" }),
    color: "#374151",
  },
  help: { fontSize: 12, color: "#6b7280" },
});
