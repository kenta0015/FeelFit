import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

interface MoodRatingProps {
  onRatingSubmit: (rating: number) => void;
  onSkip: () => void;
}

export default function MoodRating({ onRatingSubmit, onSkip }: MoodRatingProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selectedRating) {
      onRatingSubmit(selectedRating);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>How do you feel now?</Text>
        <Text style={styles.subtitle}>Rate your current mood after the workout</Text>
        
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={styles.starButton}
              onPress={() => setSelectedRating(rating)}
            >
              <Star
                size={48}
                color={selectedRating && rating <= selectedRating ? '#fbbf24' : '#d1d5db'}
                fill={selectedRating && rating <= selectedRating ? '#fbbf24' : 'transparent'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.ratingLabels}>
          <Text style={styles.ratingLabel}>Poor</Text>
          <Text style={styles.ratingLabel}>Excellent</Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.submitButton, !selectedRating && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!selectedRating}
          >
            <Text style={[styles.submitButtonText, !selectedRating && styles.disabledButtonText]}>
              Submit Rating
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    margin: 20,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
});