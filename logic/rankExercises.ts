// logic/rankExercises.ts

import type { Plan, PlanBlock } from '@/types/plan';
import templates from '@/data/exerciseTemplates.json';

// ----------------------------
// Types
// ----------------------------

export type Ranked = PlanBlock & {
  score: number;
};

type Ctx = {
  // user inputs
  focus?: 'mental' | 'physical' | 'both';
  emotion?: string;
  timeAvailable: number; // minutes
  intensityPref?: 'low' | 'med' | 'high';
  equipment?: string[]; // available equipment
  constraints?: string[]; // ids/categories/intensity keywords to avoid (hard)
  disliked?: string[]; // ids/titles/categories to avoid (hard)

  // signals (read-only)
  streak?: number;
  sessions7d?: number;
  minutes7d?: number;
  recentIntensityAvg?: number;
  mentalΔ?: number;
  physicalΔ?: number;
  acuteLoad3d?: number;
  monotony7d?: number;
  strain7d?: number;
  sRPElite7d?: number;
  earlyStopRate?: number;
  skipCount?: number;
  lastHighGap?: number; // days since last high intensity
};

// ----------------------------
// Helpers
// ----------------------------

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function asArray(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String);
  return [String(v)];
}

function normalizeStr(x?: string) {
  return (x ?? '').toLowerCase();
}

function blockMatchesFocus(block: any, focus?: 'mental' | 'physical' | 'both'): number {
  if (!focus || focus === 'both') return 1.0;
  return block.focus === focus ? 1.0 : 0.9; // mild nudge
}

function intensityBias(intensity: PlanBlock['intensity'], pref?: 'low' | 'med' | 'high') {
  if (!pref) return 1.0;
  if (pref === intensity) return 1.1;
  if (pref === 'low' && intensity === 'high') return 0.8;
  if (pref === 'high' && intensity === 'low') return 0.9;
  return 1.0;
}

function equipmentAllowed(block: any, available: string[]) {
  // 明示的に string[] に整形してから Set を作る（TS の unknown 警告回避）
  const beq = asArray(block.equipment).map(normalizeStr);
  const bset = new Set<string>(beq);
  const hasNone = bset.has('none');

  const av = new Set<string>(asArray(available).map(normalizeStr));

  // いずれか一致 or "none" で可能なら許可
  if (hasNone) return true;
  for (const e of bset) {
    if (av.has(e)) return true;
  }
  return false;
}

function hardExclude(block: any, constraints: string[], disliked: string[]) {
  const nId = normalizeStr(block.id);
  const nTitle = normalizeStr(block.title);
  const nCat = normalizeStr(block.category);
  const nInt = normalizeStr(block.intensity);
  const all = new Set([...constraints, ...disliked].map(normalizeStr));
  return all.has(nId) || all.has(nTitle) || all.has(nCat) || all.has(nInt);
}

// penalty version when we must keep something to avoid empty set
function softPenalty(block: Ranked, constraints: string[], disliked: string[]) {
  const nId = normalizeStr(block.id);
  const nTitle = normalizeStr(block.title);
  const nCat = normalizeStr(block.category);
  const nInt = normalizeStr(block.intensity);
  const all = new Set([...constraints, ...disliked].map(normalizeStr));
  let mult = 1.0;
  if (all.has(nId)) mult *= 0.4;
  if (all.has(nTitle)) mult *= 0.5;
  if (all.has(nCat)) mult *= 0.7;
  if (all.has(nInt)) mult *= 0.7;
  block.score *= mult;
}

function monotonyStrainMultiplier(block: any, ctx: Ctx) {
  const mono = ctx.monotony7d ?? 1.0; // typical 0.8–2.5
  const strain = ctx.strain7d ?? 1.0; // arbitrary scale ~0–3
  const acute = ctx.acuteLoad3d ?? 1.0; // spike ratio ~0.5–2.5
  const srpe = ctx.sRPElite7d ?? 1.0; // 0–10 scale (approx)

  let m = 1.0;

  if (mono > 1.8 && block.intensity === 'high') m *= 0.9;
  if (strain > 1.4) {
    if (block.intensity === 'high') m *= clamp(1.2 - 0.2 * (strain - 1.4), 0.75, 1.0);
  }
  if (acute > 1.3) {
    if (block.intensity !== 'low') m *= clamp(1.2 - 0.2 * (acute - 1.3), 0.75, 1.0);
  }
  if (srpe > 6) {
    if (block.intensity === 'high') m *= 0.9;
  }

  return m;
}

function buildWhyFromSignals(ctx: Ctx): string {
  const mono = ctx.monotony7d ?? 0;
  const strain = ctx.strain7d ?? 0;
  const acute = ctx.acuteLoad3d ?? 0;
  const parts: string[] = [];
  if (mono >= 2.0) parts.push('Monotony trending high → add variety.');
  if (strain >= 1.5) parts.push('Recent strain elevated → ease intensity.');
  if (acute >= 1.6) parts.push('Acute load spike → limit total load.');
  if (parts.length === 0) parts.push('Balanced day based on recent load and monotony.');
  return parts.join(' ');
}

function synthesizeTitle(blocks: PlanBlock[], totalTime: number): string {
  if (!blocks.length) return `Recovery Reset (${totalTime}m)`;
  const cats = Array.from(new Set(blocks.map((b) => b.category)));
  const mapLabel: Record<string, string> = {
    mobility: 'Mobility',
    core: 'Core',
    cardio: 'Light Cardio',
    strength: 'Strength',
    mindfulness: 'Mindfulness',
    recovery: 'Recovery'
  };
  const labels = cats.slice(0, 2).map((c) => mapLabel[c] ?? c);
  const label = labels.join(' + ');
  return `${label} (${totalTime}m)`;
}

// ----------------------------
// Ranking
// ----------------------------

export function rankExercises(ctx: Ctx): Ranked[] {
  const availableEq = asArray(ctx.equipment);
  const constraints = asArray(ctx.constraints);
  const disliked = asArray(ctx.disliked);

  // 1) map templates to Ranked with base score
  let ranked: Ranked[] = (templates as any[]).map((t) => {
    const block: PlanBlock = {
      id: t.id,
      title: t.title,
      duration: Number(t.duration),
      met: Number(t.met),
      intensity: t.intensity,
      category: t.category
    };

    // Base: MET * duration * 0.9
    let score = block.met * block.duration * 0.9;

    // Focus / preference
    score *= blockMatchesFocus(t, ctx.focus);
    score *= intensityBias(block.intensity, ctx.intensityPref);

    // Equipment gating
    const allowed = equipmentAllowed(t, availableEq);
    if (!allowed) score *= 0.3; // soft gate

    // Load modifiers
    score *= monotonyStrainMultiplier(t, ctx);

    return { ...block, score };
  });

  // 2) Hard exclude first
  const hardFiltered = ranked.filter((b) => !hardExclude(b, constraints, disliked));

  // 3) If everything excluded, restore from original ranked with soft penalties
  if (hardFiltered.length === 0) {
    ranked.forEach((b) => softPenalty(b, constraints, disliked));
  } else {
    ranked = hardFiltered;
  }

  // 4) Deterministic stable sort: score desc, id asc
  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id.localeCompare(b.id);
  });

  return ranked;
}

// ----------------------------
// Plan builder
// ----------------------------

export function buildPlan(ranked: Ranked[], timeAvailable: number): Plan {
  const timeCap = Math.max(5, Math.min(60, Math.floor(timeAvailable || 0)));
  const blocks: PlanBlock[] = [];
  let acc = 0;

  // Greedy fill without exceeding timeAvailable
  for (const r of ranked) {
    if (acc + r.duration <= timeCap) {
      blocks.push({
        id: r.id,
        title: r.title,
        duration: r.duration,
        met: r.met,
        intensity: r.intensity,
        category: r.category
      });
      acc += r.duration;
    }
    if (acc >= timeCap) break;
  }

  // Fallback: if no block selected, pick the smallest low-MET mindful/mobility/recovery
  if (blocks.length === 0) {
    const safe = (templates as any[])
      .filter(
        (t) =>
          t.intensity === 'low' &&
          ['mindfulness', 'mobility', 'recovery'].includes(t.category)
      )
      .sort((a, b) => a.duration - b.duration || a.id.localeCompare(b.id));
    const pick = safe.find((s) => s.duration <= timeCap) || safe[0];
    if (pick) {
      blocks.push({
        id: pick.id,
        title: pick.title,
        duration: pick.duration,
        met: pick.met,
        intensity: pick.intensity,
        category: pick.category
      });
      acc = pick.duration;
    }
  }

  const why = [buildWhyFromSignals({} as Ctx)]; // placeholder if no signals provided
  const title = synthesizeTitle(blocks, acc);

  return {
    title,
    blocks,
    totalTime: acc,
    why
  };
}
