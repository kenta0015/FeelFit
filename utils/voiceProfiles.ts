// utils/voiceProfiles.ts
// Voice style presets + mapping to Expo Speech and ElevenLabs payloads.
// - Strong audible style deltas (rate/pitch/stability/style).
// - Voice IDs are reduced to 3 per gender per要望（Neutral / Calm / Passionate）。
// - All other styles are routed to the nearest of those three.
// - Optional override: localStorage("tts.voiceId.v1") or 3rd arg of toElevenPayload().

export type Gender = "male" | "female";
export type VoiceStyle =
  | "Neutral"
  | "Calm"
  | "Focus"
  | "Passionate"
  | "Encouraging"
  | "Gentle"
  | "Energetic";

export const ALL_STYLES: VoiceStyle[] = [
  "Neutral",
  "Calm",
  "Focus",
  "Passionate",
  "Encouraging",
  "Gentle",
  "Energetic",
];

export const DEFAULT_STYLE: VoiceStyle = "Neutral";

// -------------------- Expo Speech (device TTS fallback) --------------------
export function toExpoSpeechOptions(style: VoiceStyle, gender: Gender) {
  let rate = 1.0;
  let pitch = 1.0;

  switch (style) {
    case "Calm":
      rate = 0.8;
      pitch = 0.9;
      break;
    case "Focus":
      rate = 0.95;
      pitch = 1.0;
      break;
    case "Passionate":
      rate = 1.18;
      pitch = 1.08;
      break;
    case "Encouraging":
      rate = 1.10;
      pitch = 1.05;
      break;
    case "Gentle":
      rate = 0.88;
      pitch = 1.0;
      break;
    case "Energetic":
      rate = 1.28;
      pitch = 1.12;
      break;
    case "Neutral":
    default:
      rate = 1.0;
      pitch = 1.0;
  }

  // iOS voices (ignored on web/Android gracefully)
  const voice =
    gender === "male" ? "com.apple.ttsbundle.Daniel-compact" : "com.apple.ttsbundle.Samantha-compact";

  return { rate, pitch, voice };
}

// -------------------- ElevenLabs (IDs & params) --------------------
// Model
const MODEL_ID = "eleven_multilingual_v2";

// Final chosen IDs (per要望)
const FEMALE = {
  neutral: "21m00Tcm4TlvDq8ikWAM", // Rachel
  calm: "HzVnxqtdk9eqrcwfxD57",
  passionate: "y9CNRBALdlEecGD3RnmT",
} as const;

const MALE = {
  neutral: "pNInz6obpgDQGcFmaJgB", // Adam
  calm: "GUDYcgRAONiI1nXDcNQQ",
  passionate: "zYcjlYFOd3taleS0gkk3",
} as const;

// Route any style → one of the three buckets (per gender)
function routeStyle(style: VoiceStyle): "neutral" | "calm" | "passionate" {
  switch (style) {
    case "Neutral":
    case "Focus":
      return "neutral";
    case "Calm":
    case "Gentle":
      return "calm";
    case "Passionate":
    case "Encouraging":
    case "Energetic":
      return "passionate";
    default:
      return "neutral";
  }
}

type ElevenPreset = {
  voiceId: string;
  modelId: string;
  settings: {
    stability?: number; // 0..1
    similarity_boost?: number; // 0..1
    style?: number; // 0..1 (expressiveness)
    speaking_rate?: number; // 0.5..2
    pitch?: number; // 0.5..2
  };
};

// Strong, audible differences per style (independent of voiceId bucket)
function styleParams(style: VoiceStyle): Required<Pick<ElevenPreset["settings"], "stability" | "similarity_boost" | "style" | "speaking_rate" | "pitch">> {
  switch (style) {
    case "Calm":
      return { stability: 0.75, similarity_boost: 0.7, style: 0.15, speaking_rate: 0.75, pitch: 0.9 };
    case "Gentle":
      return { stability: 0.70, similarity_boost: 0.7, style: 0.20, speaking_rate: 0.85, pitch: 1.0 };
    case "Focus":
      return { stability: 0.65, similarity_boost: 0.7, style: 0.25, speaking_rate: 0.95, pitch: 1.0 };
    case "Passionate":
      return { stability: 0.50, similarity_boost: 0.75, style: 0.85, speaking_rate: 1.30, pitch: 1.10 };
    case "Encouraging":
      return { stability: 0.55, similarity_boost: 0.72, style: 0.65, speaking_rate: 1.18, pitch: 1.06 };
    case "Energetic":
      return { stability: 0.48, similarity_boost: 0.72, style: 0.90, speaking_rate: 1.38, pitch: 1.15 };
    case "Neutral":
    default:
      return { stability: 0.55, similarity_boost: 0.7, style: 0.35, speaking_rate: 1.0, pitch: 1.0 };
  }
}

// Optional override from localStorage (used by Player for display too)
function getLsOverride(): string | undefined {
  try {
    if (typeof localStorage !== "undefined") {
      const v = localStorage.getItem("tts.voiceId.v1");
      if (v && v.trim()) return v.trim();
    }
  } catch {}
  return undefined;
}

/**
 * Build ElevenLabs payload.
 * @param style Voice style
 * @param gender Gender
 * @param overrideVoiceId Optional explicit voiceId (takes precedence). If omitted, tries LS override, then routed ID.
 */
export function toElevenPayload(
  style: VoiceStyle,
  gender: Gender,
  overrideVoiceId?: string
): ElevenPreset {
  const bucket = routeStyle(style);
  const routed =
    gender === "male"
      ? bucket === "neutral"
        ? MALE.neutral
        : bucket === "calm"
        ? MALE.calm
        : MALE.passionate
      : bucket === "neutral"
      ? FEMALE.neutral
      : bucket === "calm"
      ? FEMALE.calm
      : FEMALE.passionate;

  const finalId = overrideVoiceId || getLsOverride() || routed;
  const p = styleParams(style);

  return {
    voiceId: finalId,
    modelId: MODEL_ID,
    settings: {
      stability: p.stability,
      similarity_boost: p.similarity_boost,
      style: p.style,
      speaking_rate: p.speaking_rate,
      pitch: p.pitch,
    },
  };
}
