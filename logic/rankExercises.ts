// logic/rankExercises.ts

import type { Plan, PlanBlock } from '@/types/plan';

export type Ranked = PlanBlock & {
  score: number;
};

/**
 * rankExercises
 * Contract only (empty export for now). Returns a deterministic list of Ranked blocks.
 * Same ctx ⇒ same output (no randomness). Ties resolved by id ascending in final impl.
 */
export function rankExercises(ctx: any): Ranked[] {
  // TODO(A): implement base score = met * duration * 0.9
  // TODO(A): apply weights (monotony7d/strain7d/acuteLoad3d/sRPElite7d)
  // TODO(A): exclude constraints/disliked; if zero → soft penalties + note in why[]
  // TODO(A): stable sort by score desc, then id asc
  return [];
}

/**
 * buildPlan
 * Contract only (empty export for now). Must not exceed timeAvailable.
 * Must include Monotony/Strain reasoning in why[] in final impl.
 */
export function buildPlan(ranked: Ranked[], timeAvailable: number): Plan {
  // TODO(A): pick top blocks within timeAvailable
  // TODO(A): synthesize title (e.g., "Mindful Mobility + Light Cardio (20m)")
  // TODO(A): ensure why[] includes Monotony/Strain line
  // TODO(A): fallback to safe default (10–15m low-MET) if no candidates
  return {
    title: '',
    blocks: [],
    totalTime: 0,
    why: [],
  };
}
