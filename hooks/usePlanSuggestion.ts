import type { Plan } from '@/types/plan';

const mockPlan20m: Plan = {
  title: 'Mindful Mobility + Light Cardio (20m)',
  blocks: [
    { id: 'mob_cat_cow_5', title: 'Cat–Cow', duration: 5, met: 2.0, intensity: 'low', category: 'mobility' },
    { id: 'mind_box_breath_5', title: 'Box Breathing', duration: 5, met: 1.5, intensity: 'low', category: 'mindfulness' },
    { id: 'card_walk_liss_10', title: 'Walk LISS', duration: 10, met: 3.0, intensity: 'med', category: 'cardio' }
  ],
  totalTime: 20,
  why: ['Monotony trending high → add variety & lower strain.']
};

export type SuggestionCtx = {
  timeAvailable: number;
  readiness?: number; // < 40 → show Two-Choice
};

export function usePlanSuggestion(ctx: SuggestionCtx): { plan: Plan; isUncertainDay: boolean } {
  const isUncertainDay = (ctx.readiness ?? 100) < 40;
  return { plan: mockPlan20m, isUncertainDay };
}
