// app/(tabs)/player.tsx
// Player HUD + Voice Style selector + Provider/Voice display + Mini BGM controls
// + CoachAutoCues mount (speaks on start/middle/nearEnd/completion)
// + Auto-switch BGM on workout-start (healing <-> motivational)

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View, Text, Pressable, StyleSheet, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ALL_STYLES,
  DEFAULT_STYLE,
  type VoiceStyle,
  type Gender,
  toElevenPayload,
} from "@/utils/voiceProfiles";
import { playWorkoutAudio, stopAudio } from "@/utils/audio";
import CoachAutoCues from "@/components/CoachAutoCues";
import { EXERCISES } from "@/data/exercises";

// ---- Types (loose) ----
type FeelFitEngine = {
  start?: (opts: { totalSec?: number }) => void;
  pause?: () => void;
  resume?: () => void;
  stop?: () => void;
  restart?: () => void;
  onTick?: (cb: (t: { remainingSec: number; totalSec: number; running: boolean }) => void) => () => void;
  getRemainingSeconds?: () => number | undefined;
  getTotalSeconds?: () => number | undefined;
  isRunning?: () => boolean | undefined;
};

type MiniMixer = {
  play: () => Promise<void> | void;
  pause: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  setTracks: (arg: { tracks: string[]; shuffle?: boolean }) => Promise<void> | void;
  setVolumeA: (n: number) => void;
  getCurrentTrackUri: () => string | null;
  state: { isReady: boolean; isPlayingA: boolean; volumeA: number; ducking: boolean; bpmTier?: number | null };
  tracks?: string[];
};

declare global {
  // eslint-disable-next-line no-var
  var __feelFit: { engine?: FeelFitEngine } | undefined;
  // eslint-disable-next-line no-var
  var __ffMixer: MiniMixer | undefined;
}

// ---- utils ----
const getWin = (): any => (typeof window !== "undefined" ? window : undefined);
const dispatchFeelFit = (
  type: "workout-start" | "workout-pause" | "workout-resume" | "workout-finish",
  detail?: Record<string, any>
) => {
  const w = getWin();
  const evtName = `feelFit:${type}`;
  const payload = { origin: "player", ...(detail ?? {}) };
  if (w?.dispatchEvent && typeof w.CustomEvent === "function") {
    w.dispatchEvent(new w.CustomEvent(evtName, { detail: payload }));
  }
};
const fmt = (n?: number) => {
  if (n == null || !isFinite(n)) return "--:--";
  const s = Math.max(0, Math.floor(n));
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
};
const getEngine = (): FeelFitEngine | undefined => globalThis.__feelFit?.engine;
const getMixer = (): MiniMixer | undefined => (globalThis as any).__ffMixer;

// Lazy init mixer on web (imports the singleton module once)
async function ensureMixer(): Promise<MiniMixer | undefined> {
  if (Platform.OS !== "web") return undefined;
  let m = getMixer();
  if (!m) {
    try {
      await import("@/hooks/useAudioMixer.web");
      m = getMixer();
    } catch {
      // ignore
    }
  }
  return m;
}

const kv = {
  get(key: string): string | null {
    try {
      if (typeof localStorage !== "undefined") return localStorage.getItem(key);
    } catch {}
    return null;
  },
  set(key: string, val: string) {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, val);
    } catch {}
  },
};

// ---- Style→content routing ----
type ContentKind = "healing" | "motivational";
const styleToContent = (s: VoiceStyle): ContentKind => {
  if (s === "Calm" || s === "Gentle" || s === "Focus" || s === "Neutral") return "healing";
  return "motivational";
};

// ---- Provider / voice helpers ----
const getEnvKey = (): string | undefined =>
  (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY as string | undefined) ||
  (process.env.ELEVENLABS_API_KEY as string | undefined) ||
  (process.env.EXPO_PUBLIC_POLLY_URL as string | undefined);

const getSavedVoiceIdOverride = (): string | undefined => {
  try {
    if (typeof localStorage !== "undefined") {
      const v = localStorage.getItem("tts.voiceId.v1"); // keep current key to avoid breaking UI
      if (v && v.trim()) return v.trim();
    }
  } catch {}
  return undefined;
};

// ---- Workout→content routing ----
// 1) explicit by exerciseId via EXERCISES.audioType (preferred)
// 2) fallback fuzzy buckets
const HEALING_HINTS = ["breath", "breathing", "medit", "yoga", "stretch", "calm", "relax", "recovery"];
const MOTIVE_HINTS = ["hiit", "run", "cardio", "strength", "power", "workout", "motive", "speed", "intense"];

function resolveWorkoutContent(detail: any): ContentKind | null {
  // explicit mapping
  const exId = String(
    (detail?.exerciseId as string | undefined) ||
      (detail?.workout as string | undefined) ||
      ""
  ).trim();
  if (exId) {
    try {
      const ex = EXERCISES.find((e: any) => e?.id?.toLowerCase?.() === exId.toLowerCase());
      const at = ex?.audioType;
      if (at === "healing" || at === "motivational") return at as ContentKind;
    } catch {}
  }

  // fuzzy buckets
  const s = (exId || String(detail?.type || "")).toLowerCase();
  if (!s) return null;
  if (HEALING_HINTS.some((k) => s.includes(k))) return "healing";
  if (MOTIVE_HINTS.some((k) => s.includes(k))) return "motivational";
  return null;
}

// ---- Component ----
export default function PlayerTab() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(24, (insets?.bottom ?? 0) + (Platform.OS === "web" ? 96 : 72));

  const [remaining, setRemaining] = useState<number | undefined>(undefined);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [running, setRunning] = useState<boolean | undefined>(undefined);
  const [lastEvent, setLastEvent] = useState<string>("(none)");
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [copiedAt, setCopiedAt] = useState<number | null>(null);

  // Voice prefs
  const [style, setStyle] = useState<VoiceStyle>(() => (kv.get("tts.style.v1") as VoiceStyle) || DEFAULT_STYLE);
  const [gender, setGender] = useState<Gender>(() => ((kv.get("tts.gender.v1") as Gender) || "female"));

  // Provider capability / current voiceId
  const neuralCapable = Platform.OS === "web" && !!getEnvKey();
  const voiceOverride = getSavedVoiceIdOverride();
  const currentVoiceId = useMemo(
    () => (neuralCapable ? toElevenPayload(style, gender, voiceOverride).voiceId : undefined),
    [neuralCapable, style, gender, voiceOverride]
  );

  // Persist prefs
  useEffect(() => kv.set("tts.style.v1", style), [style]);
  useEffect(() => kv.set("tts.gender.v1", gender), [gender]);

  // Engine poll
  useEffect(() => {
    const eng = getEngine();
    let off: (() => void) | undefined;
    if (eng?.onTick) {
      off = eng.onTick?.(({ remainingSec, totalSec, running }) => {
        setRemaining(remainingSec);
        setTotal(totalSec);
        setRunning(running);
      });
    }
    const id = setInterval(() => {
      const e = getEngine();
      if (!e) return;
      setRemaining(e.getRemainingSeconds?.());
      setTotal(e.getTotalSeconds?.());
      setRunning(e.isRunning?.());
    }, 250);
    return () => {
      clearInterval(id);
      off?.();
    };
  }, []);

  // Listen to workout events (debug)
  useEffect(() => {
    const w = getWin();
    if (!w) return;
    const types = ["workout-start", "workout-pause", "workout-resume", "workout-finish"] as const;
    const handlers = types.map((t) => {
      const name = `feelFit:${t}`;
      const h = (ev: any) => setLastEvent(`${name} ← ${ev?.detail?.origin ?? "unknown"}`);
      w.addEventListener(name, h as EventListener);
      return { name, h };
    });
    return () => handlers.forEach(({ name, h }) => w.removeEventListener(name, h as EventListener));
  }, []);

  // Voice guard
  useEffect(() => {
    const w = getWin();
    if (!w) return;
    const onStart = () => setSpeaking(true);
    const onEnd = () => setSpeaking(false);
    w.addEventListener("feelFit:voice-start", onStart as EventListener);
    w.addEventListener("feelFit:voice-end", onEnd as EventListener);
    return () => {
      w.removeEventListener("feelFit:voice-start", onStart as EventListener);
      w.removeEventListener("feelFit:voice-end", onEnd as EventListener);
    };
  }, []);

  // Preload mixer on mount (web)
  useEffect(() => {
    void ensureMixer();
  }, []);

  const status = useMemo(() => {
    if (running === true) return "PLAYING";
    if (running === false) return "PAUSED";
    return "IDLE";
  }, [running]);

  const onPreview = () => {
    if (speaking) return;
    setSpeaking(true);
    stopAudio();
    const content = styleToContent(style);
    const phase: "start" | "middle" | "nearEnd" = content === "healing" ? "middle" : "nearEnd";
    playWorkoutAudio(phase, content, gender);
  };
  const onStop = () => stopAudio();

  const copyVoiceId = async () => {
    if (!currentVoiceId) return;
    try {
      await Clipboard.setStringAsync(currentVoiceId);
      setCopiedAt(Date.now());
      setTimeout(() => setCopiedAt(null), 1500);
    } catch {}
  };

  // ---- Mini BGM (web mixer) ----
  const [mixPlaying, setMixPlaying] = useState(false);
  const [mixReady, setMixReady] = useState(false);
  const [mixDucking, setMixDucking] = useState(false);
  const [mixVol, setMixVol] = useState(1);
  const [mixUri, setMixUri] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const id = setInterval(() => {
      const m = getMixer();
      if (!m) {
        setMixReady(false);
        setMixPlaying(false);
        setMixDucking(false);
        setMixUri(null);
        return;
      }
      setMixReady(!!m.state?.isReady);
      setMixPlaying(!!m.state?.isPlayingA);
      setMixDucking(!!m.state?.ducking);
      setMixVol(typeof m.state?.volumeA === "number" ? m.state.volumeA : 1);
      setMixUri(m.getCurrentTrackUri());
    }, 250);
    return () => clearInterval(id);
  }, []);

  // --- Playlist application ---
  const lastAppliedRef = useRef<ContentKind | null>(null);

  const applyPlaylistFor = async (kind: ContentKind) => {
    const m = await ensureMixer();
    if (!m) return;

    // prevent redundant re-apply of the same kind
    if (lastAppliedRef.current === kind) return;
    lastAppliedRef.current = kind;

    // Dedicated keys by kind (read-only). If empty, provide defaults.
    const selKey = kind === "healing" ? "healing.selection.v1" : "motivational.selection.v1";
    const shufKey = kind === "healing" ? "healing.shuffle.v1" : "motivational.shuffle.v1";

    let tracks: string[] = [];
    let shuffle = false;
    try {
      const raw = kv.get(selKey);
      tracks = raw ? (JSON.parse(raw) as string[]) : [];
      shuffle = kv.get(shufKey) === "true";
    } catch {}

    if (!tracks || tracks.length === 0) {
      tracks =
        kind === "healing"
          ? ["/audio/calm/sleep-inducing-ambient-music-with-gentle-ocean-waves-370140.mp3"]
          : ["/audio/motive/motivation-motivational-background-music-292747.mp3"];
    }

    // Force re-queue to ensure immediate switch
    try { m.stop(); } catch {}
    await Promise.resolve(m.setTracks({ tracks, shuffle }));
    await Promise.resolve(m.play());
    // optional nudge for browsers that stick to first buffer
    try { m.next?.(); } catch {}
  };

  // Start BGM button → apply by current style once
  const startBgm = async () => {
    const content = styleToContent(style);
    await applyPlaylistFor(content);
  };

  const togglePlay = async () => {
    const m = await ensureMixer();
    if (!m) return;
    if (m.state?.isPlayingA) m.pause();
    else await m.play();
  };
  const next = async () => {
    const m = await ensureMixer();
    m?.next();
  };
  const prev = async () => {
    const m = await ensureMixer();
    m?.prev();
  };
  const volStep = async (d: number) => {
    const m = await ensureMixer();
    if (!m) return;
    const nv = Math.max(0, Math.min(1, (m.state?.volumeA ?? 1) + d));
    m.setVolumeA(nv);
    setMixVol(nv);
  };

  // Auto-switch BGM on workout-start
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const w = getWin();
    if (!w) return;

    const onWorkoutStart = (ev: any) => {
      const kind = resolveWorkoutContent(ev?.detail);
      if (!kind) return;
      void applyPlaylistFor(kind);
    };

    w.addEventListener("feelFit:workout-start", onWorkoutStart as EventListener);
    return () => {
      w.removeEventListener("feelFit:workout-start", onWorkoutStart as EventListener);
    };
  }, []);

  return (
    <ScrollView
      contentContainerStyle={[styles.wrap, { paddingBottom: bottomPad }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Auto voice cues (global while Player tab is open) */}
      <CoachAutoCues style={style} gender={gender} />

      <Text style={styles.title}>Player HUD</Text>
      <Text style={styles.kv}>
        Status: <Text style={styles.bold}>{status}</Text>
      </Text>
      <Text style={styles.kv}>
        Time: <Text style={styles.bold}>{fmt((total ?? 0) - (remaining ?? 0))}</Text> /{" "}
        <Text style={styles.bold}>{fmt(total)}</Text>
      </Text>
      <Text style={styles.kv}>
        Remaining: <Text style={styles.bold}>{fmt(remaining)}</Text>
      </Text>
      <Text style={styles.kvSmall}>Last event: {lastEvent}</Text>

      <View style={styles.row}>
        <Pressable style={[styles.btn, styles.primary]} onPress={() => dispatchFeelFit("workout-start")}>
          <Text style={styles.btnText}>Start</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => dispatchFeelFit("workout-pause")}>
          <Text style={styles.btnText}>Pause</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => dispatchFeelFit("workout-resume")}>
          <Text style={styles.btnText}>Resume</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => dispatchFeelFit("workout-finish")}>
          <Text style={styles.btnText}>Finish</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Voice Style</Text>

        <View style={styles.styleGrid}>
          {ALL_STYLES.map((s) => {
            const active = s === style;
            return (
              <Pressable key={s} style={[styles.styleChip, active && styles.styleChipActive]} onPress={() => setStyle(s)}>
                <Text style={[styles.styleChipText, active && styles.styleChipTextActive]}>{s}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.genderRow}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderBtns}>
            <Pressable
              style={[styles.genderBtn, gender === "female" && styles.genderBtnActive]}
              onPress={() => setGender("female")}
            >
              <Text style={[styles.genderText, gender === "female" && styles.genderTextActive]}>Female</Text>
            </Pressable>
            <Pressable
              style={[styles.genderBtn, gender === "male" && styles.genderBtnActive]}
              onPress={() => setGender("male")}
            >
              <Text style={[styles.genderText, gender === "male" && styles.genderTextActive]}>Male</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.previewRow}>
          <Pressable
            disabled={speaking}
            style={[styles.btn, styles.primary, speaking && styles.btnDisabled]}
            onPress={speaking ? undefined : onPreview}
          >
            <Text style={styles.btnText}>{speaking ? "Speaking…" : "Preview"}</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.dim]} onPress={onStop}>
            <Text style={styles.btnText}>Stop Voice</Text>
          </Pressable>
        </View>

        <Text style={styles.memo}>
          • Saved: tts.style.v1 / tts.gender.v1{"\n"}• Provider:{" "}
          <Text style={styles.bold}>{neuralCapable ? "Neural" : "Device"}</Text>
          {neuralCapable && (
            <>
              {"\n"}• Voice ID: <Text style={styles.mono}>{currentVoiceId}</Text>
              <Pressable style={styles.copyBtn} onPress={copyVoiceId}>
                <Text style={styles.copyText}>{copiedAt ? "Copied" : "Copy"}</Text>
              </Pressable>
              {voiceOverride ? <Text style={styles.kvSmall}> (override)</Text> : null}
            </>
          )}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Background Music (mini)</Text>
        {Platform.OS !== "web" ? (
          <Text style={styles.kvSmall}>Mixer is web-only.</Text>
        ) : (
          <>
            <View style={styles.previewRow}>
              <Pressable style={[styles.btn, styles.primary]} onPress={startBgm}>
                <Text style={styles.btnText}>Start BGM</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.alt]} onPress={togglePlay}>
                <Text style={styles.btnText}>{mixPlaying ? "Pause" : "Play"}</Text>
              </Pressable>
              <Pressable style={[styles.btn]} onPress={prev}>
                <Text style={styles.btnText}>Prev</Text>
              </Pressable>
              <Pressable style={[styles.btn]} onPress={next}>
                <Text style={styles.btnText}>Next</Text>
              </Pressable>
              <Pressable style={[styles.btn]} onPress={() => volStep(-0.1)}>
                <Text style={styles.btnText}>Vol -</Text>
              </Pressable>
              <Pressable style={[styles.btn]} onPress={() => volStep(+0.1)}>
                <Text style={styles.btnText}>Vol +</Text>
              </Pressable>
            </View>
            <Text style={styles.kv}>
              Ready: <Text style={styles.bold}>{mixReady ? "YES" : "NO"}</Text> • Playing:{" "}
              <Text style={styles.bold}>{mixPlaying ? "YES" : "NO"}</Text> • Ducking:{" "}
              <Text style={styles.bold}>{mixDucking ? "YES" : "NO"}</Text> • Vol:{" "}
              <Text style={styles.bold}>{mixVol.toFixed(2)}</Text>
            </Text>
            <Text style={styles.kv}>
              Current URI: <Text style={styles.mono}>{mixUri || "-"}</Text>
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  wrap: {
    minHeight: "100%",
    backgroundColor: "#0b0c10",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#ffffff", marginBottom: 6 },
  kv: { fontSize: 16, color: "#d1d5db" },
  kvSmall: { fontSize: 13, color: "#9ca3af" },
  bold: { fontWeight: "700", color: "#ffffff" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
  btn: { backgroundColor: "#1f2937", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  primary: { backgroundColor: "#2563eb" },
  alt: { backgroundColor: "#10b981" },
  dim: { backgroundColor: "#4b5563" },
  btnText: { color: "#ffffff", fontWeight: "600" },

  card: {
    marginTop: 6,
    borderColor: "#374151",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#111827",
    gap: 10,
  },
  cardTitle: { color: "#ffffff", fontSize: 16, fontWeight: "700", marginBottom: 2 },
  styleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  styleChip: {
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  styleChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  styleChipText: { color: "#cbd5e1", fontSize: 13, fontWeight: "600" },
  styleChipTextActive: { color: "#ffffff" },
  genderRow: { marginTop: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { color: "#cbd5e1", fontSize: 14, fontWeight: "700" },
  genderBtns: { flexDirection: "row", gap: 8 },
  genderBtn: {
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  genderBtnActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  genderText: { color: "#cbd5e1", fontSize: 13, fontWeight: "700" },
  genderTextActive: { color: "#ffffff" },
  previewRow: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  memo: { color: "#9ca3af", fontSize: 12, marginTop: 4 },
  mono: {
    fontFamily: Platform.select({ web: "ui-monospace, Menlo, monospace", default: "monospace" }),
    color: "#cbd5e1",
  },
  btnDisabled: { opacity: 0.5 },
  copyBtn: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "#374151",
    alignSelf: "baseline",
  },
  copyText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
