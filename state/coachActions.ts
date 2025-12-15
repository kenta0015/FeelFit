/// state/coachActions.ts
// Transient cross-tab store for pending Coach actions → Suggestion.
import type { CoachAction } from '@/types/coach';

let pending: CoachAction[] | null = null;

export function setPendingActions(actions: CoachAction[] | undefined | null) {
  console.log('[coachActions] setPendingActions input =', actions);
  pending = actions && actions.length ? actions.slice(0, 8) : null;
  console.log('[coachActions] internal pending =', pending);
}

export function getPendingActions(): CoachAction[] | null {
  const out = pending;
  console.log('[coachActions] getPendingActions output =', out);
  pending = null; // one-shot
  return out;
}
