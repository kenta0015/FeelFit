// audio/TTSService.ts
// Phase 4.1A — ElevenLabs TTS (Energetic Coach)
// synthesize(script, voiceId) -> mp3(URI)
// Cache key = voiceId + SHA1(script)
// DoD: オフライン時は端末TTS（expo-speech）にフォールバック

import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import * as Speech from 'expo-speech';

type Source = 'cache' | 'elevenlabs' | 'device-tts' | 'error';

export type TTSOptions = {
  modelId?: string;            // default: eleven_multilingual_v2
  stability?: number;          // 0.0–1.0
  similarityBoost?: number;    // 0.0–1.0
  style?: number;              // 0.0–1.0
  speakerBoost?: boolean;      // default: true
  outputFormat?: 'mp3_44100_128' | 'mp3_44100_64' | 'mp3_22050_32';
};

export type TTSResult = {
  key: string;                 // cache key
  uri: string | null;          // mp3 file uri (null if device-tts fallback)
  source: Source;              // where audio came from
  cached: boolean;             // true if served from cache
  fallbackUsed: boolean;       // true if device-tts used
};

const ELEVEN_API_KEY =
  (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY as string | undefined) ||
  (process.env.ELEVENLABS_API_KEY as string | undefined) ||
  '';

const CACHE_DIR = FileSystem.cacheDirectory! + 'tts';
const DEFAULT_MODEL = 'eleven_multilingual_v2';
const DEFAULT_FORMAT: NonNullable<TTSOptions['outputFormat']> = 'mp3_44100_128';

async function ensureDirAsync(dir: string) {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
}

async function cacheKey(script: string, voiceId: string) {
  const h = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA1,
    `${voiceId}::${script}`
  );
  return `${voiceId}-${h}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  // Minimal base64 encoder (no deps)
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '', i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    result += abc[bytes[i] >> 2];
    result += abc[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    result += abc[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    result += abc[bytes[i + 2] & 63];
  }
  if (i < bytes.length) {
    result += abc[bytes[i] >> 2];
    if (i === bytes.length - 1) {
      result += abc[(bytes[i] & 3) << 4] + '==';
    } else {
      result += abc[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      result += abc[(bytes[i + 1] & 15) << 2] + '=';
    }
  }
  return result;
}

function isOnlineError(e: unknown) {
  const msg = String(e ?? '');
  return /network|failed to fetch|internet/i.test(msg);
}

/**
 * Main: synthesize → cache → return URI
 * - オフライン/失敗時は端末TTSでフォールバック（音は鳴るがURIはnull）
 */
export async function synthesize(
  script: string,
  voiceId: string,
  opts: TTSOptions = {}
): Promise<TTSResult> {
  await ensureDirAsync(CACHE_DIR);
  const key = await cacheKey(script, voiceId);
  const path = `${CACHE_DIR}/${key}.mp3`;

  // 1) Cache hit
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    return { key, uri: info.uri, source: 'cache', cached: true, fallbackUsed: false };
  }

  // 2) Call ElevenLabs
  try {
    if (!ELEVEN_API_KEY) throw new Error('missing_api_key');

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
      method: 'POST',
      headers: {
        'xi-api-key': ELEVEN_API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`tts_http_${res.status}: ${text.slice(0, 200)}`);
    }

    const buf = await res.arrayBuffer();
    const b64 = bytesToBase64(new Uint8Array(buf));
    await FileSystem.writeAsStringAsync(path, b64, { encoding: FileSystem.EncodingType.Base64 });

    return { key, uri: path, source: 'elevenlabs', cached: false, fallbackUsed: false };
  } catch (e) {
    // 3) Fallback: device TTS (expo-speech)
    //  - オフラインでも音声を出す（mp3は残らない）
    try {
      Speech.speak(script, {
        language: 'en-US',
        rate: 0.95,
        pitch: 1.05,
      });
    } catch {
      // ignore
    }
    // eslint-disable-next-line no-console
    console.warn('[TTSService] fallback device-tts: ', isOnlineError(e) ? 'offline' : e);
    return { key, uri: null, source: ELEVEN_API_KEY ? 'error' : 'device-tts', cached: false, fallbackUsed: true };
  }
}

// Utilities
export async function getCachePath(script: string, voiceId: string) {
  const key = await cacheKey(script, voiceId);
  return `${CACHE_DIR}/${key}.mp3`;
}

export async function clearOne(script: string, voiceId: string) {
  const p = await getCachePath(script, voiceId);
  const info = await FileSystem.getInfoAsync(p);
  if (info.exists) await FileSystem.deleteAsync(p, { idempotent: true });
}

export async function purgeAll() {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (info.exists) await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
  await ensureDirAsync(CACHE_DIR);
}

export default { synthesize, getCachePath, clearOne, purgeAll };
