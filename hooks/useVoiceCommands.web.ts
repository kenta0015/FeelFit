export function useVoiceCommands(): {
  isListening: boolean;
  listen: () => Promise<void>;
  stop: () => void;
} {
  return { isListening: false, listen: async () => {}, stop: () => {} };
}
export default useVoiceCommands;