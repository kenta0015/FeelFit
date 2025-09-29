// features/dailySummary/DailySummaryAgent.tsx
// Mount-once background agent:
// - On "workout-finish": recompute today's metrics and upsert summary (idempotent).
// - At 21:00 local or next launch after 21:00: ensure summary exists for that date.

import React, { useEffect, useRef } from 'react';
import { getWorkoutSessions, getMoodLogs } from '@/utils/storage';
import { onFeelFit } from '@/utils/feelFitEvents';
import { computeDailyMetrics } from '@/logic/summaryMetrics';
import { generateDailySummary } from '@/ai/dailySummary';
import { getSummaryByDate } from './storage';

const TZ_OFFSET_MS = 0; // rely on device local time

export default function DailySummaryAgent() {
  const ticking = useRef(false);

  useEffect(() => {
    // On mount → run once (post-21:00 catch-up)
    ensureTodaySummary();

    // Listen workout-finish → recompute (idempotent)
    const off = onFeelFit('workout-finish', () => ensureTodaySummary());

    // Lightweight 5-min timer to catch 21:00 boundary while app is open.
    const iv = setInterval(check21Boundary, 5 * 60 * 1000);

    return () => {
      off?.();
      clearInterval(iv);
    };
  }, []);

  async function ensureTodaySummary() {
    if (ticking.current) return;
    ticking.current = true;
    try {
      const now = new Date(Date.now() + TZ_OFFSET_MS);
      const day = now.toISOString().slice(0, 10);

      // If already exists, no-op
      const exist = await getSummaryByDate(day);
      if (exist?.text) return;

      const [sessions, moods] = await Promise.all([getWorkoutSessions(), getMoodLogs()]);
      const metrics = computeDailyMetrics(sessions || [], moods || [], now);
      await generateDailySummary({ date: day, metrics });
    } catch (e) {
      // swallow; try next trigger
      console.warn('ensureTodaySummary error:', e);
    } finally {
      ticking.current = false;
    }
  }

  async function check21Boundary() {
    const now = new Date();
    const localHour = now.getHours();
    if (localHour >= 21) {
      await ensureTodaySummary();
    }
  }

  return null;
}
