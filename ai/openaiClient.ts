// ai/openaiClient.ts
// Minimal OpenAI client for Expo/React Native (fetch-based).
// Exports named `openai` used by ai/suggestion.ts.

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

function getApiKey(): string {
  // Try process.env first (expo-env or babel transform), then Expo extra
  // @ts-ignore
  const envKey = process?.env?.OPENAI_API_KEY as string | undefined;
  // Lazy import to avoid hard dependency if not present
  let extraKey: string | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require('expo-constants').default;
    extraKey =
      Constants?.expoConfig?.extra?.OPENAI_API_KEY ??
      Constants?.manifest?.extra?.OPENAI_API_KEY;
  } catch {
    // ignore
  }
  const key = envKey || extraKey;
  if (!key) {
    console.warn('[openaiClient] OPENAI_API_KEY not found. Calls will fail.');
    return '';
  }
  return key;
}

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
  const json = (await res.json()) as ChatCompletion;
  return json;
}

export const openai = {
  chat: {
    completions: {
      create: chatCompletionsCreate,
    },
  },
};
