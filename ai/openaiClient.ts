// ai/openaiClient.ts
// Fetch-based OpenAI client for Expo/Web. Exports:
// - openai.chat.completions.create(...)
// - pingOpenAI(): Promise<{ ok: boolean; error?: string; reason?: string }>
// - pingOpenAIDetails(): Promise<{ ok: boolean; error?: string; reason?: string }>
// - coachWithOpenAI(input: string, opts?): Promise<string>

type ChatMessage = { role: 'user' | 'system' | 'assistant'; content: string };
type ChatCreateArgs = {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
};

type ChatChoice = { index: number; message: { role: 'assistant'; content: string } };
type ChatUsage = { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };

export type ChatCompletion = {
  id: string;
  choices: ChatChoice[];
  usage?: ChatUsage;
};

// ---- API Key loader ----
function getApiKey(): string {
  // @ts-ignore
  const pub = (typeof process !== 'undefined' && process?.env?.EXPO_PUBLIC_OPENAI_API_KEY) as
    | string
    | undefined;
  // @ts-ignore
  const std = (typeof process !== 'undefined' && process?.env?.OPENAI_API_KEY) as
    | string
    | undefined;

  let extra: string | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default;
    extra =
      Constants?.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY ||
      Constants?.expoConfig?.extra?.OPENAI_API_KEY ||
      Constants?.manifest?.extra?.EXPO_PUBLIC_OPENAI_API_KEY ||
      Constants?.manifest?.extra?.OPENAI_API_KEY;
  } catch {
    // ignore
  }

  const key = pub || std || extra || '';
  if (!key) {
    console.warn('[openaiClient] OPENAI API key not found. Set EXPO_PUBLIC_OPENAI_API_KEY or OPENAI_API_KEY.');
  }
  return key;
}

// ---- Low-level HTTP wrapper ----
async function chatCompletionsCreate(args: ChatCreateArgs): Promise<ChatCompletion> {
  const apiKey = getApiKey();
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`[openaiClient] ${res.status} ${res.statusText} ${txt}`);
  }
  return (await res.json()) as ChatCompletion;
}

export const openai = {
  chat: {
    completions: {
      create: chatCompletionsCreate,
    },
  },
};

// ---- Ping helpers ----
export async function pingOpenAIDetails(): Promise<{ ok: boolean; error?: string; reason?: string }> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return { ok: false, error: 'missing_api_key', reason: 'missing_api_key' };

    const res = await fetch('https://api.openai.com/v1/models?limit=1', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const msg = `${res.status} ${res.statusText} ${text}`.trim();
      return { ok: false, error: msg, reason: msg };
    }
    return { ok: true };
  } catch (e: any) {
    const msg = String(e?.message || e);
    return { ok: false, error: msg, reason: msg };
  }
}

// Alias: keep callers happy (returns details, not boolean)
export async function pingOpenAI(): Promise<{ ok: boolean; error?: string; reason?: string }> {
  return pingOpenAIDetails();
}

// ---- Simple coaching helper (compat for legacy imports) ----
export async function coachWithOpenAI(
  input: string,
  opts?: { model?: string; temperature?: number; max_tokens?: number; system?: string }
): Promise<string> {
  const model = opts?.model ?? 'gpt-4o-mini';
  const temperature = opts?.temperature ?? 0.6;
  const max_tokens = opts?.max_tokens ?? 160;
  const system =
    opts?.system ??
    'You are a concise, supportive fitness coach. Keep output to 2–4 sentences, no emojis.';

  const resp = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: input },
    ],
    temperature,
    max_tokens,
  });

  const text = resp?.choices?.[0]?.message?.content?.trim() || '';
  return text;
}
