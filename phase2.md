# Phase 2 Mixed Plan (A × B)

## 0) Shared Premises (Fixed)

**Plan DTO (Contract):**

```ts
export type Plan = {
  title: string;
  blocks: { id: string; title: string; duration: number; met: number; intensity: 'low'|'med'|'high'; category: string }[];
  totalTime: number;
  why: string[];
};
```

- **Trigger**: `readiness < 40` → Show Two-Choice  
- **Constraint**: Same `ctx` → Same result (deterministic sort: `score desc, id asc`)

---

## 1) Branching & Initial Step (Day 1 Morning)

### Team A (Logic)
- Create `chore/plan-dto-contract` (contract only)
- Add `Plan` type in `types/plan.ts`
- Add empty exports in `logic/rankExercises.ts`:
  ```ts
  export type Ranked = { id:string; score:number } & Plan['blocks'][number];

  export function rankExercises(ctx:any): Ranked[] { return []; }

  export function buildPlan(ranked: Ranked[], timeAvailable:number): Plan {
    return {title:'', blocks:[], totalTime:0, why:[]};
  }
  ```
- Draft PR: “fix contract only” (for A/B connection)

### Team B (UI)
- Create `feat/suggestion-ui-B` branch from the contract branch
- Implement `components/SuggestionCard.tsx` with a mock Plan first
- Add `hooks/usePlanSuggestion.ts` (returns mock for now)

---

## 2) Implementation Sprint (Day 1 Afternoon – Day 3)

### Team A (Logic) — `feat/templates-and-ranking-A`
- **2.1**: `data/exerciseTemplates.json` (12+ items, all required fields)
- **2.2**: Implement `rankExercises(ctx)`
  - Base: `met * duration * 0.9`
  - Weight adjustments: `monotony7d↑ / strain7d↑ / acuteLoad3d↑ / sRPElite7d↑`
  - Exclusion: drop `constraints/disliked`, if zero candidates → fallback with penalty + record in `why[]`
  - Stable sort: `score desc, id asc`
- **2.2**: Implement `buildPlan(ranked, timeAvailable)`
  - Must not exceed `timeAvailable`
  - Generate `title` (e.g., *“Mindful Mobility + Light Cardio (20m)”*)
  - Ensure `why[]` includes a Monotony/Strain line
  - Fallback default: low MET 10–15m session if no candidates
- **Unit Tests**: boundaries (ties, zero candidates, exact/full time buckets)

### Team B (UI) — `feat/suggestion-ui-B`
- **2.3**: Implement `SuggestionCard.tsx` (renders Plan DTO)
- **2.3**: Implement `EditPlanSheet.tsx` (simple time/intensity/category swaps)
- **2.3**: Implement `TwoChoicePrompt.tsx` (`readiness < 40`, auto-dismiss in 3s)
- Refresh control: recompute only on `ctx` changes (memoization or shallow compare)

---

## 3) Connection & Replacement (Day 3 Evening)

### Team A
- Merge PR: `templates-and-ranking-A` → `main`

### Team B
- Rebase main:
  ```bash
  git pull --rebase origin main
  ```
- Replace mock implementation in `usePlanSuggestion()` with real one:
  ```ts
  import { rankExercises, buildPlan } from '@/logic/rankExercises';

  export function usePlanSuggestion(ctx:{ timeAvailable:number; /* ... */ }) {
    const ranked = rankExercises(ctx);
    return buildPlan(ranked, ctx.timeAvailable);
  }
  ```

---

## 4) Additional Feature (2.4 Recovery Banner) (Day 4 Morning)

### Team A
- Add logic in `logic/recovery.ts`:
  ```ts
  shouldRecommendRecovery(ctxSignals): {
    show: boolean;
    reason: string;
    type: 'rest' | 'active' | 'liss15';
  }
  ```
- Rules:  
  - `monotony7d ≥ 2.0` OR `strain7d` top 25%  
  - `acuteLoad3d ≥ 1.6×` average OR `lastHighGap < 1d` with high `earlyStopRate`  
- Caps: ≤ 2 times per week, ≥ 48h between triggers

### Team B
- Add `components/RecoveryBanner.tsx`
  - Display above SuggestionCard
  - Text: *“Recent load ↑ & monotony high → consider active recovery”*
  - CTAs: `[Recover Today]` / `[Keep Normal]` (log the choice)

---

## 5) Integration (Day 4 Evening)
- Create `release/phase-2` branch and merge both A/B
- Light E2E check:
  - Same ctx → identical Plan
  - No exceeding `timeAvailable`
  - Two-Choice shown only when `readiness < 40`
  - Recovery Banner follows triggers/caps (never multiple times same day)
- If all pass → merge to `main` with `--no-ff`

---

## 6) Minimum Test Items (Practical)

### Unit (A)
- **rankExercises**:  
  - Ties → sorted by `id` ascending  
  - Exclude `constraints/disliked`  
  - Zero candidates → fallback with penalty + record in `why[]`  
- **buildPlan**:  
  - Never exceeds 10/15/20/30 buckets  
  - Always includes Monotony/Strain line in `why[]`

### UI (B)
- **SuggestionCard**: displays Plan, MET/minute  
- **EditPlanSheet**: changes (time/intensity/category) reflected in Plan  
- **TwoChoicePrompt**: only when `readiness < 40`, closes in 3s  
- **RecoveryBanner**: appears correctly, logs choice

---

## 7) Risks & Mitigations

- **Contract break** → lock `chore/plan-dto-contract`, any breaking changes must be in separate PR  
- **Zero candidates** → A must fallback to safe default  
- **Excess recomputation** → B recalculates only on `ctx` change (memoization)  
- **Non-determinism** → never use randomness (ties resolved by `id`)

---

## 8) Skeleton Files to Create Immediately

- `types/plan.ts` (Plan type)  
- `data/exerciseTemplates.json` (12+ items / required fields)  
- `logic/rankExercises.ts` (`rankExercises` / `buildPlan`)  
- `logic/recovery.ts` (`shouldRecommendRecovery`)  
- `components/SuggestionCard.tsx`  
- `components/EditPlanSheet.tsx`  
- `components/TwoChoicePrompt.tsx`  
- `components/RecoveryBanner.tsx`  
- `hooks/usePlanSuggestion.ts`
