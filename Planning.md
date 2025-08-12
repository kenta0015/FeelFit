# Fitness App — AI Suggestion, Audio, and AI Comment Plan

## – (Development Outline)

### Phase 1 – Foundation & Core

Finalize Core Architecture

Confirm tech stack (React Native + Supabase + AI API).

Establish modular codebase for future AI/voice features.

Core Workout Flow

User goal setup (mental, physical, or hybrid focus).

MET-based workout recommendations.

Mental & physical stamina tracking logic.

### Phase 2 – Enhanced Science Layer

Add Training Monotony & Strain (MET-based)

Automated daily/weekly calculation.

Highlight “high uncertainty” days.

Light-touch Check-ins

2-choice daily cards only when score is below threshold.

### Phase 3 – AI Integration

Conversational Coach

Voice-based Q&A during workouts (“How much time left?” → “2 minutes”).

Personality modes: Energetic / Soothing / Strict.

BGM Sync

Music tempo adapts to workout intensity.

Option for environment sounds.

### Phase 4 – Optimization & Gamification

User Personalization

Adaptive recommendation system (learns from user behavior).

Gamified Progress

Achievement badges for consistency, improvements, and milestones.

Retention & Engagement

Push notifications aligned with performance patterns.

### Phase 5 – Pre-launch & Scale

Closed Beta Testing

Collect feedback on AI coach and music sync.

Analytics & Iteration

Track engagement, workout completion, and user satisfaction.

Launch Campaign

Targeted to light/medium fitness users.

(Person A = AI/Ranking/Metrics, Person B = App/UI & Audio, Person C = Support for B: Assets/QA/Polish)

---

# step by step instruction (more detailed version)

## Phase 0 — Foundations (Day 0)

**0.1 Env & Wrappers — A**  
Add `.env`: `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`  
Files: `ai/openaiClient.ts`, `audio/ttsClient.ts`  
DoD: Keys loaded; “ping” success

**0.2 Consent & Toggles (default ON) — B (C QA)**  
One-time consent (“AI uses anonymized metrics”)  
Settings toggles (default ON): Use AI Text, Use Neural Voice  
Files: `screens/SettingsScreen.tsx`, `utils/prefs.ts`  
DoD: Persistence OK, no re-display

---

## Phase 1 — State & Signals (Rules fallback spine)

**1.1 Plan Context & Selectors — A**  
Store: `emotion`, `goal`, `timeAvailable`, `intensityPref`, `equipment[]`, `constraints`, `disliked[]`  
Signals (including additional):  
`streak`, `7dSessions`, `7dMinutes`, `recentIntensityAvg`, `mentalΔ`, `physicalΔ`, `acuteLoad3d`, `monotony7d`, `strain7d`, `sRPElite7d`, `earlyStopRate`, `skipCount`, `lastHighGap`  
Files: `store/usePlanStore.ts`, `logic/selectors.ts`  
DoD: Non-destructive to existing flow, memoized OK

---

## Phase 2 — Ranking Engine (On-device, Deterministic)

**2.1 Exercise Templates — A (C Copy Help)**  
JSON: `focus`, `intensity`, `equipment`, `recoveryFit`, `met`, `category`  
File: `data/exerciseTemplates.json`  
DoD: ≥12 types (mobility/core/cardio/strength/mindfulness)

**2.2 Scoring & Plan Builder — A**  
`rankExercises(ctx)` → `Ranked[]` (based on MET × time × completion rate + Recovery/Variety/Progression/Constraints)  
Zero-input basis: weighted `monotony7d` / `strain7d` / `acuteLoad3d` / `sRPElite7d`  
`buildPlan(ranked)` → `{blocks, totalTime, why[]}` (Monotony/Strain reflected in “Why this?”)  
File: `logic/rankExercises.ts`  
DoD: Deterministic, respects constraints/dislikes, with reasoning

**2.3 Suggestion Card UI — B (C QA)**  
Display: Title / Blocks / Total Time / “Why this?” (Monotony/Strain note)  
Buttons: [Start] [Edit] [Refresh]  
Two-choice card only on uncertain days (auto-skip in 3s): Push harder / Take it easy → ranking adjustment  
Files: `components/SuggestionCard.tsx`, `components/EditPlanSheet.tsx`, `components/TwoChoicePrompt.tsx`  
DoD: Live updates on input change, two-choice only under threshold

---

## Phase 3 — AI Suggestion (Default ON, Cached)

**3.1 OpenAI Rewrite — A**  
`generateSuggestionText(plan, ctx)` (energetic, 2–4 sentences, natural insertion of one-line reasoning)  
Cache key: `sha1(date + planHash + ctxHash)` (AsyncStorage/FileSystem)  
Files: `ai/suggestion.ts`, `utils/cache.ts`  
DoD: First run <3s / cache <300ms, fallback to rules text on failure

**3.2 UI Integration — B (C QA)**  
Use AI text if available, otherwise fallback  
[Refresh] disabled unless input changes → regenerate  
DoD: No duplicate calls, budget logging in dev

---

## Phase 4 — Audio: Neural TTS + Healing Music (with Fallback)

**4.1 ElevenLabs TTS (Energetic Coach) — A**  
`synthesize(script, voiceId)` → mp3, cache by `(voiceId + hash(script))`  
File: `audio/TTSService.ts`  
DoD: Fallback to device TTS when offline

**4.2 Mixer & Ducking — B (C QA/Assets)**  
Expo AV: TrackA = Healing (loop/shuffle, multi-select) / TrackB = Voice  
During voice: auto-duck A (~20%), then restore, crossfade  
BPM tier sync: switch at 90/110/130/150 BPM (swap by intensity)  
Files: `audio/AudioEngine.ts`, `hooks/useAudioEngine.ts`, `components/HealingMusicPicker.tsx`, `/assets/healing/*`  
DoD: Seamless loops, no leaks, minimal switch disruption

**4.3 Conversational Micro-commands (Preset) — A/B**  
Local intents: Pause / Resume / Skip / Time remaining / Slower / Faster  
Responses pre-synthesized & cached, with PTT button, music duck integration  
Files: `audio/VoiceIntents.ts`, `components/PTTButton.tsx`  
DoD: ≥95% success rate, <300ms response (cached)

---

## Phase 5 — AI Comment (Daily Summary, Cached, Fallback)

**5.1 Metrics & Scheduler — A**  
Post-log / 21:00 daily (or next launch) aggregation  
Supabase: `daily_summaries {date, text, metrics}`  
Files: `logic/summaryMetrics.ts`, `features/dailySummary/storage.ts`  
DoD: One per day, idempotent

**5.2 Heuristic Bucket → AI Polish — A**  
Buckets: Consistency / Comeback / PR / Encouragement  
`generateDailySummary(ctx)` → text (date-cached, fallback to rules)  
File: `ai/dailySummary.ts`  
DoD: Naturally incorporates metrics

**5.3 UI — B (C QA)**  
“Coach Note” card, 14-day history  
Files: `features/dailySummary/CoachNote.tsx`, `features/dailySummary/History.tsx`  
DoD: No duplicates

---

## Phase 6 — Settings, Privacy, Budget & Reliability

**6.1 Settings Completion — B**  
Toggles: AI Text / Neural Voice / BPM Sync / Two-Choice Card, Voice picker, Music multi-select, Disliked, Equipment  
DoD: Persistent, instant apply

**6.2 Budget Guardrails — A (C QA)**  
Rate limit: 1 suggestion/day, 1 summary/day (dev override OK)  
Token meter (dev), exponential backoff, circuit breaker  
Files: `utils/rateLimit.ts`, `utils/retry.ts`  
DoD: <$3/month (normal use), controlled even with heavy audio use

**6.3 Privacy Note — B**  
Below toggles: **“Sends anonymized aggregates only.”**  
DoD: Wording approved

---

## Phase 7 — QA & Release

**7.1 iOS End-to-End — B (C QA)**  
Flow: Inputs → Suggestion (AI) → Audio (Voice+Healing+BPM) → Log → Next-day summary  
DoD: Stable duck/restore, 0 crashes

**7.2 Web Checks — B (C QA)**  
Text functions OK, audio limitations stated  
DoD: No blockers, graceful degradation

**7.3 Performance & Accessibility — A/B/C**  
First load <3s, re-show <300ms, 60fps, VoiceOver labels  
DoD: All pass

---

## Task Matrix (Owner → Key Deliverables)

**A:**  
`store/usePlanStore.ts`, `logic/selectors.ts` (Monotony/Strain etc.)  
`data/exerciseTemplates.json`, `logic/rankExercises.ts`  
`ai/suggestion.ts`, `ai/dailySummary.ts`  
`logic/summaryMetrics.ts`, `utils/{cache,rateLimit,retry}.ts`  
`audio/TTSService.ts`, `audio/VoiceIntents.ts`

**B:**  
`components/SuggestionCard.tsx`, `components/EditPlanSheet.tsx`, `components/TwoChoicePrompt.tsx`  
`audio/AudioEngine.ts`, `hooks/useAudioEngine.ts`, `components/HealingMusicPicker.tsx`  
`features/dailySummary/{CoachNote,History}.tsx`  
`screens/SettingsScreen.tsx`, consent modal  
`components/PTTButton.tsx`

**C (Supports B):**  
Healing audio (normalized/loop-safe), copy refinement, QA scripts, accessibility, test plan

---

## Branching (Suggested)

`feat/env-and-store-A`  
`feat/templates-and-ranking-A`  
`feat/suggestion-ui-B`  
`feat/ai-suggestion-A`  
`feat/tts-service-A`  
`feat/audio-engine-B`  
`feat/music-picker-B`  
`feat/daily-summary-A` / `feat/daily-summary-B`  
`feat/monotony-strain-A`  
`feat/two-choice-card-B`  
`feat/voice-intents-A` / `feat/ptt-and-ducking-B`  
`support/assets-healing-C`, `support/qa-tests-C`

---

## Acceptance Checklist (Condensed)

- **Ranking:** Respects constraints/preferences, “Why this?” always visible (Monotony/Strain reflected)
- **AI Suggestion:** Daily cache, fallback to rules, first <3s / re <300ms
- **Audio:** ElevenLabs cache, healing loop, stable duck, BPM tier sync OK
- **Conversational:** Preset commands ≥95% success, <300ms response
- **Daily Summary:** One/day, 14-day history, no duplicates
- **Two-Choice Card:** Only under threshold, ≤1/day, auto-skip available
- **Settings/Privacy:** Toggles default ON, wording OK
- **Budget:** <$3/month (normal), retries/CB functional
- **QA:** iOS E2E pass, Web degrades gracefully under constraints

---

## Parallel — Task Allocation (Short-term Schedule & Merge Conditions)

**Day 0 (Phase 0) — Parallel**  
A: 0.1 / B: 0.2 / C: Asset prep  
Gate: Toggles, consent, keys OK

**Weeks 1–2 (Phases 1–2) — Parallel**  
A: 1.1 → 2.1 → 2.2 (Plan type fixed)  
B: 2.3 (with mock Plan), Two-Choice UI frame hidden  
C: Template/audio prep, basic QA  
Gate: Plan type fixed, UI shows `why[]`, two-choice works under hidden flag

**Weeks 3–4 (Phases 3–4–5) — Parallel**  
A: 3.1 (AI+Cache) / 5.1 / 5.2, 4.1 (TTS)  
B: 3.2 integration, 4.2 (Audio+BPM), 5.3 (Summary UI)  
C: Budget/cache/nightly idempotent QA  
Gate: Suggestion first <3s / re <300ms, TTS+duck stable, daily summary works

**Weeks 5–6 (Final Polish) — Parallel**  
A: Monotony/Strain/sRPElite integration, reason line in both AI/rules, VoiceIntents  
B: Two-Choice full impl (threshold/3s skip), PTT, BPM tier tuning  
C: Threshold/regression/latency/accessibility QA  
Gate: Monotony high → ↑ variety suggestions logged, two-choice only under condition, preset commands ≥95% success

> **Personality Coach**: If time allows, implement minimal version (text template + Voice ID map) at the end of Weeks 5–6.
