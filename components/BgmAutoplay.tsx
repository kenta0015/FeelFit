// components/BgmAutoplay.tsx
// Auto-apply BGM on workout events (web mixer).
// FIX: choose playlist by kind (healing/motivational) based on event payload,
//      instead of always applying healing. Keeps retry logic and pause/resume/finish handling.

import * as React from "react";
import { Platform } from "react-native";
import { EXERCISES } from "@/data/exercises";

// ── Mixer access
type MiniMixer = {
  play: () => Promise<void> | void;
  pause: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  setTracks: (arg: { tracks: string[]; shuffle?: boolean }) => Promise<void> | void;
  setVolumeA: (n: number) => void;
  getCurrentTrackUri: () => string | null;
  state: { isReady: boolean; isPlayingA: boolean; volumeA: number; ducking: boolean };
  tracks?: string[];
};
const getMixer = (): MiniMixer | undefined => (globalThis as any).__ffMixer;

// Lazy import to create the web mixer singleton
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

// localStorage helpers
const kv = {
  get(key: string): string | null {
    try {
      if (typeof localStorage !== "undefined") return localStorage.getItem(key);
    } catch {}
    return null;
  },
};

function add(type: string, fn: EventListenerOrEventListenerObject) {
  // @ts-ignore
  const tgt: any = typeof window !== "undefined" ? window : globalThis;
  tgt.addEventListener?.(type, fn);
  return () => tgt.removeEventListener?.(type, fn);
}

// ---- kind resolution (authoritative: audioType -> type -> EXERCISES -> heuristics)
type ContentKind = "healing" | "motivational";
const HEALING_HINTS = ["breath", "breathing", "medit", "yoga", "stretch", "calm", "relax", "recovery"];
const MOTIVE_HINTS = ["hiit", "run", "cardio", "strength", "power", "workout", "motive", "speed", "intense"];

function resolveKind(detail?: any): ContentKind | null {
  const a = (detail?.audioType || "").toLowerCase();
  if (a === "healing" || a === "motivational") return a as ContentKind;

  const t = (detail?.type || "").toLowerCase();
  if (t === "healing" || t === "motivational") return t as ContentKind;

  const exId = String(detail?.exerciseId || "").trim();
  if (exId) {
    try {
      const ex = EXERCISES.find((e: any) => e?.id?.toLowerCase?.() === exId.toLowerCase());
      const at = (ex as any)?.audioType;
      if (at === "healing" || at === "motivational") return at as ContentKind;
      const seed = `${ex?.id ?? ""}|${ex?.name ?? ""}|${(ex as any)?.category ?? ""}`.toLowerCase();
      if (seed) {
        if (HEALING_HINTS.some((k) => seed.includes(k))) return "healing";
        if (MOTIVE_HINTS.some((k) => seed.includes(k))) return "motivational";
      }
    } catch {}
  }

  const raw = `${detail?.workout || ""}|${detail?.type || ""}`.toLowerCase();
  if (raw) {
    if (HEALING_HINTS.some((k) => raw.includes(k))) return "healing";
    if (MOTIVE_HINTS.some((k) => raw.includes(k))) return "motivational";
  }

  return null;
}

export default function BgmAutoplay(): null {
  // retry to overcome suspended AudioContext on first user gesture
  const retryRef = React.useRef<number>(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAppliedRef = React.useRef<ContentKind | null>(null);

  React.useEffect(() => {
    if (Platform.OS !== "web") return; // web mixer only for now

    const start = async (detail?: any) => {
      const m = await ensureMixer();
      if (!m) return;

      const kind = resolveKind(detail);
      if (!kind) {
        // do not force a default; avoid overwriting unknown intent
        // console.debug("[BgmAutoplay] skip: unknown kind", detail);
        return;
      }

      // dedupe: if same kind already applied, just ensure playing
      if (lastAppliedRef.current === kind) {
        try { await m.play(); } catch {}
        return;
      }

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

      try {
        await m.setTracks({ tracks, shuffle });
        await m.play();
        lastAppliedRef.current = kind;
        retryRef.current = 0; // success
      } catch {
        if (retryRef.current < 3) {
          const n = ++retryRef.current;
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => start(detail), 400 * n);
        }
      }
    };

    const pause = async () => {
      const m = await ensureMixer();
      m?.pause();
    };

    const resume = async () => {
      const m = await ensureMixer();
      if (!m) return;
      try { await m.play(); } catch {}
    };

    const finish = async () => {
      const m = await ensureMixer();
      m?.stop();
      lastAppliedRef.current = null;
    };

    const offStart  = add("feelFit:workout-start",  (e: any) => start(e?.detail));
    const offPause  = add("feelFit:workout-pause",  () => pause());
    const offResume = add("feelFit:workout-resume", () => resume());
    const offFinish = add("feelFit:workout-finish", () => finish());

    return () => {
      offStart(); offPause(); offResume(); offFinish();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
