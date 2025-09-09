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
} from 'react-native';

import SuggestionCard from '@/components/SuggestionCard';
import TwoChoicePrompt from '@/components/TwoChoicePrompt';
import RecoveryBanner from '@/components/RecoveryBanner';

import { usePlanSuggestion } from '@/hooks/usePlanSuggestion';
import { shouldRecommendRecovery, type RecoverySignals } from '@/logic/recovery';
import type { Plan } from '@/types/plan';

export default function SuggestionScreen() {
  // 時間チップ（Auto=未指定）
  const chips = [10, 15, 20, 30] as const;
  const [manualTime, setManualTime] = useState<number | null>(null);

  // プラン計算（A 実装が入っていれば本番ロジック）
  const { plan, recommendedTime } = usePlanSuggestion({
    timeAvailable: manualTime ?? undefined, // Auto のとき undefined
  });

  // Recovery 判定（今は固定シグナル）
  const signals: RecoverySignals = useMemo(
    () => ({
      monotony7d: 2.2,
      strain7d: 1.3,
      acuteLoad3d: 1.1,
      lastHighGap: 0.5,
      earlyStopRate: 0.0,
      now: new Date().toISOString(),
      history: [],
    }),
    [],
  );
  const recovery = shouldRecommendRecovery(signals);

  const activeTime = manualTime ?? recommendedTime;

  const onStart = () => {
    const first = plan.blocks[0];
    if (!first) return Alert.alert('No plan', 'No blocks available');
    Alert.alert('Start', `Start "${first.title}" (${first.duration}m)`);
  };

  const onEdit = () => Alert.alert('Edit', 'Open EditPlanSheet (TBD)');
  const onRefresh = () => Alert.alert('Refresh', 'Recompute plan (TBD)');

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Recovery */}
        <RecoveryBanner
          visible={recovery.show}
          reason={recovery.reason}
          onAccept={() => Alert.alert('Recover Today', 'Accepted')}
          onDecline={() => Alert.alert('Keep Normal', 'Continue as usual')}
        />

        {/* Two-Choice（ここでのみ表示／3秒で自動クローズ） */}
        <TwoChoicePrompt
          onPushHarder={() => Alert.alert('Bias', 'Push harder (temp)')}
          onTakeEasy={() => Alert.alert('Bias', 'Take it easy (temp)')}
          autoCloseMs={3000}
        />

        {/* Time chips */}
        <View style={styles.row}>
          {chips.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, activeTime === t && styles.chipActive]}
              onPress={() => setManualTime(t)}
            >
              <Text style={[styles.chipText, activeTime === t && styles.chipTextActive]}>
                {t}m
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.chip, manualTime == null && styles.chipActive]}
            onPress={() => setManualTime(null)}
          >
            <Text style={[styles.chipText, manualTime == null && styles.chipTextActive]}>
              Auto
            </Text>
          </TouchableOpacity>
        </View>

        {/* Today’s Plan（SuggestionCard 側では Two-Choice を表示しない） */}
        <Text style={styles.sectionTitle}>Today’s Plan</Text>
        <SuggestionCard
          plan={plan as Plan}
          // isUncertainDay を渡すと内部で Two-Choice が出る実装なら、false か未指定にして抑止
          isUncertainDay={false}
          onStart={onStart}
          onEdit={onEdit}
          onRefresh={onRefresh}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipActive: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  chipText: { color: '#374151', fontWeight: '700' },
  chipTextActive: { color: '#4f46e5' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
    color: '#111827',
  },
});
