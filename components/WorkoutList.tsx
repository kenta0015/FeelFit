import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Play, Clock, Zap } from 'lucide-react-native';
import { WorkoutMatch } from '@/utils/workoutMatcher';

interface WorkoutListProps {
  workouts: WorkoutMatch[];
  onWorkoutSelect: (workoutId: string) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'cardio': return '🏃‍♀️';
    case 'strength': return '💪';
    case 'mindfulness': return '🧘‍♀️';
    case 'flexibility': return '🤸‍♀️';
    default: return '🏃‍♀️';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'cardio': return '#ef4444';
    case 'strength': return '#059669';
    case 'mindfulness': return '#8b5cf6';
    case 'flexibility': return '#0ea5e9';
    default: return '#6b7280';
  }
};

export default function WorkoutList({ workouts, onWorkoutSelect }: WorkoutListProps) {
  if (workouts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No workouts found for your selection</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recommended Workouts</Text>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {workouts.map((match, index) => (
          <TouchableOpacity
            key={match.exercise.id}
            style={[
              styles.workoutCard,
              index === 0 && styles.bestMatch,
              !match.timeCompatible && styles.timeIncompatible
            ]}
            onPress={() => onWorkoutSelect(match.exercise.id)}
          >
            {index === 0 && (
              <View style={styles.bestMatchBadge}>
                <Text style={styles.bestMatchText}>BEST MATCH</Text>
              </View>
            )}
            
            <View style={styles.workoutHeader}>
              <Text style={styles.categoryEmoji}>
                {getCategoryIcon(match.exercise.category)}
              </Text>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutName}>{match.exercise.name}</Text>
                <Text style={[
                  styles.categoryText,
                  { color: getCategoryColor(match.exercise.category) }
                ]}>
                  {match.exercise.category.toUpperCase()}
                </Text>
              </View>
              <Play size={24} color="#6366f1" />
            </View>

            <View style={styles.workoutDetails}>
              <View style={styles.detailItem}>
                <Clock size={16} color="#6b7280" />
                <Text style={styles.detailText}>{match.exercise.duration} min</Text>
              </View>
              <View style={styles.detailItem}>
                <Zap size={16} color="#6b7280" />
                <Text style={styles.detailText}>{match.exercise.intensity} MET</Text>
              </View>
              {!match.timeCompatible && (
                <Text style={styles.timeWarning}>Exceeds available time</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  workoutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bestMatch: {
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  timeIncompatible: {
    opacity: 0.7,
    backgroundColor: '#f9fafb',
  },
  bestMatchBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestMatchText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  workoutDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  timeWarning: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
});