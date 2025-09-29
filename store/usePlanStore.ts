// store/usePlanStore.ts
import { create } from 'zustand';

export type PlanFocus = 'mental' | 'physical' | 'both';
export type Intensity = 'low' | 'med' | 'high';

export type PlanSignals = {
  streak: number;
  sessions7d: number;
  minutes7d: number;
  recentIntensityAvg: number;
  mentalDelta?: number;
  physicalDelta?: number;
  acuteLoad3d?: number;
  monotony7d?: number;
  strain7d?: number;
  sRPElite7d?: number;
  earlyStopRate?: number;
  skipCount?: number;
  lastHighGap?: number;
};

export type PlanState = {
  // inputs
  focus: PlanFocus | null;
  emotion: string | null;
  goal: string | null;
  timeAvailable: number | null;
  intensityPref: Intensity;
  equipment: string[];
  constraints: string[];
  disliked: string[];

  // signals
  signals: PlanSignals;

  // setters (inputs)
  setFocus: (v: PlanFocus | null) => void;
  setEmotion: (v: string | null) => void;
  setGoal: (v: string | null) => void;
  setTimeAvailable: (v: number | null) => void;
  setIntensityPref: (v: Intensity) => void;
  setEquipment: (v: string[]) => void;
  setConstraints: (v: string[]) => void;
  setDisliked: (v: string[]) => void;

  // setters (signals)
  setSignals: (v: Partial<PlanSignals>) => void;

  // --- Quick Input UI ---
  isQuickOpen: boolean;
  lastQuickValues: {
    focus: PlanFocus | null;
    emotion: string | null;
    timeAvailable: number | null;
  };
  openQuick: () => void;
  closeQuick: () => void;
  toggleQuick: () => void;
  setLastQuickValues: (v: Partial<PlanState['lastQuickValues']>) => void;
};

export const usePlanStore = create<PlanState>((set) => ({
  // inputs
  focus: null,
  emotion: null,
  goal: null,
  timeAvailable: null,
  intensityPref: 'med',
  equipment: [],
  constraints: [],
  disliked: [],

  // signals defaults
  signals: {
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
  },

  // setters (inputs)
  setFocus: (v) => set({ focus: v }),
  setEmotion: (v) => set({ emotion: v }),
  setGoal: (v) => set({ goal: v }),
  setTimeAvailable: (v) => set({ timeAvailable: v }),
  setIntensityPref: (v) => set({ intensityPref: v }),
  setEquipment: (v) => set({ equipment: v }),
  setConstraints: (v) => set({ constraints: v }),
  setDisliked: (v) => set({ disliked: v }),

  // setters (signals)
  setSignals: (v) => set((s) => ({ signals: { ...s.signals, ...v } })),

  // Quick UI
  isQuickOpen: false,
  lastQuickValues: { focus: null, emotion: null, timeAvailable: null },
  openQuick: () => set({ isQuickOpen: true }),
  closeQuick: () => set({ isQuickOpen: false }),
  toggleQuick: () => set((s) => ({ isQuickOpen: !s.isQuickOpen })),
  setLastQuickValues: (v) =>
    set((s) => ({ lastQuickValues: { ...s.lastQuickValues, ...v } })),
}));
