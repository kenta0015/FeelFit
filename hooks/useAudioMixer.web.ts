import { useEffect, useMemo, useState } from "react";

type Track = { uri: string };

export type MixerState = {
  isReady: boolean;
  isPlayingA: boolean;
  ducking: boolean;
  bpmTier: number;
  volumeA: number;
};

export type MixerAPI = {
  state: MixerState;
  setTracks: (opts: { tracks: Track[]; shuffle?: boolean }) => void;
  start: () => void;
  stop: () => void;
  setDucking: (on: boolean) => void;
  setBpmTier: (tier: number) => void;
};

// ===== Global root (avoid duplicate module instances) =====
type Root = {
  audio: HTMLAudioElement | null;
  tracks: Track[];
  idx: number;
  duck: boolean;
  bpmTier: number;
  baseVolume: number;
  actx: AudioContext | null;
  source: MediaElementAudioSourceNode | null;
  gain: GainNode | null;
  listeners: Set<(s: MixerState) => void>;
};

function root(): Root {
  const g = globalThis as any;
  g.__ffMixer ||= {
    audio: null,
    tracks: [],
    idx: 0,
    duck: false,
    bpmTier: 110,
    baseVolume: 1,
    actx: null,
    source: null,
    gain: null,
    listeners: new Set(),
  } as Root;
  return g.__ffMixer as Root;
}

function snap(r = root()): MixerState {
  const a = r.audio;
  return {
    isReady: !!(a && a.src),
    isPlayingA: !!(a && !a.paused),
    ducking: r.duck,
    bpmTier: r.bpmTier,
    volumeA: r.duck ? 0.2 : 1.0,
  };
}

function notify() {
  const r = root();
  const s = snap(r);
  r.listeners.forEach((fn) => fn(s));
}

function ensureAudio() {
  const r = root();
  if (typeof window === "undefined") return null;
  if (r.audio) return r.audio;
  r.audio = new Audio();
  r.audio.preload = "auto";
  r.audio.loop = true;
  // ピッチ保持（対応ブラウザのみ）
  try {
    (r.audio as any).preservesPitch = true;
    (r.audio as any).mozPreservesPitch = true;
    (r.audio as any).webkitPreservesPitch = true;
  } catch {}
  return r.audio;
}

function ensureGraph() {
  const r = root();
  const a = ensureAudio();
  if (!a) return;
  if (!r.actx) r.actx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (r.actx && !r.source) r.source = r.actx.createMediaElementSource(a);
  if (r.actx && !r.gain) {
    r.gain = r.actx.createGain();
    r.gain.gain.value = 1.0;
  }
  if (r.actx && r.source && r.gain) {
    // @ts-ignore
    if (!(r.source as any).__ff_connected) {
      r.source.connect(r.gain);
      r.gain.connect(r.actx.destination);
      // @ts-ignore
      (r.source as any).__ff_connected = true;
    }
  }
}

function applyVolume() {
  const r = root();
  const target = Math.max(0, Math.min(1, (r.duck ? 0.2 : 1.0) * r.baseVolume));
  if (r.gain && r.actx) {
    const now = r.actx.currentTime;
    try {
      r.gain.gain.cancelScheduledValues(now);
      r.gain.gain.setValueAtTime(r.gain.gain.value, now);
      r.gain.gain.linearRampToValueAtTime(target, now + 0.05);
    } catch {}
  }
  if (r.audio) {
    try {
      r.audio.volume = target;
    } catch {}
  }
}

function loadCurrent() {
  const r = root();
  if (!r.audio || r.tracks.length === 0) return;
  r.audio.src = r.tracks[r.idx].uri;
  r.audio.load();
}

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ==== New: tempo (playbackRate) ====
const BASE_TIER = 110;                 // 基準ティア
const MIN_RATE = 0.70;                 // 下限
const MAX_RATE = 1.50;                 // 上限
function rateFromTier(tier: number) {
  const rate = tier / BASE_TIER;
  return Math.min(MAX_RATE, Math.max(MIN_RATE, Number.isFinite(rate) ? rate : 1));
}
function applyTempo() {
  const r = root();
  const a = r.audio;
  if (!a) return;
  const rate = rateFromTier(r.bpmTier);
  try {
    a.playbackRate = rate;
    // pitch 保持（可能なら）
    (a as any).preservesPitch = true;
    (a as any).mozPreservesPitch = true;
    (a as any).webkitPreservesPitch = true;
  } catch {}
}

export function useAudioMixer(): MixerAPI {
  const [state, setState] = useState<MixerState>(() => snap());

  useEffect(() => {
    const r = root();
    const a = ensureAudio();
    ensureGraph();
    if (!a) return;

    const onCanPlay = () => notify();
    const onPlay = () => notify();
    const onPause = () => notify();

    a.addEventListener("canplay", onCanPlay);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);

    const listener = (s: MixerState) => setState(s);
    r.listeners.add(listener);
    // 初期同期
    applyTempo();
    notify();

    return () => {
      a.removeEventListener("canplay", onCanPlay);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      r.listeners.delete(listener);
    };
  }, []);

  const api = useMemo<MixerAPI>(
    () => ({
      state,
      setTracks: ({ tracks, shuffle }) => {
        const r = root();
        r.tracks = [...tracks];
        if (shuffle) shuffleInPlace(r.tracks);
        r.idx = 0;
        ensureAudio();
        ensureGraph();
        if (r.tracks.length > 0) loadCurrent();
        applyTempo();
        notify();
      },
      start: () => {
        const r = root();
        const a = ensureAudio();
        ensureGraph();
        if (!a || r.tracks.length === 0) return;
        loadCurrent();
        applyVolume();
        applyTempo();
        if (r.actx && r.actx.state === "suspended") {
          r.actx.resume().catch(() => {});
        }
        a.play().catch(() => {});
        notify();
      },
      stop: () => {
        const r = root();
        const a = ensureAudio();
        if (!a) return;
        a.pause();
        notify();
      },
      setDucking: (on: boolean) => {
        const r = root();
        r.duck = !!on;
        applyVolume();
        notify();
      },
      setBpmTier: (tier: number) => {
        const r = root();
        r.bpmTier = Math.round(tier);
        applyTempo();
        notify();
      },
    }),
    [state]
  );

  return api;
}
