// hooks/useAudioMixer.web.ts
// Minimal HTMLAudio-based mixer (web only).
// - Singleton exposed at globalThis.__ffMixer for debugging.
// - setTracks accepts IDs or URIs. IDs map to /healing/<id>.mp3
// - Methods: setTracks, play/playHealing, pause, resume, stop, setVolumeA, getCurrentTrackUri
// - State: isReady, isPlayingA, volumeA, ducking(false), bpmTier(null)

import { useEffect, useState } from "react";

type AnyObj = Record<string, any>;
type TracksArg = { tracks: string[]; shuffle?: boolean };

type MixerState = {
  isReady: boolean;
  isPlayingA: boolean;
  volumeA: number;
  ducking: boolean;
  bpmTier: number | null;
};

type Listener = () => void;

function isUri(s: string): boolean {
  return /^(https?:|blob:|data:|file:)/i.test(s) || s.includes("/") || /\.[a-z0-9]{2,4}$/i.test(s);
}
function idToUri(s: string): string {
  const id = String(s || "").trim();
  return isUri(id) ? id : `/healing/${id}.mp3`;
}
function pick<T>(arr: T[], i: number): T | undefined {
  return arr && arr.length ? arr[i % arr.length] : undefined;
}

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
    // @ts-ignore - for Safari
    const AC = (window as AnyObj).AudioContext || (window as AnyObj).webkitAudioContext;
    if (AC) {
      actx = g.__ffMixer?.actx || new AC();
      // Create source only once per audio element
      if (!g.__ffMixer?.__sourceNode && actx && (actx as AnyObj).createMediaElementSource) {
        const src = (actx as AnyObj).createMediaElementSource(audio);
        src.connect(actx.destination);
        (audio as AnyObj).__srcNode = src;
      }
    }
  } catch {}

  let tracks: string[] = [];
  let shuffle = false;
  let currentIndex = 0;

  const state: MixerState = {
    isReady: false,
    isPlayingA: false,
    volumeA: 1,
    ducking: false,
    bpmTier: null,
  };

  const listeners: Listener[] = [];
  function emit() {
    for (let i = 0; i < listeners.length; i++) { try { listeners[i](); } catch {} }
  }

  function setReady(v: boolean) { state.isReady = v; emit(); }
  function setPlaying(v: boolean) { state.isPlayingA = v; emit(); }
  function setVolume(v: number) {
    const vol = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
    state.volumeA = vol;
    try { audio.volume = vol; } catch {}
    emit();
  }

  async function ensureUnlocked() {
    try { await actx?.resume?.(); } catch {}
    // Some browsers require a direct play attempt after gesture
  }

  function resolveTracks(input: string[]): string[] {
    return (input || []).map(idToUri);
  }

  async function setTracks(arg: TracksArg) {
    const list = resolveTracks(arg?.tracks || []);
    tracks = list;
    shuffle = !!arg?.shuffle;
    currentIndex = 0;

    if (tracks.length > 0) {
      try { audio.src = tracks[0]; } catch {}
      setReady(true);
    } else {
      try { audio.src = ""; } catch {}
      setReady(false);
    }
    setPlaying(false);
    emit();
  }

  async function playCommon() {
    if (!tracks.length) return;

    // Make sure a valid src is set
    if (!audio.src) {
      try { audio.src = tracks[currentIndex] || tracks[0]; } catch {}
    }

    try { await ensureUnlocked(); } catch {}
    try {
      await audio.play();
      setPlaying(true);
    } catch (e) {
      // autoplay blocked; caller should trigger after a user gesture
      setPlaying(false);
    }
  }

  async function playHealing() { return playCommon(); }
  async function play() { return playCommon(); }
  async function resume() { return playCommon(); }

  function pause() {
    try { audio.pause(); } catch {}
    setPlaying(false);
  }

  function stop() {
    try { audio.pause(); } catch {}
    try { audio.currentTime = 0; } catch {}
    setPlaying(false);
  }

  function nextTrack() {
    if (!tracks.length) return;
    if (shuffle) {
      currentIndex = Math.floor(Math.random() * tracks.length);
    } else {
      currentIndex = (currentIndex + 1) % tracks.length;
    }
    try { audio.src = tracks[currentIndex]; } catch {}
    void playCommon();
  }

  function prevTrack() {
    if (!tracks.length) return;
    if (shuffle) {
      currentIndex = Math.floor(Math.random() * tracks.length);
    } else {
      currentIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    }
    try { audio.src = tracks[currentIndex]; } catch {}
    void playCommon();
  }

  function getCurrentTrackUri(): string | null {
    try {
      if (audio.src) return audio.src;
      const t = pick(tracks, currentIndex);
      return t || null;
    } catch { return null; }
  }

  // events
  try {
    audio.onended = () => {
      // auto-advance
      if (tracks.length > 1) nextTrack();
      else setPlaying(false);
    };
  } catch {}

  // expose global for debugging
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
    setBpmTier: (v: number) => { state.bpmTier = Number(v) || null; emit(); },
    faster: () => {},
    slower: () => {},
    audio,
    actx,
    get tracks() { return tracks; },
  };

  // attach once
  if (!g.__ffMixer) {
    g.__ffMixer = api;
  }

  return g.__ffMixer as typeof api;
})();

export function useAudioMixer() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((v) => v + 1);
    (singleton as AnyObj).state && (singleton as AnyObj);
    const add = (singleton as AnyObj).__addListener || ((fn: Listener) => {
      (singleton as AnyObj).__listeners = (singleton as AnyObj).__listeners || [];
      (singleton as AnyObj).__listeners.push(fn);
    });
    const remove = (singleton as AnyObj).__removeListener || ((fn: Listener) => {
      const arr: Listener[] = (singleton as AnyObj).__listeners || [];
      const i = arr.indexOf(fn);
      if (i >= 0) arr.splice(i, 1);
    });

    // Hook into internal listeners array
    (singleton as AnyObj).__listeners = (singleton as AnyObj).__listeners || [];
    add(l);
    return () => remove(l);
  }, []);

  return singleton;
}
