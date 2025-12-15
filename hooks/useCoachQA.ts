/// hooks/useCoachQA.ts
// Local state + ask() for Coach Q&A thread (per day + plan signature).
import { useCallback, useMemo, useState } from 'react';
import type { Plan } from '@/types/plan';
import type { SuggestionCtx } from '@/hooks/usePlanSuggestion';
import { generateAnswer, stripActionsFromText } from '@/ai/coachQA';
import type { CoachMessage, CoachQAPrompt, ThreadKey } from '@/types/coach';

function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function hashString(s: string): string {
  // Fast non-crypto hash (djb2)
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function planSignature(plan: Plan): string {
  const core = {
    title: plan.title,
    totalTime: plan.totalTime,
    blocks: plan.blocks.map(b => ({ t: b.title, d: b.duration, i: b.intensity, c: b.category })),
  };
  return hashString(JSON.stringify(core));
}

export function useCoachQA({ plan, ctx }: { plan: Plan; ctx: SuggestionCtx }) {
  const thread: ThreadKey = useMemo(() => ({
    date: todayISO(),
    planSig: planSignature(plan)
  }), [plan.totalTime, plan.blocks.length, plan.title]);

  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [busy, setBusy] = useState(false);

  const ask = useCallback(async (prompt: CoachQAPrompt) => {
    if (busy) return;
    const text = prompt.kind === 'preset' ? prompt.label : (prompt.text || '').trim();
    if (!text) return;

    const userMsg: CoachMessage = {
      id: hashString(thread.date + text + Math.random()),
      role: 'user',
      text,
      ts: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setBusy(true);
    try {
      const ans = await generateAnswer(plan, ctx, messages, prompt);

      console.log('[useCoachQA] ans.actions =', ans.actions);

      const displayText = stripActionsFromText(ans.text);

      const coachMsg: CoachMessage = {
        id: hashString(thread.date + ans.text + Math.random()),
        role: 'coach',
        text: displayText,
        ts: Date.now(),
        actions: ans.actions
      };
      setMessages(prev => [...prev, coachMsg]);
      return coachMsg;
    } finally {
      setBusy(false);
    }
  }, [busy, plan, ctx, messages, thread.date]);

  return {
    thread,
    messages,
    busy,
    ask,
  };
}

export default useCoachQA;
