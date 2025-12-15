// audio/TTSService.web.ts
// Web — Blob URL cache + Polly Function URL（最優先）→ ElevenLabs（キー有時）→ device TTS
// 変更点：opts.tone が指定された時だけ tone を送る。自動推定は行わない（＝デフォルトは常にニュートラル）

import * as Crypto from "expo-crypto";
import { log } from "../lib/logger";

type Source = "cache" | "elevenlabs" | "device-tts" | "error";
type TTSTone = "healing" | "motivational";

export type TTSOptions = {
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
  outputFormat?: "mp3_44100_128" | "mp3_44100_64" | "mp3_22050_32";
  tone?: TTSTone;        // 明示指定時のみ送信
  rate?: string;
  pitch?: string;
  volume?: string;
  sampleRate?: string | number;
};

export type TTSResult = {
  key: string;
  uri: string | null;
  source: Source;
  cached: boolean;
  fallbackUsed: boolean;
};

const ELEVEN_API_KEY =
  (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY as string | undefined) ||
  (process.env.ELEVENLABS_API_KEY as string | undefined) ||
  "";

const POLLY_URL =
  (process.env.EXPO_PUBLIC_POLLY_URL as string | undefined) ||
  (process.env.POLLY_URL as string | undefined) ||
  "";

const POLLY_DEFAULT_VOICE =
  (process.env.EXPO_PUBLIC_POLLY_VOICE as string | undefined) || "Joanna";

const DEFAULT_MODEL = "eleven_multilingual_v2";
const DEFAULT_FORMAT: NonNullable<TTSOptions["outputFormat"]> = "mp3_44100_128";

const memoryCache = new Map<string, string>();

async function cacheKey(script: string, voiceId: string) {
  const h = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA1,
    `${voiceId}::${script}`
  );
  return `${voiceId}-${h}`;
}

function speakFallback(text: string) {
  try {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.95;
      (window as any).speechSynthesis.speak(u);
    }
  } catch {}
}

function toPollyFormat(_: TTSOptions["outputFormat"] | undefined) {
  return "mp3";
}

function toPollyVoice(voiceId: string) {
  const looksLikeEleven = /[0-9a-f]{8}-[0-9a-f]{4}/i.test(voiceId) || voiceId.length > 24;
  return looksLikeEleven ? POLLY_DEFAULT_VOICE : (voiceId || POLLY_DEFAULT_VOICE);
}

export async function synthesize(
  script: string,
  voiceId: string,
  opts: TTSOptions = {}
): Promise<TTSResult> {
  const key = await cacheKey(script, voiceId);
  log("tts:start", { key, voiceId, len: script.length });

  const hit = memoryCache.get(key);
  if (hit) return { key, uri: hit, source: "cache", cached: true, fallbackUsed: false };

  // 1) Polly
  if (POLLY_URL) {
    try {
      const pollyVoice = toPollyVoice(voiceId);
      const fmt = toPollyFormat(opts.outputFormat);

      const qs = new URLSearchParams();
      qs.set("text", script);
      qs.set("voiceId", pollyVoice);
      qs.set("format", fmt);
      qs.set("engine", "neural");
      // 明示指定時のみ送る（デフォルト中立）
      if (opts.tone) qs.set("tone", opts.tone);
      if (opts.rate) qs.set("rate", String(opts.rate));
      if (opts.volume) qs.set("volume", String(opts.volume));
      if (opts.pitch) qs.set("pitch", String(opts.pitch));
      if (opts.sampleRate) qs.set("sampleRate", String(opts.sampleRate));

      const url = `${POLLY_URL.replace(/\/+$/, "")}/?${qs.toString()}`;

      const res = await fetch(url, { method: "GET", headers: { Accept: "audio/mpeg" } });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`polly_http_${res.status}: ${t.slice(0, 200)}`);
      }

      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: "audio/mpeg" });
      const blobUrl = URL.createObjectURL(blob);
      memoryCache.set(key, blobUrl);
      log("tts:polly_ok", { key, bytes: (buf as ArrayBuffer).byteLength, voice: pollyVoice, tone: opts.tone ?? null });

      // 互換のため 'elevenlabs' を維持
      return { key, uri: blobUrl, source: "elevenlabs", cached: false, fallbackUsed: false };
    } catch (e) {
      log("tts:polly_fail", { key, error: String(e) });
      // fallthrough
    }
  }

  // 2) ElevenLabs
  try {
    if (!ELEVEN_API_KEY) throw new Error("missing_api_key");

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=0&output_format=${encodeURIComponent(
      opts.outputFormat ?? DEFAULT_FORMAT
    )}`;

    const body = {
      text: script,
      model_id: opts.modelId ?? DEFAULT_MODEL,
      voice_settings: {
        stability: opts.stability ?? 0.4,
        similarity_boost: opts.similarityBoost ?? 0.7,
        style: opts.style ?? 0.5,
        use_speaker_boost: opts.speakerBoost ?? true,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`tts_http_${res.status}: ${text.slice(0, 200)}`);
    }

    const buf = await res.arrayBuffer();
    const blob = new Blob([buf], { type: "audio/mpeg" });
    const blobUrl = URL.createObjectURL(blob);
    memoryCache.set(key, blobUrl);
    log("tts:eleven_ok", { key, bytes: (buf as ArrayBuffer).byteLength });

    return { key, uri: blobUrl, source: "elevenlabs", cached: false, fallbackUsed: false };
  } catch (e) {
    // 3) Device TTS
    speakFallback(script);
    log("tts:fallback_device", { key, error: String(e) });
    return {
      key,
      uri: null,
      source: ELEVEN_API_KEY || POLLY_URL ? "error" : "device-tts",
      cached: false,
      fallbackUsed: true,
    };
  }
}

export async function getCachePath(script: string, voiceId: string) {
  const key = await cacheKey(script, voiceId);
  return `webcache://${key}`;
}

export async function clearOne(script: string, voiceId: string) {
  const key = await cacheKey(script, voiceId);
  const url = memoryCache.get(key);
  if (url) {
    try { URL.revokeObjectURL(url); } catch {}
    memoryCache.delete(key);
  }
  log("tts:clear_one", { key });
}

export async function purgeAll() {
  for (const [, url] of memoryCache) {
    try { URL.revokeObjectURL(url); } catch {}
  }
  memoryCache.clear();
  log("tts:purge_all");
}

export default { synthesize, getCachePath, clearOne, purgeAll };
