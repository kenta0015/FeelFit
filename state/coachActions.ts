// state/coachActions.ts
// Transient cross-tab store for pending Coach actions → Suggestion.
import type { CoachAction } from '@/types/coach';

let pending: CoachAction[] | null = null;

export function setPendingActions(actions: CoachAction[] | undefined | null) {
  pending = actions && actions.length ? actions.slice(0, 8) : null;
}

export function getPendingActions(): CoachAction[] | null {
  const out = pending;
  pending = null; // one-shot
  return out;
}
