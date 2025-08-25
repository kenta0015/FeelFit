// hooks/usePlanSuggestion.ts
import { useMemo } from 'react';
import type { Plan } from '@/types/plan';
import { rankExercises, buildPlan } from '@/logic/rankExercises';

// 画面側から渡す最小コンテキスト（timeAvailable は未指定可）
export type SuggestionCtx = {
  timeAvailable?: number; // 未指定なら 10/15/20/30 を試してベストを選ぶ
  focus?: 'mental' | 'physical' | 'both';
  emotion?: string | null;
  intensityPref?: 'low' | 'med' | 'high';
  equipment?: string[];
  constraints?: string[];
  disliked?: string[];
  readiness?: number; // Two-Choice 用
};

// rankExercises に渡すために null/undefined を正規化
function normalizeCtxForRank(ctx: Required<Pick<SuggestionCtx, 'timeAvailable'>> & SuggestionCtx) {
  return {
    timeAvailable: ctx.timeAvailable,
    focus: ctx.focus,
    emotion: ctx.emotion ?? undefined,
    intensityPref: ctx.intensityPref,
    equipment: ctx.equipment ?? [],
    constraints: ctx.constraints ?? [],
    disliked: ctx.disliked ?? [],
    // シグナルは未指定時 0 扱い（ルール側で安全）
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

    // 1) 時間が指定されている → その時間で確定
    if (typeof ctx.timeAvailable === 'number') {
      const ranked = rankExercises(normalizeCtxForRank({ ...ctx, timeAvailable: ctx.timeAvailable }));
      const fixed = buildPlan(ranked, ctx.timeAvailable);
      return { plan: fixed, recommendedTime: ctx.timeAvailable, isUncertainDay };
    }

    // 2) 未指定 → 10/15/20/30 の中からベストを自動選択（同点なら短い方）
    const buckets = [10, 15, 20, 30] as const;
    let best: { plan: Plan; time: number; score: number } | null = null;

    for (const t of buckets) {
      const ranked = rankExercises(normalizeCtxForRank({ ...ctx, timeAvailable: t }));
      const p = buildPlan(ranked, t);
      const sc = scorePlan(p);
      if (!best || sc > best.score || (sc === best.score && t < best.time)) {
        best = { plan: p, time: t, score: sc };
      }
    }

    // 3) 念のためのフォールバック（理論上到達しない）
    if (!best) {
      const ranked = rankExercises(normalizeCtxForRank({ ...ctx, timeAvailable: 20 }));
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
  ]);
}

export default usePlanSuggestion;
