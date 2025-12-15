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

# Phase 2 — Ranking Engine (On-device, Deterministic)

## Shared decisions (lock these)

- **Time buckets**: `10 / 15 / 20 / 30` minutes (fixed).
- **Completion % (default)**: `0.9` (90%).
- **Uncertain day (Two-Choice trigger)**: `readiness < 40`.
- **Determinism**: Same `ctx` ⇒ same output; ties broken by **`id` ascending**.
- **Language**: `why[]` is **English** for now.

---

## 2.1 Exercise Templates — A

**File**: `data/exerciseTemplates.json`  
**Purpose**: Single source of truth for ranking (no hard-coded exercises elsewhere).

**Each template must include (required):**

- `id` (string, unique, stable)
- `title` (string)
- `focus` (`"mental" | "physical" | "both"`)
- `intensity` (`"low" | "med" | "high"`)
- `equipment` (string[]; e.g., `"mat"`, `"db"`, `"band"`, `"none"`)
- `recoveryFit` (0–1, higher = better for recovery)
- `met` (number; metabolic equivalent)
- `category` (`"mobility" | "core" | "cardio" | "strength" | "mindfulness" | "recovery"`)
- `duration` (minutes; integer)

**DoD**

- ≥ **12 distinct types** covering mobility / core / cardio / strength / mindfulness.
- IDs unique; fields complete; values consistent with time buckets.
- This file becomes the **only** exercise catalogue used in 2.2.

---

## 2.2 Scoring & Plan Builder — A

**File**: `logic/rankExercises.ts`

### Inputs (`ctx`)

From `usePlanStore`:

- **User inputs**: `focus`, `emotion`, `timeAvailable`, `intensityPref`, `equipment[]`, `constraints`, `disliked[]`
- **Signals** (read-only): `streak`, `sessions7d`, `minutes7d`, `recentIntensityAvg`, `mentalΔ`, `physicalΔ`, `acuteLoad3d`, `monotony7d`, `strain7d`, `sRPElite7d`, `earlyStopRate`, `skipCount`, `lastHighGap`

### Ranking

- **Function**: `rankExercises(ctx) → Ranked[]`
- **Base score**: `MET × duration × completionPct` (use **0.9** by default).
- **Zero-input modifiers (weights)**: adjust score using:
  - `monotony7d` (higher monotony → **boost variety / de-emphasize repeats**)
  - `strain7d` (higher strain → **de-emphasize high intensity**)
  - `acuteLoad3d` (spikes → **de-emphasize total load**)
  - `sRPElite7d` (sustained high → **slight de-emphasis**)
- **Constraints & dislikes**:
  - Prefer **exclusion**: drop items that violate `constraints` or appear in `disliked`.
  - Fallback: if zero candidates, allow soft penalties instead of exclusion (but note in `why[]`).
- **Determinism**: after scoring, **stable sort by score desc, then `id` asc**.

### Plan building

- **Function**: `buildPlan(ranked) → { title, blocks, totalTime, why[] }`
  - Fill with top ranked blocks **without exceeding** `timeAvailable`.
  - `title`: short synthesized name (e.g., “Mindful Mobility + Light Cardio (20m)”).
  - `why[]`: must include a **Monotony/Strain** reasoning line derived from signals.
- **Fallback if no candidates**: return a safe default (e.g., 10–15m low-MET mindfulness/mobility).

**DoD**

- Deterministic outputs.
- `why[]` present and understandable (English).
- Respects constraints/dislikes; never exceeds `timeAvailable`.

---

## 2.3 Suggestion Card UI — B

**Files**:

- `components/SuggestionCard.tsx` (main card)
- `components/EditPlanSheet.tsx` (tweak time/intensity, simple swaps)
- `components/TwoChoicePrompt.tsx` (“Push harder / Take it easy”, auto-skip in 3s)

**Card displays**

- **Title** / **Blocks** (with minutes/MET) / **Total Time** / **“Why this?”** (must include Monotony/Strain note)

**Actions**

- `[Start]` start with current plan
- `[Edit]` open sheet for small adjustments (time, intensity, category swaps)
- `[Refresh]` recompute only when `ctx` changed (preserve determinism)

**Two-Choice Prompt**

- Shown **only when** `readiness < 40`
- Choices apply a **temporary ranking bias** for this session only:
  - **Push harder**: modest +intensity weighting
  - **Take it easy**: modest −intensity / +recovery weighting
- Auto-dismiss after 3s (defaults to no bias).

**Data contract (from 2.2 → 2.3)**

- **Plan DTO**:
  - `title: string`
  - `blocks: { id: string; title: string; duration: number; met: number; intensity: 'low'|'med'|'high'; category: string }[]`
  - `totalTime: number`
  - `why: string[]`
- **UI props**:
  - `plan: Plan`
  - `isUncertainDay: boolean` (derived from `readiness < 40`)
  - `onStart(plan)`, `onEdit(plan)`, `onRefresh()`

**DoD**

- Renders from Plan DTO with live updates.
- Two-Choice shows **only** when `isUncertainDay` is true.
- Refresh reuses determinism (no unnecessary recompute).

---

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

## 2.4 Rest / Active Recovery Recommendation — A/B

**Triggers** (tune with QA; any one is enough):

- `monotony7d ≥ 2.0` **OR** `strain7d` in personal **top 25%** (last 28d)
- `acuteLoad3d ≥ 1.6 ×` (28d daily avg) **OR** `lastHighGap < 1d` with `earlyStopRate` elevated

**Caps**

- ≤ **2 per week**, and **≥ 48h** between triggers.

**Recommendation options**

- **Rest** (no session)
- **Active Recovery** (15–20m, mobility + mindfulness, low MET)
- **LISS 15m**

**UI**

- Banner above SuggestionCard:
  - Text: concise rationale (e.g., “Recent load ↑ & monotony high → consider active recovery”)
  - Actions: `[Recover Today 🌿]` / `[Keep Normal ➡️]`

**Logging**

- Record user choice; later use to nudge thresholds.

**DoD**

- Non-blocking; clear rationale shown.
- Acceptance/decline is logged; no unexpected plan overrides.

**Recovery Suggestion**

```scss
┌ ⚠️ Recovery Suggestion ─────────────────────────────┐
│ Recent load ↑ & monotony high. │
│ → Try Active Recovery (15–20m). │
│ [Recover Today 🌿] [Keep Normal ➡️] │
└─────────────────────────────────────────────────────┘
```

---

## Handoff checklist

1. **2.1** Create `data/exerciseTemplates.json` with ≥12 items and required fields above.
2. **2.2** Implement `rankExercises(ctx)` and `buildPlan(ranked)` with the contracts and thresholds here.
3. **2.3** Consume the **Plan DTO**; show Two-Choice when `isUncertainDay` (readiness < 40); wire Start/Edit/Refresh.
4. **2.4** Add the recovery banner logic with the stated triggers, caps, options, and logging.

**Acceptance tests**

- Same `ctx` → identical ranking & plan.
- No plan exceeds `timeAvailable`.
- Constraints/dislikes are honored.
- `why[]` always includes a Monotony/Strain line.
- Two-Choice appears only when readiness < 40.
- Recovery banner appears only under trigger/cap rules.

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

## Status – Phase 4.3 (Completed)

- Micro commands: Pause / Resume / Skip / Time / Slower / Faster wired.
- Auto ducking on TTS (WebAudio + GainNode). Restore after speech.
- Mixer is global singleton; state sync across screens.
- `bpmTier` sync (UI tier only; no realtime time-stretch yet).
- Dev tabs lazy; update-depth loop fixed. TTS falls back to Web Speech if ElevenLabs error.

### Verification

- /dev/mixer-test: SET TRACKS → PLAY → VOICE START/END → Tier 90/110/130/150 updates `bpmTier`.
- /dev/micro-test: each press speaks + duck→restore; Slower/Faster/Tempo buttons update `bpmTier`.
- /dev/interval-timer-test: Pause/Resume/Skip/Time reflect and speak with ducking.

### Known Limitations (carry to next phase)

- `bpmTier` is a display/control tier only; actual tempo/time-stretch is not applied yet.

### Next (Phase 4.4 – proposals)

1. Implement realtime tempo change (AudioWorklet + WSOLA/time-stretch).
2. Speech queue + eased duck transitions.
3. Persist TTS cache (IndexedDB).

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

# Phase 8 — Weekly Time Budget Planner (Draft)

## 0) Goal (User Value)

- User sets **weekly total time** or **days × time slots**.
- Defines **purpose** (health, weight loss, endurance, etc.).
- System proposes **optimized exercise plans** within those slots.
- Includes **rest day suggestions** and **automatic weekly reset** (with light feedback).
- **User does not need to choose “physical/mental/both”** — the system balances it automatically in the background.

---

## 1) User Flow

1. **Setup**

   - Input: weekly minutes OR day × time slots
   - Purpose: 4–6 options (health / weight loss / endurance …)
   - Can be changed anytime

2. **Home**

   - Header: _“This week: 45/90 min • 1 slot left”_
   - Daily slot card: shows Today’s Plan (existing card format)
   - If readiness low → rest/light session suggestion

3. **Unfinished Slots (Hybrid Handling)**

   - Step 1: Auto-slide to next day
   - Step 2: If still undone → auto-shorten (10–15 min version)
   - No hard carry-over beyond the week

4. **Weekend**

   - Automatic reset (no carry-over)
   - Feedback: stamina gauge drop or friendly comment
   - Next week proposal: Keep / -15m / +15m

5. **Notifications**
   - Weekly reminder only (“Let’s set your week”)

---

## 2) UI Elements

- **Settings Screen**

  - Weekly Time slider OR day/time picker
  - Purpose selector (short, 1-line descriptions)

- **Home Header**

  - Weekly progress bar (e.g., 45/90 min) + 1-line comment

- **Daily Slots**

  - Cards with session content, rest banner, completion check

- **End-of-Week Review**
  - _“You did 60/90 min. Great! Keep 90m or try 75m next week?”_
  - Buttons: Keep / -15m / +15m

---

## 3) Behavior Rules

- Plan assumes **80% of user’s declared time** (buffer for real life).
- **Hybrid unfinished handling** (slide → shorten).
- **Rest suggestions** are non-blocking, shown with rationale (max 2/week, ≥48h apart).
- **Weekly reset** always applies (no guilt carry-over).
- **Daily content** auto-balances _physical / mental / both_ in the background — hidden from user.

---

## 4) Definition of Done

- Same week & same input context ⇒ identical plan (deterministic).
- Daily suggestions **never exceed allocated time**.
- Unfinished slots always resolved (slide/shorten).
- Rest suggestions appear within caps (≤2/week, 48h apart).
- Weekly reset with light feedback (gauge or comment).
- Notifications only at week start.

---

## 5) KPI (Success Metrics)

1. **Weekly minutes achieved**: +25 min
2. **Time-to-start**: -20%
3. **Rest suggestion acceptance rate**: ≥20%

---

## 6) Risks & Mitigations

- **Accumulation overload** → hybrid handling (slide then shorten) + weekly reset.
- **Complex setup** → limit inputs to 2 choices (minutes OR slots).
- **Too many purposes** → keep at 4–6, simple wording.
- **User confusion about physical/mental** → hidden balancing done automatically.

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

# Extra Steps — Stamina Decay, Skip Reason, Anchor Time

---

## 0) Shared Notes

- Runs **on-device only** (no server required).
- Uses existing Zustand store + AsyncStorage/Supabase where noted.
- Timezone: device local.
- Daily tasks run at **21:00**; if the app wasn’t open then, they **catch up on next launch**.

---

## 1) Daily Stamina Decay (Detraining)

**Goal**: When the user skips days, gradually decrease **Physical** and **Mental** stamina.

### Parameters (locked)

- **Physical decay**: **3.5%/day** → multiplier `0.965^D`
- **Mental decay**: **2.5%/day** → multiplier `0.975^D`
- Lower bound: **0 allowed** (can reach zero).
- Execution time: **21:00 daily** + **catch-up at app launch**.
- No UI alerts by default.

### Data needed

- `lastCompletedAt` (ISO string) — last finished workout date/time.
- `lastDecayRun` (ISO date) — last day decay was applied.
- `physicalStamina`, `mentalStamina` (numbers).

### Logic (high level)

1. Compute **inactivity days** `D` since the day _after_ `lastCompletedAt`.
2. If `D <= 0` or already applied today (`lastDecayRun == today`): **do nothing**.
3. Apply:
   - `physicalStamina = floor(physicalStamina * 0.965^D)`
   - `mentalStamina   = floor(mentalStamina   * 0.975^D)`
4. Persist updated stamina.
5. Set `lastDecayRun = today`.

### Acceptance

- Skipping 7/14/30 days yields roughly:
  - Physical ≈ 77.9% / 60.7% / 34.3%
  - Mental ≈ 83.8% / 70.2% / 46.8%
- Running multiple times/day doesn’t double-apply.
- Works after cold start (catch-up).

### Edge cases

- No prior workouts: skip decay (stamina stays at current value).
- System time changes: rely on **dates**, not seconds; clamp `D ≥ 0`.
- Large gaps (e.g., 100+ days): apply once using the exponent.

---

## 2) Skip Reason (Optional, One-Tap)

**Goal**: Capture _why_ a session was skipped—analytics + softer UX. **No effect** on decay or ranking.

### UI

- When user dismisses/ignores a plan (or exits workout early), show a **1-tap chip row**:
  - `Busy`, `Fatigue`, `Sick`, `Travel`, `No Time`, `Other`
- **Dismiss is fine**; no forced answer.

### Data

- `skipEvents` list (append-only):
  - `{ id, date, reason, context? }`
  - `reason ∈ {busy, fatigue, sick, travel, time, other}`

### Behavior

- Record and store locally (and Supabase if available) for later insights.
- May show a **gentle banner** next day: “Yesterday: _Busy_. Try a 5–7 min micro-plan?”

### Acceptance

- Logging works even offline.
- No impact on scoring/decay.
- Not shown during an ongoing workout.

---

## 3) Anchor Time (Time Anchor)

**Goal**: Let the user choose a **daily preferred time** to train. Reduce friction by suggesting a small plan if they miss it.

### UX

- **Settings**: pick one anchor time (e.g., `21:10`). Toggle on/off.
- **If missed** (no session within ±60 min of anchor):
  - Next app open: show a **micro-plan CTA (5–10 min)**: “Missed your anchor. Start a quick reset?”
- **No notifications requirement**; purely in-app. (Push can be added later.)

### Data

- `anchorEnabled` (bool), `anchorTime` (HH:mm)
- `lastAnchorCheck` (ISO date) to avoid duplicate prompts per day.

### Logic

1. If `anchorEnabled`:
   - On app open or at 21:00 runner, check if today has a completed session within `[anchorTime − 60m, anchorTime + 60m]`.
   - If **not**, and not already prompted today:
     - Show **micro-plan CTA** (breathing + mobility 5–10m).
     - Set `lastAnchorCheck = today`.
2. CTA is light—dismiss is OK.

### Acceptance

- Anchor disabled → no prompts.
- Only **one** prompt/day.
- Micro-plan starts immediately when accepted.

---

## Implementation Order (suggested)

1. **Anchor Time** (UI + simple check) — smallest surface, fast value.
2. **Skip Reason** (chips + logging) — UI-only, no algorithm dependencies.
3. **Stamina Decay** — pure logic + storage; validate with a few test dates.

---

## Minimal QA Checklist

- Decay:
  - Set fake `lastCompletedAt` 7/14/30 days ago → stamina matches expected ranges.
  - Multiple runs same day → no extra decay.
- Skip Reason:
  - Tapping a chip creates a `skipEvents` record.
  - No chip shown during active workouts.
- Anchor Time:
  - Set an anchor, miss it, reopen app → see micro-plan CTA once.
  - Turning anchor off → no CTA.

---

## Notes for Devs

- Keep constants (decay rates, anchor window) in a single `constants.ts`.
- All features are **non-blocking** and **opt-in** (Anchor).
- Avoid intrusive prompts; keep a friendly tone.
