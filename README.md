# Feel Fit - Emotion-Based Fitness App

A React Native Expo app that matches workouts to your current emotional state and physical goals, helping you build both mental and physical stamina through personalized exercise recommendations.

## Features

### 🧠 Mental Wellness

- **Emotion-based workout matching** - Select how you're feeling and get exercises designed to improve that emotional state
- **Mental stamina tracking** - Build points through mindfulness, breathing, and gentle exercises
- **Healing audio guidance** - Soothing voice coaching for mental wellness workouts

### 💪 Physical Fitness

- **Goal-oriented workouts** - Choose from metabolism, weight loss, toning, stamina, fitness, or immune system goals
- **Physical stamina tracking** - Earn points through cardio, strength, and endurance exercises
- **Motivational audio coaching** - Energizing voice guidance to push through physical challenges

### ⚖️ Balanced Approach

- **Mind-body workouts** - Exercises that combine mental wellness with physical fitness
- **Dual stamina building** - Gain both mental and physical stamina in balanced sessions
- **Adaptive audio** - Healing or motivational coaching based on exercise type

### 📊 Progress Tracking

- **Comprehensive analytics** - Track total workouts, minutes exercised, and completion rates
- **Mood logging** - Rate your post-workout mood to track emotional improvements
- **Achievement system** - Unlock badges for reaching stamina milestones
- **Weekly streaks** - Monitor your consistency and build healthy habits

## Technology Stack

- **Frontend**: React Native with Expo SDK 52
- **Navigation**: Expo Router with tab-based architecture
- **Database**: Supabase with PostgreSQL
- **Authentication**: Supabase Auth (email/password)
- **Audio**: Expo Speech for workout guidance
- **Animations**: React Native Reanimated
- **Icons**: Lucide React Native
- **Styling**: React Native StyleSheet

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. **Clone and install dependencies**

   ```bash
   npm install
   ```

2. **Set up Supabase**

   - Click "Connect to Supabase" in the top right corner of the development environment
   - Or manually create a Supabase project and add environment variables:
     ```
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

### Database Setup

The app automatically creates the required database tables:

- **users** - User profiles with stamina tracking
- **workout_sessions** - Complete workout history
- **mood_logs** - Post-workout mood ratings

All tables include Row Level Security (RLS) policies for data protection.

## App Architecture

### Navigation Structure

```
app/
├── _layout.tsx              # Root layout with authentication
├── (tabs)/
│   ├── _layout.tsx          # Tab navigation setup
│   ├── index.tsx            # Home - workout selection flow
│   ├── progress.tsx         # Progress tracking and history
│   ├── stamina.tsx          # Stamina levels and achievements
│   └── profile.tsx          # User settings and preferences
```

### Component Organization

```
components/
├── AuthScreen.tsx           # Login/signup interface
├── ImprovementTypeSelector.tsx  # Mental/Physical/Both selection
├── EmotionSelector.tsx      # Emotion selection for mental workouts
├── PhysicalPurposeSelector.tsx  # Goal selection for physical workouts
├── TimeSelector.tsx         # Available time selection
├── WorkoutList.tsx          # Recommended workout display
├── WorkoutTimer.tsx         # Exercise execution with audio
├── MoodRating.tsx           # Post-workout mood logging
└── AnimatedStaminaIndicator.tsx # Animated stamina visualization
```

### Data Flow

1. **User selects improvement type** (mental/physical/both)
2. **Chooses specific emotion or physical goal**
3. **Sets available time** (5-30 minutes)
4. **Gets personalized workout recommendations** based on effectiveness scores
5. **Executes workout** with audio guidance and timer
6. **Logs mood rating** and automatically gains stamina points
7. **Tracks progress** across all sessions

## Workout Matching Algorithm

The app uses a sophisticated matching system:

### Mental Workouts

- **Effectiveness scores** for each emotion (1-10 scale)
- **Time compatibility** checking
- **Audio type** (healing voice guidance)

### Physical Workouts

- **Purpose effectiveness** for fitness goals (1-10 scale)
- **Intensity levels** (MET values)
- **Audio type** (motivational coaching)

### Balanced Workouts

- **Combined scoring** for both mental and physical benefits
- **Dual stamina gains** from single sessions
- **Adaptive audio** based on exercise focus

## Stamina System

### Mental Stamina

- Gained through mindfulness, breathing, and gentle exercises
- Calculated based on: `duration + intensity + effectiveness + completion%`
- Unlocks mental wellness achievements

### Physical Stamina

- Gained through cardio, strength, and endurance workouts
- Higher weight on intensity and duration for physical gains
- Unlocks fitness achievements

### Levels

- **Starter** (0-24 points)
- **Beginner** (25-49 points)
- **Beginner+** (50-99 points)
- **Intermediate** (100-149 points)
- **Advanced** (150-199 points)
- **Elite** (200+ points)

## Audio Guidance

### Healing Voice (Mental/Mindfulness)

- Slower speech rate (0.8x)
- Lower pitch (0.9)
- Calming, supportive messages
- Focus on breathing and presence

### Motivational Voice (Physical/Cardio)

- Normal speech rate (0.9x)
- Standard pitch (1.0)
- Energizing, encouraging messages
- Focus on strength and achievement

## Development

### Running Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build:web
```

### Platform Support

- **Web** (primary platform)
- **iOS** (with Expo Dev Client)
- **Android** (with Expo Dev Client)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open an issue in the repository or contact the development team.
