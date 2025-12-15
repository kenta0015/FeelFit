// app/(tabs)/index.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';

import ImprovementTypeSelector from '@/components/ImprovementTypeSelector';
import EmotionSelector from '@/components/EmotionSelector';
import PhysicalPurposeSelector from '@/components/PhysicalPurposeSelector';
import TimeSelector from '@/components/TimeSelector';
import WorkoutList from '@/components/WorkoutList';
import WorkoutTimer from '@/components/WorkoutTimer';
import MoodRating from '@/components/MoodRating';

import {
  findMentalWorkouts,
  findPhysicalWorkouts,
  findBalancedWorkouts,
  calculateMentalStaminaGain,
  calculatePhysicalStaminaGain,
} from '@/utils/workoutMatcher';

import {
  getUser,
  createUser,
  saveWorkoutSession,
  saveMoodLog,
  updateMentalStamina,
  updatePhysicalStamina,
} from '@/utils/storage';

import { EXERCISES } from '@/data/exercises';
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react-native';

import FABQuick from '@/components/FABQuick';
import QuickInputSheet from '@/components/QuickInputSheet';

import type { WorkoutSession, MoodLog } from '@/types';

// ===== Choose tab (manual flow) =====
type StepType =
  | 'improvement-type'
  | 'emotion'
  | 'physical-purpose'
  | 'time'
  | 'workouts'
  | 'workout-execution';

export default function ChooseScreen() {
  const [improvementType, setImprovementType] =
    useState<'mental' | 'physical' | 'both' | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedPhysicalPurpose, setSelectedPhysicalPurpose] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<StepType>('improvement-type');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [showMoodRating, setShowMoodRating] = useState(false);
  const [voicePreference, setVoicePreference] = useState<'male' | 'female'>('female');
  const isCompletedRef = useRef(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionAndInit();
  }, []);

  const fetchSessionAndInit = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return;
    const id = data.user.id;
    setUserId(id);
    const user = await getUser();
    if (!user) {
      await createUser('User');
    }
    if (user?.audioVoicePreference) {
      setVoicePreference(user.audioVoicePreference);
    }
  };

  const handleImprovementTypeSelect = (type: 'mental' | 'physical' | 'both') => {
    setImprovementType(type);
    setCurrentStep(type === 'mental' ? 'emotion' : type === 'physical' ? 'physical-purpose' : 'emotion');
  };

  const handleEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion);
    setCurrentStep(improvementType === 'both' ? 'physical-purpose' : 'time');
  };

  const handlePhysicalPurposeSelect = (purpose: string) => {
    setSelectedPhysicalPurpose(purpose);
    setCurrentStep('time');
  };

  const handleTimeSelect = (time: number) => {
    setSelectedTime(time);
    setCurrentStep('workouts');
  };

  /**
   * Entry unification:
   * Prefer navigating to /workout/session with seconds + exerciseId + style.
   * Keep the old inline path as a fallback (non-destructive).
   */
  const handleWorkoutSelect = (workoutId: string) => {
    const exercise = EXERCISES.find((ex) => ex.id === workoutId);
    if (!exercise) return;

    const minutes = Number.isFinite(exercise.duration)
      ? Number(exercise.duration)
      : Number(selectedTime ?? 0);
    const seconds = Math.max(1, Math.round(minutes * 60));

    try {
      router.push({
        pathname: '/workout/session' as any,
        params: {
          duration: String(seconds),
          exerciseId: String(exercise.id),
          style: String(voicePreference),
        },
      });
      return;
    } catch {
      // fall through to inline flow
    }

    if (!userId) return;
    const session: WorkoutSession = {
      id: Date.now().toString(),
      user_id: userId!,
      workoutId: exercise.id,
      startEmotion: selectedEmotion || '',
      startPhysicalPurpose: selectedPhysicalPurpose || undefined,
      improvementType: improvementType!,
      selectedTime: selectedTime || 0,
      startTime: new Date().toISOString(),
      completionPercentage: 0,
      staminaGained: 0,
      physicalStaminaGained: 0,
    };

    setSelectedExercise(exercise);
    setCurrentSession(session);
    setCurrentStep('workout-execution');
    isCompletedRef.current = false;
  };

  const handleWorkoutComplete = async (completionPercentage: number) => {
    if (!currentSession || !selectedExercise || isCompletedRef.current || !userId) return;
    isCompletedRef.current = true;

    let mentalStaminaGain = 0;
    let physicalStaminaGain = 0;

    if (improvementType === 'mental' && selectedEmotion) {
      const effectiveness = selectedExercise.effectivenessScore[selectedEmotion] || 5;
      mentalStaminaGain = calculateMentalStaminaGain(
        selectedExercise.duration,
        selectedExercise.intensity,
        effectiveness,
        completionPercentage
      );
    } else if (improvementType === 'physical' && selectedPhysicalPurpose) {
      const effectiveness =
        selectedExercise.physicalEffectivenessScore[selectedPhysicalPurpose] || 5;
      physicalStaminaGain = calculatePhysicalStaminaGain(
        selectedExercise.duration,
        selectedExercise.intensity,
        effectiveness,
        completionPercentage
      );
    } else if (improvementType === 'both' && selectedEmotion && selectedPhysicalPurpose) {
      const mentalEffectiveness = selectedExercise.effectivenessScore[selectedEmotion] || 5;
      const physicalEffectiveness =
        selectedExercise.physicalEffectivenessScore[selectedPhysicalPurpose] || 5;
      mentalStaminaGain = calculateMentalStaminaGain(
        selectedExercise.duration,
        selectedExercise.intensity,
        mentalEffectiveness,
        completionPercentage
      );
      physicalStaminaGain = calculatePhysicalStaminaGain(
        selectedExercise.duration,
        selectedExercise.intensity,
        physicalEffectiveness,
        completionPercentage
      );
    }

    const completedSession: WorkoutSession = {
      ...currentSession,
      endTime: new Date().toISOString(),
      completionPercentage,
      staminaGained: mentalStaminaGain,
      physicalStaminaGained: physicalStaminaGain,
    };

    await saveWorkoutSession(completedSession);
    if (mentalStaminaGain > 0) await updateMentalStamina(mentalStaminaGain);
    if (physicalStaminaGain > 0) await updatePhysicalStamina(physicalStaminaGain);

    setCurrentSession(completedSession);
    setShowMoodRating(true);
  };

  const handleMoodRatingSubmit = async (rating: number) => {
    if (!currentSession) return;

    let uid = userId;
    if (!uid) {
      const authUser = (await supabase.auth.getUser()).data.user;
      uid = authUser?.id ?? (await getUser())?.id ?? (await createUser('User')).id;
      setUserId(uid);
    }

    const moodLog: MoodLog = {
      id: Date.now().toString(),
      user_id: uid!,
      workoutSessionId: currentSession.id,
      rating,
      createdAt: new Date().toISOString(),
    };

    await saveMoodLog(moodLog);
    setShowMoodRating(false);
    resetToHome();
  };

  const handleWorkoutCancel = () => {
    setCurrentStep('workouts');
    setSelectedExercise(null);
    setCurrentSession(null);
  };

  const handleMoodRatingSkip = () => {
    setShowMoodRating(false);
    resetToHome();
  };

  const resetToHome = () => {
    setImprovementType(null);
    setSelectedEmotion(null);
    setSelectedPhysicalPurpose(null);
    setSelectedTime(null);
    setSelectedExercise(null);
    setCurrentSession(null);
    setCurrentStep('improvement-type');
    isCompletedRef.current = false;
  };

  const goBack = () => {
    if (currentStep === 'workout-execution') {
      setCurrentStep('workouts');
    } else if (currentStep === 'workouts') {
      setCurrentStep('time');
    } else if (currentStep === 'time') {
      setCurrentStep(
        improvementType === 'both'
          ? 'physical-purpose'
          : improvementType === 'mental'
          ? 'emotion'
          : 'physical-purpose'
      );
      setSelectedTime(null);
    } else if (currentStep === 'physical-purpose') {
      setCurrentStep(improvementType === 'both' ? 'emotion' : 'improvement-type');
      setSelectedPhysicalPurpose(null);
    } else if (currentStep === 'emotion') {
      setCurrentStep('improvement-type');
      setSelectedEmotion(null);
    }
  };

  const getWorkoutMatches = () => {
    if (!selectedTime) return [];
    if (improvementType === 'mental' && selectedEmotion) {
      return findMentalWorkouts(selectedEmotion, selectedTime);
    } else if (improvementType === 'physical' && selectedPhysicalPurpose) {
      return findPhysicalWorkouts(selectedPhysicalPurpose, selectedTime);
    } else if (improvementType === 'both' && selectedEmotion && selectedPhysicalPurpose) {
      return findBalancedWorkouts(selectedEmotion, selectedPhysicalPurpose, selectedTime);
    }
    return [];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {currentStep !== 'improvement-type' && currentStep !== 'workout-execution' && (
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <ArrowLeft size={24} color="#6366f1" />
          </TouchableOpacity>
        )}
        {currentStep === 'workout-execution' && (
          <TouchableOpacity style={styles.backButton} onPress={handleWorkoutCancel}>
            <ArrowLeft size={24} color="#6366f1" />
          </TouchableOpacity>
        )}
        <Text style={styles.appTitle}>FEEL FIT</Text>
        {currentStep === 'workouts' && (
          <TouchableOpacity style={styles.resetButton} onPress={resetToHome}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        )}
        {(currentStep === 'workout-execution' || currentStep === 'improvement-type') && (
          <View style={styles.spacer} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Manual flow only (NO Coach Note / NO Recovery on Choose) */}
        {currentStep === 'improvement-type' && (
          <ImprovementTypeSelector onTypeSelect={handleImprovementTypeSelect} />
        )}
        {currentStep === 'emotion' && (
          <EmotionSelector selectedEmotion={selectedEmotion} onEmotionSelect={handleEmotionSelect} />
        )}
        {currentStep === 'physical-purpose' && (
          <PhysicalPurposeSelector
            selectedPurpose={selectedPhysicalPurpose}
            onPurposeSelect={handlePhysicalPurposeSelect}
          />
        )}
        {currentStep === 'time' && (
          <TimeSelector selectedTime={selectedTime} onTimeSelect={handleTimeSelect} />
        )}
        {currentStep === 'workouts' && (
          <WorkoutList workouts={getWorkoutMatches()} onWorkoutSelect={handleWorkoutSelect} />
        )}
        {currentStep === 'workout-execution' && selectedExercise && (
          <WorkoutTimer
            exercise={selectedExercise}
            onComplete={handleWorkoutComplete}
            onCancel={handleWorkoutCancel}
            voicePreference={voicePreference}
          />
        )}
      </ScrollView>

      {/* Quick Input */}
      <FABQuick hidden={currentStep === 'workout-execution'} />
      <QuickInputSheet />

      <Modal visible={showMoodRating} transparent animationType="fade">
        <MoodRating onRatingSubmit={handleMoodRatingSubmit} onSkip={handleMoodRatingSkip} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: { padding: 8, width: 40 },
  appTitle: { fontSize: 24, fontWeight: 'bold', color: '#6366f1', letterSpacing: 1 },
  resetButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f3f4f6' },
  resetButtonText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  spacer: { width: 40 },
});
