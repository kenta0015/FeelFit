// types/plan.ts

export type PlanBlock = {
  id: string;
  title: string;
  duration: number; // minutes
  met: number; // metabolic equivalent
  intensity: 'low' | 'med' | 'high';
  category: string; // e.g., mobility | core | cardio | strength | mindfulness | recovery
};

export type Plan = {
  title: string;
  blocks: PlanBlock[];
  totalTime: number; // minutes
  why: string[]; // explanations (English), must include a Monotony/Strain line
};
