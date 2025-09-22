// hooks/useBpmTier.ts
import { useCallback, useEffect, useRef } from "react";
import { useAudioMixer } from "./useAudioMixer";

type Options = {
  min?: number;   // default 70
  max?: number;   // default 150
  step?: number;  // default 5
  rampMs?: number; // default 600 (UI ramp)
  tickMs?: number; // default 60
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function useBpmTier(opts: Options = {}) {
  const min = opts.min ?? 70;
  const max = opts.max ?? 150;
  const step = opts.step ?? 5;
  const rampMs = opts.rampMs ?? 600;
  const tickMs = opts.tickMs ?? 60;

  const mixer = useAudioMixer();
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // always cancel ramp on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const setTier = useCallback(
    (t: number) => {
      const next = clamp(Math.round(t), min, max);
      mixer.setBpmTier(next); // ← グローバルへ即時反映（全画面同期）
    },
    [mixer, min, max]
  );

  const slower = useCallback(() => {
    setTier((mixer.state.bpmTier ?? 110) - step);
  }, [mixer.state.bpmTier, setTier, step]);

  const faster = useCallback(() => {
    setTier((mixer.state.bpmTier ?? 110) + step);
  }, [mixer.state.bpmTier, setTier, step]);

  const rampTo = useCallback(
    (target: number) => {
      // cancel any previous ramp
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearInterval(timerRef.current);

      const start = mixer.state.bpmTier ?? 110;
      const end = clamp(Math.round(target), min, max);
      if (start === end) return;

      // simple linear ramp using setInterval (avoid RAF tight loops)
      const delta = end - start;
      const steps = Math.max(1, Math.round(rampMs / tickMs));
      let i = 0;
      timerRef.current = window.setInterval(() => {
        i += 1;
        const t = i / steps;
        const val = Math.round(start + delta * t);
        setTier(val);
        if (i >= steps) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setTier(end);
        }
      }, tickMs);
    },
    [mixer.state.bpmTier, min, max, rampMs, tickMs, setTier]
  );

  return {
    bpmTier: mixer.state.bpmTier,
    range: { min, max, step },
    setTier,
    slower,
    faster,
    rampTo,
  };
}
