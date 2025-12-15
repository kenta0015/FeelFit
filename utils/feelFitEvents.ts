// utils/feelFitEvents.ts
// Tiny helper to standardize feelFit:* CustomEvent emit/listen.

export type FeelFitEventType =
  | "workout-start"
  | "workout-pause"
  | "workout-resume"
  | "workout-finish"
  | "voice-start"
  | "voice-end";

export type FeelFitEventDetail = {
  origin: "player" | "workout-timer" | "workout-test" | "miniplayer" | "tts" | string;
  [k: string]: any;
};

const getWin = (): any => (typeof window !== "undefined" ? window : undefined);

export function emitFeelFit(type: FeelFitEventType, detail?: Partial<FeelFitEventDetail>) {
  const w = getWin();
  if (!w?.dispatchEvent || typeof w.CustomEvent !== "function") return;
  const name = `feelFit:${type}`;
  const payload: FeelFitEventDetail = { origin: detail?.origin ?? "player", ...(detail ?? {}) };
  w.dispatchEvent(new w.CustomEvent(name, { detail: payload }));
}

export type FeelFitHandler = (detail: FeelFitEventDetail) => void;

export function onFeelFit(type: FeelFitEventType, handler: FeelFitHandler): () => void {
  const w = getWin();
  if (!w) return () => {};
  const name = `feelFit:${type}`;
  const wrapped = (ev: any) => handler(ev?.detail as FeelFitEventDetail);
  w.addEventListener(name, wrapped as EventListener);
  return () => w.removeEventListener(name, wrapped as EventListener);
}

export function onMany(types: FeelFitEventType[], handler: (type: FeelFitEventType, d: FeelFitEventDetail) => void) {
  const offs = types.map((t) => onFeelFit(t, (d) => handler(t, d)));
  return () => offs.forEach((off) => off());
}
