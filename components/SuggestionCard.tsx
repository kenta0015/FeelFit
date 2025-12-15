// components/SuggestionCard.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Plan } from '@/types/plan';

type Props = {
  plan: Plan;
  isUncertainDay?: boolean;        // preferred
  showTwoChoice?: boolean;         // compat
  uncertain?: boolean;             // compat
  showPrompt?: boolean;            // compat
  onStart?: (plan: Plan) => void;
  onEdit?: (plan: Plan) => void;
  onRefresh?: () => void;
  onTwoChoiceSelect?: (choice: 'push' | 'easy') => void;
  onAskCoach?: (plan: Plan) => void; // NEW
};

export default function SuggestionCard({
  plan,
  isUncertainDay,
  showTwoChoice,
  uncertain,
  showPrompt,
  onStart,
  onEdit,
  onRefresh,
  onTwoChoiceSelect,
  onAskCoach,
}: Props) {
  const initialUncertain =
    typeof isUncertainDay === 'boolean'
      ? isUncertainDay
      : !!(showTwoChoice ?? uncertain ?? showPrompt);

  const [showChoice, setShowChoice] = useState<boolean>(initialUncertain);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setShowChoice(initialUncertain);
  }, [initialUncertain]);

  useEffect(() => {
    if (!showChoice) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowChoice(false), 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showChoice]);

  const totalText = useMemo(() => `⏱️ Total: ${plan.totalTime}m`, [plan.totalTime]);

  const handleStart = () => onStart?.(plan);
  const handleEdit = () => onEdit?.(plan);
  const handleRefresh = () => onRefresh?.();
  const handleAsk = () => onAskCoach?.(plan);

  const selectPush = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowChoice(false);
    onTwoChoiceSelect?.('push');
  };
  const selectEasy = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowChoice(false);
    onTwoChoiceSelect?.('easy');
  };

  return (
    <View style={styles.card}>
      {showChoice && (
        <View style={styles.twoChoice}>
          <Text style={styles.twoChoiceText}>How do you feel today? (auto close in 3s)</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.chip, styles.push]} onPress={selectPush} accessibilityRole="button">
              <Text style={styles.chipText}>💥  Push harder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, styles.easy]} onPress={selectEasy} accessibilityRole="button">
              <Text style={styles.chipText}>🌿  Take it easy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.title}>Today’s Plan</Text>
      <Text style={styles.planTitle}>🏷️ {plan.title}</Text>
      <Text style={styles.total}>{totalText}</Text>

      <View style={styles.blocks}>
        {plan.blocks.map((b) => (
          <Text key={b.id} style={styles.block}>
            • {b.title} ({b.duration}m, MET {b.met})
          </Text>
        ))}
      </View>

      {plan.why?.length > 0 && (
        <View style={styles.why}>
          <Text style={styles.whyHead}>📌 Why this?</Text>
          {plan.why.map((w, i) => (
            <Text key={i} style={styles.whyLine}>
              {w}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.start]} onPress={handleStart} accessibilityRole="button">
          <Text style={styles.btnText}>▶ Start</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.edit]} onPress={handleEdit} accessibilityRole="button">
          <Text style={styles.btnText}>✏ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.ask]} onPress={handleAsk} accessibilityRole="button">
          <Text style={styles.btnText}>💬 Ask Coach</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.refresh]} onPress={handleRefresh} accessibilityRole="button">
          <Text style={styles.btnText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, padding: 16, gap: 8, backgroundColor: '#fff' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  planTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  total: { color: '#4b5563', marginTop: 2 },
  blocks: { marginTop: 6, gap: 4 },
  block: { color: '#374151' },
  why: { marginTop: 8, gap: 2 },
  whyHead: { fontWeight: '600', color: '#111827' },
  whyLine: { color: '#374151' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  start: { backgroundColor: '#6366f1' },
  edit: { backgroundColor: '#f59e0b' },
  ask: { backgroundColor: '#8b5cf6' },
  refresh: { backgroundColor: '#e5e7eb' },
  btnText: { color: '#fff', fontWeight: '700' },
  twoChoice: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 10, gap: 8, marginBottom: 6 },
  twoChoiceText: { color: '#111827', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  push: { backgroundColor: '#FDE68A' },
  easy: { backgroundColor: '#DCFCE7' },
  chipText: { color: '#111827', fontWeight: '600' },
});
