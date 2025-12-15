// hooks/useVoiceDuck.ts
import { useCallback, useMemo, useRef, useState } from "react";
import { useAudioMixer } from "./useAudioMixer";
import { synthesize, playUri } from "../audio/TTSService";

type Opts = {
  timeoutMs?: number; // max TTS wait
  minGapMs?: number;  // next call guard
};

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function speakWeb(text: string) {
  if (typeof window === "undefined") return;
  const anyWin: any = window as any;
  if (!anyWin.speechSynthesis) return;
  await new Promise<void>((resolve) => {
    const u = new anyWin.SpeechSynthesisUtterance(text);
    u.onend = () => resolve();
    u.onerror = () => resolve();
    anyWin.speechSynthesis.speak(u);
  });
}

function resolveUri(res: any): string | null {
  if (!res) return null;
  if (typeof res === "string") return res;
  return res.uri ?? res.url ?? res.path ?? null;
}

export function useVoiceDuck(opts: Opts = {}) {
  const { timeoutMs = 10000, minGapMs = 350 } = opts;
  const mixer = useAudioMixer();

  const [busy, setBusy] = useState(false);
  const lastEndAtRef = useRef<number>(0);
  const runIdRef = useRef<number>(0);

  const sayWithDuck = useCallback(
    async (text: string) => {
      // gap guard
      const now = Date.now();
      const since = now - lastEndAtRef.current;
      if (since < minGapMs) {
        await sleep(minGapMs - since);
      }

      // prevent overlapping
      if (busy) return;
      setBusy(true);
      const myRun = ++runIdRef.current;

      mixer.setDucking(true);

      try {
        // timeout guard for synth
        const synthPromise = (async () => {
          const res = await synthesize(text);
          const uri = resolveUri(res);
          if (uri) {
            await playUri(uri);
            return;
          }
          // no uri -> fallback
          await speakWeb(text);
        })();

        await Promise.race([
          synthPromise,
          sleep(timeoutMs).then(() => {
            throw new Error("TTS timeout");
          }),
        ]);
      } catch {
        // hard fallback
        await speakWeb(text);
      } finally {
        // ensure restore even if any error/timeout occurs
        mixer.setDucking(false);
        lastEndAtRef.current = Date.now();
        // only the latest run can clear busy (avoid race)
        if (runIdRef.current === myRun) {
          setBusy(false);
        }
      }
    },
    [busy, mixer, timeoutMs, minGapMs]
  );

  const api = useMemo(
    () => ({
      sayWithDuck,
      busy,
      ducking: mixer.state.ducking,
      mixerState: mixer.state,
    }),
    [sayWithDuck, busy, mixer.state]
  );

  return api;
}
