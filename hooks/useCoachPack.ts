// hooks/useCoachPack.ts
// Coach line picker + delivery with cooldown and no-repeat.
// Non-destructive: uses existing useCoachSpeech() for TTS+ducking.

import { useMemo, useRef } from "react";
import {
  COACH_LINES,
  type ContentKind,
  type Phase,
  type Gender,
  type CoachLine,
} from "@/data/coachLines";
import { useCoachSpeech } from "@/hooks/useCoachSpeech";

type Options = {
  cooldownMs?: number;   // block same (content, phase) within this window
  recentWindow?: number; // recent list size per (content, phase, gender)
};

type PhaseKey = `${ContentKind}:${Phase}`;
type GenderKey = `${ContentKind}:${Phase}:${Gender}`;

export function useCoachPack(opts?: Options) {
  const cooldownMs = opts?.cooldownMs ?? 10_000;
  const recentWindow = Math.max(1, Math.floor(opts?.recentWindow ?? 3));

  const { cue, busy, ducking, mixerState } = useCoachSpeech({
    timeoutMs: 10_000,
    minGapMs: 350,
  });

  // Use Partial<> so empty {} is valid at init (fixes TS overload error).
  const lastFireRef = useRef<Partial<Record<PhaseKey, number>>>({});
  const recentRef = useRef<Partial<Record<GenderKey, string[]>>>({});

  const pick = (content: ContentKind, phase: Phase, gender: Gender): CoachLine | null => {
    const pool = COACH_LINES[content]?.[phase]?.[gender] ?? [];
    if (!pool.length) return null;

    const key: GenderKey = `${content}:${phase}:${gender}`;
    const recent = recentRef.current[key] ?? [];

    // Filter out very recent IDs to avoid repetition
    const candidates = pool.filter((l) => !recent.includes(l.id));
    const bag = candidates.length ? candidates : pool; // fallback if all filtered

    const idx = Math.floor(Math.random() * bag.length);
    const chosen = bag[idx];

    // Update recent list
    const updated = [chosen.id, ...recent.filter((id) => id !== chosen.id)].slice(0, recentWindow);
    recentRef.current[key] = updated;

    return chosen;
  };

  const say = async (phase: Phase, content: ContentKind, gender: Gender) => {
    const k: PhaseKey = `${content}:${phase}`;
    const now = Date.now();
    const last = lastFireRef.current[k] ?? 0;
    if (now - last < cooldownMs) return; // in cooldown

    const line = pick(content, phase, gender);
    if (!line?.text) return;

    lastFireRef.current[k] = now;
    await cue(line.text);
  };

  return useMemo(
    () => ({
      say,
      busy,
      ducking,
      mixerState,
    }),
    [busy, ducking, mixerState]
  );
}
