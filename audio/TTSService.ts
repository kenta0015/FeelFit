// audio/TTSService.ts
import { Platform } from "react-native";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";

export type SynthResult = {
  uri: string | null;          // device-tts では null
  key: string;
  source: "device-tts";
  cached: false;
  bytes?: number;
};

function makeKey(voiceId: string | undefined, text: string) {
  const v = voiceId ?? "";
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return `${v}-${Math.abs(h)}`;
}

export async function synthesize(
  script: string,
  voiceId?: string
): Promise<SynthResult> {
  await new Promise<void>((resolve) => {
    Speech.speak(script, {
      voice: voiceId,
      onDone: resolve,
      onStopped: resolve,
      onError: () => resolve(),
      rate: Platform.OS === "web" ? 1.0 : undefined,
    });
    if (Platform.OS === "web") setTimeout(resolve, 0);
  });

  return {
    uri: null,
    key: makeKey(voiceId, script),
    source: "device-tts",
    cached: false,
  };
}

export async function playUri(uri: string): Promise<void> {
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });

  await new Promise<void>((resolve) => {
    sound.setOnPlaybackStatusUpdate((st: any) => {
      if (st?.didJustFinish || (st?.durationMillis && st?.positionMillis >= st.durationMillis)) {
        // ← 返り値は void なので `sub &&` などの判定は不要
        sound.setOnPlaybackStatusUpdate(null as any);
        resolve();
      }
    });
  });

  await sound.unloadAsync();
}
