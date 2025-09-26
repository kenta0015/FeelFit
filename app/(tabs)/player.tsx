// app/(tabs)/player.tsx
// Minimal Player HUD tab + Voice Style selector (Phase5).
// - Listens to feelFit:* custom events and mirrors Engine state if present.
// - Emits control events with detail.origin = "player".
// - Adds "Voice Style" UI (style/gender pick + Preview) with localStorage persistence.
// - Non-breaking: works even if Engine/Mixer are not implemented yet.

import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { ALL_STYLES, DEFAULT_STYLE, type VoiceStyle, type Gender } from "@/utils/voiceProfiles";
import { playWorkoutAudio, stopAudio } from "@/utils/audio";

// ---- Types (loose, to avoid coupling) ----
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

declare global {
  // eslint-disable-next-line no-var
  var __feelFit: {
    engine?: FeelFitEngine;
  } | undefined;
}

// ---- Safe window in RN (web only has window; native still okay via globalThis) ----
const getWin = (): any => {
  if (typeof window !== "undefined") return window;
  return undefined;
};

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

// ---- Format helpers ----
const fmt = (n?: number) => {
  if (n == null || !isFinite(n)) return "--:--";
  const s = Math.max(0, Math.floor(n));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${mm}:${ss}`;
};

const getEngine = (): FeelFitEngine | undefined => globalThis.__feelFit?.engine;

// ---- Small storage (web localStorage; no-op otherwise) ----
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

// ---- Component ----
export default function PlayerTab() {
  const [remaining, setRemaining] = useState<number | undefined>(undefined);
  const [total, setTotal] = useState<number | undefined>(undefined);
  const [running, setRunning] = useState<boolean | undefined>(undefined);
  const [lastEvent, setLastEvent] = useState<string>("(none)");

  // Voice prefs
  const [style, setStyle] = useState<VoiceStyle>(() => (kv.get("tts.style.v1") as VoiceStyle) || DEFAULT_STYLE);
  const [gender, setGender] = useState<Gender>(() => ((kv.get("tts.gender.v1") as Gender) || "female"));

  // Persist voice prefs
  useEffect(() => {
    kv.set("tts.style.v1", style);
  }, [style]);
  useEffect(() => {
    kv.set("tts.gender.v1", gender);
  }, [gender]);

  // Poll Engine state (works even if Engine has no onTick)
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

  // Listen to feelFit:* events just to reflect "last action"
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
    return () => {
      handlers.forEach(({ name, h }) => w.removeEventListener(name, h as EventListener));
    };
  }, []);

  const status = useMemo(() => {
    if (running === true) return "PLAYING";
    if (running === false) return "PAUSED";
    return "IDLE";
  }, [running]);

  const previewHealing = () => {
    stopAudio(); // ensure previous is stopped
    playWorkoutAudio("middle", "healing", gender);
  };
  const previewMotivational = () => {
    stopAudio();
    playWorkoutAudio("nearEnd", "motivational", gender);
  };

  return (
    <View style={styles.wrap}>
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
          <Pressable style={[styles.btn, styles.primary]} onPress={previewHealing}>
            <Text style={styles.btnText}>Preview (Healing)</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.alt]} onPress={previewMotivational}>
            <Text style={styles.btnText}>Preview (Motivational)</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.dim]} onPress={() => stopAudio()}>
            <Text style={styles.btnText}>Stop Voice</Text>
          </Pressable>
        </View>

        <Text style={styles.memo}>
          • Saved as tts.style.v1 / tts.gender.v1{"\n"}• ElevenLabs key present → Neural voice; otherwise device TTS
        </Text>
      </View>

      <View style={styles.noteBox}>
        <Text style={styles.note}>
          • Emits window events with detail.origin = "player".{"\n"}
          • Mirrors globalThis.__feelFit.engine if present (non-fatal if missing).{"\n"}
          • Safe addition: no changes to existing screens or logic.
        </Text>
      </View>

      {Platform.OS === "web" ? (
        <Text style={styles.hint}>Web tip: ensure autoplay is unlocked by a user gesture in your audio layer.</Text>
      ) : null}
    </View>
  );
}

// ---- Styles ----
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#0b0c10",
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 6,
  },
  kv: {
    fontSize: 16,
    color: "#d1d5db",
  },
  kvSmall: {
    fontSize: 13,
    color: "#9ca3af",
  },
  bold: {
    fontWeight: "700",
    color: "#ffffff",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  btn: {
    backgroundColor: "#1f2937",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primary: {
    backgroundColor: "#2563eb",
  },
  alt: {
    backgroundColor: "#10b981",
  },
  dim: {
    backgroundColor: "#4b5563",
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "600",
  },

  // Card
  card: {
    marginTop: 6,
    borderColor: "#374151",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#111827",
    gap: 10,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  styleChip: {
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  styleChipActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  styleChipText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "600",
  },
  styleChipTextActive: {
    color: "#ffffff",
  },
  genderRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "700",
  },
  genderBtns: {
    flexDirection: "row",
    gap: 8,
  },
  genderBtn: {
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  genderBtnActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  genderText: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "700",
  },
  genderTextActive: {
    color: "#ffffff",
  },
  previewRow: {
    marginTop: 4,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  memo: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 4,
  },

  noteBox: {
    marginTop: 6,
    borderColor: "#374151",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#111827",
  },
  note: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 16,
  },
  hint: {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 12,
  },
});
