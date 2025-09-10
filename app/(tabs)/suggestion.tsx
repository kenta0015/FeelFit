// app/(tabs)/suggestion.tsx
import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';

import type { Plan } from '@/types/plan';
import SuggestionCard from '@/components/SuggestionCard';
import RecoveryBanner from '@/components/RecoveryBanner';
import { usePlanSuggestion, type SuggestionCtx } from '@/hooks/usePlanSuggestion';
import { shouldRecommendRecovery } from '@/logic/recovery';

/**
 * Phase 4.1A — Wire up Suggestion tab with usePlanSuggestion + SuggestionCard.
 * - Minimal UI
 * - Lightweight console logging
 * - Web alert fallback
 */

const TIME_CHOICES = [10, 15, 20, 30];

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function SuggestionTab() {
  // --- Local UI state
  const [manualTime, setManualTime] = useState<number | undefined>(undefined);
  const [refreshNonce, setRefreshNonce] = useState(0);

  // --- Context for the suggestion hook
  const ctx: SuggestionCtx = useMemo(() => {
    return {
      timeAvailable: manualTime, // undefined → hook chooses the best time
      focus: 'both',
      emotion: null,
      intensityPref: undefined,
      equipment: [],
      constraints: [],
      disliked: [],
      readiness: undefined,
    };
  }, [manualTime]);

  // --- Compute plan suggestion
  const { plan, recommendedTime, isUncertainDay } = usePlanSuggestion(ctx);

  // --- Active time (manual override wins)
  const activeTime = manualTime ?? recommendedTime;

  // --- Recovery recommendation（ダミー信号; 必要に応じて実データに置換）
  const signals = useMemo(
    () => ({
      monotony7d: 1.2,
      strain7d: 1.1,
      strainP75: 1.6,
      acuteLoad3d: 1.0,
      lastHighGap: 0.5,
      earlyStopRate: 0.0,
      now: new Date().toISOString(),
      history: [],
    }),
    [refreshNonce]
  );
  const recovery = shouldRecommendRecovery(signals);

  // --- Logging（consoleのみ）
  const logEvent = (kind: string, extra?: Record<string, unknown>) => {
    const payload = {
      t: new Date().toISOString(),
      kind,
      recommendedTime,
      manualTime,
      activeTime,
      blocks: plan?.blocks?.length ?? 0,
      ...(extra || {}),
    };
    // eslint-disable-next-line no-console
    console.log('[SuggestionTab]', payload);
  };

  const onStart = (p: Plan) => {
    const first = p.blocks[0];
    if (!first) return showAlert('No plan', 'No blocks available');
    logEvent('start', { firstBlock: first?.title, title: p.title });
    showAlert('Start', `Starting: ${p.title} — ${activeTime} min`);
    // TODO: navigate to workout player/timer when available
  };

  const onEdit = (p: Plan) => {
    logEvent('edit', { title: p.title });
    showAlert('Edit', 'Plan editor is not implemented yet.');
  };

  const onRefresh = () => {
    logEvent('refresh');
    setRefreshNonce((n) => n + 1);
  };

  const selectTime = (t: number) => {
    setManualTime(t);
    logEvent('select_time', { t });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Recovery recommendation banner */}
        {recovery?.show ? (
          <View style={styles.section}>
            {/* RecoveryBanner は `type` prop を受け取りません */}
            <RecoveryBanner show reason={recovery.reason} />
          </View>
        ) : null}

        {/* Header */}
        <View style={[styles.section, styles.headerRow]}>
          <Text style={styles.title}>Today’s Suggestion</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Time chips */}
        <View style={[styles.section, styles.chipsRow]}>
          {TIME_CHOICES.map((t) => {
            const active = activeTime === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => selectTime(t)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}m</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SuggestionCard (main) */}
        <View style={styles.section}>
          <SuggestionCard
            plan={plan as Plan}
            isUncertainDay={!!isUncertainDay}
            onStart={onStart}
            onEdit={onEdit}
            onRefresh={onRefresh}
            onTwoChoiceSelect={(choice) => logEvent('two_choice', { choice })}
          />
        </View>

        {/* Why / meta (simple readout for dev) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why this plan</Text>
          {(plan?.why ?? []).map((w, i) => (
            <Text key={i} style={styles.whyLine}>
              • {w}
            </Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16 },
  section: { marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  refreshText: { color: '#4f46e5', fontWeight: '700' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  chipActive: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
  chipText: { color: '#374151', fontWeight: '700' },
  chipTextActive: { color: '#4f46e5' },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    color: '#111827',
  },
  whyLine: { color: '#374151', lineHeight: 20 },
});
