// logic/summaryMetrics.ts
// Compute daily metrics from workout sessions and mood logs.
// Idempotent, no side effects. Tolerates schema variations safely.

import { WorkoutSession, MoodLog } from '@/types';

export type DailyMetrics = {
  date: string;                 // YYYY-MM-DD
  streak: number;               // consecutive active days up to date
  sessions7d: number;           // last 7 days session count
  minutes7d: number;            // last 7 days total minutes
  avgIntensity7d: number;       // avg MET (best-effort)
  monotony: number;             // (mean / std) of daily minutes (7d); fallback 0
  strain: number;               // sum(minutes * intensity) across 7d (best-effort)
  lastSessionMinutes?: number;  // most recent session minutes
};

const toDateKey = (d: Date) => d.toISOString().slice(0, 10);

// --- Safe readers (tolerate different field names) --------------------------

function readMinutesFromSession(s: any): number {
  // Prefer explicit minute fields if present
  const minuteKeys = [
    'durationMinutes', 'durationMin', 'minutes',
    'plannedMinutes', 'plannedMin',
  ];
  for (const k of minuteKeys) {
    const v = s?.[k];
    if (typeof v === 'number' && isFinite(v)) return Math.max(0, Math.round(v));
  }

  // Derive from timestamps
  const start = s?.startTime ? new Date(s.startTime) : undefined;
  const end = s?.endTime ? new Date(s.endTime) : undefined;
  if (start instanceof Date && !isNaN(+start) && end instanceof Date && !isNaN(+end)) {
    const mins = Math.round((+end - +start) / 60000);
    if (isFinite(mins) && mins > 0) return mins;
  }
  return 0;
}

function readIntensityMET(s: any): number {
  // Try common fields; fallback = 1 MET (very light)
  const candidates = ['intensityMET', 'intensity', 'met'];
  for (const k of candidates) {
    const v = s?.[k];
    if (typeof v === 'number' && isFinite(v) && v > 0) {
      return clamp(v, 0.5, 15);
    }
  }
  return 1;
}

// ----------------------------------------------------------------------------

export function computeDailyMetrics(
  allSessions: WorkoutSession[],
  _allMoods: MoodLog[] | undefined,
  forDate: Date
): DailyMetrics {
  const dayKey = toDateKey(forDate);

  // 7-day window (inclusive today)
  const start = new Date(forDate);
  start.setDate(start.getDate() - 6);
  const startKey = toDateKey(start);

  const within7d = (allSessions || []).filter((s: any) => {
    const k = toDateKey(new Date(s?.startTime ?? forDate));
    return k >= startKey && k <= dayKey;
  });

  const sessionsByDay = groupBy(within7d, (s: any) => toDateKey(new Date(s?.startTime ?? forDate)));

  const minutesPerDay: number[] = [];
  let strain = 0;
  let totalIntensity = 0;
  let intensityCount = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const k = toDateKey(d);

    const list = sessionsByDay[k] || [];
    const mins = list.reduce((acc: number, s: any) => acc + readMinutesFromSession(s), 0);
    minutesPerDay.push(mins);

    list.forEach((s: any) => {
      const met = readIntensityMET(s);
      strain += mins * met;
      totalIntensity += met;
      intensityCount += 1;
    });
  }

  const sessions7d = within7d.length;
  const minutes7d = minutesPerDay.reduce((a, b) => a + b, 0);
  const avgIntensity7d = intensityCount > 0 ? clamp(totalIntensity / intensityCount, 0.5, 15) : 0;

  const mean = minutes7d / 7;
  const variance = minutesPerDay.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / 7;
  const std = Math.sqrt(variance);
  const monotony = std > 0 ? clamp(mean / std, 0, 10) : 0;

  // Streak: consecutive days with any minutes > 0, counting back from 'forDate'
  let streak = 0;
  for (let i = 0; i <= 365; i++) {
    const d = new Date(forDate);
    d.setDate(forDate.getDate() - i);
    const k = toDateKey(d);
    const list = sessionsByDay[k] || [];
    const mins = list.reduce((acc: number, s: any) => acc + readMinutesFromSession(s), 0);
    if (mins > 0) streak++;
    else break;
  }

  // Last session minutes
  const sorted = [...within7d].sort(
    (a: any, b: any) => new Date(b?.startTime ?? 0).getTime() - new Date(a?.startTime ?? 0).getTime()
  );
  const last = sorted[0];
  const lastSessionMinutes = last ? readMinutesFromSession(last) : undefined;

  return {
    date: dayKey,
    streak,
    sessions7d,
    minutes7d,
    avgIntensity7d,
    monotony: Number(monotony.toFixed(2)),
    strain: Math.round(strain),
    lastSessionMinutes,
  };
}

// utils
function groupBy<T>(arr: T[], key: (x: T) => string) {
  return arr.reduce<Record<string, T[]>>((acc, cur) => {
    const k = key(cur);
    (acc[k] ||= []).push(cur);
    return acc;
  }, {});
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
