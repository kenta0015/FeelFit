// hooks/useCoachSpeech.ts
import { useVoiceDuck } from "./useVoiceDuck";

/**
 * Thin wrapper for coach speech with auto-ducking.
 * Usage: const coach = useCoachSpeech(); await coach.cue("Hydrate.");
 */
export function useCoachSpeech(opts?: { timeoutMs?: number; minGapMs?: number }) {
  const { sayWithDuck, busy, ducking, mixerState } = useVoiceDuck(opts ?? { timeoutMs: 10000, minGapMs: 350 });
  return {
    cue: (text: string) => sayWithDuck(text),
    busy,
    ducking,
    mixerState,
  };
}
