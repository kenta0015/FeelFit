// ai/coachQA.ts
// Q&A generator for Coach tab (MVP).
// Tries OpenAI via coachWithOpenAI(); falls back to safe heuristics offline.

import type { Plan } from '@/types/plan';
import type { SuggestionCtx } from '@/hooks/usePlanSuggestion';
import { coachWithOpenAI } from '@/ai/openaiClient';
import type { CoachAnswer, CoachMessage, CoachQAPrompt } from '@/types/coach';

function summarizePlan(plan: Plan): string {
  const blocks = plan.blocks.map(b => `${b.title}(${b.duration}m, ${b.intensity})`).join(' + ');
  return `${plan.title} · ${plan.totalTime}m · ${blocks}`;
}

function buildSystem(ctx: SuggestionCtx) {
  return [
    'You are a concise, supportive fitness coach.',
    'Answer in 2–5 short sentences.',
    'Never start the workout yourself; suggest actions only.',
    'Prefer low-impact alternatives when user mentions joints or pain.',
    `User context: focus=${ctx.focus ?? 'both'}, emotion=${ctx.emotion ?? 'neutral'}, time=${ctx.timeAvailable ?? 'auto'}, intensityPref=${ctx.intensityPref ?? 'auto'}`,
    'When useful, propose structured actions as JSON at the end under an "actions" array (applyTime, swapBlock, replaceStyle).',
  ].join('\n');
}

function parseActions(text: string) {
  // Naive parser: extract final JSON-like actions array if present
  const m = text.match(/\"actions\"\\s*:\\s*(\\[[\\s\\S]*?\\])/i);
  if (!m) return undefined;
  try {
    const arr = JSON.parse(m[1]);
    if (Array.isArray(arr)) return arr;
  } catch {}
  return undefined;
}

function heuristicFallback(q: string): CoachAnswer {
  const lc = q.toLowerCase();
  const actions: any[] = [];
  if (lc.includes('20') && lc.includes('min')) actions.push({ type: 'applyTime', minutes: 20 });
  if (lc.includes('indoor') || lc.includes('inside')) actions.push({ type: 'replaceStyle', style: 'indoor' });
  if (lc.includes('joint') || lc.includes('knee') || lc.includes('low-impact')) actions.push({ type: 'replaceStyle', style: 'low-impact' });
  if (lc.includes('bike')) actions.push({ type: 'swapBlock', from: 'walk', to: 'bike' });
  const text = actions.length
    ? 'Here is a safer variant. I recommend a shorter or lower-impact plan based on your request. You can apply the change below.'
    : 'Based on your request, keep it light and focus on form. I adjusted the idea in principle; you can apply changes if needed.';
  return { text, actions };
}

export async function generateAnswer(
  plan: Plan,
  ctx: SuggestionCtx,
  history: CoachMessage[],
  prompt: CoachQAPrompt
): Promise<CoachAnswer> {
  const q = prompt.kind === 'preset' ? prompt.label : prompt.text.trim();
  if (!q) return { text: 'Please type a question or choose a preset.' };

  const sys = buildSystem(ctx);
  const planLine = summarizePlan(plan);
  const hist = history.slice(-6).map(m => `${m.role === 'coach' ? 'Coach' : 'You'}: ${m.text}`).join('\n');

  try {
    const content = [
      `PLAN: ${planLine}`,
      `HISTORY:\n${hist || '(none)'}`,
      `QUESTION: ${q}`,
      'Reply concisely. If proposing edits, add a JSON: {"actions":[...]} at the end.',
    ].join('\n\n');

    const text = await coachWithOpenAI(content, {
      system: sys,
      model: 'gpt-4o-mini',
      temperature: 0.6,
      max_tokens: 220,
    });

    const actions = parseActions(text);
    return { text, actions, cache: { used: 'openai' } };
  } catch {
    // Fallback (offline / key missing)
    return heuristicFallback(q);
  }
}
