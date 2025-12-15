// utils/healingCatalog.ts
// ID → URI resolver for healing BGM (Expo Web serves /public/* at the web root).
// Use /healing/<id>.mp3 (no "/public" in URL).

export type HealingId = string;

const MAP: Record<HealingId, string> = {
  song1: "/healing/song1.mp3",
  song2: "/healing/song2.mp3",
};

function isUri(s: string): boolean {
  return /^(https?:|blob:|data:|file:)/i.test(s) || s.includes("/") && /\.[a-z0-9]{2,4}$/i.test(s);
}

/** Register/override an ID → URI mapping at runtime. */
export function registerHealingTrack(id: HealingId, uri: string) {
  if (!id || !uri) return;
  MAP[String(id).trim()] = String(uri).trim();
}

/** Return a web-playable URI for a healing track ID. */
export function getHealingUri(id: HealingId): string | null {
  const key = String(id || "").trim();
  if (!key) return null;
  if (isUri(key)) return key; // absolute/relative URL provided directly
  if (MAP[key]) return MAP[key];
  // Convention fallback
  return `/healing/${encodeURIComponent(key)}.mp3`;
}

/** Introspect available IDs (registered + defaults). */
export function getKnownHealingIds(): string[] {
  return Object.keys(MAP);
}
