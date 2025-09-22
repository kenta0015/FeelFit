// hooks/useBpmTier.ts
import { useCallback, useEffect, useRef } from "react";
import { useAudioMixer } from "./useAudioMixer";

type Options = {
  min?: number;
  max?: number;
  step?: number;
  rampMs?: number;
  tickMs?: number;
};

export function useBpmTier(opts: Options = {}) {
  const {
    min = 70,
    max = 150,
    step = 5,
    rampMs = 600,
    tickMs = 60,
  } = opts;

  const mixer = useAudioMixer();
  const timerRef = useRef<NodeJS.Timer | number | null>(null);

  const clamp = useCallback(
    (v: number) => Math.max(min, Math.min(max, Math.round(v))),
    [min, max]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current as number);
      timerRef.current = null;
    }
  }, []);

  const setImmediateTier = useCallback(
    (tier: number) => {
      mixer.setBpmTier(clamp(tier));
    },
    [mixer, clamp]
  );

  const rampTo = useCallback(
    (target: number) => {
      cancel();
      const start = mixer.state.bpmTier ?? Math.round((min + max) / 2);
      const end = clamp(target);
      if (start === end) return;

      const steps = Math.max(1, Math.round(rampMs / tickMs));
      let i = 0;

      timerRef.current = setInterval(() => {
        i += 1;
        const t = i / steps;
        const v = Math.round(start + (end - start) * t);
        mixer.setBpmTier(clamp(v));
        if (i >= steps) cancel();
      }, tickMs);
    },
    [mixer, clamp, cancel, rampMs, tickMs, min, max]
  );

  const nudge = useCallback(
    (dir: -1 | 1) => {
      const current = mixer.state.bpmTier ?? Math.round((min + max) / 2);
      rampTo(current + dir * step);
    },
    [mixer.state.bpmTier, rampTo, step, min, max]
  );

  useEffect(() => () => cancel(), [cancel]);

  return {
    bpmTier: mixer.state.bpmTier,
    isPlayingA: mixer.state.isPlayingA,
    ducking: mixer.state.ducking,
    volumeA: mixer.state.volumeA,
    setImmediateTier,
    rampTo,
    slower: () => nudge(-1),
    faster: () => nudge(1),
    clamp,
    range: { min, max, step },
  };
}
