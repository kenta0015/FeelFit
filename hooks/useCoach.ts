// hooks/useCoach.ts
import { useCallback } from 'react';
import { useAppStore, selectors } from '@/state/appStore';
import { rulesCoach } from '@/logic/rules';
import { coachWithOpenAI } from '@/ai/openaiClient';

export function useCoach() {
  const metrics   = useAppStore((s) => s.metrics);
  const prefs     = useAppStore((s) => s.prefs);
  const shouldAI  = useAppStore(selectors.shouldUseAI);
  const setCoach  = useAppStore((s) => s.setCoach);

  const getNext = useCallback(async () => {
    // Try AI (Phase 2 will expand the prompt)
    if (shouldAI) {
      const prompt =
        `You are a concise fitness coach. Based on these metrics ${JSON.stringify(
          metrics
        )}, give one actionable sentence (max 24 words).`;
      const ai = await coachWithOpenAI(prompt);
      if (ai) {
        setCoach({ text: ai, source: 'ai', ts: Date.now() });
        return;
      }
    }
    // Fallback to rules spine
    const rule = rulesCoach(metrics);
    setCoach({ text: rule.text, ruleId: rule.id, source: 'rules', ts: Date.now() });
  }, [metrics, shouldAI, setCoach]);

  return { getNext };
}
