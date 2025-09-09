import { useEffect, useState } from "react";
import { generateSuggestionText } from "../ai/suggestion"; // mock for now

export function useSuggestionText(plan: any, ctx: any) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const suggestion = await generateSuggestionText(plan, ctx);
        if (active) setText(suggestion);
      } catch (err) {
        console.warn("AI suggestion failed, fallback", err);
        if (active) setText(null);
      }
    }
    load();
    return () => { active = false };
  }, [plan, ctx]);

  return text;
}
