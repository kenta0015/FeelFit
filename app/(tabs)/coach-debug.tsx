// app/(tabs)/coach.tsx
// Production Coach tab (Phase 3 preview). Uses safe mock until wired to generator.
// Non-destructive.

import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import CoachSays from '@/components/CoachSays';

type PlanBlock = {
  id: string;
  title: string;
  duration: number; // minutes
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

// --- SAFE MOCK (fallback until wired to generator) ---
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
  signals: { monotony7d: 2.1, strain7d: 0.8, acuteLoad3d: 0.9 },
};
// -----------------------------------------------------

export default function CoachScreen() {
  const [refreshKey, setRefreshKey] = useState(0);

  const startBlock = useMemo<PlanBlock>(() => {
    const b = mockPlan.blocks.find((x) => x.category === 'cardio') || mockPlan.blocks[0];
    return b;
  }, []);

  const onStartPlan = () => {
    // Start from the selected block (safe default). Falls back silently if route not available.
    const seconds = Math.max(1, Math.round(startBlock.duration * 60));
    try {
      router.push({
        pathname: '/workout/session' as any,
        params: { duration: String(seconds), exerciseId: String(startBlock.id), style: 'female' },
      });
    } catch {}
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h1}>Coach</Text>
      <Text style={styles.note}>Today’s AI plan preview and guidance.</Text>

      <View style={styles.card}>
        <Text style={styles.h2}>Plan Preview</Text>
        <Text style={styles.p}>Title: {mockPlan.title}</Text>
        <Text style={styles.p}>Total: {mockPlan.totalTime}m</Text>
        <Text style={styles.p}>Why: {mockPlan.why[0]}</Text>

        <View style={styles.row}>
          <Pressable style={[styles.btn, styles.primary]} onPress={onStartPlan}>
            <Text style={styles.primaryText}>Start Plan</Text>
          </Pressable>
          {__DEV__ ? (
            <Pressable style={[styles.btn, styles.ghost]} onPress={() => setRefreshKey(Date.now())}>
              <Text style={styles.ghostText}>Refresh</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Coach message + optional TTS ping (inside component). */}
      <CoachSays key={refreshKey} plan={mockPlan as any} ctx={mockCtx as any} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  h1: { fontSize: 22, fontWeight: '800' },
  note: { color: '#6b7280', marginBottom: 6 },
  card: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', gap: 8 },
  h2: { fontSize: 16, fontWeight: '700' },
  p: { fontSize: 14 },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: { flex: 1, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: '#6366f1' },
  primaryText: { color: '#fff', fontWeight: '700' },
  ghost: { borderWidth: 1, borderColor: '#c7d2fe', backgroundColor: '#eef2ff' },
  ghostText: { color: '#3730a3', fontWeight: '700' },
});
