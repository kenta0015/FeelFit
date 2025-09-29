// components/BgmAutoplay.tsx
import * as React from "react";
import { Platform } from "react-native";

// ── Mixer access（PlayerTab と同じユーティリティを最低限再掲）
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
    try { if (typeof localStorage !== "undefined") return localStorage.getItem(key); } catch {}
    return null;
  },
};

function add(type: string, fn: EventListenerOrEventListenerObject) {
  // @ts-ignore
  const tgt: any = typeof window !== "undefined" ? window : globalThis;
  tgt.addEventListener?.(type, fn);
  return () => tgt.removeEventListener?.(type, fn);
}

export default function BgmAutoplay(): null {
  // 再生は “一度でもユーザー操作があった後” でないとブロックされる可能性があるため、
  // start 直後に “初回のみ数回リトライ” を入れておく
  const retryRef = React.useRef<number>(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (Platform.OS !== "web") return; // いまは web ミキサーのみ

    const start = async (detail?: any) => {
      const m = await ensureMixer();
      if (!m) return;

      // トラック選択（未設定なら仮のデフォルト）
      let tracks: string[] = [];
      let shuffle = false;
      try {
        const raw = kv.get("healing.selection.v1");
        tracks = raw ? (JSON.parse(raw) as string[]) : [];
        shuffle = kv.get("healing.shuffle.v1") === "true";
      } catch {}
      if (!tracks || tracks.length === 0) {
        // デフォルトのダミー
        tracks = ["song1", "song2"];
      }

      try {
        await m.setTracks({ tracks, shuffle });
        await m.play();
        retryRef.current = 0; // 成功
      } catch {
        // AudioContext が "suspended" などのとき。
        if (retryRef.current < 3) {
          const n = ++retryRef.current;
          timerRef.current && clearTimeout(timerRef.current);
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
