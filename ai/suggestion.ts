// ai/suggestion.ts
// Phase 3.1: OpenAI rewrite with cache, single-flight, fallback.
// Cache key: sha1(date + planHash + ctxHash)

import { getCache, setCache } from '../utils/cache';
import { budgetAllow, budgetLog } from '../utils/budget';
import * as Crypto from 'expo-crypto';
import { openai } from './openaiClient';

type PlanBlock = {
  id: string;
  title: string;
  duration: number;
  met: number;
  intensity: 'low' | 'med' | 'high';
  category: string;
};

type Plan = {
  title: string;
  blocks: PlanBlock[];
  totalTime: number;
  why: string[];
};

type Ctx = {
  focus?: 'mental' | 'physical' | 'both';
  emotion?: string;
  timeAvailable?: number;
  intensityPref?: 'low' | 'med' | 'high';
  equipment?: string[];
  constraints?: string[];
  disliked?: string[];
  signals?: Record<string, unknown>;
};

// ---- Helpers ----
function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
  const entries = Object.entries(obj as Record<string, unknown>).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0
  );
  return (
    '{' +
    entries.map(([k, v]) => JSON.stringify(k) + ':' + stableStringify(v)).join(',') +
    '}'
  );
}

async function sha1(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, input);
}

function dateOnlyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildRulesFallback(plan: Plan): string {
  const reason = plan.why?.[0] ? `Reason: ${plan.why[0]}` : '';
  const blocks = plan.blocks.slice(0, 3).map((b) => b.title).join(', ');
  return `Plan: ${plan.title}. We'll cover: ${blocks}. ${reason}`.trim();
}

function extractReasonLine(plan: Plan): string {
  const line =
    plan.why?.find((w) => /monotony|strain|recovery|load/i.test(w)) ||
    plan.why?.[0] ||
    '';
  return line;
}

function buildPrompt(plan: Plan, ctx: Ctx): string {
  const reason = extractReasonLine(plan);
  const focus = ctx.focus ?? 'both';
  const time = plan.totalTime ?? ctx.timeAvailable ?? 20;

  return [
    `You are a concise, energetic fitness coach.`,
    `Write a 2–4 sentence motivational suggestion for the user’s session.`,
    `Must include a short reasoning line aligned with the user's recent training context.`,
    `Tone: upbeat, practical, specific; avoid emojis.`,
    `Do not exceed ~65 words.`,
    ``,
    `Session: "${plan.title}" (${time} minutes)`,
    `Blocks: ${plan.blocks
      .map((b) => `${b.title} (${b.duration}m, MET ${b.met})`)
      .join('; ')}`,
    `Focus: ${focus}`,
    `Reasoning hint: ${reason || 'Keep variety appropriate to recent load.'}`,
    ``,
    `Output format (no JSON):`,
    `- Suggestion: <single paragraph of 2–4 sentences>`,
    `- Reason: <one short line>`,
  ].join('\n');
}

// Single-flight map: cacheKey → inflight promise
const inflight = new Map<
  string,
  Promise<{ text: string; reasonLine: string; cache: 'hit' | 'miss' }>
>();

function signatureParts(plan: Plan, ctx: Ctx) {
  const planStable = {
    title: plan.title,
    totalTime: plan.totalTime,
    blocks: plan.blocks.map((b) => ({
      id: b.id,
      title: b.title,
      duration: b.duration,
      met: b.met,
      intensity: b.intensity,
      category: b.category,
    })),
    why: plan.why ?? [],
  };
  const ctxStable = {
    focus: ctx.focus,
    emotion: ctx.emotion,
    timeAvailable: ctx.timeAvailable,
    intensityPref: ctx.intensityPref,
    signals: ctx.signals ?? {},
  };
  return { planStable, ctxStable };
}

export async function generateSuggestionText(
  plan: Plan,
  ctx: Ctx
): Promise<{ text: string; reasonLine: string; cache: 'hit' | 'miss' }> {
  const { planStable, ctxStable } = signatureParts(plan, ctx);
  const date = dateOnlyISO();
  const planHash = await sha1(stableStringify(planStable));
  const ctxHash = await sha1(stableStringify(ctxStable));
  const keyRaw = `${date}|${planHash}|${ctxHash}`;
  const cacheKey = await sha1(keyRaw);

  // 1) Cache fast-path
  const cached = await getCache(cacheKey);
  if (cached) {
    return { text: cached, reasonLine: extractReasonLine(plan), cache: 'hit' };
  }

  // 2) Single-flight
  const existing = inflight.get(cacheKey);
  if (existing) return existing;

  // 3) Miss path
  const p = (async () => {
    const allow = await budgetAllow('ai_suggestion', 1, true);
    const start = Date.now();

    if (!allow) {
      const fb = buildRulesFallback(plan);
      budgetLog('ai_suggestion:budget_closed', {}, Date.now() - start);
      await setCache(cacheKey, fb, 10 * 60 * 1000);
      return { text: fb, reasonLine: extractReasonLine(plan), cache: 'miss' as const };
    }

    try {
      const prompt = buildPrompt(plan, ctx);
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 160,
      });

      const ms = Date.now() - start;
      const content = resp?.choices?.[0]?.message?.content?.trim() || '';
      const text = content
        .replace(/^[-*]\s*Suggestion:\s*/i, '')
        .replace(/\n[-*]\s*Reason:\s*/i, '\nReason: ')
        .trim();

      budgetLog(
        'ai_suggestion:ok',
        { completion: resp?.usage?.completion_tokens, prompt: resp?.usage?.prompt_tokens },
        ms
      );

      await setCache(cacheKey, text);
      return { text, reasonLine: extractReasonLine(plan), cache: 'miss' as const };
    } catch (err) {
      const ms = Date.now() - start;
      budgetLog('ai_suggestion:error', {}, ms);
      const fb = buildRulesFallback(plan);
      await setCache(cacheKey, fb, 5 * 60 * 1000);
      return { text: fb, reasonLine: extractReasonLine(plan), cache: 'miss' as const };
    } finally {
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, p);
  return p;
}
