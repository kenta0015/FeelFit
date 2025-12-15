// components/WorkoutTimer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Play, Pause, Square, RotateCcw } from 'lucide-react-native';
import { Exercise } from '@/types';
// import { playWorkoutAudio } from '@/utils/audio';
import { emitFeelFit } from '@/utils/feelFitEvents';
import { onMany } from '@/utils/feelFitEvents';

interface WorkoutTimerProps {
  exercise: Exercise;
  onComplete: (completionPercentage: number) => void;
  onCancel: () => void;
  voicePreference: 'male' | 'female';
}

export default function WorkoutTimer({ exercise, onComplete, onCancel, voicePreference }: WorkoutTimerProps) {
  const [timeLeft, setTimeLeft] = useState(exercise.duration * 60); // Convert to seconds
  const [isRunning, setIsRunning] = useState(false);

  // ✅ Typed interval reference
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTime = exercise.duration * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const completionPercentage = Math.round(progress);

  // ---- Subscribe to external HUD/MiniPlayer events (bidirectional sync) ----
  useEffect(() => {
    const off = onMany(
      ['workout-start', 'workout-pause', 'workout-resume', 'workout-finish'],
      (type, detail) => {
        // Ignore self-originated events
        if (detail?.origin === 'workout-timer') return;

        switch (type) {
          case 'workout-start':
            // Reset to start-of-workout and run
            setTimeLeft(totalTime);
            setIsRunning(true);
            break;
          case 'workout-pause':
            setIsRunning(false);
            break;
          case 'workout-resume':
            setIsRunning(true);
            break;
          case 'workout-finish':
            // Stop & reset UI. (Do NOT call onComplete here to avoid double-saving.)
            setIsRunning(false);
            setTimeLeft(totalTime);
            break;
        }
      }
    );
    return off;
  }, [totalTime]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;

          // Progress calculation (audio cues moved to CoachAutoCues)
          const progressPercent = ((totalTime - newTime) / totalTime) * 100;

          // Play motivational audio at key moments (now handled by CoachAutoCues via events)
          // if (newTime === totalTime - 5) {
          //   // Start message (5 seconds in)
          //   playWorkoutAudio('start', exercise.audioType, voicePreference);
          // } else if (Math.abs(progressPercent - 50) < 1) {
          //   // Middle message (around 50%)
          //   playWorkoutAudio('middle', exercise.audioType, voicePreference);
          // } else if (newTime === 10) {
          //   // Near end message (10 seconds left)
          //   playWorkoutAudio('nearEnd', exercise.audioType, voicePreference);
          // }

          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeLeft, totalTime, voicePreference, exercise.audioType]);

  useEffect(() => {
    if (timeLeft === 0) {
      setIsRunning(false);
      // Completion audio is now handled by CoachAutoCues via events
      // playWorkoutAudio('completion', exercise.audioType, voicePreference);
      // ▼ Event (Finish)
      emitFeelFit('workout-finish', { origin: 'workout-timer', completionPercentage: 100 });
      onComplete(100);
    }
  }, [timeLeft, onComplete, voicePreference, exercise.audioType]);

  const startTimer = () => {
    // ▼ Event (Start or Resume)
    if (timeLeft === totalTime) {
      emitFeelFit('workout-start', {
        origin: 'workout-timer',
        totalSec: totalTime,
        exercise: {
          id: exercise.id,
          name: exercise.name,
          duration: exercise.duration,
          intensity: exercise.intensity,
        },
      });
    } else {
      emitFeelFit('workout-resume', { origin: 'workout-timer' });
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    // ▼ Event (Pause)
    emitFeelFit('workout-pause', { origin: 'workout-timer' });
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalTime);
  };

  const stopWorkout = () => {
    Alert.alert(
      'Stop Workout',
      `You've completed ${completionPercentage}% of the workout. Do you want to finish here?`,
      [
        { text: 'Continue', style: 'cancel' },
        {
          text: 'Finish',
          onPress: () => {
            // ▼ Event (Finish)
            emitFeelFit('workout-finish', { origin: 'workout-timer', completionPercentage });
            onComplete(completionPercentage);
          },
          style: 'destructive'
        }
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.categoryText}>
          {exercise.category.toUpperCase()} • {exercise.intensity} MET
        </Text>
      </View>

      <View style={styles.timerContainer}>
        <View style={[styles.progressRing, { borderColor: progress > 0 ? '#6366f1' : '#e5e7eb' }]}>
          <Text style={styles.timeDisplay}>{formatTime(timeLeft)}</Text>
          <Text style={styles.progressText}>{completionPercentage}%</Text>
        </View>
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        {exercise.instructions.map((instruction, index) => (
          <Text key={index} style={styles.instructionText}>
            {index + 1}. {instruction}
          </Text>
        ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={isRunning ? styles.pauseButton : styles.startButton}
          onPress={isRunning ? pauseTimer : startTimer}
        >
          {isRunning ? (
            <>
              <Pause size={24} color="white" />
              <Text style={styles.pauseButtonText}>Pause</Text>
            </>
          ) : (
            <>
              <Play size={24} color="white" />
              <Text style={styles.startButtonText}>
                {timeLeft === totalTime ? 'Start Workout' : 'Resume'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.secondaryControls}>
          <TouchableOpacity style={styles.resetButton} onPress={resetTimer}>
            <RotateCcw size={20} color="#6b7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.stopButton} onPress={stopWorkout}>
            <Square size={20} color="#dc2626" />
            <Text style={styles.stopButtonText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  progressRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  timeDisplay: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  progressText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  instructionsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 24,
    fontWeight: '500',
  },
  controls: {
    gap: 16,
  },
  startButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  pauseButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  stopButton: {
    backgroundColor: '#fef2f2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 8,
  },
  stopButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
});
