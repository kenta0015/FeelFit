export type MixerState = { isReady: boolean; isPlaying: boolean; ducking: boolean; bpmTier: number; };

export function useAudioMixer(): {
  state: MixerState;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  setTracks: (_tracks?: any) => void;
  setDucking: (_on: boolean) => void;
  setBpmTier: (_tier: number) => void;
} {
  return {
    state: { isReady: false, isPlaying: false, ducking: false, bpmTier: 110 },
    start: async () => {},
    stop: async () => {},
    setTracks: () => {},
    setDucking: () => {},
    setBpmTier: () => {},
  };
}
export default useAudioMixer;