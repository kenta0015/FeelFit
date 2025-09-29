// state/appStore.ts
import { create } from 'zustand';

export type Prefs = {
  useAIText: boolean;
  useNeuralVoice: boolean;
  consentAccepted: boolean;
};

export type Metrics = {
  stamina: number;           // 0..100
  sleepHours?: number;       // last night
  daysSinceWorkout?: number; // 0=today
  rpeAvg?: number;           // 1..10 perceived effort
  hydration?: number;        // 0..100-ish
  stepsToday?: number;
};

export type CoachMessage = {
  text: string;
  source: 'rules' | 'ai';
  ruleId?: string;
  ts: number;
};

type AppState = {
  prefs: Prefs;
  metrics: Metrics;
  openaiOk: boolean;
  networkOk: boolean;
  coach: CoachMessage | null;

  setPrefs: (p: Partial<Prefs>) => void;
  setMetrics: (m: Partial<Metrics>) => void;
  setOpenAI: (ok: boolean) => void;
  setNetwork: (ok: boolean) => void;
  setCoach: (msg: CoachMessage | null) => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  prefs: { useAIText: true, useNeuralVoice: true, consentAccepted: false },
  metrics: { stamina: 70, sleepHours: 7, daysSinceWorkout: 1, rpeAvg: 5, hydration: 60, stepsToday: 0 },
  openaiOk: false,
  networkOk: true,
  coach: null,

  setPrefs: (p) => set({ prefs: { ...get().prefs, ...p } }),
  setMetrics: (m) => set({ metrics: { ...get().metrics, ...m } }),
  setOpenAI: (ok) => set({ openaiOk: ok }),
  setNetwork: (ok) => set({ networkOk: ok }),
  setCoach: (msg) => set({ coach: msg }),
}));

export const selectors = {
  shouldUseAI: (s: AppState) =>
    s.prefs.consentAccepted && s.prefs.useAIText && s.openaiOk && s.networkOk,
  energyBucket: (s: AppState) =>
    s.metrics.stamina < 35 ? 'low' : s.metrics.stamina > 75 ? 'high' : 'ok',
};
