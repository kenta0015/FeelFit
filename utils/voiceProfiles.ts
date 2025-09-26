// utils/voiceProfiles.ts
// Voice style presets + mapping to Expo Speech and ElevenLabs payloads (aggressive deltas for audible change).

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

// ---- Expo Speech mapping (device TTS fallback) ----
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
      rate = 1.12;
      pitch = 1.08;
      break;
    case "Encouraging":
      rate = 1.06;
      pitch = 1.04;
      break;
    case "Gentle":
      rate = 0.88;
      pitch = 1.0;
      break;
    case "Energetic":
      rate = 1.2;
      pitch = 1.12;
      break;
    case "Neutral":
    default:
      rate = 1.0;
      pitch = 1.0;
  }

  const voice =
    gender === "male" ? "com.apple.ttsbundle.Daniel-compact" : "com.apple.ttsbundle.Samantha-compact";

  return { rate, pitch, voice };
}

// ---- ElevenLabs mapping (stronger differences) ----
type ElevenPreset = {
  voiceId: string;
  modelId: string;
  settings: {
    stability?: number;          // 0..1
    similarity_boost?: number;   // 0..1
    style?: number;              // 0..1 (expressiveness)
    speaking_rate?: number;      // 0.5..2 (beta; larger deltas for audibility)
    pitch?: number;              // 0.5..2 (beta)
  };
};

const FEMALE_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel
const MALE_VOICE_ID = "pNInz6obpgDQGcFmaJgB";   // Adam
const MODEL_ID = "eleven_multilingual_v2";

export function toElevenPayload(style: VoiceStyle, gender: Gender): ElevenPreset {
  const base: ElevenPreset = {
    voiceId: gender === "male" ? MALE_VOICE_ID : FEMALE_VOICE_ID,
    modelId: MODEL_ID,
    settings: {
      stability: 0.55,
      similarity_boost: 0.7,
      style: 0.35,
      speaking_rate: 1.0,
      pitch: 1.0,
    },
  };

  switch (style) {
    case "Calm":
      base.settings.stability = 0.75;
      base.settings.style = 0.15;
      base.settings.speaking_rate = 0.75; // much slower
      base.settings.pitch = 0.9;          // slightly lower
      break;
    case "Focus":
      base.settings.stability = 0.65;
      base.settings.style = 0.25;
      base.settings.speaking_rate = 0.95;
      base.settings.pitch = 1.0;
      break;
    case "Passionate":
      base.settings.stability = 0.5;
      base.settings.style = 0.7;
      base.settings.speaking_rate = 1.25;
      base.settings.pitch = 1.08;
      break;
    case "Encouraging":
      base.settings.stability = 0.55;
      base.settings.style = 0.55;
      base.settings.speaking_rate = 1.15;
      base.settings.pitch = 1.05;
      break;
    case "Gentle":
      base.settings.stability = 0.7;
      base.settings.style = 0.2;
      base.settings.speaking_rate = 0.85;
      base.settings.pitch = 1.0;
      break;
    case "Energetic":
      base.settings.stability = 0.48;
      base.settings.style = 0.9;
      base.settings.speaking_rate = 1.35; // much faster
      base.settings.pitch = 1.15;         // higher
      break;
    case "Neutral":
    default:
      // keep base
      break;
  }
  return base;
}
