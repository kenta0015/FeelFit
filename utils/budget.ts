// utils/budget.ts
// Minimal daily budget guard + dev logging.
// Per-category daily cap stored in AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

const KEY_PREFIX = '@budget:';

async function getCount(category: string, day: string): Promise<number> {
  const raw = await AsyncStorage.getItem(KEY_PREFIX + category + ':' + day);
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

async function setCount(category: string, day: string, n: number): Promise<void> {
  await AsyncStorage.setItem(KEY_PREFIX + category + ':' + day, String(n));
}

/**
 * Returns true if allowed; optionally reserves one unit.
 * Default cap: 1 per day.
 */
export async function budgetAllow(category: string, maxPerDay: number = 1, reserve: boolean = true): Promise<boolean> {
  const day = todayStr();
  const used = await getCount(category, day);
  if (used >= maxPerDay) return false;
  if (reserve) {
    await setCount(category, day, used + 1);
  }
  return true;
}

/** Dev-only budget/timing/token logs (no-op in production if desired). */
export function budgetLog(event: string, tokens: { prompt?: number; completion?: number } = {}, ms?: number) {
  // eslint-disable-next-line no-console
  console.log(`[budget] ${event}`, { tokens, ms });
}
