# For Team B --- Phase 2 (UI) Quick Start

## 0) Prerequisites

-   **Base**: `main`\
-   **Contract PR/branch**: `chore/plan-dto-contract` (Plan type
    included)\
-   **A implementation PR**: `feat/templates-and-ranking-A` (to be
    merged later)

------------------------------------------------------------------------

## 1) Create Branch (Start from Contract)

``` bash
git fetch origin
git checkout -b feat/suggestion-ui-B origin/chore/plan-dto-contract
```

------------------------------------------------------------------------

## 2) Add Files (Full Code, Paste as-is)

### `hooks/usePlanSuggestion.ts` (mock return for now → later switch to A implementation)

``` ts
// hooks/usePlanSuggestion.ts
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
  // TODO: Replace with A’s logic once merged
  const isUncertainDay = (ctx.readiness ?? 100) < 40;
  return { plan: mockPlan20m, isUncertainDay };
}
```

### `components/SuggestionCard.tsx`

``` tsx
// components/SuggestionCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { Plan } from '@/types/plan';

// ... (full code as provided earlier)
```

(Include full code from earlier response)

### `components/EditPlanSheet.tsx`

// (full code as provided earlier)

### `components/TwoChoicePrompt.tsx`

// (full code as provided earlier)

### `components/RecoveryBanner.tsx`

// (full code as provided earlier)

------------------------------------------------------------------------

## 3) Integration Example (with mock)

``` tsx
// app/(tabs)/index.tsx
// Example usage with mock data until A’s logic is merged
```

------------------------------------------------------------------------

## 4) Commit & PR

``` bash
git add hooks/usePlanSuggestion.ts components/SuggestionCard.tsx components/EditPlanSheet.tsx components/TwoChoicePrompt.tsx components/RecoveryBanner.tsx
git commit -m "feat(ui): SuggestionCard/EditPlanSheet/TwoChoicePrompt/RecoveryBanner + mock hook"
git push -u origin feat/suggestion-ui-B
```

GitHub → **New pull request**\
- **Base**: `main`\
- **Compare**: `feat/suggestion-ui-B`\
- **Title**: `feat(ui): suggestion UI (2.3) with mock hook`\
- **Body**:\
`- Renders Plan DTO (mock)   - Two-Choice prompt on readiness < 40 (auto-close 3s)   - Recovery banner placeholder (wired for later A logic)   - Non-destructive; switches to A later via usePlanSuggestion`

------------------------------------------------------------------------

## 5) Switch to A's Implementation (after merge)

Update `usePlanSuggestion.ts` to import from `@/logic/rankExercises` and
`@/logic/recovery`.

------------------------------------------------------------------------

## 6) Verify

-   Plan renders correctly (title, blocks, total time)\
-   Two-Choice only when readiness \< 40, auto closes in 3s\
-   Buttons \[Start\]/\[Edit\]/\[Refresh\] functional (Alert OK for
    now)\
-   RecoveryBanner visible above SuggestionCard
