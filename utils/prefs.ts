// utils/prefs.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  CONSENT: 'feel_fit_consent_accepted',
  USE_AI_TEXT: 'feel_fit_use_ai_text',
  USE_NEURAL_VOICE: 'feel_fit_use_neural_voice',
};

export type Prefs = {
  consentAccepted: boolean;
  useAiText: boolean;
  useNeuralVoice: boolean;
};

export async function getPrefs(): Promise<Prefs> {
  const [consent, ai, voice] = await Promise.all([
    AsyncStorage.getItem(K.CONSENT),
    AsyncStorage.getItem(K.USE_AI_TEXT),
    AsyncStorage.getItem(K.USE_NEURAL_VOICE),
  ]);

  return {
    consentAccepted: consent === '1',
    useAiText: ai == null ? true : ai === '1',
    useNeuralVoice: voice == null ? true : voice === '1',
  };
}

export async function setConsentAccepted(v: boolean): Promise<void> {
  await AsyncStorage.setItem(K.CONSENT, v ? '1' : '0');
}

export async function setUseAiText(v: boolean): Promise<void> {
  await AsyncStorage.setItem(K.USE_AI_TEXT, v ? '1' : '0');
}

export async function setUseNeuralVoice(v: boolean): Promise<void> {
  await AsyncStorage.setItem(K.USE_NEURAL_VOICE, v ? '1' : '0');
}
