import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { TIME_OPTIONS } from '@/types';

interface TimeSelectorProps {
  selectedTime: number | null;
  onTimeSelect: (time: number) => void;
}

export default function TimeSelector({ selectedTime, onTimeSelect }: TimeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How much time do you have?</Text>
      <View style={styles.timeGrid}>
        {TIME_OPTIONS.map((time) => (
          <TouchableOpacity
            key={time}
            style={[
              styles.timeButton,
              selectedTime === time && styles.selectedTime
            ]}
            onPress={() => onTimeSelect(time)}
          >
            <Clock size={24} color={selectedTime === time ? '#6366f1' : '#6b7280'} />
            <Text style={[
              styles.timeText,
              selectedTime === time && styles.selectedTimeText
            ]}>
              {time} min
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
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeButton: {
    width: '30%',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  selectedTime: {
    backgroundColor: '#eef2ff',
    borderColor: '#6366f1',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
  },
  selectedTimeText: {
    color: '#6366f1',
  },
});