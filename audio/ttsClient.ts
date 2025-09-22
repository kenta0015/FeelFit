// audio/ttsClient.ts
import * as Speech from 'expo-speech';

// ---- 既存（そのまま） -----------------------------
const ELEVEN_KEY =
  process.env.ELEVENLABS_API_KEY ||
  process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY ||
  '';

export type ElevenPingResult = { ok: boolean; reason?: string };

export async function pingElevenLabs(): Promise<ElevenPingResult> {
  if (!ELEVEN_KEY) return { ok: false, reason: 'Missing ELEVENLABS_API_KEY' };
  try {
    const res = await fetch('https://api.elevenlabs.io/v2/voices', {
      headers: { 'xi-api-key': ELEVEN_KEY },
    });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? String(e) };
  }
}

// ---- 追加（端末TTSの synthesize） ------------------
// 将来 ElevenLabs/キャッシュ実装に差し替え可能な、共通の戻り型
export type SynthResult = {
  uri: string | null;                 // mp3 のローカル/remote URI（今は端末TTSなので null）
  source: 'device-tts' | 'elevenlabs' | 'cache';
  cached: boolean;                    // 端末TTSは false
  fallbackUsed: boolean;              // 端末TTSなので true
  key?: string;                       // 将来のキャッシュキー用
  bytes?: number;                     // 生成バイト数（将来用）
};

// 端末TTSで即時発話し、URIは返さない薄い実装
export async function synthesize(text: string, _voiceId?: string): Promise<SynthResult> {
  try {
    // NOTE: 完了待ちを厳密にやるなら onDone で Promise 化するが、
    // ここではレスポンス即時でOK（既存フローが playUri を条件分岐しているため）
    Speech.speak(text);
  } catch (_) {
    // 失敗してもコールサイトは URI の有無で分岐するので、そのまま返す
  }
  return {
    uri: null,
    source: 'device-tts',
    cached: false,
    fallbackUsed: true,
  };
}
