// app/player/index.tsx
// Minimal Player HUD for web mixer
// - Listens "feelFit:workout-start" → load LS healing.* → play
// - Manual controls for Start/Pause/Resume/Stop/Restart
// - No "as" assertions

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, Pressable, StyleSheet, View, Platform, TextInput } from "react-native";
import { useAudioMixer } from "../../hooks/useAudioMixer.web";

type StartDetail = { origin?: string; source?: string; ts?: number };

const LS_HEAL_SEL = "healing.selection.v1"; // JSON string[]
const LS_HEAL_SHUF = "healing.shuffle.v1";  // "1" | "0"

function isUri(s: string) {
  return /^(https?:|blob:|data:|file:)/i.test(s) || s.includes("/") || /\.[a-z0-9]{2,4}$/i.test(s);
}
function idToUri(s: string) {
  const t = String(s || "").trim();
  return isUri(t) ? t : `/healing/${t}.mp3`;
}
function mmss(secs: number) {
  const s = Math.max(0, Math.floor(secs));
  const m = Math.floor(s / 60);
  const ss = `${s % 60}`.padStart(2, "0");
  return `${m}:${ss}`;
}
function readHealingSelection(): { uris: string[]; shuffle: boolean } {
  try {
    const rawSel = typeof window !== "undefined" ? window.localStorage.getItem(LS_HEAL_SEL) : null;
    const rawShuf = typeof window !== "undefined" ? window.localStorage.getItem(LS_HEAL_SHUF) : null;
    const ids = rawSel ? JSON.parse(rawSel) : [];
    const arr: string[] = Array.isArray(ids) ? ids.filter(v => typeof v === "string") : [];
    const uris = arr.map(idToUri);
    return { uris, shuffle: rawShuf === "1" };
  } catch {
    return { uris: [], shuffle: false };
  }
}

export default function PlayerScreen() {
  const mx = useAudioMixer();
  const s = mx.state;

  const [title, setTitle] = useState<string>("Workout");
  const [elapsed, setElapsed] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [manualIds, setManualIds] = useState<string>("song1");
  const onceRef = useRef<boolean>(false);

  // Tick from <audio>
  useEffect(() => {
    const t = setInterval(() => {
      try {
        const a = mx.audio;
        if (a) {
          setElapsed(a.currentTime || 0);
          setDuration(a.duration && isFinite(a.duration) ? a.duration : 0);
        }
      } catch {}
    }, 200);
    return () => clearInterval(t);
  }, [mx]);

  // Event listener → unified start
  useEffect(() => {
    function onStart(ev: Event) {
      const detail = (ev as CustomEvent).detail as StartDetail | undefined;
      // Accept all origins for this minimal HUD
      void startFromLS(detail?.origin || "unknown");
    }
    if (typeof window !== "undefined") {
      window.addEventListener("feelFit:workout-start", onStart as EventListener);
      return () => window.removeEventListener("feelFit:workout-start", onStart as EventListener);
    }
    return undefined;
  }, []);

  async function unlock() {
    try { if (mx.actx && mx.actx.state !== "running") { await mx.actx.resume(); } } catch {}
  }

  async function startFromLS(origin: string) {
    const { uris, shuffle } = readHealingSelection();
    const list = uris.length > 0 ? uris : [idToUri("song1")];
    await unlock();
    try { await mx.setTracks({ tracks: list, shuffle }); } catch {}
    try { await mx.play(); } catch {}
    setTitle(`Started (${origin})`);
  }

  async function startManual() {
    const list = manualIds.split(",").map(v => v.trim()).filter(Boolean).map(idToUri);
    await unlock();
    try { await mx.setTracks({ tracks: list, shuffle: false }); } catch {}
    try { await mx.play(); } catch {}
    setTitle("Started (manual)");
  }

  async function restart() {
    try { await mx.stop(); } catch {}
    await startFromLS("restart");
  }

  function dispatchStart(origin: string) {
    if (typeof window === "undefined") return;
    const ts = Date.now();
    const e = new CustomEvent("feelFit:workout-start", { detail: { origin, source: "hud", ts } });
    window.dispatchEvent(e);
  }

  // Expose one-shot helper: auto-unlock & auto-play on first render (optional)
  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;
    // no auto start; keep idle
  }, []);

  const current = useMemo(() => {
    try {
      const src = mx.getCurrentTrackUri ? mx.getCurrentTrackUri() : null;
      return src ? (src.split("/").pop() || src) : "-";
    } catch { return "-"; }
  }, [s.isPlayingA, s.isReady, elapsed]);

  const progressPct = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.max(0, Math.min(1, elapsed / duration));
  }, [elapsed, duration]);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h1}>Workout Player</Text>
      <Text style={styles.note}>Event-driven start. You can also dispatch from this HUD.</Text>

      <View style={styles.hudCard}>
        <View style={styles.rowSpace}>
          <Text style={styles.h2}>{title}</Text>
          <Text style={styles.badge}>{s.isPlayingA ? "PLAYING" : "IDLE"}</Text>
        </View>

        <View style={styles.progressWrap}>
          <Text style={styles.progressLabel}>
            {mmss(elapsed)} {duration > 0 ? `/ ${mmss(duration)}` : ""}
          </Text>
        </View>
        <View style={styles.progressOuter}>
          <View style={[styles.progressInner, { width: `${Math.round(progressPct * 100)}%` }]} />
        </View>

        <Text style={styles.inlineLine}>Track: {current}</Text>
        <Text style={styles.inlineStatus}>
          Ready: {String(s.isReady)} | Volume: {s.volumeA.toFixed(2)}
        </Text>
      </View>

      {/* Core controls */}
      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={() => { void mx.pause(); }} disabled={!s.isReady}><Text style={styles.btnText}>Pause</Text></Pressable>
        <Pressable style={styles.btn} onPress={() => { void mx.play(); }} disabled={!s.isReady}><Text style={styles.btnText}>Resume</Text></Pressable>
        <Pressable style={styles.btn} onPress={restart} disabled={!s.isReady}><Text style={styles.btnText}>Restart</Text></Pressable>
        <Pressable style={styles.btn} onPress={() => { void mx.stop(); }} disabled={!s.isReady}><Text style={styles.btnText}>Stop</Text></Pressable>
      </View>

      {/* Manual start & event dispatch */}
      <View style={styles.card}>
        <Text style={styles.h2}>Manual Start</Text>
        <Text style={styles.small}>IDs or URLs (comma):</Text>
        {Platform.OS === "web" ? (
          <TextInput
            value={manualIds}
            onChangeText={setManualIds}
            style={styles.input}
            placeholder="song1, https://example.com/foo.mp3"
            autoCapitalize="none"
          />
        ) : null}
        <View style={styles.row}>
          <Pressable style={styles.btn} onPress={startManual}><Text style={styles.btnText}>Start (IDs)</Text></Pressable>
          <Pressable style={styles.btn} onPress={() => dispatchStart("hud")}><Text style={styles.btnText}>Dispatch Event</Text></Pressable>
        </View>
      </View>

      {/* Snapshot */}
      <Text style={styles.h2}>Mixer State</Text>
      <Text style={styles.mono}>
        {JSON.stringify({ isReady: s.isReady, isPlayingA: s.isPlayingA, ducking: s.ducking, bpmTier: s.bpmTier, volumeA: s.volumeA }, null, 2)}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 16 },
  row: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  rowSpace: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h1: { fontSize: 22, fontWeight: "700" },
  h2: { fontSize: 16, fontWeight: "700", marginTop: 4, marginBottom: 6 },
  note: { color: "#374151" },
  mono: { fontFamily: "monospace" as unknown as string },
  small: { fontSize: 12, opacity: 0.6 },
  btn: { backgroundColor: "#2563eb", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnText: { color: "white", fontWeight: "700" },
  hudCard: {
    gap: 8, padding: 14, borderRadius: 12, backgroundColor: "#f3f4f6",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#e5e7eb",
  },
  card: {
    gap: 10, padding: 12, borderRadius: 12, backgroundColor: "#f3f4f6",
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#e5e7eb",
  },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: "#111827", color: "white", fontWeight: "700" },
  inlineLine: { marginTop: 2, fontWeight: "600" }, inlineStatus: { marginTop: 2, color: "#374151" },
  progressWrap: { gap: 6 }, progressLabel: { fontFamily: "monospace" as unknown as string, fontSize: 13 },
  progressOuter: { height: 16, backgroundColor: "#e5e7eb", borderRadius: 999, overflow: "hidden" },
  progressInner: { height: "100%", width: "0%", backgroundColor: "#22c55e" },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "white" },
});
