# Fitness App — Concise Development Outline

(Group A = AI/Ranking/metrics, Group B = App/UI & audio/assets/QA/polish)

## Phase 0 — Foundations

Env & Wrappers (A): Set up API keys and test connections (OpenAI, ElevenLabs).

Consent & Toggles (B, C): Add consent modal and settings toggles (AI text, Neural voice).

## Phase 1 — State & Signals

Plan Context (A): Centralize user inputs (emotion, goal, time, equipment).

Signals (A): Compute workout trends (streaks, strain, monotony) for adaptive logic.

## Phase 2 — Ranking Engine

Exercise Templates (A, C): Define workouts with metadata (MET, category, intensity).

Scoring & Builder (A): Rank exercises with science-based metrics; handle rest/strain.

Suggestion Card UI (B, C): Display plan, “Why this?”, edit/refresh options. Show two-choice card only when needed.

2.3 Suggestion Card (Normal)

## Phase 3 — AI Suggestion

OpenAI Rewrite (A): Turn plan into natural coaching text, cached for speed.

UI Integration (B, C): Insert AI text into Suggestion Card with fallback.

## Phase 4 — Audio

Neural TTS (A): Generate energetic coach voice; cache with fallback to device TTS.

Mixer & Ducking (B, C): Balance healing music + voice; sync music BPM to exercise.

Conversational Commands (A/B): Predefined voice commands (“pause”, “time left”) for interactive coaching.

## Phase 5 — AI Comment

Metrics & Scheduler (A): Aggregate logs daily (strain, streaks, stamina changes).

Buckets → AI Polish (A): Map user progress to feedback categories, refine with AI.

UI (B, C): Show “Coach Note” card with history (14 days).

## Phase 6 — Settings, Privacy, Budget

Settings (B): Toggles for AI/voice/music/rest suggestions, equipment/dislikes.

Budget Guardrails (A, C): Rate limits and retry logic to keep costs <$3/mo.

Privacy Note (B): Clear message: only anonymized aggregates sent.

## Phase 7 — QA & Release

iOS E2E (B, C): Full test: input → suggestion → audio → log → daily summary.

Web Checks (B, C): Text functions OK, document audio limitations.

Perf & Accessibility (A/B/C): Ensure speed (<3s first AI, <300ms cached), stable 60fps, accessible UI.

## Parallelization (Short Form)

Day 0: Env setup (A) + Toggles (B).

Weeks 1–2: Core signals (A) + Ranking/UI (A/B) + Audio base (A/B/C).

Weeks 3–4: AI suggestion + Audio polish + Daily summary (A/B).

Weeks 5–6: Monotony/strain logic, conversational commands, QA hardening.

Optional: Personality coach if time allows.

# Step-by-Step Implementation (detailed)

(Team A = AI/Ranking/metrics, Team B = App/UI & audio/assets/QA/polish)

## Phase 0 — Foundations (Day 0)⇒Done!!

### 0.1 Env & Wrappers — A

Add .env: OPENAI_API_KEY, ELEVENLABS_API_KEY

Files: ai/openaiClient.ts, audio/ttsClient.ts

DoD: Keys loaded; “ping” success

**Consent Modal**

```css
┌─────────────────────────────┐
│ 🔐 Allow AI Coaching? │
│ AI uses anonymized metrics │
│ │
│ [Decline] [Accept ✅] │
└─────────────────────────────┘
```

### 0.2 Consent & Toggles (default ON) — B (C QA)

One-time consent: “AI uses anonymized metrics”

Settings toggles (default ON): Use AI Text, Use Neural Voice

Files: screens/SettingsScreen.tsx, utils/prefs.ts

DoD: Persistence OK, no re-display

**Settings (Toggles)**

```pgsql

┌ Settings ───────────────────┐
│ [ON] Use AI Text │
│ [ON] Use Neural Voice │
│ │
│ i Sends anonymized aggregates only. │
└─────────────────────────────┘

```

“audio test” (2 commands)

```
powershell

# 1) set vars + body (re-run in any new terminal)
$env:ELEVEN_KEY="YOUR_xi_api_key"; $voice="21m00Tcm4TlvDq8ikWAM"
'{"text":"Hello from FeelFit","model_id":"eleven_multilingual_v2"}' | Set-Content body.json -Encoding utf8
```

```powershell

# 2) request & play
curl.exe -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$voice" `
  -H ("xi-api-key: " + $env:ELEVEN_KEY) -H "Accept: audio/mpeg" -H "Content-Type: application/json" `
  --data-binary "@body.json" --output out.mp3; start .\out.mp3


```

note: $env:ELEVEN_KEY lasts only for the current PowerShell window; open a new one → set it again.

## Phase 1 — State & Signals (Rules fallback spine)⇒Done!!

### 1.1 Plan Context & Selectors — A

Store: emotion, goal, timeAvailable, intensityPref, equipment[], constraints, disliked[]

Signals (incl. additional):
streak, 7dSessions, 7dMinutes, recentIntensityAvg, mentalΔ, physicalΔ, acuteLoad3d, monotony7d, strain7d, sRPElite7d, earlyStopRate, skipCount, lastHighGap

Files: store/usePlanStore.ts, logic/selectors.ts

DoD: Non-destructive to existing flow; selectors memoized

**Home (Inputs + Signals)**

```yaml
┌ Home ───────────────────────────────────────────────┐
│ Focus: 🧠 Mental / 💪 Physical / ⚖️ Both │
│ Emotion: 🙂 😌 😤 😣 😴 │
│ Goal: ⚡ Metabolism 🏃 Stamina 💧 Recovery ... │
│ Time: 10m 15m 20m 30m │
│ │
│ Signals: Streak: 3 | 7d Min: 85 | Intensity: Med │
└─────────────────────────────────────────────────────┘
```

**What is this for?**

Quick Input: Select “Focus / Emotion / Time” at the top with a single tap (faster than going through the multi-step UI every time).

Global State Foundation: Centralized in the Zustand store → shared across screens without prop drilling.

Signal Display: Always show Streak / 7d Min / Intensity / Readiness (future basis for workout recommendations).

Preparation for Phase 2: Current version is not connected. In Phase 2 we will compute signals from past sessions and automatically propose workouts using rules (scoring).

**Phase 2 Process**

2.1–2.2: Implement data/exerciseTemplates.json and logic/rankExercises.ts.
→ rankExercises(ctx) will directly consume values from usePlanStore.

Replace getWorkoutMatches() in app/(tabs)/index.tsx with rankExercises.

Retire the old find\*Workouts functions.

## Phase 2 — Ranking Engine (On-device, Deterministic)

### 2.1 Exercise Templates — A

JSON fields: focus, intensity, equipment, recoveryFit, met, category

File: data/exerciseTemplates.json

DoD: ≥12 types（mobility / core / cardio / strength / mindfulness）

### 2.2 Scoring & Plan Builder — A

rankExercises(ctx) → Ranked[]

Base: MET × time × completion%

Zero-input modifiers（weights）：monotony7d / strain7d / acuteLoad3d / sRPElite7d

Constraints & dislikes respected

buildPlan(ranked) → { blocks, totalTime, why[] }

“Why this?” includes Monotony/Strain note

File: logic/rankExercises.ts

DoD: Deterministic; reasons present; constraint-safe

### 2.3 Suggestion Card UI — B

Display: Title / Blocks / Total Time / “Why this?”（Monotony/Strain）

Actions: [Start] [Edit] [Refresh]

Two-Choice Card（only on uncertain days; auto-skip in 3s）: Push harder / Take it easy → temporary ranking bias 「Readiness < 40」fixed standard (in the future user input base Only when「emotion ：Neutral/Unsure」is selected Two-Choice displays)

Files: components/SuggestionCard.tsx, components/EditPlanSheet.tsx, components/TwoChoicePrompt.tsx

DoD: Live updates; two-choice only under threshold

**Suggestion Card (Normal)**

```java

┌ Today’s Plan ───────────────────────────────────────┐
│ 🏷️ Title: Mindful Mobility + Light Cardio (20m) │
│ ⏱️ Blocks: │
│ • Cat–Cow (5m) • Box Breathing (5m) │
│ • Walk LISS (10m, MET 3.0) │
│ 📌 Why this? Monotony↑ → add variety & lower strain │
│ │
│ [▶ Start] [✏ Edit] [↻ Refresh] │
└─────────────────────────────────────────────────────┘

```

**Edit Plan Sheet**

```scss
┌ Edit Plan ──────────────────────────────────────────┐
│ Time: 15 20 25 30 | Intensity: Low Med High │
│ Focus: Mobility / Strength / Cardio / Mindfulness │
│ Swap: [Cat–Cow] → [Hip Opener] │
│ [Save ✅] [Cancel] │
└─────────────────────────────────────────────────────┘
```

**“Uncertain Day” Two-Choice Card**

```arduino

┌ How do you feel today? (auto close in 3s) ┐
│ 💥 Push harder 🌿 Take it easy │
└────────────────────────────────────────────┘

```

### 2.4 Rest / Active Recovery Recommendation — A/B

Triggers（examples, tune via QA）:

monotony7d ≥ 2.0 OR strain7d in personal top 25% (last 28d)

acuteLoad3d ≥ 1.6 ×(28d per-day avg) OR lastHighGap < 1d with earlyStopRate ↑

Caps: ≤2 per week, ≥48h between triggers

**Recommendations**:

Rest（no session） / Active Recovery（15–20m mobility+mindfulness, low MET） / LISS 15m

UI: Banner above SuggestionCard with [Recover Today] [Keep Normal]

Logging: user choice → adjust future thresholds mildly

DoD: Non-blocking; acceptance/decline logged; visible rationale line

**Recovery Suggestion**

```scss
┌ ⚠️ Recovery Suggestion ─────────────────────────────┐
│ Recent load ↑ & monotony high. │
│ → Try Active Recovery (15–20m). │
│ [Recover Today 🌿] [Keep Normal ➡️] │
└─────────────────────────────────────────────────────┘
```

## Phase 3 — AI Suggestion (Default ON, Cached)

### 3.1 OpenAI Rewrite — A

generateSuggestionText(plan, ctx)（energetic, 2–4 sentences, includes reasoning line）

Cache key: sha1(date + planHash + ctxHash)（AsyncStorage/FileSystem）

Files: ai/suggestion.ts, utils/cache.ts

DoD: First <3s / Cache <300ms; fallback to rules text on failure

### 3.2 UI Integration — B

Use AI text if available; else fallback

[Refresh] only when inputs changed → regenerate

DoD: No duplicate calls; dev budget logging

**AI-generated Suggestion**

```sql

┌ Coach Says 🤖🎙️ ───────────────────────────────────┐
│ "Great day for a lighter reset. We'll open hips, │
│ steady your breath, then finish with an easy walk." │
│ Reason: Monotony trending high → add variety. │
└─────────────────────────────────────────────────────┘
```

## Phase 4 — Audio: Neural TTS + Healing Music (with Fallback)

### 4.1 ElevenLabs TTS (Energetic Coach) — A

synthesize(script, voiceId) → mp3

Cache key: (voiceId + hash(script))

File: audio/TTSService.ts

DoD: Offline → device TTS fallback

### 4.2 Mixer & Ducking — B

Expo AV: TrackA = Healing (loop/shuffle, multi-select) / TrackB = Voice

During voice: auto-duck A (~20%), then restore; 2.0s crossfade

BPM tier sync: switch at 90 / 110 / 130 / 150 BPM by intensity

Files: audio/AudioEngine.ts, hooks/useAudioEngine.ts, components/HealingMusicPicker.tsx, /assets/healing/\*

DoD: Seamless loops; no leaks; minimal switch disruption

### 4.3 Conversational Micro-commands (Preset) — A/B

Local intents: Pause / Resume / Skip / Time remaining / Slower / Faster

Responses pre-synthesized & cached; PTT button; music duck integration

Files: audio/VoiceIntents.ts, components/PTTButton.tsx

DoD: ≥95% success; <300ms response（cached）

**Workout Player**

```mathematica

┌ Player ─────────────────────────────────────────────┐
│ 00:12 / 20:00 ▓▓▓▓▓░░░░░░ │
│ Now: Box Breathing (5m) │
│ Voice: 🎧 Neural (ElevenLabs) Music: 🌊 Ocean │
│ Ducking: ON | BPM Tier: 110 → 130 (Next) │
│ │
│ [⏯ Pause] [⏭ Skip] [⏱ Time Left?] [🐢 Slower] [⚡ Faster] │
│ 🎤 PTT: Hold to ask │
└─────────────────────────────────────────────────────┘
```

**Healing Music Picker**

```scss
┌ Healing Tracks ─────────────────────────────────────┐
│ [✓] 🌊 Ocean Calm (loop) [ ] 🎹 Soft Piano │
│ [✓] 🌳 Forest Air (loop) [ ] 🔉 Binaural Lite │
│ Selected: Ocean, Forest (shuffle) │
└─────────────────────────────────────────────────────┘
```

## Phase 5 — AI Comment (Daily Summary, Cached, Fallback)

### 5.1 Metrics & Scheduler — A

Post-log & 21:00 daily（or next launch）aggregation

Supabase: daily_summaries { date, text, metrics }

Files: logic/summaryMetrics.ts, features/dailySummary/storage.ts

DoD: One per day; idempotent

### 5.2 Heuristic Bucket → AI Polish — A

Buckets: Consistency / Comeback / PR / Encouragement

generateDailySummary(ctx) → text（date-cached; fallback to rules）

File: ai/dailySummary.ts

DoD: Uses metrics naturally

### 5.3 UI — B

Coach Note card; 14-day history

Files: features/dailySummary/CoachNote.tsx, features/dailySummary/History.tsx

DoD: No duplicates

**Coach Note (for Today)**

```yaml
┌ Coach Note (Today) ─────────────────────────────────┐
│ Streak: 4 | 7d: 4 sessions / 132 min │
│ "Solid consistency. Light variety kept strain in check." │
│ CTA: [Plan 15m Recovery] [View History] │
└─────────────────────────────────────────────────────┘
```

**History (14 Days)**

```css
┌ History (14d) ──────────────────────────────────────┐
│ • 08/10 20m Monotony↑ → Variety day ✅ │
│ • 08/11 25m Strength PR 💪 │
│ • 08/12 Rest suggested → Accepted 🌿 │
│ • 08/13 30m Cardio LISS 🚶 │
│ ... [More]│
└─────────────────────────────────────────────────────┘
```

## Phase 6 — Settings, Privacy, Budget & Reliability

### 6.1 Settings Completion — B

Toggles: AI Text / Neural Voice / BPM Sync / Two-Choice Card

Also: Voice picker, Music multi-select, Disliked, Equipment

DoD: Persistent; instant effect

### 6.2 Budget Guardrails — A (C QA)

Rate limits: 1 suggestion/day, 1 summary/day（dev override OK）

Dev token meter; exponential backoff; circuit breaker

Files: utils/rateLimit.ts, utils/retry.ts

DoD: <$3/month (typical); controlled under heavier audio

### 6.3 Privacy Note — B

Under toggles: “Sends anonymized aggregates only.”

DoD: Copy approved

**Settings (Extended)**

```nbnet
┌ Settings ───────────────────────────────────────────┐
│ [ON] Use AI Text [ON] Neural Voice │
│ [ON] BPM Sync [ON] Two-Choice Prompt │
│ Voice: Energetic / Calm / Strict │
│ Music: [Ocean] [Forest] [Piano] [Binaural] │
│ Disliked: [Burpees] [HIIT] ... │
│ Equipment: [DB] [Band] [Mat] │
│ i Sends anonymized aggregates only. │
│ $ Budget Meter: ████░ (under $3/mo) │
└─────────────────────────────────────────────────────┘

```

## Phase 7 — QA & Release

### 7.1 iOS End-to-End — B

Flow: Inputs → Suggestion（AI）→ Audio（Voice+Healing+BPM）→ Log → Next-day summary

DoD: Stable duck/restore; 0 crashes

### 7.2 Web Checks — B

Text features OK; audio limitations stated

DoD: No blockers; graceful degradation

### 7.3 Performance & Accessibility — A/B/

First load <3s; re-show <300ms; 60fps; VoiceOver labels

DoD: All pass

**E2E Flow (iOS)**

```css

[Select Focus/Time] → [Suggestion Card+Why] → [AI Text]
↓ ↓
[Two-Choice / Rest Banner] [▶ Start]
↓ ↓
[Player: Voice+Healing+BPM] ←→ [PTT Commands]
↓
[Log Done] → [21:00 Daily Coach Note] → [History]

```

## Task Matrix (Owner → Key Deliverables)

A
store/usePlanStore.ts, logic/selectors.ts（Monotony/Strain 等）
data/exerciseTemplates.json, logic/rankExercises.ts
ai/suggestion.ts, ai/dailySummary.ts
logic/summaryMetrics.ts, utils/{cache,rateLimit,retry}.ts
audio/TTSService.ts, audio/VoiceIntents.ts

B
components/SuggestionCard.tsx, components/EditPlanSheet.tsx, components/TwoChoicePrompt.tsx
audio/AudioEngine.ts, hooks/useAudioEngine.ts, components/HealingMusicPicker.tsx
features/dailySummary/{CoachNote,History}.tsx
screens/SettingsScreen.tsx, consent modal
components/PTTButton.tsx

Healing audio（normalized / loop-safe）, copy refinement, QA scripts, accessibility, test plan

## Branching (Suggested)

feat/env-and-store-A
feat/templates-and-ranking-A
feat/suggestion-ui-B
feat/ai-suggestion-A
feat/tts-service-A
feat/audio-engine-B
feat/music-picker-B
feat/daily-summary-A / feat/daily-summary-B
feat/monotony-strain-A
feat/two-choice-card-B
feat/voice-intents-A / feat/ptt-and-ducking-B
support/assets-healing-B, support/qa-tests-B

## Acceptance Checklist (Condensed)

Ranking: constraints/preferences respected; “Why this?” always on（Monotony/Strain indicator）

Rest/Recovery: triggers/caps working; non-blocking; user choice logged

AI Suggestion: daily cache; fallback OK; first <3s / re <300ms

Audio: ElevenLabs cache; healing loop; stable duck; BPM tier sync OK

Conversational: preset commands ≥95% success; <300ms response

Daily Summary: 1/day; 14-day history; no dupes

Two-Choice Card: threshold-only; ≤1/day; auto-skip works

Settings/Privacy: toggles default ON; wording approved

Budget: <$3/month typical; retries / CB functional

QA: iOS E2E pass; Web degrades gracefully

## Parallel — Task Allocation (Short-term Schedule & Merge Conditions)

### Day 0（Phase 0）— Parallel

A: 0.1 / B: 0.2 / C: assets prep

Gate: toggles/consent/keys OK

### Weeks 1–2（Phases 1–2）— Parallel

A: 1.1 → 2.1 → 2.2（Plan type fixed）

B: 2.3（mock Plan）＋ Two-Choice UI skeleton（hidden,templates & healing assets; basic QA

Gate: Plan type fixed; UI shows why[]; two-choice works under hidden flag

### Weeks 3–4（Phases 3–4–5）— Parallel

A: 3.1（AI+Cache）/ 5.1 / 5.2, 4.1（TTS）

B: 3.2 integration, 4.2（Audio+BPM tiers）, 5.3（Summary UI）,budget/cache/nightly idempotent QA

Gate: Suggestion first <3s / re <300ms; TTS+duck stable; daily summary works

### Weeks 5–6（Final Polish）— Parallel

A: Monotony/Strain/sRPElite integration; reasoning line for AI/rules; VoiceIntents

B: Two-Choice full impl（threshold + 3s skip）; PTT; BPM tier tuning,thresholds/regression/latency/accessibility QA

Gate: Monotony high → ↑ variety suggestions（logs）; Two-Choice only under condition; preset commands ≥95% success

Personality coach（text templates + Voice ID map）＝ optional at end of Weeks 5–6 if time allows.
