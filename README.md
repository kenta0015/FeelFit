# Feel Fit — Emotion & Goal-Aware Fitness Coach

A React Native (Expo) app that proposes the best workout for your time window and focus (Mental / Physical / Both), grounded in MET intensity and enhanced by AI coaching. It builds mental & physical stamina with science-flavored guidance that stays lightweight for everyday users.

## Features

### 🧠 Mental Wellness

Emotion-based matching for mindfulness, breathing, soothing mobility.

Mental stamina accrues from low-impact focus work.

Healing audio with calming voice + optional background tracks.

### 💪 Physical Fitness

Goal-oriented plans (metabolism, weight loss, toning, stamina, fitness, immune).

MET-grounded intensity; progression when appropriate.

Motivational coaching with energetic neural voice.

### ⚖️ Balanced Sessions

Combine mental & physical benefits in one plan.

Dual stamina gains; adaptive audio per block.

Clear “Why this?” line referencing monotony/strain or recovery intent.

### 📊 Progress & Insight

Totals, minutes, completion, streaks.

Monotony (7-day) & Strain (7-day) indicators (MET-based) to avoid sameness/overload.

Daily Coach Note history (14 days).

### 🗣️ Audio & Interaction

Neural TTS (ElevenLabs) with local cache; device TTS fallback.

Healing Music Picker (multi-select loops), auto-ducking during voice.

BPM Step Sync: swaps among curated BPM tracks by exercise intensity.

Micro-commands during workouts via Push-to-Talk.

## Highlights (What’s new in this plan)

**AI Suggestion (default ON, cached)**: energetic coaching text in 2–4 sentences, with a one-line “Why this?” reason.

**Ranking engine (on-device)**: MET × time × completion, plus Training Monotony & Strain (MET-based), variety/progression, constraints, dislikes.

**Zero-input signals**: no devices needed. Uses your recent sessions to avoid monotony and overdoing.

**“Two-Choice” quick adjust (only on uncertain days)**: Go harder / Keep it light (auto-dismiss in 3s) to fine-tune today’s plan.

**Audio upgrade**: ElevenLabs neural TTS with cache, healing music picker, auto-ducking, BPM step sync (90/110/130/150).

**Conversational micro-commands**: Push-to-Talk → Pause/Resume/Skip/How long left?/Slower/Faster (sub-300ms with cached replies).

**Daily AI Comment**: once per day summary card with streak/minutes/trends; cached, with rule fallback.

**Budget & privacy**: rate-limited, cached; sends only minimal aggregates to AI; offline fallbacks everywhere.

## Technology Stack

Frontend: React Native with Expo SDK 52

Navigation: Expo Router (tab architecture)

Database: Supabase (PostgreSQL) with RLS

Auth: Supabase Auth (email/password)

AI Text: OpenAI (suggestions & daily summaries) with strict caching

Audio: Expo AV, ElevenLabs TTS (+ device TTS fallback)

Animations: React Native Reanimated

Icons: lucide-react-native

Styling: React Native StyleSheet

## Getting Started

### Prerequisites

Node.js 18+

npm or yarn

Expo CLI

Supabase project (URL + anon key)

OpenAI & ElevenLabs API keys (for AI text & neural voice)

## Installation

### 1.Install dependencies

bash

npm install

### 2.Environment variables

Create .env and set:

ini

EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key

### 3.Start development

bash

npm run dev

### Notes

AI text is cached & rate-limited (1 suggestion/day, 1 summary/day).

If keys are missing or offline → rule-based text + device TTS fallback.

### Database Setup

Tables are created/seeded by the app or migrations:

users — User profile & stamina

workout_sessions — Full session history (duration, intensity/MET, completion)

mood_logs — Post-session mood

daily_summaries — One per day: text + metrics snapshot

All tables use Row Level Security (RLS).

## App Architecture

### Navigation

app/
├─ \_layout.tsx
└─ (tabs)/
├─ \_layout.tsx
├─ index.tsx # Home (plan & suggestion)
├─ progress.tsx # Charts, streaks, monotony/strain
├─ stamina.tsx # Mental/Physical levels & badges
└─ profile.tsx # Settings & consent
Components (excerpt)

components/
├─ SuggestionCard.tsx # Plan + “Why this?”
├─ EditPlanSheet.tsx # Tweak time/intensity/focus
├─ TwoChoicePrompt.tsx # Show only on uncertain days
├─ HealingMusicPicker.tsx # Multi-select background tracks
├─ PTTButton.tsx # Push-to-Talk for commands
└─ WorkoutTimer.tsx # Timer + audio engine hooks

## Data Flow

User selects focus (Mental/Physical/Both) & time window

Engine ranks with MET + Monotony/Strain + Variety/Progression + constraints

AI rewrites to coaching text (cached)

Workout runs with voice + optional healing music (ducked)

Session saved → stamina & metrics update

Nightly (or next open): Daily Coach Note generated (cached)

## Workout Matching & Science

MET-based intensity per exercise block (time-compatible).

Training Monotony (7d): mean(load)/std(load) from daily MET-minutes × completion.

Training Strain (7d): Monotony × sum(load) to bound overall stress.

Variety: penalize repeats when monotony high.

Progression: allow small overload only when recent load & completion support it.

Two-Choice Quick Adjust: on uncertain days only → Go harder or Keep it light → nudges ranking weights.

Why this? surfaces one factual reason (e.g., “Monotony trending high → adding mobility & mindfulness today”).

## Stamina System

**Mental Stamina**
Earned via mindfulness/breathing/mobility.
Formula emphasizes duration & effectiveness, moderates intensity.

**Physical Stamina**
Earned via cardio/strength/endurance.
Formula weights intensity (MET) and duration higher.

**Levels**
Starter (0–24), Beginner (25–49), Beginner+ (50–99),
Intermediate (100–149), Advanced (150–199), Elite (200+)

### Audio Guidance

**Healing (Mental/Mindfulness)**
Calming neural voice (or device TTS fallback)

Background tracks (multi-select), seamless loop

Auto-duck under voice, gentle prompts

**Motivational (Physical/Cardio)**
Energetic neural voice (cached lines)

BPM step sync: swaps among curated BPM tracks per intensity

Micro-commands via Push-to-Talk:
Pause / Resume / Skip / How long left? / Slower / Faster

## Settings & Privacy

Toggles (default ON): Use AI Text, Use Neural Voice, BPM Sync, Two-Choice Prompt

Voice picker, music multi-select, disliked exercises, equipment

Privacy: sends only anonymized aggregates to AI; no raw personal logs

Budget: caching + rate limits target <$3/mo typical usage

## Development

**Scripts**
bash

npm run dev # start
npm run test # unit tests
npm run build:web # web build

**Platform Support**
iOS: primary target, fully supported

Web: text & most UI; mic/background audio may be limited by browser policies

Android: bring-up with Expo Dev Client (not primary for this plan)

**Contributing**
Fork → 2) Feature branch → 3) Implement → 4) Test → 5) PR

**License**
MIT

Support
Open an issue or contact the dev team.

## **Dev-only Test Tab Toggle**

What: the workout(test) tab is hidden by default, controlled by EXPO_PUBLIC_SHOW_TEST_TAB.

Default OFF. Quick enable for a single session:

**Windows (PowerShell)**

powershell

$env:EXPO_PUBLIC_SHOW_TEST_TAB=1; npx expo start -c

**Windows (cmd.exe)**

bat

set EXPO_PUBLIC_SHOW_TEST_TAB=1 && npx expo start -c

**macOS/Linux**

bash

EXPO_PUBLIC_SHOW_TEST_TAB=1 npx expo start -c
Verify: console.log(process.env.EXPO_PUBLIC_SHOW_TEST_TAB) → "1"/"true".

** Optional script:**

json

{
"scripts": {
"dev:test": "EXPO*PUBLIC_SHOW_TEST_TAB=1 expo start -c"
}
}
CI/EAS: keep production with no EXPO_PUBLIC_SHOW_TEST_TAB (stays OFF).
Note: EXPO_PUBLIC*\* vars are client-visible—don’t put secrets there.
