// types/index.ts
export type ImprovementType = 'mental' | 'physical' | 'both';

export interface Exercise {
  id: string;
  name: string;
  duration: number; // in minutes
  intensity: number; // MET value
  category: 'cardio' | 'strength' | 'mindfulness' | 'flexibility' | 'endurance';
  emotions: string[];
  physicalPurposes: string[];
  instructions: string[];
  effectivenessScore: { [emotion: string]: number }; // 1-10 scale
  physicalEffectivenessScore: { [purpose: string]: number }; // 1-10 scale
  audioType: 'healing' | 'motivational';
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  startEmotion: string;            // 空文字可にする想定
  startPhysicalPurpose?: string;
  user_id: string;                 // Supabase FK
  improvementType: ImprovementType;
  selectedTime: number;
  startTime: string;               // ISO string
  endTime?: string;                // ISO string
  completionPercentage: number;
  staminaGained: number;
  physicalStaminaGained: number;
  postWorkoutRating?: number;      // 1-5 stars
}

export interface User {
  id: string;
  name: string;
  mentalStamina: number;
  physicalStamina: number;
  audioVoicePreference: 'male' | 'female';
  createdAt: string;               // ISO string（Supabaseの日時）
}

export interface MoodLog {
  id: string;
  user_id: string;                 // 必須（RLS用）
  workoutSessionId: string;
  rating: number;                  // 1-5 stars
  createdAt: string;               // ISO string
}

export const EMOTIONS = [
  'anxious',
  'stressed',
  'low energy',
  'angry',
  'sad',
  'tired',
  'overwhelmed',
  'frustrated',
  'restless',
  'unmotivated'
] as const;

export const PHYSICAL_PURPOSES = [
  'metabolism',
  'lose weight',
  'tone body',
  'basic stamina',
  'stay fit',
  'immune system'
] as const;

export const TIME_OPTIONS = [5, 10, 15, 20, 30] as const;
