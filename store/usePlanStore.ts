// store/usePlanStore.ts
import { create } from 'zustand';

export type PlanFocus = 'mental' | 'physical' | 'both';
export type IntensityPref = 'low' | 'med' | 'high' | null;

export type PlanSignals = {
  streak: number;
  sessions7d: number;
  minutes7d: number;
  recentIntensityAvg: number;
  mentalDelta: number;
  physicalDelta: number;
  acuteLoad3d: number;
  monotony7d: number;
  strain7d: number;
  sRPElite7d: number;
  earlyStopRate: number;
  skipCount: number;
  lastHighGap: number;
};

export type PlanState = {
  // inputs
  focus: PlanFocus | null;
  emotion: string | null;
  goal: string | null;
  timeAvailable: number | null;
  intensityPref: IntensityPref;
  equipment: string[];
  constraints: string[];
  disliked: string[];

  // signals
  signals: PlanSignals;

  // actions
  setFocus: (v: PlanFocus | null) => void;
  setEmotion: (v: string | null) => void;
  setGoal: (v: string | null) => void;
  setTimeAvailable: (v: number | null) => void;
  setIntensityPref: (v: IntensityPref) => void;
  setEquipment: (v: string[] | ((prev: string[]) => string[])) => void;
  setConstraints: (v: string[] | ((prev: string[]) => string[])) => void;
  setDisliked: (v: string[] | ((prev: string[]) => string[])) => void;
  patchSignals: (v: Partial<PlanSignals>) => void;
  reset: () => void;
};

const initialSignals: PlanSignals = {
  streak: 0,
  sessions7d: 0,
  minutes7d: 0,
  recentIntensityAvg: 0,
  mentalDelta: 0,
  physicalDelta: 0,
  acuteLoad3d: 0,
  monotony7d: 0,
  strain7d: 0,
  sRPElite7d: 0,
  earlyStopRate: 0,
  skipCount: 0,
  lastHighGap: 0,
};

const initialState = {
  focus: null,
  emotion: null,
  goal: null,
  timeAvailable: null,
  intensityPref: null as IntensityPref,
  equipment: [] as string[],
  constraints: [] as string[],
  disliked: [] as string[],
  signals: initialSignals,
};

export const usePlanStore = create<PlanState>((set) => ({
  ...initialState,
  setFocus: (v) => set({ focus: v }),
  setEmotion: (v) => set({ emotion: v }),
  setGoal: (v) => set({ goal: v }),
  setTimeAvailable: (v) => set({ timeAvailable: v }),
  setIntensityPref: (v) => set({ intensityPref: v }),
  setEquipment: (v) => set((s) => ({ equipment: typeof v === 'function' ? v(s.equipment) : v })),
  setConstraints: (v) => set((s) => ({ constraints: typeof v === 'function' ? v(s.constraints) : v })),
  setDisliked: (v) => set((s) => ({ disliked: typeof v === 'function' ? v(s.disliked) : v })),
  patchSignals: (v) => set((s) => ({ signals: { ...s.signals, ...v } })),
  reset: () => set(initialState),
}));
