// components/BgmAutoplay.tsx
// Auto-start/stop Background Music in response to workout events (web-only mixer).
// Hardens autoplay across browsers with:
// - User-gesture priming (pointer/keydown)
// - AudioContext.resume() best-effort
// - Visibility change recovery
// - Small retry backoff on first play()
// Safe no-op on native. Drop-in replacement.

import * as React from "react";
import { Platform } from "react-native";

// ---- Minimal mixer shape (same as Player HUD expectations)
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
  // Some builds expose audio context objects; keep names loose.
  ctx?: any;
  context?: any;
  audioContext?: any;
  tracks?: string[];
};

// ---- Globals helpers
const getMixer = (): MiniMixer | undefined => (globalThis as any).__ffMixer;
const getWin = (): any => (typeof window !== "undefined" ? window : undefined);
const getDoc = (): Document | undefined =>
  typeof document !== "undefined" ? (document as Document) : undefined;

// Lazy import to create the web mixer singleton (once)
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

// Resume any exposed AudioContext best-effort
async function resumeAnyAudioContext(m?: MiniMixer) {
  try {
    const ctx =
      (m as any)?.audioContext ||
      (m as any)?.context ||
      (m as any)?.ctx ||
      (getWin() as any)?.__ffAudioCtx ||
      undefined;
    if (ctx?.state === "suspended" && typeof ctx.resume === "function") {
      await ctx.resume();
    }
  } catch {
    // ignore
  }
}

// Add/remove global event listener
function onGlobal(type: string, fn: EventListenerOrEventListenerObject) {
  const w = getWin();
  w?.addEventListener?.(type, fn);
  return () => w?.removeEventListener?.(type, fn);
}

// Add/remove DOM listener
function onDom<K extends keyof DocumentEventMap>(type: K, fn: (ev: DocumentEventMap[K]) => void) {
  const d = getDoc();
  d?.addEventListener(type, fn as any, { passive: true });
  return () => d?.removeEventListener(type, fn as any);
}

// User gesture priming: consider a few input types as gestures.
function onUserGesture(fn: () => void) {
  const d = getDoc();
  if (!d) return () => {};
  const h = () => fn();
  const opts = { passive: true } as AddEventListenerOptions;

  d.addEventListener("pointerdown", h, opts);
  d.addEventListener("keydown", h, opts);
  d.addEventListener("touchstart", h, opts);

  return () => {
    d.removeEventListener("pointerdown", h, opts as any);
    d.removeEventListener("keydown", h, opts as any);
    d.removeEventListener("touchstart", h, opts as any);
  };
}

export default function BgmAutoplay(): null {
  const primedRef = React.useRef(false); // set true after first user gesture
  const triedOnceRef = React.useRef(false); // prevent redundant heavy init
  const retryTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPendingRef = React.useRef(false); // if start requested before gesture, defer
  const lastStartPayloadRef = React.useRef<any>(null);

  // Clear timer
  const clearRetry = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  // Attempt to start mixer (with small backoff)
  const startMixer = React.useCallback(async (detail?: any) => {
    const m = await ensureMixer();
    if (!m) return;

    // Track selection (fallback to dummy)
    let tracks: string[] = [];
    let shuffle = false;
    try {
      const raw = kv.get("healing.selection.v1");
      tracks = raw ? (JSON.parse(raw) as string[]) : [];
      shuffle = kv.get("healing.shuffle.v1") === "true";
    } catch {}
    if (!tracks || tracks.length === 0) tracks = ["song1", "song2"];

    // Resume context if needed
    await resumeAnyAudioContext(m);

    try {
      await m.setTracks({ tracks, shuffle });
      await Promise.resolve(m.play());
      triedOnceRef.current = true;
      startPendingRef.current = false;
      lastStartPayloadRef.current = null;
    } catch {
      // Likely autoplay guard → backoff a bit
      const n = Math.min(3, (retryTimerRef.current ? 1 : 0) + 1);
      clearRetry();
      retryTimerRef.current = setTimeout(() => {
        // try again, but only if user has interacted or page visible
        const doc = getDoc();
        const visible = doc?.visibilityState === "visible";
        if (primedRef.current && visible) void startMixer(detail);
      }, 350 * n);
    }
  }, []);

  const pauseMixer = React.useCallback(async () => {
    const m = await ensureMixer();
    m?.pause();
  }, []);

  const resumeMixer = React.useCallback(async () => {
    const m = await ensureMixer();
    if (!m) return;
    await resumeAnyAudioContext(m);
    try {
      await Promise.resolve(m.play());
    } catch {
      // Will likely succeed after next user gesture; no-op
    }
  }, []);

  const stopMixer = React.useCallback(async () => {
    const m = await ensureMixer();
    m?.stop();
  }, []);

  React.useEffect(() => {
    if (Platform.OS !== "web") return;

    // 1) Prime on first user gesture
    const offPrime = onUserGesture(() => {
      if (!primedRef.current) {
        primedRef.current = true;
        // If a start was asked before user interacted, fulfill it now.
        if (startPendingRef.current) {
          void startMixer(lastStartPayloadRef.current);
        }
      }
    });

    // 2) Recover on visibility change (page back to foreground)
    const offVis = onDom("visibilitychange", () => {
      const doc = getDoc();
      if (doc?.visibilityState === "visible") {
        // If playback was attempted before, try to resume softly.
        if (triedOnceRef.current) {
          void resumeMixer();
        }
        // If there is a pending start (no gesture earlier), and now primed, start it.
        if (startPendingRef.current && primedRef.current) {
          void startMixer(lastStartPayloadRef.current);
        }
      }
    });

    // 3) Workout event wiring
    const offStart = onGlobal("feelFit:workout-start", (e: any) => {
      clearRetry();
      if (primedRef.current) {
        void startMixer(e?.detail);
      } else {
        // Defer until first gesture is observed
        startPendingRef.current = true;
        lastStartPayloadRef.current = e?.detail ?? null;
      }
    });
    const offPause = onGlobal("feelFit:workout-pause", () => {
      clearRetry();
      void pauseMixer();
    });
    const offResume = onGlobal("feelFit:workout-resume", () => {
      clearRetry();
      void resumeMixer();
    });
    const offFinish = onGlobal("feelFit:workout-finish", () => {
      clearRetry();
      startPendingRef.current = false;
      lastStartPayloadRef.current = null;
      void stopMixer();
    });

    return () => {
      offPrime();
      offVis();
      offStart();
      offPause();
      offResume();
      offFinish();
      clearRetry();
    };
  }, [pauseMixer, resumeMixer, startMixer, stopMixer]);

  return null;
}
