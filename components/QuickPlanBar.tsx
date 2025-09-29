// components/QuickPlanBar.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePlanStore } from '@/store/usePlanStore';
import { usePlanInputs, useSignals, useReadinessScore } from '@/logic/selectors';

export default function QuickPlanBar() {
  const { focus, emotion, timeAvailable } = usePlanInputs();
  const setFocus = usePlanStore((s) => s.setFocus);
  const setEmotion = usePlanStore((s) => s.setEmotion);
  const setTimeAvailable = usePlanStore((s) => s.setTimeAvailable);
  const signals = useSignals();
  const readiness = useReadinessScore();

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Text style={styles.label}>Focus</Text>
        <View style={styles.chips}>
          {(['mental', 'physical', 'both'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFocus(f)}
              style={[styles.chip, focus === f && styles.chipActive]}
            >
              <Text style={[styles.chipText, focus === f && styles.chipTextActive]}>
                {f === 'mental' ? '🧠 Mental' : f === 'physical' ? '💪 Physical' : '⚖️ Both'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Emotion</Text>
        <View style={styles.chips}>
          {['🙂','😌','😤','😣','😴'].map((e) => (
            <TouchableOpacity
              key={e}
              onPress={() => setEmotion(e)}
              style={[styles.chip, emotion === e && styles.chipActive]}
            >
              <Text style={[styles.chipText, emotion === e && styles.chipTextActive]}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Time</Text>
        <View style={styles.chips}>
          {[10,15,20,30].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTimeAvailable(t)}
              style={[styles.chip, timeAvailable === t && styles.chipActive]}
            >
              <Text style={[styles.chipText, timeAvailable === t && styles.chipTextActive]}>{t}m</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.signals}>
        <Text style={styles.sigText}>
          Streak: {signals.streak} | 7d Min: {signals.minutes7d} | Intensity: {Math.round(signals.recentIntensityAvg) || 0}
        </Text>
        <Text style={styles.sigText}>Readiness: {readiness}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  row: { marginBottom: 10 },
  label: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 1, borderColor: '#e5e7eb',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999,
    backgroundColor: '#f9fafb', marginRight: 8, marginBottom: 8,
  },
  chipActive: { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' },
  chipText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#4f46e5' },
  signals: { marginTop: 6 },
  sigText: { fontSize: 12, color: '#4b5563' },
});
