// lib/engineRegistry.ts
// Minimal global engine registry for dev/testing and optional production wiring.

export type CoachEngine = {
  pause?: () => Promise<void> | void;
  resume?: () => Promise<void> | void;
  skip?: () => Promise<void> | void;
  getRemainingSeconds?: () => number | Promise<number>;
};

type GG = typeof globalThis & { __feelFit?: { engine?: CoachEngine } };

function ensureRoot(g: GG) {
  g.__feelFit = g.__feelFit || {};
  return g.__feelFit;
}

export function setEngine(engine: CoachEngine | undefined) {
  const g = globalThis as GG;
  const root = ensureRoot(g);
  root.engine = engine;
}

export function getEngine(): CoachEngine | undefined {
  const g = globalThis as GG;
  return g.__feelFit?.engine;
}

export function clearEngine() {
  setEngine(undefined);
}
