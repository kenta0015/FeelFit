// hooks/useAudioEngine.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { AudioEngine, MixerState } from "../audio/AudioEngine";

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null);
  const [state, setState] = useState<MixerState>({
    isReady: false,
    isPlayingA: false,
    ducking: false,
    bpmTier: 110,
    volumeA: 1,
  });

  useEffect(() => {
    const e = new AudioEngine();
    engineRef.current = e;
    e.setup().then(() => setState({ ...e.getState() }));
    return () => { engineRef.current = null; };
  }, []);

  const api = useMemo(() => ({
    get ready() { return !!engineRef.current?.getState().isReady; },
    state,
    refresh: () => {
      const s = engineRef.current?.getState();
      if (s) setState({ ...s });
    },
    setHealingTracks: (uris: string[]) => {
      engineRef.current?.setHealingTracks(uris);
      const s = engineRef.current?.getState(); if (s) setState({ ...s });
    },
    startHealing: async (loop = true, shuffle = false) => {
      await engineRef.current?.startHealing(loop, shuffle);
      const s = engineRef.current?.getState(); if (s) setState({ ...s });
    },
    stopHealing: async () => {
      await engineRef.current?.stopHealing();
      const s = engineRef.current?.getState(); if (s) setState({ ...s });
    },
    onVoiceStart: async () => {
      await engineRef.current?.startDucking();
      const s = engineRef.current?.getState(); if (s) setState({ ...s });
    },
    onVoiceEnd: async () => {
      await engineRef.current?.stopDucking();
      const s = engineRef.current?.getState(); if (s) setState({ ...s });
    },
    setBpmTier: (tier: 90 | 110 | 130 | 150) => {
      engineRef.current?.setBpmTier(tier);
      const s = engineRef.current?.getState(); if (s) setState({ ...s });
    },
  }), [state]);

  return api;
}

export type UseAudioEngine = ReturnType<typeof useAudioEngine>;
