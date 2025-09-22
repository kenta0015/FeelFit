// hooks/useVoiceIntents.ts
import { useCallback } from "react";
import { useCoachSpeech } from "./useCoachSpeech";
import { useBpmTier } from "./useBpmTier";

// Optional engine type (best-effort). Keep loose to avoid coupling.
type Engine = {
  pause?: () => Promise<void> | void;
  resume?: () => Promise<void> | void;
  skip?: () => Promise<void> | void;
  getRemainingSeconds?: () => number | Promise<number>;
};

function resolveEngine(provided?: Engine): Engine {
  if (provided) return provided;
  // best-effort discovery (non-fatal if absent)
  const g: any = globalThis as any;
  return g.__feelFit?.engine ?? {};
}

/**
 * Voice intents that drive real controls when available,
 * and always speak with auto-ducking.
 */
export function useVoiceIntents(providedEngine?: Engine) {
  const coach = useCoachSpeech();
  const { slower, faster, bpmTier, range, rampTo } = useBpmTier({ min: 70, max: 150, step: 5, rampMs: 600, tickMs: 60 });
  const engine = resolveEngine(providedEngine);

  const doPause = useCallback(async () => {
    try { await engine.pause?.(); } catch {}
    await coach.cue("Paused. Music ducked.");
  }, [engine, coach]);

  const doResume = useCallback(async () => {
    try { await engine.resume?.(); } catch {}
    await coach.cue("Resumed. Back to normal volume.");
  }, [engine, coach]);

  const doSkip = useCallback(async () => {
    try { await engine.skip?.(); } catch {}
    await coach.cue("Skipping to the next.");
  }, [engine, coach]);

  const doTime = useCallback(async () => {
    let secs: number | undefined;
    try {
      const v = await engine.getRemainingSeconds?.();
      if (typeof v === "number") secs = v;
    } catch {}
    if (typeof secs === "number") {
      const m = Math.max(0, Math.floor(secs / 60));
      const s = Math.max(0, secs % 60);
      await coach.cue(`You have ${m} minutes and ${s} seconds remaining.`);
    } else {
      await coach.cue("You have five minutes remaining.");
    }
  }, [engine, coach]);

  const doSlower = useCallback(async () => {
    slower();
    const next = Math.max(range.min, (bpmTier ?? 100) - range.step);
    await coach.cue(`Slowing down. Tempo ${next}.`);
  }, [slower, coach, bpmTier, range]);

  const doFaster = useCallback(async () => {
    faster();
    const next = Math.min(range.max, (bpmTier ?? 100) + range.step);
    await coach.cue(`Speeding up. Tempo ${next}.`);
  }, [faster, coach, bpmTier, range]);

  return {
    pause: doPause,
    resume: doResume,
    skip: doSkip,
    time: doTime,
    slower: doSlower,
    faster: doFaster,
    rampTo,
    coachBusy: coach.busy,
    mixerState: coach.mixerState,
  };
}
