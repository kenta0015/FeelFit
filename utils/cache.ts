// utils/cache.ts
// Simple AsyncStorage-backed cache with TTL + LRU cap.
// Works in Expo/React Native.

import AsyncStorage from '@react-native-async-storage/async-storage';

type CacheRecord = {
  v: string;     // value
  exp: number;   // epoch ms expiration
  ts: number;    // epoch ms last access (for LRU)
};

const INDEX_KEY = '@cache:index'; // JSON: string[]
const ENTRY_PREFIX = '@cache:entry:'; // key → CacheRecord
const DEFAULT_TTL_MS = 36 * 60 * 60 * 1000; // 36h
const LRU_CAP = 100;

async function readIndex(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr as string[];
  } catch {}
  return [];
}

async function writeIndex(keys: string[]) {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(keys));
}

async function readEntry(key: string): Promise<CacheRecord | undefined> {
  const raw = await AsyncStorage.getItem(ENTRY_PREFIX + key);
  if (!raw) return undefined;
  try {
    const rec = JSON.parse(raw) as CacheRecord;
    if (typeof rec?.v === 'string' && typeof rec?.exp === 'number') {
      return rec;
    }
  } catch {}
  return undefined;
}

async function writeEntry(key: string, rec: CacheRecord) {
  await AsyncStorage.setItem(ENTRY_PREFIX + key, JSON.stringify(rec));
}

async function deleteEntry(key: string) {
  await AsyncStorage.removeItem(ENTRY_PREFIX + key);
}

async function touchIndex(keys: string[], key: string): Promise<string[]> {
  const i = keys.indexOf(key);
  if (i >= 0) keys.splice(i, 1);
  keys.unshift(key); // most-recent at front
  if (keys.length > LRU_CAP) {
    const toDrop = keys.splice(LRU_CAP);
    await Promise.all(toDrop.map(k => deleteEntry(k)));
  }
  await writeIndex(keys);
  return keys;
}

export async function getCache(key: string): Promise<string | undefined> {
  const [rec, keys] = await Promise.all([readEntry(key), readIndex()]);
  const now = Date.now();
  if (!rec) return undefined;
  if (rec.exp <= now) {
    // expired
    await Promise.all([
      deleteEntry(key),
      writeIndex(keys.filter(k => k !== key)),
    ]);
    return undefined;
  }
  // update LRU + last access
  rec.ts = now;
  await Promise.all([writeEntry(key, rec), touchIndex(keys, key)]);
  return rec.v;
}

export async function setCache(key: string, value: string, ttlMs: number = DEFAULT_TTL_MS): Promise<void> {
  const now = Date.now();
  const rec: CacheRecord = { v: value, exp: now + ttlMs, ts: now };
  const keys = await readIndex();
  await Promise.all([writeEntry(key, rec), touchIndex(keys, key)]);
}

export async function clearCacheKey(key: string): Promise<void> {
  const keys = await readIndex();
  await Promise.all([
    deleteEntry(key),
    writeIndex(keys.filter(k => k !== key)),
  ]);
}

export const CacheConfig = {
  DEFAULT_TTL_MS,
  LRU_CAP,
};
