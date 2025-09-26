// utils/audio.ts
// ElevenLabs (web) with device TTS fallback (expo-speech).
// Emits feelFit:voice-start / feelFit:voice-end with de-dup guard (single end per session).
// Applies Voice Style from localStorage "tts.style.v1" + "tts.gender.v1".

import * as Speech from "expo-speech";
import { emitFeelFit } from "@/utils/feelFitEvents";
import {
  DEFAULT_STYLE,
  type VoiceStyle,
  type Gender,
  toExpoSpeechOptions,
  toElevenPayload,
} from "@/utils/voiceProfiles";

export interface MotivationalMessage {
  start: string[];
  middle: string[];
  nearEnd: string[];
  completion: string[];
}

const HEALING_MESSAGES: MotivationalMessage = {
  start: [
    "Take a deep breath and let yourself settle into this moment.",
    "You're creating space for healing and peace within yourself.",
    "Allow your body to relax as we begin this gentle journey.",
    "This is your time to nurture your mind and spirit.",
    "Breathe deeply and let go of any tension you're holding.",
  ],
  middle: [
    "You're doing beautifully. Let each breath bring you deeper peace.",
    "Feel the calm spreading through your body with each movement.",
    "You're exactly where you need to be right now.",
    "Notice how your body is responding to this gentle care.",
    "Continue to breathe deeply and stay present with yourself.",
  ],
  nearEnd: [
    "Almost complete. Take these final moments to appreciate yourself.",
    "You're nearly finished. Feel the peace you've created.",
    "Just a little more time to nurture your wellbeing.",
    "Stay with this feeling of calm as we finish.",
    "You're doing something wonderful for yourself right now.",
  ],
  completion: [
    "Beautiful work. You've given yourself the gift of peace.",
    "You've completed this healing practice. Notice how you feel now.",
    "Wonderful. You've taken time to care for your mental wellbeing.",
    "You've created space for calm in your day. Well done.",
    "This practice is complete. Carry this peace with you.",
  ],
};

const MOTIVATIONAL_MESSAGES: MotivationalMessage = {
  start: [
    "Let's do this! You've got the strength to push through.",
    "Time to unleash your power! Every rep counts.",
    "You're taking control of your fitness journey. Amazing!",
    "Every movement is building your strength and stamina.",
    "You showed up today - that's already a victory!",
  ],
  middle: [
    "You're crushing it! Keep that energy flowing.",
    "Halfway there! Feel that strength building inside you.",
    "Your body is getting stronger with every rep.",
    "Push through - you're more powerful than you think!",
    "Feel your stamina increasing with every movement.",
  ],
  nearEnd: [
    "Almost there! Finish strong!",
    "Final push! Give it everything you've got!",
    "You're so close! Don't give up now!",
    "Dig deep - the finish line is right there!",
    "Ten seconds left - show your strength!",
  ],
  completion: [
    "Incredible work! You just leveled up your fitness.",
    "You did it! Feel that sense of accomplishment.",
    "Amazing! You've built both strength and stamina today.",
    "Workout complete! You should be proud of yourself.",
    "Fantastic! You just proved your dedication to fitness.",
  ],
};

// -------- env / platform helpers --------
const isWeb = typeof window !== "undefined" && typeof document !== "undefined";

const getEnvKey = () =>
  (process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY as string | undefined) ||
  (process.env.ELEVENLABS_API_KEY as string | undefined);

// -------- read saved prefs --------
function getSavedStyle(): VoiceStyle {
  try {
    if (typeof localStorage !== "undefined") {
      const v = localStorage.getItem("tts.style.v1") as VoiceStyle | null;
      if (v) return v;
    }
  } catch {}
  return DEFAULT_STYLE;
}
function getSavedGender(fallback: Gender): Gender {
  try {
    if (typeof localStorage !== "undefined") {
      const v = localStorage.getItem("tts.gender.v1") as Gender | null;
      if (v === "male" || v === "female") return v;
    }
  } catch {}
  return fallback;
}

// -------- Voice session guard (de-dup) --------
let currentWebAudio: HTMLAudioElement | null = null;
let currentWebAudioUrl: string | null = null;

let voiceTokenSeq = 0;
let activeVoiceToken: number | null = null;

function voiceStart(provider: "elevenlabs" | "device-tts", extra?: Record<string, any>) {
  activeVoiceToken = ++voiceTokenSeq;
  emitFeelFit("voice-start", { origin: "tts", provider, token: activeVoiceToken, ...(extra || {}) });
}

function voiceEnd(extra?: Record<string, any>) {
  if (activeVoiceToken == null) return; // already ended or never started
  const token = activeVoiceToken;
  activeVoiceToken = null;
  emitFeelFit("voice-end", { origin: "tts", token, ...(extra || {}) });
}

function cleanupWebAudio() {
  if (currentWebAudio) {
    try {
      currentWebAudio.onended = null;
      currentWebAudio.onerror = null;
      currentWebAudio.pause();
      currentWebAudio.src = "";
    } catch {}
  }
  if (currentWebAudioUrl) {
    try {
      URL.revokeObjectURL(currentWebAudioUrl);
    } catch {}
  }
  currentWebAudio = null;
  currentWebAudioUrl = null;
}

// -------- Internal (web) ElevenLabs playback --------
async function playWithElevenLabsWeb(
  text: string,
  opts: { voiceId: string; modelId: string; settings: Record<string, any> }
) {
  const key = getEnvKey();
  if (!isWeb || !key) throw new Error("no_eleven_key_or_not_web");

  const { voiceId, modelId, settings } = opts;

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
    voiceId
  )}/stream?optimize_streaming_latency=0&output_format=mp3_44100_128`;

  const body = {
    text,
    model_id: modelId,
    voice_settings: settings, // style/stability/speaking_rate/pitch etc.
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": key,
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`eleven_http_${res.status}`);

  const buf = await res.arrayBuffer();
  const blob = new Blob([buf], { type: "audio/mpeg" });
  const src = URL.createObjectURL(blob);

  // replace previous audio
  cleanupWebAudio();
  const audio = new Audio(src);
  currentWebAudio = audio;
  currentWebAudioUrl = src;

  voiceStart("elevenlabs", { provider: "elevenlabs" });

  audio.onended = () => {
    voiceEnd({ provider: "elevenlabs" });
    cleanupWebAudio();
  };
  audio.onerror = () => {
    voiceEnd({ provider: "elevenlabs", error: true });
    cleanupWebAudio();
  };

  await audio.play();
}

// -------- Public API (unchanged names) --------
export const playWorkoutAudio = (
  phase: keyof MotivationalMessage,
  audioType: "healing" | "motivational",
  voicePreference: "male" | "female" = "female"
) => {
  const messages = audioType === "healing" ? HEALING_MESSAGES[phase] : MOTIVATIONAL_MESSAGES[phase];
  const text = messages[Math.floor(Math.random() * messages.length)];

  const style = getSavedStyle();
  const gender: Gender = getSavedGender(voicePreference);

  // Web + ElevenLabs: use style-specific voice_settings
  if (isWeb && getEnvKey()) {
    const preset = toElevenPayload(style, gender);
    playWithElevenLabsWeb(text, preset).catch(() => {
      // Fallback to device TTS on error
      const opts = toExpoSpeechOptions(style, gender);
      voiceStart("device-tts", { provider: "device-tts", fallback: true });
      Speech.speak(text, {
        voice: opts.voice,
        rate: opts.rate,
        pitch: opts.pitch,
        onDone: () => voiceEnd({ provider: "device-tts", fallback: true }),
        onStopped: () => voiceEnd({ provider: "device-tts", stopped: true, fallback: true }),
      });
    });
    return;
  }

  // Native / no key / non-web → Expo Speech using style mapping
  const opts = toExpoSpeechOptions(style, gender);
  voiceStart("device-tts", { provider: "device-tts" });
  Speech.speak(text, {
    voice: opts.voice,
    rate: opts.rate,
    pitch: opts.pitch,
    onDone: () => voiceEnd({ provider: "device-tts" }),
    onStopped: () => voiceEnd({ provider: "device-tts", stopped: true }),
  });
};

export const stopAudio = () => {
  // stop device TTS
  try {
    Speech.stop();
  } catch {}
  // stop web audio
  cleanupWebAudio();
  // single synthetic end for the active session (manual stop)
  voiceEnd({ manualStop: true });
};
