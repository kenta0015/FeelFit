// components/WhyThisPlanDetailed.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  planTitle: string;
  recommendedTime: number;
  why: string[];
};

export default function WhyThisPlanDetailed({ planTitle, recommendedTime, why }: Props) {
  const items: string[] = [
    `Recommended time: ${recommendedTime}m`,
    ...why,
  ];

  return (
    <View style={styles.card} accessibilityLabel="Why this plan (detailed)">
      <Text style={styles.title}>Why this plan (details)</Text>
      <Text style={styles.subtle}>Plan: {planTitle}</Text>
      <View style={{ height: 8 }} />
      {items.map((t, i) => (
        <Text key={i} style={styles.li}>
          • {t}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  subtle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  li: { color: '#111827', lineHeight: 20 },
});
