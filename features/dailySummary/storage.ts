// features/dailySummary/storage.ts
// Idempotent CRUD for daily summaries (Supabase + AsyncStorage cache).
// Table: daily_summaries { date: date (PK), text: text, metrics: jsonb }

import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DailyMetrics } from '@/logic/summaryMetrics';

const AS_KEY = 'feel_fit_daily_summaries_v1';

export type DailySummary = {
  date: string;             // YYYY-MM-DD (PK)
  text: string;             // coach note
  metrics: DailyMetrics;
};

export async function getLocalSummaries(): Promise<DailySummary[]> {
  try {
    const raw = await AsyncStorage.getItem(AS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DailySummary[];
  } catch {
    return [];
  }
}

export async function getSummaryByDate(date: string): Promise<DailySummary | undefined> {
  const list = await getLocalSummaries();
  return list.find((x) => x.date === date);
}

export async function upsertLocal(summary: DailySummary) {
  const list = await getLocalSummaries();
  const i = list.findIndex((x) => x.date === summary.date);
  if (i >= 0) list[i] = summary;
  else list.push(summary);
  await AsyncStorage.setItem(AS_KEY, JSON.stringify(list));
}

export async function upsertRemote(summary: DailySummary) {
  try {
    await supabase
      .from('daily_summaries')
      .upsert(
        { date: summary.date, text: summary.text, metrics: summary.metrics },
        { onConflict: 'date' }
      );
  } catch (e) {
    // swallow errors (offline safe)
    console.warn('upsertRemote daily_summaries error:', e);
  }
}

export async function upsertDailySummary(summary: DailySummary) {
  await upsertLocal(summary);
  await upsertRemote(summary);
}
