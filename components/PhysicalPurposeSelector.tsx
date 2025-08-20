import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PHYSICAL_PURPOSES } from '@/types';

interface PhysicalPurposeSelectorProps {
  selectedPurpose: string | null;
  onPurposeSelect: (purpose: string) => void;
}

const PURPOSE_COLORS: { [key: string]: string } = {
  'metabolism': '#f59e0b',
  'lose weight': '#ef4444',
  'tone body': '#8b5cf6',
  'basic stamina': '#059669',
  'stay fit': '#0ea5e9',
  'immune system': '#84cc16'
};

const PURPOSE_EMOJIS: { [key: string]: string } = {
  'metabolism': '🔥',
  'lose weight': '⚖️',
  'tone body': '💪',
  'basic stamina': '🏃‍♀️',
  'stay fit': '🎯',
  'immune system': '🛡️'
};

export default function PhysicalPurposeSelector({ selectedPurpose, onPurposeSelect }: PhysicalPurposeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What's your physical goal?</Text>
      <View style={styles.purposeGrid}>
        {PHYSICAL_PURPOSES.map((purpose) => (
          <TouchableOpacity
            key={purpose}
            style={[
              styles.purposeButton,
              { backgroundColor: PURPOSE_COLORS[purpose] },
              selectedPurpose === purpose && styles.selectedPurpose
            ]}
            onPress={() => onPurposeSelect(purpose)}
          >
            <Text style={styles.purposeEmoji}>
              {PURPOSE_EMOJIS[purpose]}
            </Text>
            <Text style={styles.purposeText}>
              {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
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
  purposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  purposeButton: {
    width: '48%',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedPurpose: {
    borderWidth: 3,
    borderColor: '#1f2937',
  },
  purposeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  purposeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});