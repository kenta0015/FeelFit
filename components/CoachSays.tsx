// components/CoachSays.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import {
  useCoachSuggestion,
  type Plan as CoachPlan,
  type Ctx as CoachCtx,
} from '@/hooks/useCoachSuggestion';

type Props = {
  plan: CoachPlan | null;
  ctx: CoachCtx | null;
  mode?: 'compact' | 'full';
  title?: string;
};

// 折りたたみ時の行数（差を出しやすく 1 行に）
const COLLAPSED_LINES = 1;

// 「More/Less」を出すしきい値（短文ならボタン非表示）
const MORE_THRESHOLD = 140;

export default function CoachSays({
  plan,
  ctx,
  mode = 'compact',
  title = 'Coach Says 🤖🎙️',
}: Props) {
  const { text, reasonLine, loading, cache, refresh } = useCoachSuggestion(plan, ctx, 250);
  const [expanded, setExpanded] = useState(mode === 'full');

  const shortText = useMemo(() => text ?? 'Coach is preparing guidance…', [text]);

  // 長文のときだけ More/Less を出す
  const needsMore = useMemo(() => {
    if (mode === 'full') return false;
    const len = (shortText?.length ?? 0) + (reasonLine?.length ?? 0);
    return len > MORE_THRESHOLD;
  }, [mode, shortText, reasonLine]);

  return (
    <View style={styles.card} accessibilityLabel="Coach Says">
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.headerRight}>
          {cache ? (
            <Text style={[styles.badge, cache === 'hit' ? styles.badgeHit : styles.badgeMiss]}>
              {cache === 'hit' ? 'cache:hit' : 'cache:miss'}
            </Text>
          ) : null}
          <Pressable onPress={refresh} style={styles.refreshBtn} disabled={loading}>
            <Text style={[styles.refreshText, loading && { opacity: 0.5 }]}>↻ Refresh</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <>
            <Text
              style={styles.text}
              numberOfLines={mode === 'compact' && !expanded ? COLLAPSED_LINES : undefined}
              ellipsizeMode="tail"
            >
              {shortText}
            </Text>

            {reasonLine ? (
              <Text
                style={styles.reason}
                numberOfLines={mode === 'compact' && !expanded ? 1 : undefined}
                ellipsizeMode="tail"
              >
                Reason: {reasonLine}
              </Text>
            ) : null}
          </>
        )}
      </View>

      {mode === 'compact' && needsMore ? (
        <View style={styles.footerRow}>
          <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={6}>
            <Text style={styles.moreLink}>{expanded ? 'Less ▲' : 'More ▼'}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  badgeHit: { backgroundColor: '#ecfeff', color: '#0e7490' },
  badgeMiss: { backgroundColor: '#eef2ff', color: '#3730a3' },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  refreshText: { fontSize: 12, fontWeight: '700', color: '#111827' },
  body: { gap: 6 },
  text: { fontSize: 14, color: '#111827', lineHeight: 20 },
  reason: { fontSize: 12, color: '#6b7280' },
  footerRow: { alignItems: 'flex-start' },
  moreLink: { fontSize: 12, color: '#4f46e5', fontWeight: '700' },
});
