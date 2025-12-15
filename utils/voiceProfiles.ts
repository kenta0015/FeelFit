// utils/voiceProfiles.ts
// Voice style presets + mapping to Expo Speech and AWS Polly personas.
// Keeps the same public API used elsewhere: toExpoSpeechOptions(), toElevenPayload().

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

  // iOS voices (ignored gracefully elsewhere)
  const voice =
    gender === "male" ? "com.apple.ttsbundle.Daniel-compact" : "com.apple.ttsbundle.Samantha-compact";

  return { rate, pitch, voice };
}

// -------------------- AWS Polly persona mapping --------------------
// Map styles to en-US Polly voices (neural-capable).
const POLLY_PERSONA: Record<
  VoiceStyle,
  { female: string; male: string }
> = {
  Neutral:     { female: "Joanna",   male: "Matthew" },
  Calm:        { female: "Joanna",   male: "Matthew" },
  Focus:       { female: "Kendra",   male: "Justin"  },
  Passionate:  { female: "Salli",    male: "Joey"    },
  Encouraging: { female: "Kimberly", male: "Joey"    },
  Gentle:      { female: "Ivy",      male: "Kevin"   },
  Energetic:   { female: "Kimberly", male: "Joey"    },
};

function pickPollyVoice(style: VoiceStyle, gender: Gender): string {
  const row = POLLY_PERSONA[style] ?? POLLY_PERSONA[DEFAULT_STYLE];
  return row[gender] ?? row.female;
}

// Optional LS override (kept for compatibility with existing UI)
function getLsOverride(): string | undefined {
  try {
    if (typeof localStorage !== "undefined") {
      const v = localStorage.getItem("tts.voiceId.v1");
      if (v && v.trim()) return v.trim();
    }
  } catch {}
  return undefined;
}

// -------------------- Compatibility helper (historically ElevenLabs) --------------------
/**
 * Keep name/signature used elsewhere.
 * Returns Polly voiceId + a fixed modelId string so call sites that require it compile.
 */
export function toElevenPayload(
  style: VoiceStyle,
  gender: Gender,
  overrideVoiceId?: string
): { voiceId: string; modelId: string; settings: Record<string, any> } {
  const voiceId = overrideVoiceId?.trim() || getLsOverride() || pickPollyVoice(style, gender);
  return {
    voiceId,
    modelId: "aws-polly",         // <-- always a string (fixes TS error)
    settings: {},                 // not used by Polly; kept for API compatibility
  };
}
