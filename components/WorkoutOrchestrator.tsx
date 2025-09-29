// components/WorkoutOrchestrator.tsx
// Central event-driven orchestrator for workout flow.
// - Mount this exactly once (e.g., in app/(tabs)/_layout.tsx).
// - Listens to:  feelFit:workout-start | pause | resume | finish
// - Emits:      feelFit:workout-middle (50%), feelFit:workout-nearEnd (90%),
//               feelFit:workout-completion (at finish or timeout)
// - Timer is internal and non-invasive (does not modify existing hooks/APIs).
// - Safe-by-default: no direct mixer/TTS calls here; other parts can listen
//   to the emitted events to start BGM, speak lines, etc.

import * as React from "react";
import { Platform } from "react-native";

type WorkoutStartDetail = {
  duration?: number; // seconds
  exerciseId?: string;
  style?: string;
  // Allow extra fields without breaking
  [key: string]: any;
};

type WorkoutEventMap =
  | { type: "start"; detail: WorkoutStartDetail }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "finish" };

const EVENT_PREFIX = "feelFit:workout-";
const EVT_START = `${EVENT_PREFIX}start`;
const EVT_PAUSE = `${EVENT_PREFIX}pause`;
const EVT_RESUME = `${EVENT_PREFIX}resume`;
const EVT_FINISH = `${EVENT_PREFIX}finish`;

const EVT_MIDDLE = `${EVENT_PREFIX}middle`;     // fired once at 50%
const EVT_NEAREND = `${EVENT_PREFIX}nearEnd`;   // fired once at 90%
const EVT_COMPLETION = `${EVENT_PREFIX}completion`; // fired at end

// Utility to add window-level listeners on both Web and Native
function addGlobalEventListener(
  type: string,
  listener: (ev: Event) => any
): () => void {
  // @ts-ignore - global (web)
  const target: any = typeof window !== "undefined" ? window : globalThis;
  target.addEventListener?.(type, listener as EventListener);
  return () => {
    target.removeEventListener?.(type, listener as EventListener);
  };
}

function dispatchGlobalEvent(type: string, detail?: Record<string, any>) {
  // @ts-ignore
  const target: any = typeof window !== "undefined" ? window : globalThis;
  try {
    const evt =
      typeof CustomEvent !== "undefined"
        ? new CustomEvent(type, { detail })
        : // Fallback for older RN engines without CustomEvent
          { type, detail };
    target.dispatchEvent?.(evt as any);
  } catch {
    // no-op
  }
}

export default function WorkoutOrchestrator(): null {
  const rafRef = React.useRef<number | null>(null);
  const tickTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const startedRef = React.useRef(false);
  const pausedRef = React.useRef(false);

  const startEpochRef = React.useRef<number>(0); // ms
  const pausedAtRef = React.useRef<number>(0);   // ms
  const totalPauseMsRef = React.useRef<number>(0);

  const durationMsRef = React.useRef<number>(0);
  const fired50Ref = React.useRef(false);
  const fired90Ref = React.useRef(false);

  // Clear all timers/flags
  const resetAll = React.useCallback(() => {
    startedRef.current = false;
    pausedRef.current = false;
    startEpochRef.current = 0;
    pausedAtRef.current = 0;
    totalPauseMsRef.current = 0;
    durationMsRef.current = 0;
    fired50Ref.current = false;
    fired90Ref.current = false;
    if (rafRef.current != null) {
      if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (tickTimerRef.current != null) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }, []);

  // Compute effective elapsed (ms), accounting for pauses
  const getElapsedMs = React.useCallback(() => {
    if (!startedRef.current || startEpochRef.current === 0) return 0;
    const now = Date.now();
    const base = now - startEpochRef.current - totalPauseMsRef.current;
    return Math.max(0, base);
  }, []);

  // Internal periodic tick to detect thresholds and timeout completion
  const ensureTicking = React.useCallback(() => {
    if (tickTimerRef.current) return;
    // Use a modest interval to avoid battery drain; thresholds are coarse.
    tickTimerRef.current = setInterval(() => {
      if (!startedRef.current || pausedRef.current) return;

      const elapsed = getElapsedMs();
      const dur = durationMsRef.current || 0;

      if (dur > 0) {
        const ratio = elapsed / dur;

        if (!fired50Ref.current && ratio >= 0.5) {
          fired50Ref.current = true;
          dispatchGlobalEvent(EVT_MIDDLE, {
            elapsedMs: elapsed,
            durationMs: dur,
            platform: Platform.OS,
          });
        }

        if (!fired90Ref.current && ratio >= 0.9) {
          fired90Ref.current = true;
          dispatchGlobalEvent(EVT_NEAREND, {
            elapsedMs: elapsed,
            durationMs: dur,
            platform: Platform.OS,
          });
        }

        if (elapsed >= dur) {
          // Auto-finish when time is up
          dispatchGlobalEvent(EVT_COMPLETION, {
            elapsedMs: elapsed,
            durationMs: dur,
            reason: "timeout",
            platform: Platform.OS,
          });
          resetAll();
        }
      }
    }, 250);
  }, [getElapsedMs, resetAll]);

  const onEvent = React.useCallback(
    (e: WorkoutEventMap) => {
      switch (e.type) {
        case "start": {
          const durSec = Math.max(0, Number(e.detail?.duration ?? 0));
          durationMsRef.current = Math.round(durSec * 1000);
          startEpochRef.current = Date.now();
          totalPauseMsRef.current = 0;
          pausedAtRef.current = 0;
          fired50Ref.current = false;
          fired90Ref.current = false;

          startedRef.current = true;
          pausedRef.current = false;

          // Orchestrator itself does not call mixer/TTS directly.
          // Other parts should react to the same start event OR to these cues.

          ensureTicking();
          break;
        }
        case "pause": {
          if (!startedRef.current || pausedRef.current) break;
          pausedRef.current = true;
          pausedAtRef.current = Date.now();
          break;
        }
        case "resume": {
          if (!startedRef.current || !pausedRef.current) break;
          pausedRef.current = false;
          const pausedSpan = Date.now() - (pausedAtRef.current || Date.now());
          totalPauseMsRef.current += Math.max(0, pausedSpan);
          pausedAtRef.current = 0;
          ensureTicking();
          break;
        }
        case "finish": {
          if (startedRef.current) {
            const elapsed = getElapsedMs();
            const dur = durationMsRef.current || 0;
            dispatchGlobalEvent(EVT_COMPLETION, {
              elapsedMs: elapsed,
              durationMs: dur,
              reason: "finish",
              platform: Platform.OS,
            });
          }
          resetAll();
          break;
        }
        default:
          break;
      }
    },
    [ensureTicking, getElapsedMs, resetAll]
  );

  // Wire global listeners
  React.useEffect(() => {
    const offStart = addGlobalEventListener(EVT_START, (raw) => {
      const ce = raw as CustomEvent<WorkoutStartDetail>;
      onEvent({ type: "start", detail: ce?.detail ?? {} });
    });
    const offPause = addGlobalEventListener(EVT_PAUSE, () => onEvent({ type: "pause" }));
    const offResume = addGlobalEventListener(EVT_RESUME, () => onEvent({ type: "resume" }));
    const offFinish = addGlobalEventListener(EVT_FINISH, () => onEvent({ type: "finish" }));

    return () => {
      offStart();
      offPause();
      offResume();
      offFinish();
      resetAll();
    };
  }, [onEvent, resetAll]);

  return null;
}
