// features/dailySummary/CoachNote.tsx
// Coach Note card for "today". Pure UI; no side effects.
// ✅ 小さいほうの「View History」ボタンを撤去し、下段フル幅のみ残しています。

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { getSummaryByDate } from './storage';

type Props = {
  onPlanRecovery?: () => void;
  onViewHistory?: () => void;
  date?: Date;                 // default: today (device local)
  hidePlanRecovery?: boolean;  // true で左の Recovery CTA を非表示（Recovery バナー重複回避）
};

export default function CoachNote({
  onPlanRecovery,
  onViewHistory,
  date,
  hidePlanRecovery,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string>('');
  const [streak, setStreak] = useState<number>(0);
  const [sessions7d, setSessions7d] = useState<number>(0);
  const [minutes7d, setMinutes7d] = useState<number>(0);

  const dayKey = useMemo(() => {
    const d = date ? new Date(date) : new Date();
    return d.toISOString().slice(0, 10);
  }, [date]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const s = await getSummaryByDate(dayKey);
        if (!alive) return;
        if (s) {
          setNote(s.text || '');
          setStreak(s.metrics?.streak || 0);
          setSessions7d(s.metrics?.sessions7d || 0);
          setMinutes7d(s.metrics?.minutes7d || 0);
        } else {
          setNote('');
          setStreak(0);
          setSessions7d(0);
          setMinutes7d(0);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [dayKey]);

  return (
    <View style={styles.card} accessibilityLabel="Coach Note (Today)">
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Coach Note (Today)</Text>
        <Text style={styles.meta}>
          Streak: {streak} | 7d: {sessions7d} sessions / {minutes7d} min
        </Text>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator />
        ) : note ? (
          <Text style={styles.note}>"{note}"</Text>
        ) : (
          <Text style={styles.noteMuted}>
            No note yet. It will appear after your first log or at 21:00.
          </Text>
        )}
      </View>

      {/* CTA row（小ボタン）：Recovery のみ。View History はここから撤去 */}
      {!hidePlanRecovery && (
        <View style={styles.ctaRow}>
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={onPlanRecovery}>
            <Text style={[styles.btnText, styles.btnGhostText]}>Start Recovery (15m)</Text>
          </Pressable>
        </View>
      )}

      {/* 下段フル幅の View History（こちらを残す） */}
      <Pressable style={styles.fullWidthHistory} onPress={onViewHistory}>
        <Text style={styles.fullWidthHistoryText}>View History</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    gap: 12,
  },
  headerRow: {
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  meta: {
    fontSize: 12,
    color: '#64748b',
  },
  body: {
    paddingVertical: 4,
  },
  note: {
    fontSize: 14,
    color: '#111827',
  },
  noteMuted: {
    fontSize: 14,
    color: '#9ca3af',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: '#eef2ff',
  },
  btnGhostText: {
    color: '#3730a3',
    fontWeight: '700',
  },
  btnText: { fontSize: 13 },

  // 下段フル幅の View History
  fullWidthHistory: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
  },
  fullWidthHistoryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
