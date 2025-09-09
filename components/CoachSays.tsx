// components/CoachSays.tsx
// Drop-in UI block. B can place this inside SuggestionCard.
// Shows AI text (or rules fallback), skeleton on first load, and a tiny dev line.

import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import type { Plan, Ctx } from '../hooks/useCoachSuggestion';
import { useCoachSuggestion } from '../hooks/useCoachSuggestion';

type Props = {
  plan: Plan;
  ctx: Ctx;
  onRefresh?: () => void; // optional extra UI-side refresh hook
};

export default function CoachSays({ plan, ctx, onRefresh }: Props) {
  const { text, reasonLine, loading, cache, refresh, signature } = useCoachSuggestion(plan, ctx, 250);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Coach Says 🤖🎙️</Text>

      {loading && !text ? (
        <View style={styles.skeleton}>
          <ActivityIndicator />
          <Text style={styles.skelText}>Preparing your short suggestion…</Text>
        </View>
      ) : (
        <Text style={styles.body}>{text}</Text>
      )}

      {!!reasonLine && (
        <Text style={styles.reason}>Reason: {reasonLine}</Text>
      )}

      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={() => { refresh(); onRefresh?.(); }}>
          <Text style={styles.btnText}>↻ Refresh</Text>
        </Pressable>
        {__DEV__ && (
          <Text style={styles.dev}>
            {cache ? `cache:${cache}` : ''}{signature ? ` · sig:${signature.slice(0, 7)}` : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 14, backgroundColor: '#fff', gap: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  skeleton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skelText: { color: '#6b7280' },
  body: { fontSize: 14, lineHeight: 20 },
  reason: { fontSize: 12, color: '#6b7280' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#111827' },
  btnText: { color: '#fff', fontWeight: '600' },
  dev: { color: '#9ca3af', fontSize: 11 },
});
