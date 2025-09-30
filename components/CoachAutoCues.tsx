// components/CoachAutoCues.tsx
// Auto voice cues + full instructions queue (start → instructions → middle/nearEnd/finish)
// Uses existing playWorkoutAudio/stopAudio for encouragement cues.
// Instructions are spoken via web TTS (TTSService.web.synthesize) with Joanna/Matthew by audioType.
// On native, falls back to encouragement cues only (no instruction TTS).

import * as React from "react";
import { Platform } from "react-native";
import { playWorkoutAudio, stopAudio } from "@/utils/audio";
import { type VoiceStyle, type Gender } from "@/utils/voiceProfiles";
import { EXERCISES } from "@/data/exercises";

type Props = {
  style: VoiceStyle;
  gender: Gender;
};

type Phase = "start" | "middle" | "nearEnd" | "completion";
type ContentKind = "healing" | "motivational";

function getWin(): any {
  return typeof window !== "undefined" ? window : (globalThis as any);
}

function styleToContent(s: VoiceStyle): ContentKind {
  if (s === "Calm" || s === "Gentle" || s === "Focus" || s === "Neutral") return "healing";
  return "motivational";
}

function audioTypeToKind(at?: string | null): ContentKind | null {
  const v = (at || "").toLowerCase();
  if (v === "healing") return "healing";
  if (v === "motivational") return "motivational";
  return null;
}

function kindToDefaultVoice(k: ContentKind): string {
  return k === "healing" ? "Joanna" : "Matthew"; // en-US
}

export default function CoachAutoCues({ style, gender }: Props): null {
  const contentByStyle = React.useMemo(() => styleToContent(style), [style]);

  // ---- Simple serial queue (one-at-a-time) ----
  const qRef = React.useRef<(() => Promise<void>)[]>([]);
  const busyRef = React.useRef(false);
  const abortedRef = React.useRef(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const runNext = React.useCallback(async () => {
    if (busyRef.current) return;
    const next = qRef.current.shift();
    if (!next) return;
    busyRef.current = true;
    try {
      await next();
    } catch {
      // swallow
    } finally {
      busyRef.current = false;
      if (!abortedRef.current) void runNext();
    }
  }, []);

  const clearQueue = React.useCallback(() => {
    abortedRef.current = true;
    qRef.current = [];
    busyRef.current = false;
    // stop any current instruction audio
    try {
      audioRef.current?.pause?.();
      audioRef.current && (audioRef.current.currentTime = 0);
    } catch {}
    stopAudio();
    // small async tick to re-enable queue
    setTimeout(() => (abortedRef.current = false), 0);
  }, []);

  // ---- Helpers to enqueue tasks ----
  const enqueueEncouragement = React.useCallback((phase: Phase, kind: ContentKind) => {
    qRef.current.push(async () => {
      // ensure no overlap
      stopAudio();
      const w = getWin();
      try {
        // wait for "voice-end" once playWorkoutAudio finishes
        const done = new Promise<void>((resolve) => {
          const onEnd = () => {
            w.removeEventListener("feelFit:voice-end", onEnd as EventListener);
            resolve();
          };
          w.addEventListener("feelFit:voice-end", onEnd as EventListener, { once: true });
          // safety timeout (6s) to avoid deadlock
          setTimeout(() => {
            w.removeEventListener("feelFit:voice-end", onEnd as EventListener);
            resolve();
          }, 6000);
        });
        playWorkoutAudio(phase, kind, gender);
        await done;
      } catch {
        // ignore
      }
    });
  }, [gender]);

  const enqueueInstruction = React.useCallback((line: string, voiceId: string) => {
    // web only (uses TTSService.web)
    if (Platform.OS !== "web") return;
    qRef.current.push(async () => {
      const w = getWin();
      try {
        // dynamic import to avoid native bundling
        const { synthesize } = await import("@/audio/TTSService.web");
        // NOTE: tone=healing|motivational will be added in Step2 (TTSService patch)
        const res = await synthesize(line, voiceId, {});
        if (!res?.uri) return;
        // emit ducking hooks for mixer
        try {
          w.dispatchEvent?.(new CustomEvent("feelFit:voice-start", { detail: { source: "instructions" } }));
        } catch {}
        // play audio
        const a = new Audio(res.uri!);
        audioRef.current = a;
        await new Promise<void>((resolve) => {
          a.addEventListener("ended", () => resolve(), { once: true });
          a.addEventListener("error", () => resolve(), { once: true });
          // small gapless start
          a.play().catch(() => resolve());
        });
      } finally {
        try {
          w.dispatchEvent?.(new CustomEvent("feelFit:voice-end", { detail: { source: "instructions" } }));
        } catch {}
      }
    });
  }, []);

  // ---- Event wiring ----
  React.useEffect(() => {
    const w = getWin();
    if (!w?.addEventListener) return;

    const onStart = (ev: any) => {
      clearQueue();

      // Determine exercise & kind
      const detail = ev?.detail || {};
      const exId: string | undefined = detail.exerciseId || detail.id;
      const exercise = exId ? EXERCISES.find((e: any) => e?.id === exId) : undefined;
      const kind =
        audioTypeToKind(detail.audioType) ||
        audioTypeToKind(exercise?.audioType) ||
        contentByStyle;

      const voiceId = kindToDefaultVoice(kind);

      // 1) Encouragement: start
      enqueueEncouragement("start", kind);

      // 2) Full instructions (if any)
      const lines: string[] = Array.isArray(exercise?.instructions) ? exercise!.instructions : [];
      for (const line of lines) {
        const txt = String(line || "").trim();
        if (!txt) continue;
        enqueueInstruction(txt, voiceId);
      }

      // Start the queue
      void runNext();
    };

    // middle/nearEnd/completion → 順延（queueへ）
    const onMiddle = () => {
      // pick style at runtime (closest intent)
      const k = contentByStyle;
      enqueueEncouragement("middle", k);
      void runNext();
    };
    const onNearEnd = () => {
      const k = contentByStyle;
      enqueueEncouragement("nearEnd", k);
      void runNext();
    };
    const onCompletion = () => {
      const k = contentByStyle;
      enqueueEncouragement("completion", k);
      void runNext();
    };

    w.addEventListener("feelFit:workout-start", onStart as EventListener);
    w.addEventListener("feelFit:workout-middle", onMiddle as EventListener);
    w.addEventListener("feelFit:workout-nearEnd", onNearEnd as EventListener);
    w.addEventListener("feelFit:workout-completion", onCompletion as EventListener);

    return () => {
      w.removeEventListener("feelFit:workout-start", onStart as EventListener);
      w.removeEventListener("feelFit:workout-middle", onMiddle as EventListener);
      w.removeEventListener("feelFit:workout-nearEnd", onNearEnd as EventListener);
      w.removeEventListener("feelFit:workout-completion", onCompletion as EventListener);
      clearQueue();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentByStyle, enqueueEncouragement, enqueueInstruction, runNext, clearQueue, gender]);

  return null;
}
