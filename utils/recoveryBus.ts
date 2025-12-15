// utils/recoveryBus.ts
// Tiny global switch + event dispatch for recovery flow.

declare global {
  // eslint-disable-next-line no-var
  var __ffRecovery: { mode: boolean; updatedAt?: string } | undefined;
}

const getTarget = (): any => (typeof window !== "undefined" ? window : globalThis);

export function isRecoveryMode(): boolean {
  return !!globalThis.__ffRecovery?.mode;
}

export function setRecoveryMode(on: boolean) {
  globalThis.__ffRecovery = { mode: !!on, updatedAt: new Date().toISOString() };
  const t = getTarget();
  const type = on ? "feelFit:recovery-accept" : "feelFit:recovery-decline";
  const detail = { origin: "recoveryBus", mode: on, at: globalThis.__ffRecovery.updatedAt };
  try {
    const evt =
      typeof CustomEvent !== "undefined"
        ? new CustomEvent(type, { detail })
        : { type, detail };
    t.dispatchEvent?.(evt as any);
  } catch {
    // no-op
  }
}
