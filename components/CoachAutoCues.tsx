// components/CoachAutoCues.tsx
// Auto voice cues driven by orchestrator events.
// Listens: feelFit:workout-start | -middle | -nearEnd | -completion
// Uses existing playWorkoutAudio() (with ducking/BGM handled elsewhere).

import * as React from "react";
import { Platform } from "react-native";
import { playWorkoutAudio, stopAudio } from "@/utils/audio";
import { type VoiceStyle, type Gender } from "@/utils/voiceProfiles";

type Props = {
  style: VoiceStyle;
  gender: Gender;
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

  React.useEffect(() => {
    const w = getWin();
    if (!w?.addEventListener) return;

    const speak = (phase: Phase) => {
      // Ensure no overlap; ducking system will take care of mixer.
      stopAudio();
      playWorkoutAudio(phase, content, gender);
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
  }, [content, gender]);

  return null;
}
