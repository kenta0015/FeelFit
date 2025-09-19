import { useState } from 'react';
import { Audio } from 'expo-av';

export function useAudioEngine() {
  const [music, setMusic] = useState<Audio.Sound | null>(null);
  const [voice, setVoice] = useState<Audio.Sound | null>(null);

  const playMusic = async () => {
    const { sound } = await Audio.Sound.createAsync(require('../assets/audio/healing.mp3'), { isLooping: true, volume: 1 });
    setMusic(sound);
    await sound.playAsync();
  };

  const playVoice = async () => {
    if (!music) return;
    await music.setVolumeAsync(0.2); // Duck music
    const { sound } = await Audio.Sound.createAsync(require('../assets/audio/voice.mp3'));
    setVoice(sound);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate(async (status) => {
      if (status.didJustFinish) {
        await music.setVolumeAsync(1); // Restore music
      }
    });
  };

  return { playMusic, playVoice };
}
