// ai/dailySummary.ts
// generateDailySummary(ctx) -> text (cached per date; heuristic fallback; OpenAI polish optional)

import { coachWithOpenAI } from './openaiClient';
import type { DailyMetrics } from '@/logic/summaryMetrics';
import { getSummaryByDate, upsertDailySummary } from '@/features/dailySummary/storage';

type Ctx = {
  date: string;        // YYYY-MM-DD
  metrics: DailyMetrics;
};

export async function generateDailySummary(ctx: Ctx): Promise<string> {
  // 1) cache hit
  const cached = await getSummaryByDate(ctx.date);
  if (cached?.text) return cached.text;

  // 2) heuristic draft
  const draft = heuristic(ctx.metrics);

  // 3) AI polish (best-effort)
  const polished = await safePolish(draft, ctx.metrics);
  const text = (polished || draft).trim();

  // 4) persist (idempotent)
  await upsertDailySummary({ date: ctx.date, text, metrics: ctx.metrics });

  return text;
}

function heuristic(m: DailyMetrics): string {
  const parts: string[] = [];

  if (m.streak >= 3) {
    parts.push(`Nice consistency — streak ${m.streak}.`);
  } else if (m.streak === 0) {
    parts.push('Welcome back — let’s rebuild gently.');
  } else {
    parts.push(`Good work — streak ${m.streak}.`);
  }

  parts.push(`7d: ${m.sessions7d} sessions / ${m.minutes7d} min.`);

  if (m.monotony >= 3.5) {
    parts.push('Monotony trending high — add variety to reduce strain.');
  } else if (m.monotony > 0) {
    parts.push('Balanced variety kept strain in check.');
  }

  if (m.avgIntensity7d >= 6) {
    parts.push('Solid intensity — schedule an easy/recovery block tomorrow.');
  } else if (m.avgIntensity7d > 0) {
    parts.push('Light–moderate load — optional light build-up is fine.');
  }

  return parts.join(' ');
}

async function safePolish(draft: string, m: DailyMetrics): Promise<string | null> {
  try {
    const input =
      `Polish this into one friendly coach note (max 2 sentences). ` +
      `Avoid emojis; be specific but concise.\n` +
      `Metrics: ${JSON.stringify(m)}\n` +
      `Draft: "${draft}"`;
    const out = await coachWithOpenAI(input, {
      model: process.env.EXPO_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.6,
      max_tokens: 120,
      system:
        'You are a concise fitness coach. One or two short sentences. Encouraging, specific, and safe.',
    });
    return (out || '').trim() || null;
  } catch {
    return null;
  }
}
