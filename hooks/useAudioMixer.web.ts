// hooks/useAudioMixer.web.ts
// Minimal HTMLAudio-based mixer (web only) with voice ducking via feelFit:voice-start/end.
// - Singleton exposed at globalThis.__ffMixer for debugging.
// - setTracks accepts IDs or URIs. IDs are resolved via utils/healingCatalog.ts (assets/healing/*).
// - Methods: setTracks, play/playHealing, pause, resume, stop, setVolumeA, getCurrentTrackUri
// - State: isReady, isPlayingA, volumeA, ducking(false), bpmTier(null)
// - Non-breaking: preserves existing API and behavior; only changes ID->URI resolution.

import { useEffect, useState } from "react";
import { getHealingUri } from "@/utils/healingCatalog";

type AnyObj = Record<string, any>;
type TracksArg = { tracks: string[]; shuffle?: boolean };

type MixerState = {
  isReady: boolean;
  isPlayingA: boolean;
  volumeA: number; // 0..1 (base volume before duck)
  ducking: boolean;
  bpmTier: number | null;
};

type Listener = () => void;

function isUri(s: string): boolean {
  return /^(https?:|blob:|data:|file:)/i.test(s) || s.includes("/") || /\.[a-z0-9]{2,4}$/i.test(s);
}
function idToUri(s: string): string | null {
  const id = String(s || "").trim();
  if (!id) return null;
  if (isUri(id)) return id; // absolute/relative URL stays as-is
  const u = getHealingUri(id); // assets resolver
  if (!u) {
    console.warn(`[mixer] unknown audio id: "${id}" (register in utils/healingCatalog.ts)`);
    return null;
  }
  return u;
}
function pick<T>(arr: T[], i: number): T | undefined {
  return arr && arr.length ? arr[i % arr.length] : undefined;
}

// ---- Singleton ----
const singleton = (function buildSingleton() {
  const g: AnyObj = typeof globalThis !== "undefined" ? (globalThis as AnyObj) : {};
  g.__feelFit = g.__feelFit || {};

  // HTMLAudio + (optional) AudioContext
  const audio: HTMLAudioElement =
    (g.__ffMixer && g.__ffMixer.audio) ||
    (() => {
      const a = new Audio();
      a.preload = "auto";
      a.crossOrigin = "anonymous";
      return a;
    })();

  let actx: AudioContext | null = null;
  try {
    // @ts-ignore - Safari
    const AC = (window as AnyObj).AudioContext || (window as AnyObj).webkitAudioContext;
    if (AC) {
      actx = g.__ffMixer?.actx || new AC();
      if (!g.__ffMixer?.__sourceNode && actx && (actx as AnyObj).createMediaElementSource) {
        const src = (actx as AnyObj).createMediaElementSource(audio);
        src.connect(actx.destination);
        (audio as AnyObj).__srcNode = src;
      }
    }
  } catch {}

  // Internal state
  let tracks: string[] = [];
  let shuffle = false;
  let currentIndex = 0;

  const state: MixerState = {
    isReady: false,
    isPlayingA: false,
    volumeA: (() => {
      try {
        const v = localStorage.getItem("mixer.volumeA.v1");
        return v ? Math.min(1, Math.max(0, parseFloat(v))) : 1;
      } catch {
        return 1;
      }
    })(),
    ducking: false,
    bpmTier: null,
  };

  const listeners: Listener[] = [];
  function emit() {
    for (let i = 0; i < listeners.length; i++) {
      try {
        listeners[i]();
      } catch {}
    }
  }
  function addListener(fn: Listener) {
    if (!listeners.includes(fn)) listeners.push(fn);
  }
  function removeListener(fn: Listener) {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  }

  function applyVolume() {
    const duckFactor = 0.25; // 25% during voice
    const v = Math.max(0, Math.min(1, state.ducking ? state.volumeA * duckFactor : state.volumeA));
    try {
      audio.volume = v;
    } catch {}
  }

  function setReady(v: boolean) {
    state.isReady = v;
    emit();
  }
  function setPlaying(v: boolean) {
    state.isPlayingA = v;
    emit();
  }
  function setVolume(v: number) {
    const vol = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
    state.volumeA = vol;
    applyVolume();
    try {
      localStorage.setItem("mixer.volumeA.v1", String(vol));
    } catch {}
    emit();
  }
  function setDucking(v: boolean) {
    state.ducking = !!v;
    applyVolume();
    emit();
  }

  async function ensureUnlocked() {
    try {
      await actx?.resume?.();
    } catch {}
    // Some browsers require a user gesture before play() succeeds.
  }

  function resolveTracks(input: string[]): string[] {
    const out: string[] = [];
    for (const raw of input || []) {
      const u = idToUri(raw);
      if (u) out.push(u);
    }
    return out;
  }

  async function setTracks(arg: TracksArg) {
    const list = resolveTracks(arg?.tracks || []);
    tracks = list;
    shuffle = !!arg?.shuffle;
    currentIndex = 0;

    if (tracks.length > 0) {
      try {
        audio.src = tracks[0];
        audio.load();
      } catch {}
      setReady(true);
    } else {
      try {
        audio.src = "";
      } catch {}
      setReady(false);
    }
    setPlaying(false);
    emit();
  }

  async function playCommon() {
    if (!tracks.length) return;

    if (!audio.src) {
      try {
        audio.src = tracks[currentIndex] || tracks[0];
        audio.load();
      } catch {}
    }

    try {
      await ensureUnlocked();
    } catch {}
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false); // autoplay blocked: caller must retry after a gesture
    }
  }

  async function playHealing() {
    return playCommon();
  }
  async function play() {
    return playCommon();
  }
  async function resume() {
    return playCommon();
  }

  function pause() {
    try {
      audio.pause();
    } catch {}
    setPlaying(false);
  }

  function stop() {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {}
    setPlaying(false);
  }

  function nextTrack() {
    if (!tracks.length) return;
    if (shuffle) {
      let n = Math.floor(Math.random() * tracks.length);
      if (n === currentIndex && tracks.length > 1) n = (n + 1) % tracks.length;
      currentIndex = n;
    } else {
      currentIndex = (currentIndex + 1) % tracks.length;
    }
    try {
      audio.src = tracks[currentIndex];
      audio.load();
    } catch {}
    void playCommon();
  }

  function prevTrack() {
    if (!tracks.length) return;
    if (shuffle) {
      let n = Math.floor(Math.random() * tracks.length);
      if (n === currentIndex && tracks.length > 1) n = (n + 1) % tracks.length;
      currentIndex = n;
    } else {
      currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    }
    try {
      audio.src = tracks[currentIndex];
      audio.load();
    } catch {}
    void playCommon();
  }

  function getCurrentTrackUri(): string | null {
    try {
      if (audio.src) return audio.src;
      const t = pick(tracks, currentIndex);
      return t || null;
    } catch {
      return null;
    }
  }

  // HTMLAudio events
  try {
    audio.onended = () => {
      if (tracks.length > 1) nextTrack();
      else setPlaying(false);
    };
    audio.onplay = () => setPlaying(true);
    audio.onpause = () => setPlaying(false);
  } catch {}

  // ---- Voice ducking via feelFit events ----
  try {
    const onVoiceStart = () => setDucking(true);
    const onVoiceEnd = () => setDucking(false);
    window.addEventListener("feelFit:voice-start", onVoiceStart as EventListener);
    window.addEventListener("feelFit:voice-end", onVoiceEnd as EventListener);
    // ensure initial volume is applied considering current ducking
    applyVolume();
  } catch {}

  // Expose API
  const api = {
    state,
    setTracks,
    playHealing,
    play,
    pause,
    resume,
    stop,
    setVolumeA: setVolume,
    setVolume: setVolume,
    getCurrentTrackUri,
    setBpmTier: (v: number) => {
      state.bpmTier = Number(v) || null;
      emit();
    },
    faster: () => {},
    slower: () => {},
    next: nextTrack,
    prev: prevTrack,
    audio,
    actx,
    get tracks() {
      return tracks;
    },
    // listeners for hooks
    __addListener: addListener,
    __removeListener: removeListener,
  };

  if (!g.__ffMixer) {
    g.__ffMixer = api;
  } else {
    // Update mutable parts if reloaded HMR
    g.__ffMixer.state = state;
    g.__ffMixer.audio = audio;
    g.__ffMixer.actx = actx;
    g.__ffMixer.__addListener = addListener;
    g.__ffMixer.__removeListener = removeListener;
    g.__ffMixer.setTracks = setTracks;
    g.__ffMixer.play = play;
    g.__ffMixer.playHealing = playHealing;
    g.__ffMixer.pause = pause;
    g.__ffMixer.resume = resume;
    g.__ffMixer.stop = stop;
    g.__ffMixer.setVolumeA = setVolume;
    g.__ffMixer.setVolume = setVolume;
    g.__ffMixer.getCurrentTrackUri = getCurrentTrackUri;
    g.__ffMixer.setBpmTier = api.setBpmTier;
    g.__ffMixer.faster = api.faster;
    g.__ffMixer.slower = api.slower;
    g.__ffMixer.next = nextTrack;
    g.__ffMixer.prev = prevTrack;
    g.__ffMixer.tracks = tracks;
  }

  return g.__ffMixer as typeof api;
})();

// ---- Hook wrapper ----
export function useAudioMixer() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((v) => v + 1);
    const add = (singleton as AnyObj).__addListener as (fn: Listener) => void;
    const remove = (singleton as AnyObj).__removeListener as (fn: Listener) => void;
    add(l);
    return () => remove(l);
  }, []);
  return singleton;
}
