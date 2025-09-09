// app/coach-debug.tsx
// Standalone debug screen to verify AI Suggestion + Ping without touching existing UI.
// Access via: npx expo start --web → http://localhost:19006/coach-debug

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import CoachSays from '../../components/CoachSays'; // <-- fixed
// Local minimal Plan/Ctx types (keep in sync with hooks/useCoachSuggestion)
type PlanBlock = {
  id: string;
  title: string;
  duration: number;
  met: number;
  intensity: 'low' | 'med' | 'high';
  category: string;
};
type Plan = { title: string; blocks: PlanBlock[]; totalTime: number; why: string[] };
type Ctx = {
  focus?: 'mental' | 'physical' | 'both';
  emotion?: string;
  timeAvailable?: number;
  intensityPref?: 'low' | 'med' | 'high';
  signals?: Record<string, unknown>;
};

// Mock plan/ctx (safe defaults)
const mockPlan: Plan = {
  title: 'Mindful Mobility + Light Cardio (20m)',
  totalTime: 20,
  blocks: [
    { id: 'cat-cow', title: 'Cat–Cow', duration: 5, met: 2.0, intensity: 'low', category: 'mobility' },
    { id: 'box-breath', title: 'Box Breathing', duration: 5, met: 1.5, intensity: 'low', category: 'mindfulness' },
    { id: 'walk-liss', title: 'Walk LISS', duration: 10, met: 3.0, intensity: 'low', category: 'cardio' },
  ],
  why: ['Monotony trending high → add variety & lower strain.'],
};

const mockCtx: Ctx = {
  focus: 'both',
  emotion: 'calm',
  timeAvailable: 20,
  intensityPref: 'low',
  signals: {
    monotony7d: 2.1,
    strain7d: 0.8,
    acuteLoad3d: 0.9,
  },
};

export default function CoachDebugScreen() {
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h1}>Coach Debug</Text>
      <Text style={styles.note}>
        Use this screen to verify AI Suggestion and OpenAI Ping. The button “Ping AI” is below.
      </Text>

      <View style={styles.card}>
        <Text style={styles.h2}>Plan Preview</Text>
        <Text style={styles.p}>Title: {mockPlan.title}</Text>
        <Text style={styles.p}>Total: {mockPlan.totalTime}m</Text>
        <Text style={styles.p}>Why: {mockPlan.why[0]}</Text>
      </View>

      <CoachSays plan={mockPlan as any} ctx={mockCtx as any} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  h1: { fontSize: 22, fontWeight: '800' },
  h2: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  p: { fontSize: 14, marginBottom: 2 },
  note: { color: '#6b7280', marginBottom: 8 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
});
