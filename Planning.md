# Fitness App — AI Suggestion, Audio, and AI Comment Plan

(Person A = AI/Ranking/metrics, Person B = App/UI & audio, Person C = Support for B: assets/QA/polish)

## Phase 0 — Foundations (Day 0)

0.1 Env & wrappers — A

Add .env: OPENAI_API_KEY, ELEVENLABS_API_KEY.

Files: ai/openaiClient.ts, audio/ttsClient.ts.
DoD: Keys loaded; simple “ping” calls succeed.

### 0.2 Consent & Toggles (default ON) — B (C QA)

One-time consent modal (“AI uses anonymized metrics”).

Settings toggles: Use AI Text, Use Neural Voice (both ON by default).

Files: screens/SettingsScreen.tsx, utils/prefs.ts.
DoD: Flags persisted; modal never reappears after accept.

## Phase 1 — State & Signals (Rules fallback spine)

### 1.1 Plan context & selectors — A

Store: emotion, goal, timeAvailable, intensityPref, equipment[], constraints, disliked[].

Signals: streak, 7dSessions, 7dMinutes, recentIntensityAvg, mentalΔ, physicalΔ.

Files: store/usePlanStore.ts, logic/selectors.ts.
DoD: Existing manual flow unchanged; selectors memoized.

## Phase 2 — Ranking Engine (on-device, deterministic)

### 2.1 Exercise templates — A (C copy help)

JSON templates with tags: focus, intensity, equipment, recoveryFit.

File: data/exerciseTemplates.json.
DoD: At least 12 templates (mobility, core, cardio, strength, mindfulness).

## 2.2 Scoring & plan builder — A

rankExercises(ctx) → Ranked[] (weights per your spec).

buildPlan(ranked) → {blocks, totalTime, why[]}.

File: logic/rankExercises.ts.
DoD: Deterministic output; respects constraints/disliked; “why” reasons present.

## 2.3 Suggestion Card UI — B (C QA)

Shows top plan (title, blocks, total time, Why this?).

Buttons: [Start] [Edit] [Refresh].

Files: components/SuggestionCard.tsx, components/EditPlanSheet.tsx.
DoD: Live updates on input change; edit sheet writes back to store.

## Phase 3 — AI Suggestion (default ON, cached)

### 3.1 OpenAI rewrite — A

generateSuggestionText(plan, ctx) (energetic coach, 2–4 sentences).

Cache key: sha1(date + planHash + ctxHash) in AsyncStorage/FileSystem.

Files: ai/suggestion.ts, utils/cache.ts.
DoD: First call <3s; subsequent <300ms; automatic rules-text fallback on error.

## 3.2 UI integration — B (C QA)

Suggestion Card displays AI text when available; shows fallback if not.

[Refresh] invalidates cache only if inputs changed.
DoD: No duplicate calls; budget log visible in dev.

## Phase 4 — Audio: Neural TTS + Healing Music (with fallback)

### 4.1 ElevenLabs TTS (energetic coach) — A

synthesize(script, voiceId) → mp3, cache by (voiceId+hash(script)).

File: audio/TTSService.ts.
DoD: Works offline via cache; fallback to device TTS if network/API fails.

### 4.2 Mixer & ducking — B (C QA/assets)

Expo AV: Track A (healing music, loop/shuffle, multi-select), Track B (voice).

Auto-duck A to ~20% during voice; restore after.

Files: audio/AudioEngine.ts, hooks/useAudioEngine.ts, components/HealingMusicPicker.tsx, assets /assets/healing/\*.
DoD: Seamless loop; no leaks on pause/resume; picker persists selection.

## Phase 5 — AI Comment (Daily Summary, cached, fallback)

### 5.1 Metrics & scheduler — A

Compute features post-log & nightly (21:00 local or next app open).

Persist daily_summaries {date, text, metrics} (Supabase).

Files: logic/summaryMetrics.ts, features/dailySummary/storage.ts.
DoD: Exactly one summary/day; idempotent.

## 5.2 Heuristic bucket → AI polish — A

Buckets: Consistency / Comeback / PR / Encouragement.

generateDailySummary(ctx) → text (OpenAI → cache by date).

File: ai/dailySummary.ts.
DoD: Uses metrics naturally; rules fallback on failure.

### 5.3 UI — B (C QA)

“Coach Note” card on Home; history list view.

Files: features/dailySummary/CoachNote.tsx, features/dailySummary/History.tsx.
DoD: Shows latest + past 14 days; no duplicates.

## Phase 6 — Settings, Privacy, Budget & Reliability

### 6.1 Settings completion — B

Toggles: AI Text / Neural Voice; Voice picker; Music multi-select; Disliked exercises; Equipment.

Default: toggles ON.
DoD: All prefs persist; instant effect.

### 6.2 Budget guardrails — A (C QA)

Rate limits: 1 suggestion/day, 1 summary/day (manual override for dev).

Token meter in dev builds; exponential backoff; circuit breaker on repeated failures.

Files: utils/rateLimit.ts, utils/retry.ts.
DoD: Stays under <$3/mo with typical use.

## 6.3 Privacy note — B

Inline note under toggles: “Sends anonymized aggregates only.”
DoD: Copy approved.

Phase 7 — QA & Release

## 7.1 iOS end-to-end — B (C QA)

Flow: Inputs → Suggestion (AI) → Audio guidance (voice+music) → Log → Next day summary.
DoD: Smooth playback; correct ducking; no crashes.

### 7.2 Web checks — B (C QA)

Text features OK; document web-audio constraints.
DoD: No blocking errors; graceful degradation.

### 7.3 Performance & accessibility — A/B/C

Cold AI <3s; cached <300ms; 60fps during audio UI; VoiceOver labels for controls.
DoD: All acceptance checks pass.

## Task matrix (Owner → Key Deliverables)

A: usePlanStore.ts, data/exerciseTemplates.json, logic/rankExercises.ts, ai/suggestion.ts, ai/dailySummary.ts, audio/TTSService.ts, logic/summaryMetrics.ts, utils/{cache,rateLimit,retry}.ts.

B: components/SuggestionCard.tsx, components/EditPlanSheet.tsx, audio/AudioEngine.ts, hooks/useAudioEngine.ts, components/HealingMusicPicker.tsx, features/dailySummary/{CoachNote,History}.tsx, screens/SettingsScreen.tsx, consent modal.

C (supports B): Healing tracks (normalized, loop-safe), copy polish, QA scripts, accessibility review, test plans.

## Branching (suggested)

feat/ranking-A, feat/ai-suggestion-A, feat/tts-engine-A, feat/audio-engine-B, feat/music-picker-B, feat/daily-summary-A, feat/settings-consent-B, support/assets-healing-C, support/qa-tests-C.

## Acceptance checklist (condensed)

Ranking plan respects preferences/constraints and shows “Why this?”.

AI suggestion shows energetic coaching text; cached; rules fallback works.

ElevenLabs voice + healing music with ducking and cache; device TTS fallback OK.

One daily AI summary stored & displayed; fallback text OK.

Toggles default ON; user can opt out; consent recorded.

Budget within cap; retries/backoff/circuit breaker implemented.

iOS passes E2E; Web degrades gracefully; no regressions.
