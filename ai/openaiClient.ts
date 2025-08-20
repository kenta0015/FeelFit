// ai/openaiClient.ts

export type PingResult = { ok: boolean; reason?: string };

const API = 'https://api.openai.com/v1';

function authHeaders() {
  const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

/** Lightweight health check used at app start */
export async function pingOpenAI(): Promise<PingResult> {
  try {
    const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!key) return { ok: false, reason: 'missing OPENAI key' };

    const res = await fetch(`${API}/models`, { headers: authHeaders() });
    return res.ok
      ? { ok: true }
      : { ok: false, reason: `${res.status} ${res.statusText}` };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? 'network error' };
  }
}

/** Calls OpenAI for a coaching reply */
export async function coachWithOpenAI(prompt: string): Promise<string | null> {
  try {
    const key = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!key) return null;

    const res = await fetch(`${API}/chat/completions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
