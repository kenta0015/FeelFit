// logic/recovery.ts
//
// Phase 2 — 2.4 Recovery Recommendation (A-side logic)
// Triggers (any one):
//  - monotony7d >= 2.0
//  - strain7d in personal top 25% (approx threshold = strainP75, default 1.6)
//  - acuteLoad3d >= 1.6
//  - lastHighGap < 1 day with elevated earlyStopRate
//
// Caps:
//  - ≤ 2 per rolling 7 days
//  - ≥ 48h since last recommendation
//
// Output:
//  shouldRecommendRecovery(signals) -> { show, reason, type: 'rest' | 'active' | 'liss15' }

export type RecoveryType = 'rest' | 'active' | 'liss15';

export type RecoveryDecision = {
  show: boolean;
  reason: string;
  type: RecoveryType;
};

export type RecoveryEvent = {
  date: string;           // ISO string (UTC or local)
  accepted: boolean;      // whether user accepted the suggestion
  type: RecoveryType;     // what was suggested
};

export type RecoverySignals = {
  // load/monotony signals
  monotony7d?: number;      // ~0.8–2.5+
  strain7d?: number;        // arbitrary 0–3
  strainP75?: number;       // personal 75th percentile (last 28d). default 1.6 if missing
  acuteLoad3d?: number;     // ratio vs 28d avg, ~0.5–2.5+
  lastHighGap?: number;     // days since last high-intensity session
  earlyStopRate?: number;   // 0.0–1.0

  // caps enforcement
  now?: string | Date;      // current time (default: new Date())
  history?: RecoveryEvent[]; // past recommendations (accepted/declined), for caps
};

// ------------------------------
// Config (thresholds & caps)
// ------------------------------
const MONOTONY_THRESHOLD = 2.0;
const DEFAULT_STRAIN_P75 = 1.6;
const ACUTE_SPIKE_THRESHOLD = 1.6;
const EARLY_STOP_ELEVATED = 0.25; // 25%
const LAST_HIGH_GAP_MAX_DAYS = 1; // < 1 day

const WEEKLY_CAP = 2;       // ≤2 per rolling 7 days
const MIN_GAP_HOURS = 48;   // ≥48h since last suggestion

// ------------------------------
// Utils
// ------------------------------
function toDate(x?: string | Date): Date {
  return x instanceof Date ? x : new Date(x ?? Date.now());
}

function hoursBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 36e5;
}

function daysBetween(a: Date, b: Date): number {
  return hoursBetween(a, b) / 24;
}

function recentCount(history: RecoveryEvent[] | undefined, now: Date, daysWindow: number): number {
  if (!history || history.length === 0) return 0;
  const from = new Date(now.getTime() - daysWindow * 24 * 60 * 60 * 1000);
  return history.filter(h => toDate(h.date) >= from).length;
}

function lastEvent(history: RecoveryEvent[] | undefined): RecoveryEvent | undefined {
  if (!history || history.length === 0) return undefined;
  // assume history may be unsorted; pick max by date
  return history.reduce((acc, cur) => (toDate(cur.date) > toDate(acc.date) ? cur : acc));
}

// ------------------------------
// Trigger evaluation
// ------------------------------
function computeTriggers(s: RecoverySignals) {
  const monotonyHigh = (s.monotony7d ?? 0) >= MONOTONY_THRESHOLD;

  const p75 = s.strainP75 ?? DEFAULT_STRAIN_P75;
  const strainHigh = (s.strain7d ?? 0) >= p75;

  const acuteSpike = (s.acuteLoad3d ?? 0) >= ACUTE_SPIKE_THRESHOLD;

  const lastHighGap = s.lastHighGap ?? Number.POSITIVE_INFINITY;
  const earlyStopHigh = (s.earlyStopRate ?? 0) >= EARLY_STOP_ELEVATED;
  const gapIssue = lastHighGap < LAST_HIGH_GAP_MAX_DAYS && earlyStopHigh;

  return { monotonyHigh, strainHigh, acuteSpike, gapIssue };
}

// ------------------------------
// Decision mapping
// ------------------------------
function chooseType(tr: ReturnType<typeof computeTriggers>): RecoveryType {
  // Strongest conditions → 'rest'
  if (tr.acuteSpike && tr.strainHigh) return 'rest';

  // Elevated strain OR monotony → 'active'
  if (tr.strainHigh || tr.monotonyHigh) return 'active';

  // Mild cases → 'liss15'
  if (tr.gapIssue || tr.acuteSpike) return 'liss15';

  // Default fallback
  return 'active';
}

function buildReason(tr: ReturnType<typeof computeTriggers>): string {
  const reasons: string[] = [];
  if (tr.acuteSpike) reasons.push('acute load spike');
  if (tr.strainHigh) reasons.push('strain high');
  if (tr.monotonyHigh) reasons.push('monotony high');
  if (tr.gapIssue) reasons.push('recent high-intensity gap short with early stops');
  if (reasons.length === 0) reasons.push('balanced signals');
  return `Signals: ${reasons.join(' & ')}.`;
}

// ------------------------------
// Public API
// ------------------------------
export function shouldRecommendRecovery(signals: RecoverySignals): RecoveryDecision {
  const now = toDate(signals.now);

  // Caps: weekly limit
  const count7d = recentCount(signals.history, now, 7);
  if (count7d >= WEEKLY_CAP) {
    return { show: false, reason: 'Cap: already suggested ≥2 times in last 7 days.', type: 'active' };
    // type is irrelevant when show=false
  }

  // Caps: min gap 48h
  const last = lastEvent(signals.history);
  if (last) {
    const sinceLastH = hoursBetween(now, toDate(last.date));
    if (sinceLastH < MIN_GAP_HOURS) {
      return { show: false, reason: 'Cap: last suggestion was within 48 hours.', type: 'active' };
    }
  }

  // Evaluate triggers
  const tr = computeTriggers(signals);
  const triggered = tr.monotonyHigh || tr.strainHigh || tr.acuteSpike || tr.gapIssue;

  if (!triggered) {
    return { show: false, reason: 'No recovery triggers met.', type: 'active' };
  }

  // Choose recommendation type and reason
  const type = chooseType(tr);
  const reason = buildReason(tr);

  return { show: true, reason, type };
}
