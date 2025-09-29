// hooks/useSuggestionText.ts
// Minimal hook to get AI suggestion text (string) from plan/ctx.

import { useEffect, useState } from 'react';
import type { Plan } from '@/types/plan';
import { generateSuggestionText } from '@/ai/suggestion';

export function useSuggestionText(plan: Plan, ctx: any): string | null {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await generateSuggestionText(plan, ctx);
        if (active) setText(res.text); // ← stringのみを反映
      } catch {
        if (active) setText(null);
      }
    })();
    return () => {
      active = false;
    };
    // stringify for simple change detection
  }, [JSON.stringify(plan), JSON.stringify(ctx)]);

  return text;
}

export default useSuggestionText;
