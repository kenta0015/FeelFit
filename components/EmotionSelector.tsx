import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { EMOTIONS } from '@/types';

interface EmotionSelectorProps {
  selectedEmotion: string | null;
  onEmotionSelect: (emotion: string) => void;
}

const EMOTION_COLORS: { [key: string]: string } = {
  anxious: '#fbbf24',
  stressed: '#f87171',
  'low energy': '#94a3b8',
  angry: '#dc2626',
  sad: '#6366f1',
  tired: '#64748b',
  overwhelmed: '#f59e0b',
  frustrated: '#ef4444',
  restless: '#f97316',
  unmotivated: '#8b5cf6'
};

export default function EmotionSelector({ selectedEmotion, onEmotionSelect }: EmotionSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How are you feeling right now?</Text>
      <View style={styles.emotionGrid}>
        {EMOTIONS.map((emotion) => (
          <TouchableOpacity
            key={emotion}
            style={[
              styles.emotionButton,
              { backgroundColor: EMOTION_COLORS[emotion] },
              selectedEmotion === emotion && styles.selectedEmotion
            ]}
            onPress={() => onEmotionSelect(emotion)}
          >
            <Text style={styles.emotionText}>
              {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  emotionButton: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedEmotion: {
    borderWidth: 3,
    borderColor: '#1f2937',
  },
  emotionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});