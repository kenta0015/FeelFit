// components/PlanSummaryBar.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

type Props = {
  title: string;
  totalTime: number;
  blockCount: number;
  onEditInSuggestion?: () => void;
};

export default function PlanSummaryBar({
  title,
  totalTime,
  blockCount,
  onEditInSuggestion,
}: Props) {
  return (
    <View style={styles.card} accessibilityLabel="Plan Summary">
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta}>
          {totalTime}m • {blockCount} blocks
        </Text>
      </View>

      {onEditInSuggestion ? (
        <Pressable style={styles.editBtn} onPress={onEditInSuggestion}>
          <Text style={styles.editText}>Edit in Suggestion</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  meta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  editText: { fontSize: 12, fontWeight: '700', color: '#111827' },
});
