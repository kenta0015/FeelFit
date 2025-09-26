// utils/healingCatalog.ts
// ID -> asset URI resolver (web/native). Put mp3 files under assets/healing/

import { Asset } from "expo-asset";

// Register actual files you have:
const REG: Record<string, number> = {
  song1: require("@/assets/healing/song1.mp3"),
  song2: require("@/assets/healing/song2.mp3"),
};

function isAbsoluteUrl(s: string) {
  return /^(https?:|blob:|data:)/i.test(s);
}

/** Returns a playable URI for HTMLAudio / AV. Null if unknown ID. */
export function getHealingUri(idOrUrl: string): string | null {
  const s = (idOrUrl || "").trim();
  if (!s) return null;
  if (isAbsoluteUrl(s) || s.includes("/")) return s;

  const mod = REG[s];
  if (!mod) return null;

  const asset = Asset.fromModule(mod);
  // Warmup on web; non-blocking.
  // @ts-ignore
  if (typeof asset.downloadAsync === "function") asset.downloadAsync().catch(() => {});
  return asset.uri ?? null;
}

/** For UI/testing */
export const KNOWN_HEALING_IDS = Object.keys(REG);
