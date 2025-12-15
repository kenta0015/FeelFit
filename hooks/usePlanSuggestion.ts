// hooks/usePlanSuggestion.ts
import { useMemo } from 'react';
import type { Plan } from '@/types/plan';
import { rankExercises, buildPlan } from '@/logic/rankExercises';

// Minimal ctx from screen (timeAvailable optional)
export type SuggestionCtx = {
  timeAvailable?: number; // if not given, choose best from 10/15/20/30
  focus?: 'mental' | 'physical' | 'both';
  emotion?: string | null;
  intensityPref?: 'low' | 'med' | 'high';
  equipment?: string[];
  constraints?: string[];
  disliked?: string[];
  readiness?: number; // for Two-Choice trigger

  // Style constraints (set e.g. by Coach actions like "Indoor only", "Be gentle on joints")
  indoorOnly?: boolean;
  lowImpactOnly?: boolean;
};

// normalize for ranker (fill null/undefined with safe defaults)
function normalizeCtxForRank(
  ctx: Required<Pick<SuggestionCtx, 'timeAvailable'>> & SuggestionCtx
) {
  const rawConstraints = (ctx.constraints ?? []).map(String);
  const rawHasIndoor = rawConstraints.some((c) => c.toLowerCase() === 'coach:indoor-only');
  const rawHasGentle = rawConstraints.some((c) => c.toLowerCase() === 'coach:gentle-joints');

  // Support both legacy "constraints tag" mode and newer boolean flags.
  // If a boolean flag is undefined, fall back to whether the tag already existed.
  const indoorOnly = ctx.indoorOnly ?? rawHasIndoor;
  const lowImpactOnly = ctx.lowImpactOnly ?? rawHasGentle;

  // Strip the coach tags from the base list and then re-add based on the resolved flags.
  const baseConstraints = rawConstraints.filter((c) => {
    const n = c.toLowerCase();
    return n !== 'coach:indoor-only' && n !== 'coach:gentle-joints';
  });

  const mergedConstraints: string[] = [...baseConstraints];
  if (indoorOnly) mergedConstraints.push('coach:indoor-only');
  if (lowImpactOnly) mergedConstraints.push('coach:gentle-joints');

  const finalConstraints = Array.from(new Set(mergedConstraints));

  return {
    timeAvailable: ctx.timeAvailable,
    focus: ctx.focus,
    emotion: ctx.emotion ?? undefined,
    intensityPref: ctx.intensityPref,
    equipment: ctx.equipment ?? [],
    constraints: finalConstraints,
    disliked: ctx.disliked ?? [],

    // Style constraints propagated to ranker
    indoorOnly: indoorOnly,
    lowImpactOnly: lowImpactOnly,

    // signals default 0 (safe on rules)
    streak: 0,
    sessions7d: 0,
    minutes7d: 0,
    recentIntensityAvg: 0,
    mentalΔ: 0,
    physicalΔ: 0,
    acuteLoad3d: 0,
    monotony7d: 0,
    strain7d: 0,
    sRPElite7d: 0,
    earlyStopRate: 0,
    skipCount: 0,
    lastHighGap: 0,
  } as any;
}

function scorePlan(p: Plan): number {
  const completion = 0.9;
  return p.blocks.reduce((s, b) => s + b.met * b.duration * completion, 0);
}

export type UsePlanSuggestionResult = {
  plan: Plan;
  recommendedTime: number;
  isUncertainDay: boolean;
};

export function usePlanSuggestion(ctx: SuggestionCtx): UsePlanSuggestionResult {
  return useMemo(() => {
    const isUncertainDay = (ctx.readiness ?? 100) < 40;

    // 1) fixed time
    if (typeof ctx.timeAvailable === 'number') {
      const ranked = rankExercises(
        normalizeCtxForRank({ ...ctx, timeAvailable: ctx.timeAvailable })
      );
      const fixed = buildPlan(ranked, ctx.timeAvailable);
      return { plan: fixed, recommendedTime: ctx.timeAvailable, isUncertainDay };
    }

    // 2) choose best from 10/15/20/30 (tie → shorter)
    const buckets = [10, 15, 20, 30] as const;
    let best: { plan: Plan; time: number; score: number } | null = null;

    for (const t of buckets) {
      const ranked = rankExercises(
        normalizeCtxForRank({ ...ctx, timeAvailable: t })
      );
      const p = buildPlan(ranked, t);
      const sc = scorePlan(p);
      if (!best || sc > best.score || (sc === best.score && t < best.time)) {
        best = { plan: p, time: t, score: sc };
      }
    }

    if (!best) {
      const ranked = rankExercises(
        normalizeCtxForRank({ ...ctx, timeAvailable: 20 })
      );
      const p = buildPlan(ranked, 20);
      return { plan: p, recommendedTime: 20, isUncertainDay };
    }

    return { plan: best.plan, recommendedTime: best.time, isUncertainDay };
  }, [
    ctx.timeAvailable,
    ctx.focus,
    ctx.emotion ?? undefined,
    ctx.intensityPref,
    JSON.stringify(ctx.equipment ?? []),
    JSON.stringify(ctx.constraints ?? []),
    JSON.stringify(ctx.disliked ?? []),
    ctx.readiness,
    ctx.indoorOnly,
    ctx.lowImpactOnly,
  ]);
}

export default usePlanSuggestion;
