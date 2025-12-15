// components/CoachAutoCues.tsx
// Auto voice cues driven by orchestrator events, via useCoachPack.
// Listens: feelFit:workout-start | -middle | -nearEnd | -completion

import * as React from "react";
import { type VoiceStyle, type Gender as VP_Gender } from "@/utils/voiceProfiles";
import { useCoachPack } from "@/hooks/useCoachPack";

type Props = {
  style: VoiceStyle;
  gender: VP_Gender; // "female" | "male"
};

type Phase = "start" | "middle" | "nearEnd" | "completion";

function getWin(): any {
  return typeof window !== "undefined" ? window : globalThis;
}

function styleToContent(s: VoiceStyle): "healing" | "motivational" {
  if (s === "Calm" || s === "Gentle" || s === "Focus" || s === "Neutral") return "healing";
  return "motivational";
}

export default function CoachAutoCues({ style, gender }: Props): null {
  const content = React.useMemo(() => styleToContent(style), [style]);
  const coach = useCoachPack({ cooldownMs: 9000, recentWindow: 3 });

  React.useEffect(() => {
    const w = getWin();
    if (!w?.addEventListener) return;

    const speak = (phase: Phase) => {
      // Delegate to coach pack (handles cooldown, repetition, ducking)
      void coach.say(phase, content, gender);
    };

    const onStart = () => speak("start");
    const onMiddle = () => speak("middle");
    const onNearEnd = () => speak("nearEnd");
    const onCompletion = () => speak("completion");

    w.addEventListener("feelFit:workout-start", onStart as EventListener);
    w.addEventListener("feelFit:workout-middle", onMiddle as EventListener);
    w.addEventListener("feelFit:workout-nearEnd", onNearEnd as EventListener);
    w.addEventListener("feelFit:workout-completion", onCompletion as EventListener);

    return () => {
      w.removeEventListener("feelFit:workout-start", onStart as EventListener);
      w.removeEventListener("feelFit:workout-middle", onMiddle as EventListener);
      w.removeEventListener("feelFit:workout-nearEnd", onNearEnd as EventListener);
      w.removeEventListener("feelFit:workout-completion", onCompletion as EventListener);
    };
  }, [coach, content, gender]);

  return null;
}
