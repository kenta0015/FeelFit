// hooks/useCoachSuggestion.ts
// Deduped AI text fetch with input-change guard + debounce.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { generateSuggestionText } from '../ai/suggestion';

type PlanBlock = {
  id: string;
  title: string;
  duration: number;
  met: number;
  intensity: 'low' | 'med' | 'high';
  category: string;
};

export type Plan = {
  title: string;
  blocks: PlanBlock[];
  totalTime: number;
  why: string[];
};

export type Ctx = {
  focus?: 'mental' | 'physical' | 'both';
  emotion?: string;
  timeAvailable?: number;
  intensityPref?: 'low' | 'med' | 'high';
  equipment?: string[];
  constraints?: string[];
  disliked?: string[];
  signals?: Record<string, unknown>;
};

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

function dateOnlyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

async function sha1(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, input);
}

function planSignatureSource(plan: Plan) {
  return {
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
}

function ctxSignatureSource(ctx: Ctx) {
  return {
    focus: ctx.focus,
    emotion: ctx.emotion,
    timeAvailable: ctx.timeAvailable,
    intensityPref: ctx.intensityPref,
    signals: ctx.signals ?? {},
  };
}

async function computeSignature(plan: Plan, ctx: Ctx) {
  const date = dateOnlyISO();
  const planHash = await sha1(stableStringify(planSignatureSource(plan)));
  const ctxHash = await sha1(stableStringify(ctxSignatureSource(ctx)));
  return `${date}|${planHash}|${ctxHash}`;
}

export type UseCoachSuggestionResult = {
  text: string | null;
  reasonLine: string | null;
  loading: boolean;
  cache: 'hit' | 'miss' | null;
  refresh: () => void;
  signature: string | null;
};

type TimerHandle = ReturnType<typeof globalThis.setTimeout>;

export function useCoachSuggestion(
  plan: Plan | null,
  ctx: Ctx | null,
  debounceMs = 250
): UseCoachSuggestionResult {
  const [text, setText] = useState<string | null>(null);
  const [reasonLine, setReasonLine] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [cache, setCache] = useState<'hit' | 'miss' | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  // Cross-env safe: RN/DOM returns number, Node returns Timeout → use ReturnType<typeof globalThis.setTimeout>
  const timerRef = useRef<TimerHandle | null>(null);
  const sigRef = useRef<string | null>(null);
  const inflightRef = useRef<Promise<void> | null>(null);

  const canRun = useMemo(
    () => !!plan && !!ctx && (plan.blocks?.length ?? 0) > 0,
    [plan, ctx]
  );

  const run = useCallback(async () => {
    if (!plan || !ctx) return;

    const nextSig = await computeSignature(plan, ctx);
    if (sigRef.current === nextSig && text) {
      return; // unchanged
    }

    sigRef.current = nextSig;
    setSignature(nextSig);
    setLoading(true);

    try {
      const res = await generateSuggestionText(plan, ctx);
      setText(res.text);
      setReasonLine(res.reasonLine || null);
      setCache(res.cache);
    } catch {
      setText((prev) => prev ?? 'Coach is offline. Using a safe plan description.');
      setReasonLine((prev) => prev ?? null);
      setCache((prev) => prev ?? 'miss');
    } finally {
      setLoading(false);
    }
  }, [plan, ctx, text]);

  const schedule = useCallback(() => {
    if (!canRun) return;
    if (timerRef.current) {
      // clearTimeout is overloaded across envs; cast once to keep TS happy everywhere
      clearTimeout(timerRef.current as unknown as number);
    }
    timerRef.current = globalThis.setTimeout(() => {
      if (inflightRef.current) return; // single-flight at hook level
      inflightRef.current = run().finally(() => {
        inflightRef.current = null;
      });
    }, debounceMs) as TimerHandle;
  }, [canRun, run, debounceMs]);

  useEffect(() => {
    schedule();
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current as unknown as number);
      }
    };
  }, [schedule]);

  const refresh = useCallback(() => {
    if (!canRun) return;
    sigRef.current = null; // force
    if (timerRef.current) {
      clearTimeout(timerRef.current as unknown as number);
    }
    inflightRef.current = run().finally(() => {
      inflightRef.current = null;
    });
  }, [canRun, run]);

  return { text, reasonLine, loading, cache, refresh, signature };
}
