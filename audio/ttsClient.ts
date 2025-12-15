// audio/ttsClient.ts
// ElevenLabs ping via /v2/voices (needs only Voices: Read)
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
