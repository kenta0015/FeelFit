# Feel Fit — Emotion & Goal-Aware Fitness Coach

A React Native (Expo) app that proposes the best workout for your time window and focus (Mental / Physical / Both), grounded in MET intensity and enhanced by AI coaching. It builds mental & physical stamina with science-backed guidance while staying lightweight for everyday users.

---

## Features

### 🧠 Mental Wellness

- Emotion-based workout matching (mindfulness, breathing, soothing mobility)
- Mental stamina accrues from low-impact focus work
- Healing audio guidance with calming neural voice and optional background tracks

### 💪 Physical Fitness

- Goal-oriented plans (metabolism, weight loss, toning, stamina, fitness, immune)
- MET-grounded intensity with progression when appropriate
- Motivational coaching with energetic neural voice

### ⚖️ Balanced Sessions

- Combine mental & physical benefits in one plan
- Dual stamina gains; adaptive audio for each block
- Clear “Why this?” line referencing monotony/strain or recovery intent

### 📊 Progress & Insight

- Totals, minutes, completion, streaks
- Training Monotony (7d) & Strain (7d) indicators (MET-based) to prevent overload
- Daily Coach Note history (14 days)

### 🗣️ Audio & Interaction

- Neural TTS (AWS Polly via Lambda Function URL) with cache; device TTS fallback
- Healing Music Picker (multi-select loops) with auto-ducking during voice
- BPM Step Sync: background tracks adapt to intensity tiers (90/110/130/150 BPM)
- Push-to-Talk micro-commands: Pause, Resume, Skip, Time remaining, Slower, Faster

---

## Technology Stack

- **Frontend:** React Native with Expo SDK 52
- **Navigation:** Expo Router (tab architecture)
- **Database:** Supabase (PostgreSQL, RLS)
- **Auth:** Supabase Auth (email/password)
- **AI Text:** OpenAI (suggestions & summaries) with strict caching
- **Audio:** Audio: Expo AV, AWS Polly TTS (Lambda URL) + device fallback
- **Animations:** React Native Reanimated
- **Icons:** lucide-react-native
- **Styling:** React Native StyleSheet

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Supabase project (URL + anon key)
- OpenAI & ElevenLabs API keys

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set environment variables**  
   Create `.env` with:

   ```ini
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_key
   ELEVENLABS_API_KEY=your_elevenlabs_key
   ```

3. **Start development**
   ```bash
   npm run dev
   ```

### Notes

- AI text is cached & rate-limited (1 suggestion/day, 1 summary/day)
- Offline or missing keys → fallback to rule-based text and device TTS

---

## Database Setup

Tables created automatically:

- **users** — Profile & stamina
- **workout_sessions** — Session history (duration, MET, completion)
- **mood_logs** — Post-session mood
- **daily_summaries** — One/day, cached text + metrics

All with Row Level Security (RLS).

---

## App Architecture

### Navigation

```
app/
├─ _layout.tsx
└─ (tabs)/
   ├─ _layout.tsx
   ├─ index.tsx       # Home (plan & suggestion)
   ├─ progress.tsx    # Charts, streaks, monotony/strain
   ├─ stamina.tsx     # Mental/Physical levels & badges
   └─ profile.tsx     # Settings & consent
```

### Components (excerpt)

```
components/
├─ SuggestionCard.tsx      # Plan + “Why this?”
├─ EditPlanSheet.tsx       # Adjust plan
├─ TwoChoicePrompt.tsx     # Quick adjust (harder/easier)
├─ HealingMusicPicker.tsx  # Background music
├─ PTTButton.tsx           # Push-to-Talk
└─ WorkoutTimer.tsx        # Timer + audio engine
```

---

## Data Flow

1. User selects focus (Mental / Physical / Both) + time window
2. Engine ranks exercises (MET × Monotony/Strain × Variety/Progression)
3. AI rewrites plan into coaching text (cached)
4. Workout runs with voice + music (ducked, BPM-synced)
5. Session saved → stamina & metrics updated
6. Daily Coach Note generated at night or next open

---

## Workout Matching & Science

- **MET-based intensity:** per exercise block
- **Training Monotony (7d):** load mean ÷ std (MET-minutes)
- **Training Strain (7d):** monotony × total load
- **Variety:** penalizes repeats when monotony high
- **Progression:** allows overload when metrics support it
- **Two-Choice Quick Adjust:** only on uncertain days → Go harder or Keep light
- **Why this?** always references real metrics (monotony, recovery, or goal fit)

---

## Stamina System

- **Mental stamina:** mindfulness, breathing, mobility
- **Physical stamina:** cardio, strength, endurance (heavier weight on intensity)
- **Levels:** Starter → Beginner → Beginner+ → Intermediate → Advanced → Elite

---

## Audio Coaching

- **Healing (Mental):** calming neural voice, background loops, auto-duck
- **Motivational (Physical):** energetic neural voice, BPM sync
- **Micro-commands:** Push-to-Talk for Pause/Resume/Skip/Time/Slower/Faster

---

## Settings & Privacy

- Toggles (default ON): AI Text, Neural Voice, BPM Sync, Two-Choice Card
- Voice picker, music multi-select, disliked/equipment prefs
- **Privacy:** only anonymized aggregates sent to AI
- **Budget:** caching + rate limits ensure <$3/mo typical use

---

## Development

```bash
npm run dev       # start dev server
npm run test      # run unit tests
npm run build:web # web build
```

---

## Platform Support

- **iOS:** full support, primary target
- **Web:** most text/UI, limited audio (browser constraints)
- **Android:** Expo Dev Client only (not primary)

---

## Contributing

1. Fork repo
2. Create feature branch
3. Implement changes
4. Test thoroughly
5. Submit PR

---

## License

MIT

---

## Support

Open an issue or contact the team.

---

## Dev-only Test Tab Toggle

Hidden by default, controlled by `EXPO_PUBLIC_SHOW_TEST_TAB`.

Enable in dev:

```bash
EXPO_PUBLIC_SHOW_TEST_TAB=1 npx expo start -c
```

Windows (PowerShell):

```powershell
$env:EXPO_PUBLIC_SHOW_TEST_TAB=1; npx expo start -c
```

---
