// app/(tabs)/suggestion.tsx
import React, { useCallback, useMemo, useState } from 'react';
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
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import type { Plan } from '@/types/plan';
import SuggestionCard from '@/components/SuggestionCard';
import RecoveryBanner from '@/components/RecoveryBanner';
import CoachNote from '@/features/dailySummary/CoachNote';

import { usePlanSuggestion, type SuggestionCtx } from '@/hooks/usePlanSuggestion';
import { shouldRecommendRecovery } from '@/logic/recovery';
import { getPendingActions } from '@/state/coachActions';
import type { CoachAction } from '@/types/coach';

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

  // Coach-driven soft constraints（スタイル）
  const [coachIndoorOnly, setCoachIndoorOnly] = useState(false);
  const [coachGentleJoints, setCoachGentleJoints] = useState(false); // low-impact フラグ

  // --- Context for the suggestion hook
  const ctx: SuggestionCtx = useMemo(() => {
    return {
      timeAvailable: manualTime, // undefined → hook chooses the best time
      focus: 'both',
      emotion: null,
      intensityPref: undefined,
      equipment: [],
      constraints: [], // ハード除外は今は使わない
      disliked: [],
      readiness: undefined,
      // Coach からのスタイル制約を ranker に渡す
      indoorOnly: coachIndoorOnly,
      lowImpactOnly: coachGentleJoints,
    };
  }, [manualTime, coachIndoorOnly, coachGentleJoints]);

  // --- Compute plan suggestion
  const { plan, recommendedTime, isUncertainDay } = usePlanSuggestion(ctx);

  // --- Active time (manual override wins)
  const activeTime = manualTime ?? recommendedTime;

  // --- Recovery recommendation（dummy signals）
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
      coachIndoorOnly,
      coachGentleJoints,
      ...(extra || {}),
    };
    // eslint-disable-next-line no-console
    console.log('[SuggestionTab]', payload);
  };

  // --- Apply pending Coach actions（Coach Q&A → Suggestion への一方向ブリッジ）
  // IMPORTANT: Tabs often keep screens mounted → we must read pending actions on EVERY focus.
  useFocusEffect(
    useCallback(() => {
      const actions = getPendingActions();
      if (!actions || !actions.length) return;

      // eslint-disable-next-line no-console
      console.log('[SuggestionTab] pending Coach actions:', actions);

      actions.forEach((action: CoachAction) => {
        switch (action.type) {
          case 'applyTime': {
            if (typeof action.minutes === 'number') {
              // TIME_CHOICES に含まれていなくても、とりあえず反映しておく
              setManualTime(action.minutes);
              logEvent('apply_time_from_coach', { minutes: action.minutes });
            }
            break;
          }
          case 'replaceStyle': {
            if (action.style === 'indoor') {
              setCoachIndoorOnly(true);
              logEvent('coach_replace_style_indoor', { action });
            } else if (action.style === 'low-impact') {
              setCoachGentleJoints(true);
              logEvent('coach_replace_style_gentle_joints', { action });
            } else {
              // eslint-disable-next-line no-console
              console.log('[SuggestionTab] replaceStyle (unsupported style):', action);
            }
            break;
          }
          case 'swapBlock': {
            // まだ未実装：とりあえずログだけ
            // eslint-disable-next-line no-console
            console.log('[SuggestionTab] Coach swapBlock not implemented yet:', action);
            break;
          }
          default:
            // eslint-disable-next-line no-console
            console.log('[SuggestionTab] Unknown Coach action:', action);
        }
      });
    }, [recommendedTime, manualTime, activeTime, plan, coachIndoorOnly, coachGentleJoints])
  );

  // ===== navigation handlers =====
  const handleViewHistory = () => {
    router.push('/progress/history');
  };

  const handlePlanRecovery = () => {
    const seconds = 15 * 60;
    router.push({
      pathname: '/workout/session' as any,
      params: { duration: String(seconds) },
    });
  };
  // ==============================

  const onStart = (p: Plan) => {
    const first = p?.blocks?.[0];
    if (!first && !activeTime) return showAlert('No plan', 'No blocks/time available');

    logEvent('start', { firstBlock: first?.title, title: p?.title });

    const seconds = Math.max(1, Number(activeTime ?? 10)) * 60;
    router.push({
      pathname: '/workout/session' as any,
      params: {
        duration: String(seconds),
      },
    });
  };

  const onEdit = (p: Plan) => {
    logEvent('edit', { title: p.title });
    showAlert('Edit', 'Plan editor is not implemented yet.');
  };

  const onRefresh = () => {
    logEvent('refresh');
    setRefreshNonce((n) => n + 1);
  };

  // Time chip selection
  const selectTime = (t: number) => {
    setManualTime(t);
    logEvent('select_time', { t });
  };

  const onAskCoach = () => {
    router.navigate('/(tabs)/coach');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* ─ Coach Note（今日の一言） ─ */}
        <View style={styles.section}>
          <CoachNote
            onPlanRecovery={handlePlanRecovery}
            onViewHistory={handleViewHistory}
            hidePlanRecovery={!!recovery?.show}
          />
        </View>

        {/* Recovery recommendation banner */}
        {recovery?.show ? (
          <View style={styles.section}>
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
            onAskCoach={onAskCoach}
          />
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
});
