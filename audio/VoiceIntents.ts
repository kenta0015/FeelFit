// audio/VoiceIntents.ts
import { Platform } from "react-native";
import { Audio } from "expo-av";
// audio/VoiceIntents.ts
// audio/VoiceIntents.ts
import { synthesize } from "./TTSService";



export type Intent = "pause" | "resume" | "skip" | "time" | "slower" | "faster";

export type EngineAPI = {
  duck: (on: boolean) => void | Promise<void>;
  pauseHealing: () => Promise<void> | void;
  resumeHealing: () => Promise<void> | void;
};

function replyFor(intent: Intent): string {
  switch (intent) {
    case "pause":
      return "Pausing the session.";
    case "resume":
      return "Resuming now.";
    case "skip":
      return "Skipping to the next section.";
    case "time":
      return "You have about nineteen minutes left.";
    case "slower":
      return "Slowing the tempo slightly.";
    case "faster":
      return "Speeding up a bit.";
    default:
      return "Okay.";
  }
}

export async function handleIntent(
  intent: Intent,
  engine: EngineAPI,
  voiceId: string
): Promise<{ spoken?: string }> {
  const response = replyFor(intent);
  try {
    // 音声の前に duck
    await engine.duck?.(true);

    // 先にミキサー側のアクション（pause/resumeなど）
    if (intent === "pause") await engine.pauseHealing?.();
    if (intent === "resume") await engine.resumeHealing?.();

    // TTS 合成 → 再生
    const out = await synthesize(response, voiceId);
    if ((out as any)?.uri) {
      await playUri((out as any).uri);
    }

    // 発話後に duck を戻す
    await engine.duck?.(false);
    return { spoken: response };
  } catch (e) {
    // 失敗時も必ず元に戻す
    try {
      await engine.duck?.(false);
    } catch {}
    return { spoken: response };
  }
}

async function playUri(uri: string): Promise<void> {
  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true, volume: 1.0 }
  );

  return new Promise<void>((resolve) => {
    // ⚠ setOnPlaybackStatusUpdate は void を返すので、そのまま呼ぶ（真偽判定しない）
    sound.setOnPlaybackStatusUpdate((st: any) => {
      if (st?.didJustFinish) {
        sound.setOnPlaybackStatusUpdate(null);
        resolve();
      }
    });
  });
}
