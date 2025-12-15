import { Exercise } from '@/types';
import { MENTAL_EXERCISES, PHYSICAL_EXERCISES, BALANCED_EXERCISES } from '@/data/exercises';

export interface WorkoutMatch {
  exercise: Exercise;
  matchScore: number;
  timeCompatible: boolean;
}

export const findMentalWorkouts = (emotion: string, timeAvailable: number): WorkoutMatch[] => {
  const matches: WorkoutMatch[] = [];

  MENTAL_EXERCISES.forEach(exercise => {
    const emotionEffectiveness = exercise.effectivenessScore[emotion] || 0;
    const timeCompatible = exercise.duration <= timeAvailable;
    
    let matchScore = emotionEffectiveness;
    if (timeCompatible) {
      matchScore += 20;
    } else {
      matchScore -= 10;
    }
    
    matches.push({
      exercise,
      matchScore,
      timeCompatible
    });
  });

  return matches.sort((a, b) => b.matchScore - a.matchScore);
};

export const findPhysicalWorkouts = (purpose: string, timeAvailable: number): WorkoutMatch[] => {
  const matches: WorkoutMatch[] = [];

  PHYSICAL_EXERCISES.forEach(exercise => {
    const purposeEffectiveness = exercise.physicalEffectivenessScore[purpose] || 0;
    const timeCompatible = exercise.duration <= timeAvailable;
    
    let matchScore = purposeEffectiveness;
    if (timeCompatible) {
      matchScore += 20;
    } else {
      matchScore -= 10;
    }
    
    matches.push({
      exercise,
      matchScore,
      timeCompatible
    });
  });

  return matches.sort((a, b) => b.matchScore - a.matchScore);
};

export const findBalancedWorkouts = (emotion: string, purpose: string, timeAvailable: number): WorkoutMatch[] => {
  const matches: WorkoutMatch[] = [];

  BALANCED_EXERCISES.forEach(exercise => {
    const emotionEffectiveness = exercise.effectivenessScore[emotion] || 0;
    const purposeEffectiveness = exercise.physicalEffectivenessScore[purpose] || 0;
    const timeCompatible = exercise.duration <= timeAvailable;
    
    // Combined score - both mental and physical effectiveness
    let matchScore = (emotionEffectiveness + purposeEffectiveness) / 2;
    if (timeCompatible) {
      matchScore += 20;
    } else {
      matchScore -= 10;
    }
    
    matches.push({
      exercise,
      matchScore,
      timeCompatible
    });
  });

  return matches.sort((a, b) => b.matchScore - a.matchScore);
};

export const calculateMentalStaminaGain = (
  duration: number,
  intensity: number,
  effectiveness: number,
  completionPercentage: number
): number => {
  const baseDuration = Math.min(duration / 5, 10);
  const baseIntensity = Math.min(intensity, 10);
  const baseEffectiveness = effectiveness;
  
  const totalBase = baseDuration + baseIntensity + baseEffectiveness;
  const adjustedForCompletion = totalBase * (completionPercentage / 100);
  
  return Math.round(adjustedForCompletion);
};

export const calculatePhysicalStaminaGain = (
  duration: number,
  intensity: number,
  effectiveness: number,
  completionPercentage: number
): number => {
  // Focus more on intensity and duration for physical stamina
  const baseDuration = Math.min(duration / 3, 15); // Higher weight for duration
  const baseIntensity = Math.min(intensity * 1.5, 15); // Higher weight for intensity
  const baseEffectiveness = effectiveness;
  
  const totalBase = baseDuration + baseIntensity + baseEffectiveness;
  const adjustedForCompletion = totalBase * (completionPercentage / 100);
  
  return Math.round(adjustedForCompletion);
};