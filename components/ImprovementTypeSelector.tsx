import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Brain, Dumbbell, Zap } from 'lucide-react-native';

interface ImprovementTypeSelectorProps {
  onTypeSelect: (type: 'mental' | 'physical' | 'both') => void;
}

export default function ImprovementTypeSelector({ onTypeSelect }: ImprovementTypeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What do you want to improve today?</Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionButton, styles.mentalButton]}
          onPress={() => onTypeSelect('mental')}
        >
          <Brain size={32} color="#8b5cf6" />
          <Text style={styles.optionTitle}>Mental</Text>
          <Text style={styles.optionSubtitle}>Focus on emotional wellbeing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, styles.physicalButton]}
          onPress={() => onTypeSelect('physical')}
        >
          <Dumbbell size={32} color="#059669" />
          <Text style={styles.optionTitle}>Physical</Text>
          <Text style={styles.optionSubtitle}>Build strength and fitness</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionButton, styles.bothButton]}
          onPress={() => onTypeSelect('both')}
        >
          <Zap size={32} color="#f59e0b" />
          <Text style={styles.optionTitle}>Both</Text>
          <Text style={styles.optionSubtitle}>Balanced mind-body wellness</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 36,
  },
  optionsContainer: {
    gap: 20,
  },
  optionButton: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  mentalButton: {
    backgroundColor: '#f3f0ff',
    borderWidth: 2,
    borderColor: '#e9d5ff',
  },
  physicalButton: {
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: '#a7f3d0',
  },
  bothButton: {
    backgroundColor: '#fffbeb',
    borderWidth: 2,
    borderColor: '#fde68a',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});