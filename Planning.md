# Fitness App — AI Suggestion, Audio, and AI Comment Plan

This README outlines a **rules-first**, offline-friendly implementation with **optional AI add-ons**.  
Work is split across **Person A (Feature/UI Lead)**, **Person B (Audio/Infra Lead)**, and **Person C (Support/QA/Content)**.

---

## Roles

- **Person A — Feature/UI Lead**
  - R1, R2, R3, R6, R9
  - A1, A3, A4, A5, A6
- **Person B — Audio/Infra Lead**
  - R4, R5
  - A2
- **Person C — Support/QA/Content**
  - Templates, assets, QA, analytics, docs (R2, R3, R4, R5, R6, R7)

---

## Phase R — Rules / Template Based (ship first)

### R1. Shared State & Signals — **Owner: A** (C: QA)

Single source of truth: `mood`, `time`, `intensity`, `goal`, `planMode ('manual'|'ai')`.  
Expose computed signals (streak, week sessions, 7/30d totals, stamina deltas).  
**DoD:** Manual flow unchanged; selectors read/write shared state.

[State]
mood=Calm | time=20 | intensity=Low | goal=Recovery
signals: streak=3, week=2, totalMins7d=85

---

### R2. AI Suggestion (Rules) — **Owner: A** (C: copy/templates)

Deterministic planner → Suggestion Card (no LLM).  
**DoD:** Live updates; [Start] calls existing pipeline; [Edit] opens sheet.

──────────────────────────────────────
🧘 Today’s Mindful Flow
──────────────────────────────────────
Mood: Calm Goal: Recovery
Time: 20 min Intensity: Low
──────────────────────────────────────

Yoga Stretch – 10 min

Box Breathing – 10 min
──────────────────────────────────────
💡 Why this?
Low activity yesterday + Calm mood → restore.
──────────────────────────────────────
[▶ Start Session] [✏ Edit Plan]

──────────────────────────────────────
🏋 Power Push Circuit
──────────────────────────────────────
Mood: Energized Goal: Strength
Time: 30 min Intensity: High
──────────────────────────────────────

Squat Press (12×3)

Push-ups (10×3)

Mountain Climbers (30s×3)
──────────────────────────────────────
💡 Why this?
Physical stamina trending ↑; keep HR on target.
──────────────────────────────────────
[▶ Start Session] [✏ Edit Plan]

---

### R3. Edit Plan Sheet — **Owner: A** (C: QA)

Bottom sheet to tweak time/intensity/focus/swap; writes back to shared state.  
**DoD:** Save updates card; Cancel reverts.

──────── Edit Plan ────────
Time: 20m 25m 30m
Inten: Low Med High
Focus: Mobility Strength Cardio
Swap: [Yoga Stretch] → [Cat-Cow]
[Breathing] → [Body Scan]
───────────────────────────
[Save] [Cancel]

---

### R4. Healing Music (bundled, no AI) — **Owner: B** (C: assets/manifest)

Multi-select loop-safe tracks (Mental/Mindfulness only) with shuffle/loop.  
**DoD:** Select ≥2; persisted in prefs.

──────────────────────────────────────
🎵 Healing Music (Select)
──────────────────────────────────────
[✓] Ocean Calm (loop)
[ ] Soft Piano Night (loop)
[✓] Forest Air (loop)
[ ] Binaural Lite (loop)
──────────────────────────────────────
Selected: Ocean Calm, Forest Air (shuffle)
[Save]

---

### R5. Audio Engine & Voice Scripts (templated) — **Owner: B** (C: QA)

Two players (`voice`, `bgm`) via expo-av; **ducking −12 dB**, **crossfade 2.0s**; device TTS; concise scripts.  
**DoD:** Start/Pause/Resume/Finish stable; no leaks; smoother, less robotic.

──────────────────────────────────────
🔊 Audio Settings (Local)
──────────────────────────────────────
Voice: Mindful Guide (device)
Duck: On (12 dB)
Fade: 2.0 s
Preview: [▶ Test]
──────────────────────────────────────

---

### R6. AI Comment (Rules) — **Owner: A** (C: template lines)

Classify: `consistency | boost | gentle | recovery` → show contextual card + CTAs.  
**DoD:** Correct variant; CTAs prefill next plan.

──────────────────────────────────────
🎯 Consistency Win
──────────────────────────────────────
Streak: 5 days This week: 4 sessions
Total mins: 132 Avg intensity: Medium
Trend: ▂▆▇▅▇
──────────────────────────────────────
“You’re building a solid base—keep it up.”
──────────────────────────────────────
[Plan 15-min Recovery] [Share Win]

──────────────────────────────────────
⚡ Stamina Boost
──────────────────────────────────────
Mental: 62 → 68 (↑ +6)
Physical: 54 → 61 (↑ +7)
──────────────────────────────────────
“Nice lift—physical stamina reached 61.”
──────────────────────────────────────
[Lock 25-min Strength] [View Stats]

---

### R7. Settings / Privacy / Analytics — **Owner: C** (A/B review)

Toggles (off by default): **Neural Voice**, **AI Paraphrase**.  
Analytics events: `plan_viewed`, `plan_started`, `audio_mode_changed`, `comment_shown`, `cta_clicked`.  
**DoD:** Offline-first; events fire once; toggles persisted.

⚙️ Preferences
──────────────────────────────────────
( ) Use Neural Voice (online)
( ) AI Paraphrase (captions/comments)
[ Privacy: Offline-first | Minimal data ]
──────────────────────────────────────

---

## Phase AI — Integrated (opt-in, safe fallbacks)

### A1. Paraphrase Service (captions/comments only) — **Owner: A** (C: prompts)

Tiny LLM rewrite (tone: **Hype/Warm/Mindful**); cache by `(planHash, tone)`.  
**DoD:** ≤60 tokens; <800ms typical; offline → template fallback.

Input facts → “Warm” paraphrase
“Today we restore mobility—you’ll feel lighter.”
[Cache ✓] [Fallback if offline ✓]

---

### A2. Neural TTS (optional) — **Owner: B** (C: QA)

Online neural voices; cache audio per line; fallback to device TTS.  
**DoD:** Noticeably more natural; no break offline.

──────────────────────────────────────
🗣️ Voice Quality
──────────────────────────────────────
(•) Device Voice (offline)
( ) Neural Voice (online, cached)
Tip: Neural sounds more natural.
────────────────────────────────────

---

### A3. Weekly Recap (light LLM) — **Owner: A** (C: review)

100–150-word recap + 3 bullets; cached; offline → rule template.  
**DoD:** Stable tone; token-capped; quick render.

──────────────────────────────────────
📅 Weekly Recap
──────────────────────────────────────
This week you trained 4 times (132 min).
Strength days were consistent; recovery
was light—consider one longer unwind.
• Improve: add 5–10 min mindfulness
• Watch: back-to-back HIIT
• Next: 30-min strength + 15-min unwind
──────────────────────────────────────
[Schedule Next Week]

---

### A4. Adaptive Nudge (bounded adjust) — **Owner: A** (B: audio cue hook)

After the rule plan, AI may suggest a small edit (±5–10m, swap within category).  
Rules validate or ignore; never blocks start.  
**DoD:** Logged `nudge_applied`.

Nudge: “Reduce today by 5 min (sleep low)”
[Apply] [Ignore] (rules-validated)

---

### A5. Natural Language Intents (small scope) — **Owner: A** (C: fallback chips)

Parse “Plan a 20-min unwind tonight” → map to filters.  
Low confidence → show chips.  
**DoD:** Zero dead ends.

Plan a 20-min unwind”
→ Mood: Calm | Time: 20 | Focus: Mobility
[Start] [Edit]

---

### A6. “Why this?” Explainer (LLM polish) — **Owner: A** (C: prompts)

Turn signals into a transparent one-liner; cache; offline → template.  
**DoD:** Human, concise, never blocking.

💡 Why this?
“Calm mood + two HIIT days → restore mobility today.”

---

## Task Matrix (Owner → Deliverables)

| Task                          | Owner           | Key Deliverables                                                          |
| ----------------------------- | --------------- | ------------------------------------------------------------------------- |
| R1 Shared State & Signals     | A               | `useWorkoutPlanStore.ts` / context, computed selectors                    |
| R2 AI Suggestion (Rules)      | A (C templates) | `components/SuggestionCard.tsx`, templates JSON                           |
| R3 Edit Plan Sheet            | A (C QA)        | `components/EditPlanSheet.tsx`                                            |
| R4 Healing Music              | B (C assets)    | `components/HealingMusicPicker.tsx`, `/assets/healing/*`, `manifest.json` |
| R5 Audio Engine & Scripts     | B (C QA)        | `audio/AudioEngine.ts`, `useAudioEngine.ts`, device TTS scripts           |
| R6 AI Comment (Rules)         | A (C templates) | `logic/commentRules.ts`, `components/AICommentCard.tsx`                   |
| R7 Settings/Privacy/Analytics | C (A/B review)  | `utils/analytics.ts`, toggles UI, docs                                    |
| A1 Paraphrase Service         | A (C prompts)   | `ai/paraphrase.ts`, cache                                                 |
| A2 Neural TTS                 | B (C QA)        | `audio/TTSService.ts`, cache, toggle UI                                   |
| A3 Weekly Recap               | A (C review)    | `features/recap/WeeklyRecap.tsx`                                          |
| A4 Adaptive Nudge             | A (B hook)      | `logic/nudgeRules.ts`, UI apply/ignore                                    |
| A5 NL Intents                 | A (C chips)     | `ai/intent.ts`, fallback chips                                            |
| A6 “Why this?” (LLM)          | A (C prompts)   | `ai/whyThis.ts`                                                           |

---

## Branch & PR Guidelines

- Branches:  
  `feat/ui-suggestion-A`, `feat/edit-sheet-A`, `feat/audio-engine-B`, `feat/tts-service-B`,  
  `feat/ai-comment-A`, `support/assets-C`, `support/analytics-C`
- PR checklist:
  - No regression in manual flow
  - Offline OK (device TTS)
  - 60fps during playback; no audio leaks
  - Analytics events correct (once per action)
  - Screenshots/GIF + DoD ticked

---

## Privacy & Defaults

- **Offline-first** by default (no AI required).
- AI toggles are **opt-in**.
- Only minimal aggregates are sent to AI (counts/averages/streak), never raw personal logs.

---

# Fitness App — AI Suggestion, Audio, and AI Comment Plan

This README outlines a **rules-first**, offline-friendly implementation with **optional AI add-ons**.  
Work is split across **Person A (Feature/UI Lead)**, **Person B (Audio/Infra Lead)**, and **Person C (Support/QA/Content)**.

---

## Roles

- **Person A — Feature/UI Lead**
  - R1, R2, R3, R6, R9
  - A1, A3, A4, A5, A6
- **Person B — Audio/Infra Lead**
  - R4, R5
  - A2
- **Person C — Support/QA/Content**
  - Templates, assets, QA, analytics, docs (R2, R3, R4, R5, R6, R7)

---

## Phase R — Rules / Template Based (ship first)

### R1. Shared State & Signals — **Owner: A** (C: QA)

Single source of truth: `mood`, `time`, `intensity`, `goal`, `planMode ('manual'|'ai')`.  
Expose computed signals (streak, week sessions, 7/30d totals, stamina deltas).  
**DoD:** Manual flow unchanged; selectors read/write shared state.

[State]
mood=Calm | time=20 | intensity=Low | goal=Recovery
signals: streak=3, week=2, totalMins7d=85

yaml
コピーする
編集する

---

### R2. AI Suggestion (Rules) — **Owner: A** (C: copy/templates)

Deterministic planner → Suggestion Card (no LLM).  
**DoD:** Live updates; [Start] calls existing pipeline; [Edit] opens sheet.

──────────────────────────────────────
🧘 Today’s Mindful Flow
──────────────────────────────────────
Mood: Calm Goal: Recovery
Time: 20 min Intensity: Low
──────────────────────────────────────

Yoga Stretch – 10 min

Box Breathing – 10 min
──────────────────────────────────────
💡 Why this?
Low activity yesterday + Calm mood → restore.
──────────────────────────────────────
[▶ Start Session] [✏ Edit Plan]

コピーする
編集する
──────────────────────────────────────
🏋 Power Push Circuit
──────────────────────────────────────
Mood: Energized Goal: Strength
Time: 30 min Intensity: High
──────────────────────────────────────

Squat Press (12×3)

Push-ups (10×3)

Mountain Climbers (30s×3)
──────────────────────────────────────
💡 Why this?
Physical stamina trending ↑; keep HR on target.
──────────────────────────────────────
[▶ Start Session] [✏ Edit Plan]

yaml
コピーする
編集する

---

### R3. Edit Plan Sheet — **Owner: A** (C: QA)

Bottom sheet to tweak time/intensity/focus/swap; writes back to shared state.  
**DoD:** Save updates card; Cancel reverts.

──────── Edit Plan ────────
Time: 20m 25m 30m
Inten: Low Med High
Focus: Mobility Strength Cardio
Swap: [Yoga Stretch] → [Cat-Cow]
[Breathing] → [Body Scan]
───────────────────────────
[Save] [Cancel]

yaml
コピーする
編集する

---

### R4. Healing Music (bundled, no AI) — **Owner: B** (C: assets/manifest)

Multi-select loop-safe tracks (Mental/Mindfulness only) with shuffle/loop.  
**DoD:** Select ≥2; persisted in prefs.

──────────────────────────────────────
🎵 Healing Music (Select)
──────────────────────────────────────
[✓] Ocean Calm (loop)
[ ] Soft Piano Night (loop)
[✓] Forest Air (loop)
[ ] Binaural Lite (loop)
──────────────────────────────────────
Selected: Ocean Calm, Forest Air (shuffle)
[Save]

yaml
コピーする
編集する

---

### R5. Audio Engine & Voice Scripts (templated) — **Owner: B** (C: QA)

Two players (`voice`, `bgm`) via expo-av; **ducking −12 dB**, **crossfade 2.0s**; device TTS; concise scripts.  
**DoD:** Start/Pause/Resume/Finish stable; no leaks; smoother, less robotic.

──────────────────────────────────────
🔊 Audio Settings (Local)
──────────────────────────────────────
Voice: Mindful Guide (device)
Duck: On (12 dB)
Fade: 2.0 s
Preview: [▶ Test]
──────────────────────────────────────

yaml
コピーする
編集する

---

### R6. AI Comment (Rules) — **Owner: A** (C: template lines)

Classify: `consistency | boost | gentle | recovery` → show contextual card + CTAs.  
**DoD:** Correct variant; CTAs prefill next plan.

──────────────────────────────────────
🎯 Consistency Win
──────────────────────────────────────
Streak: 5 days This week: 4 sessions
Total mins: 132 Avg intensity: Medium
Trend: ▂▆▇▅▇
──────────────────────────────────────
“You’re building a solid base—keep it up.”
──────────────────────────────────────
[Plan 15-min Recovery] [Share Win]

コピーする
編集する
──────────────────────────────────────
⚡ Stamina Boost
──────────────────────────────────────
Mental: 62 → 68 (↑ +6)
Physical: 54 → 61 (↑ +7)
──────────────────────────────────────
“Nice lift—physical stamina reached 61.”
──────────────────────────────────────
[Lock 25-min Strength] [View Stats]

yaml
コピーする
編集する

---

### R7. Settings / Privacy / Analytics — **Owner: C** (A/B review)

Toggles (off by default): **Neural Voice**, **AI Paraphrase**.  
Analytics events: `plan_viewed`, `plan_started`, `audio_mode_changed`, `comment_shown`, `cta_clicked`.  
**DoD:** Offline-first; events fire once; toggles persisted.

──────────────────────────────────────
⚙️ Preferences
──────────────────────────────────────
( ) Use Neural Voice (online)
( ) AI Paraphrase (captions/comments)
[ Privacy: Offline-first | Minimal data ]
──────────────────────────────────────

yaml
コピーする
編集する

---

## Phase AI — Integrated (opt-in, safe fallbacks)

### A1. Paraphrase Service (captions/comments only) — **Owner: A** (C: prompts)

Tiny LLM rewrite (tone: **Hype/Warm/Mindful**); cache by `(planHash, tone)`.  
**DoD:** ≤60 tokens; <800ms typical; offline → template fallback.

Input facts → “Warm” paraphrase
“Today we restore mobility—you’ll feel lighter.”
[Cache ✓] [Fallback if offline ✓]

yaml
コピーする
編集する

---

### A2. Neural TTS (optional) — **Owner: B** (C: QA)

Online neural voices; cache audio per line; fallback to device TTS.  
**DoD:** Noticeably more natural; no break offline.

──────────────────────────────────────
🗣️ Voice Quality
──────────────────────────────────────
(•) Device Voice (offline)
( ) Neural Voice (online, cached)
Tip: Neural sounds more natural.
──────────────────────────────────────

yaml
コピーする
編集する

---

### A3. Weekly Recap (light LLM) — **Owner: A** (C: review)

100–150-word recap + 3 bullets; cached; offline → rule template.  
**DoD:** Stable tone; token-capped; quick render.

──────────────────────────────────────
📅 Weekly Recap
──────────────────────────────────────
This week you trained 4 times (132 min).
Strength days were consistent; recovery
was light—consider one longer unwind.
• Improve: add 5–10 min mindfulness
• Watch: back-to-back HIIT
• Next: 30-min strength + 15-min unwind
──────────────────────────────────────
[Schedule Next Week]

yaml
コピーする
編集する

---

### A4. Adaptive Nudge (bounded adjust) — **Owner: A** (B: audio cue hook)

After the rule plan, AI may suggest a small edit (±5–10m, swap within category).  
Rules validate or ignore; never blocks start.  
**DoD:** Logged `nudge_applied`.

Nudge: “Reduce today by 5 min (sleep low)”
[Apply] [Ignore] (rules-validated)

yaml
コピーする
編集する

---

### A5. Natural Language Intents (small scope) — **Owner: A** (C: fallback chips)

Parse “Plan a 20-min unwind tonight” → map to filters.  
Low confidence → show chips.  
**DoD:** Zero dead ends.

“Plan a 20-min unwind”
→ Mood: Calm | Time: 20 | Focus: Mobility
[Start] [Edit]

yaml
コピーする
編集する

---

### A6. “Why this?” Explainer (LLM polish) — **Owner: A** (C: prompts)

Turn signals into a transparent one-liner; cache; offline → template.  
**DoD:** Human, concise, never blocking.

💡 Why this?
“Calm mood + two HIIT days → restore mobility today.”

yaml
コピーする
編集する

---

## Task Matrix (Owner → Deliverables)

| Task                          | Owner           | Key Deliverables                                                          |
| ----------------------------- | --------------- | ------------------------------------------------------------------------- |
| R1 Shared State & Signals     | A               | `useWorkoutPlanStore.ts` / context, computed selectors                    |
| R2 AI Suggestion (Rules)      | A (C templates) | `components/SuggestionCard.tsx`, templates JSON                           |
| R3 Edit Plan Sheet            | A (C QA)        | `components/EditPlanSheet.tsx`                                            |
| R4 Healing Music              | B (C assets)    | `components/HealingMusicPicker.tsx`, `/assets/healing/*`, `manifest.json` |
| R5 Audio Engine & Scripts     | B (C QA)        | `audio/AudioEngine.ts`, `useAudioEngine.ts`, device TTS scripts           |
| R6 AI Comment (Rules)         | A (C templates) | `logic/commentRules.ts`, `components/AICommentCard.tsx`                   |
| R7 Settings/Privacy/Analytics | C (A/B review)  | `utils/analytics.ts`, toggles UI, docs                                    |
| A1 Paraphrase Service         | A (C prompts)   | `ai/paraphrase.ts`, cache                                                 |
| A2 Neural TTS                 | B (C QA)        | `audio/TTSService.ts`, cache, toggle UI                                   |
| A3 Weekly Recap               | A (C review)    | `features/recap/WeeklyRecap.tsx`                                          |
| A4 Adaptive Nudge             | A (B hook)      | `logic/nudgeRules.ts`, UI apply/ignore                                    |
| A5 NL Intents                 | A (C chips)     | `ai/intent.ts`, fallback chips                                            |
| A6 “Why this?” (LLM)          | A (C prompts)   | `ai/whyThis.ts`                                                           |

---

## Branch & PR Guidelines

- Branches:  
  `feat/ui-suggestion-A`, `feat/edit-sheet-A`, `feat/audio-engine-B`, `feat/tts-service-B`,  
  `feat/ai-comment-A`, `support/assets-C`, `support/analytics-C`
- PR checklist:
  - No regression in manual flow
  - Offline OK (device TTS)
  - 60fps during playback; no audio leaks
  - Analytics events correct (once per action)
  - Screenshots/GIF + DoD ticked

---

## Privacy & Defaults

- **Offline-first** by default (no AI required).
- AI toggles are **opt-in**.
- Only minimal aggregates are sent to AI (counts/averages/streak), never raw personal logs.

---
