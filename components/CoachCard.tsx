// components/CoachCard.tsx
import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppStore } from '@/state/appStore';
import { useCoach } from '@/hooks/useCoach';

export default function CoachCard() {
  const coach = useAppStore((s) => s.coach);
  const { getNext } = useCoach();

  useEffect(() => { if (!coach) getNext(); }, []);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Today’s Nudge</Text>
      <Text style={styles.body}>{coach?.text ?? '—'}</Text>
      <Pressable onPress={getNext} style={styles.btn}>
        <Text style={styles.btnLabel}>Refresh advice</Text>
      </Pressable>
      {!!coach?.ruleId && <Text style={styles.meta}>via rules: {coach.ruleId}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, backgroundColor: '#fff', gap: 8, elevation: 2 },
  title: { fontWeight: '700', fontSize: 16 },
  body: { fontSize: 15, color: '#111827' },
  btn: { marginTop: 8, backgroundColor: '#111827', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  btnLabel: { color: '#fff', fontWeight: '600' },
  meta: { marginTop: 6, color: '#6b7280', fontSize: 12 },
});
