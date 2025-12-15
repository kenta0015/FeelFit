// components/CoachAutoCues.tsx
// Auto voice cues + full instructions queue (start → instructions → middle/nearEnd/finish)
// Encouragement: exercise/audioType ベース（healing→Joanna / motivational→Matthew は utils/audio 側）
// Instructions: Salli（ニュートラル, tone 付与なし）

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

// UIのStyleは最終フォールバックのみで使用
function styleToContent(s: VoiceStyle): ContentKind {
  if (s === "Calm" || s === "Gentle" || s === "Focus" || s === "Neutral") return "healing";
  return "motivational";
}

function toKind(v?: string | null): ContentKind | null {
  const s = (v || "").toLowerCase();
  if (s === "healing") return "healing";
  if (s === "motivational") return "motivational";
  return null;
}

export default function CoachAutoCues({ style, gender }: Props): null {
  const fallbackKind = React.useMemo(() => styleToContent(style), [style]);

  // ---- serial queue ----
  const qRef = React.useRef<(() => Promise<void>)[]>([]);
  const busyRef = React.useRef(false);
  const abortedRef = React.useRef(false);
  const lastKindRef = React.useRef<ContentKind | null>(null);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const runNext = React.useCallback(async () => {
    if (busyRef.current) return;
    const next = qRef.current.shift();
    if (!next) return;
    busyRef.current = true;
    try { await next(); } finally {
      busyRef.current = false;
      if (!abortedRef.current) void runNext();
    }
  }, []);

  const clearQueue = React.useCallback(() => {
    abortedRef.current = true;
    qRef.current = [];
    busyRef.current = false;
    try { audioRef.current?.pause?.(); if (audioRef.current) audioRef.current.currentTime = 0; } catch {}
    stopAudio();
    setTimeout(() => (abortedRef.current = false), 0);
  }, []);

  const enqueueEncouragement = React.useCallback((phase: Phase, kind: ContentKind) => {
    qRef.current.push(async () => {
      stopAudio();
      const w = getWin();
      // voice-end を待ってから次へ
      const done = new Promise<void>((resolve) => {
        const onEnd = () => { w.removeEventListener("feelFit:voice-end", onEnd as EventListener); resolve(); };
        w.addEventListener("feelFit:voice-end", onEnd as EventListener, { once: true });
        setTimeout(() => { w.removeEventListener("feelFit:voice-end", onEnd as EventListener); resolve(); }, 6000);
      });
      playWorkoutAudio(phase, kind, gender);
      await done;
    });
  }, [gender]);

  const enqueueInstruction = React.useCallback((line: string) => {
    if (Platform.OS !== "web") return;
    qRef.current.push(async () => {
      const w = getWin();
      try {
        const { synthesize } = await import("@/audio/TTSService.web");
        // Salli 固定・tone等は一切付与しない
        const res = await synthesize(line, "Salli", {});
        if (!res?.uri) return;

        try { w.dispatchEvent?.(new CustomEvent("feelFit:voice-start", { detail: { source: "instructions" } })); } catch {}
        const a = new Audio(res.uri!);
        audioRef.current = a;
        await new Promise<void>((resolve) => {
          a.addEventListener("ended", () => resolve(), { once: true });
          a.addEventListener("error", () => resolve(), { once: true });
          a.play().catch(() => resolve());
        });
      } finally {
        try { w.dispatchEvent?.(new CustomEvent("feelFit:voice-end", { detail: { source: "instructions" } })); } catch {}
      }
    });
  }, []);

  React.useEffect(() => {
    const w = getWin();
    if (!w?.addEventListener) return;

    const onStart = (ev: any) => {
      clearQueue();

      const detail = ev?.detail || {};
      const exId: string | undefined = detail.exerciseId || detail.id;
      const ex = exId ? EXERCISES.find((e: any) => e?.id === exId) : undefined;

      // 種別の決定順序： detail.audioType → exercise.audioType → UI Style
      const kind: ContentKind =
        toKind(detail.audioType) ||
        toKind(ex?.audioType) ||
        fallbackKind;

      lastKindRef.current = kind;

      // 1) start の励まし（種別固定で呼ぶ）
      enqueueEncouragement("start", kind);

      // 2) インスト（Salli / neutral）
      const lines: string[] = Array.isArray(ex?.instructions) ? ex!.instructions : [];
      for (const line of lines) {
        const txt = String(line || "").trim();
        if (txt) enqueueInstruction(txt);
      }

      void runNext();
    };

    const resolveKind = (): ContentKind => lastKindRef.current || fallbackKind;

    const onMiddle = () => { enqueueEncouragement("middle", resolveKind()); void runNext(); };
    const onNearEnd = () => { enqueueEncouragement("nearEnd", resolveKind()); void runNext(); };
    const onCompletion = () => { enqueueEncouragement("completion", resolveKind()); void runNext(); };

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
  }, [fallbackKind, enqueueEncouragement, enqueueInstruction, runNext, clearQueue]);

  return null;
}
