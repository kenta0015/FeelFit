// audio/TTSService.native.ts
// Native (iOS/Android) — expo-file-system cache + expo-speech fallback
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import * as Speech from 'expo-speech';
import { log } from '../lib/logger';

type Source = 'cache' | 'elevenlabs' | 'device-tts' | 'error';

export type TTSOptions = {
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
  outputFormat?: 'mp3_44100_128' | 'mp3_44100_64' | 'mp3_22050_32';
};

export type TTSResult = {
  key: string;
  uri: string | null; // file://...
  source: Source;
  cached: boolean;
  fallbackUsed: boolean;
};

const ELEVEN_API_KEY =
  (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY as string | undefined) ||
  (process.env.ELEVENLABS_API_KEY as string | undefined) ||
  '';

const DEFAULT_MODEL = 'eleven_multilingual_v2';
const DEFAULT_FORMAT: NonNullable<TTSOptions['outputFormat']> = 'mp3_44100_128';

const CACHE_DIR = (FileSystem.cacheDirectory || FileSystem.documentDirectory || '') + 'tts';

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
  const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '', i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    out += abc[bytes[i] >> 2];
    out += abc[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    out += abc[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    out += abc[bytes[i + 2] & 63];
  }
  if (i < bytes.length) {
    out += abc[bytes[i] >> 2];
    if (i === bytes.length - 1) out += abc[(bytes[i] & 3) << 4] + '==';
    else {
      out += abc[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      out += abc[(bytes[i + 1] & 15) << 2] + '=';
    }
  }
  return out;
}

export async function synthesize(
  script: string,
  voiceId: string,
  opts: TTSOptions = {}
): Promise<TTSResult> {
  await ensureDirAsync(CACHE_DIR);
  const key = await cacheKey(script, voiceId);
  const path = `${CACHE_DIR}/${key}.mp3`;

  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    log('tts:cache_hit', { key });
    return { key, uri: info.uri, source: 'cache', cached: true, fallbackUsed: false };
  }

  try {
    if (!ELEVEN_API_KEY) throw new Error('missing_api_key');
    log('tts:start', { key, voiceId, len: script.length });

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

    log('tts:eleven_ok', { key, bytes: (buf as ArrayBuffer).byteLength });
    return { key, uri: path, source: 'elevenlabs', cached: false, fallbackUsed: false };
  } catch (e) {
    try { Speech.speak(script, { language: 'en-US', rate: 0.95, pitch: 1.05 }); } catch {}
    log('tts:fallback_device', { key, error: String(e) });
    return { key, uri: null, source: ELEVEN_API_KEY ? 'error' : 'device-tts', cached: false, fallbackUsed: true };
  }
}

export async function getCachePath(script: string, voiceId: string) {
  const key = await cacheKey(script, voiceId);
  return `${CACHE_DIR}/${key}.mp3`;
}

export async function clearOne(script: string, voiceId: string) {
  const key = await cacheKey(script, voiceId);
  const p = await getCachePath(script, voiceId);
  const info = await FileSystem.getInfoAsync(p);
  if (info.exists) await FileSystem.deleteAsync(p, { idempotent: true });
  log('tts:clear_one', { key });
}

export async function purgeAll() {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (info.exists) await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
  await ensureDirAsync(CACHE_DIR);
  log('tts:purge_all');
}

export default { synthesize, getCachePath, clearOne, purgeAll };
