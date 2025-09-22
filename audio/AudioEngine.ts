// audio/AudioEngine.ts
import { Audio, AVPlaybackStatusSuccess, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

type FadeOpts = { from: number; to: number; ms: number };

export type MixerState = {
  isReady: boolean;
  isPlayingA: boolean;
  ducking: boolean;
  bpmTier: 90 | 110 | 130 | 150;
  volumeA: number;
};

export class AudioEngine {
  private trackA: Audio.Sound | null = null; // Healing (loop)
  private state: MixerState = {
    isReady: false,
    isPlayingA: false,
    ducking: false,
    bpmTier: 110,
    volumeA: 1,
  };
  private currentUris: string[] = [];
  private currentIdx = 0;

  getState() {
    return this.state;
  }

  async setup(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    });
    this.state.isReady = true;
  }

  setHealingTracks(uris: string[]) {
    this.currentUris = (uris || []).filter(Boolean);
    this.currentIdx = 0;
  }

  async startHealing(loop = true, shuffle = false) {
    if (!this.state.isReady || this.currentUris.length === 0) return;

    if (this.trackA) {
      try { await this.trackA.stopAsync(); await this.trackA.unloadAsync(); } catch {}
      this.trackA = null;
    }

    if (shuffle) this.currentIdx = Math.floor(Math.random() * this.currentUris.length);

    const uri = this.currentUris[this.currentIdx];
    const sound = new Audio.Sound();
    await sound.loadAsync({ uri }, { shouldPlay: true, isLooping: loop, volume: this.state.volumeA });
    this.trackA = sound;

    sound.setOnPlaybackStatusUpdate((s) => {
      const st = s as AVPlaybackStatusSuccess;
      if (!st.isLoaded) return;
      if (!loop && st.didJustFinish) this.nextHealing(shuffle).catch(() => {});
    });

    this.state.isPlayingA = true;
  }

  async stopHealing() {
    if (!this.trackA) return;
    try { await this.trackA.stopAsync(); await this.trackA.unloadAsync(); } catch {}
    this.trackA = null;
    this.state.isPlayingA = false;
  }

  async nextHealing(shuffle = true) {
    if (this.currentUris.length === 0) return;
    if (shuffle) this.currentIdx = Math.floor(Math.random() * this.currentUris.length);
    else this.currentIdx = (this.currentIdx + 1) % this.currentUris.length;
    await this.startHealing(true, false);
  }

  setBpmTier(tier: 90 | 110 | 130 | 150) {
    this.state.bpmTier = tier;
  }

  async startDucking() {
    if (this.state.ducking) return;
    this.state.ducking = true;
    await this.fadeA({ from: this.state.volumeA, to: 0.2, ms: 2000 });
    this.state.volumeA = 0.2;
  }

  async stopDucking() {
    if (!this.state.ducking) return;
    this.state.ducking = false;
    await this.fadeA({ from: this.state.volumeA, to: 1.0, ms: 2000 });
    this.state.volumeA = 1.0;
  }

  private async fadeA({ from, to, ms }: FadeOpts) {
    if (!this.trackA) return;
    const steps = Math.max(1, Math.floor(ms / 50));
    const delta = (to - from) / steps;
    let current = from;
    for (let i = 0; i < steps; i++) {
      current += delta;
      try { await this.trackA.setVolumeAsync(Math.max(0, Math.min(1, current))); } catch {}
      await new Promise((r) => setTimeout(r, 50));
    }
    try { await this.trackA.setVolumeAsync(Math.max(0, Math.min(1, to))); } catch {}
  }
}
