// features/dailySummary/History.tsx
// 14-day history list (local cache). Pure UI; no side effects.

import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getLocalSummaries, type DailySummary } from './storage';

type Props = {
  days?: number; // default: 14
};

export default function History({ days = 14 }: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DailyRow[]>([]);

  const range = useMemo(() => {
    const now = new Date();
    const arr: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
  }, [days]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const all = await getLocalSummaries();
        if (!alive) return;
        // De-duplicate by date (keep latest)
        const byDate = new Map<string, DailySummary>();
        for (const s of all) {
          const prev = byDate.get(s.date);
          if (!prev) byDate.set(s.date, s);
          else {
            // choose the one with non-empty text, or latest metrics strain as tiebreak
            const choose =
              (s.text && !prev.text) || (s.metrics?.strain ?? 0) >= (prev.metrics?.strain ?? 0)
                ? s
                : prev;
            byDate.set(s.date, choose);
          }
        }
        const rows: DailyRow[] = range
          .map((d) => {
            const s = byDate.get(d);
            return toRow(d, s || null);
          })
          .filter(Boolean) as DailyRow[];
        setItems(rows);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [range]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.wrap} accessibilityLabel="History (14d)">
      <Text style={styles.title}>History ({days}d)</Text>
      <FlatList
        data={items}
        keyExtractor={(it) => it.date}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.date}>{formatMMDD(item.date)}</Text>
            <Text style={styles.text}>{item.line}</Text>
          </View>
        )}
      />
    </View>
  );
}

// --- helpers ----------------------------------------------------------------

type DailyRow = { date: string; line: string };

function toRow(date: string, s: DailySummary | null): DailyRow | null {
  if (!s) return { date, line: '—' };
  const m = s.metrics;
  const badges: string[] = [];

  // Heuristic badges similar to spec examples
  if (m.monotony >= 3.5) badges.push('Monotony↑ → Variety day ✅');
  if ((m.lastSessionMinutes ?? 0) >= 25) badges.push('25m+');
  if (m.avgIntensity7d >= 6) badges.push('Intensity↑');

  const base =
    s.text?.length
      ? clip(s.text, 64)
      : `${m.sessions7d} sessions / ${m.minutes7d} min (7d)`;

  const line = badges.length ? `${base} — ${badges.join(' / ')}` : base;

  return { date, line };
}

function clip(t: string, n: number) {
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}

function formatMMDD(iso: string) {
  // iso = YYYY-MM-DD
  return `${iso.slice(5, 7)}/${iso.slice(8, 10)}`;
}

// --- styles -----------------------------------------------------------------

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  sep: {
    height: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  date: {
    width: 52,
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  loading: { padding: 20, alignItems: 'center', justifyContent: 'center' },
});
