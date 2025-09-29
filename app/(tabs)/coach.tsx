// app/(tabs)/coach.tsx
// Coach tab = guidance-only screen.
// Order: PlanSummaryBar → Coach Says → Coach Q&A
// Removed: "Why this plan (details)" section.

import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';

import { usePlanSuggestion, type SuggestionCtx } from '@/hooks/usePlanSuggestion';
import CoachSays from '@/components/CoachSays';
import PlanSummaryBar from '@/components/PlanSummaryBar';
import CoachQACard from '@/components/CoachQACard';

export default function CoachTab() {
  // Same logic as Suggestion: auto-pick best time today if unspecified
  const baseCtx: SuggestionCtx = useMemo(
    () => ({
      timeAvailable: undefined, // auto-select among 10/15/20/30 by usePlanSuggestion
      focus: 'both',
      emotion: null,
      intensityPref: undefined,
      equipment: [],
      constraints: [],
      disliked: [],
      readiness: undefined,
    }),
    []
  );

  const { plan, recommendedTime } = usePlanSuggestion(baseCtx);

  const goEditInSuggestion = () => {
    // Navigate to Suggestion tab (edit/start happens there)
    router.navigate('/(tabs)/suggestion');
  };

  // CoachSays lightweight context (with demo signals)
  const coachCtx = useMemo(
    () => ({
      focus: baseCtx.focus,
      emotion: baseCtx.emotion ?? undefined,
      timeAvailable: recommendedTime,
      intensityPref: baseCtx.intensityPref,
      signals: {
        monotony7d: 1.2,
        strain7d: 1.1,
      },
    }),
    [baseCtx.focus, baseCtx.emotion, baseCtx.intensityPref, recommendedTime]
  );

  // Q&A context (strict SuggestionCtx shape; time filled with recommendedTime)
  const qaCtx: SuggestionCtx = useMemo(
    () => ({
      ...baseCtx,
      timeAvailable: recommendedTime,
    }),
    [baseCtx, recommendedTime]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.h1}>Coach</Text>
        <Text style={styles.subtitle}>Today’s AI plan preview and guidance.</Text>

        {/* Plan summary (single line) + "Edit in Suggestion" */}
        <View style={styles.section}>
          <PlanSummaryBar
            title={plan.title}
            totalTime={plan.totalTime}
            blockCount={plan.blocks.length}
            onEditInSuggestion={goEditInSuggestion}
          />
        </View>

        {/* Coach Says (full) */}
        <View style={styles.section}>
          <CoachSays plan={plan as any} ctx={coachCtx as any} mode="full" title="Coach Says 🤖🎙️" />
        </View>

        {/* Coach Mini Q&A (presets + chat log + Apply in Suggestion) */}
        <View style={styles.section}>
          <CoachQACard plan={plan as any} ctx={qaCtx as any} />
        </View>

        {/* Bottom "Edit in Suggestion" link */}
        <View style={[styles.section, { alignItems: 'flex-end' }]}>
          <Pressable onPress={goEditInSuggestion} style={styles.linkBtn}>
            <Text style={styles.linkText}>Edit in Suggestion →</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 16, gap: 14 },
  h1: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { color: '#6b7280', marginTop: -4 },
  section: { marginTop: 8 },

  linkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  linkText: { color: '#111827', fontWeight: '700' },
});
