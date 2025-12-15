// components/FABQuick.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { usePlanStore } from '@/store/usePlanStore';
import { Zap } from 'lucide-react-native';

type Props = { hidden?: boolean };

export default function FABQuick({ hidden }: Props) {
  const openQuick = usePlanStore((s) => s.openQuick);
  if (hidden) return null;

  return (
    <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={openQuick}>
      <View style={styles.row}>
        <Zap size={18} color="#fff" />
        <Text style={styles.label}>Quick</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    backgroundColor: '#6366F1', borderRadius: 24,
    paddingHorizontal: 14, paddingVertical: 12,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: '#fff', fontWeight: '700' },
});
