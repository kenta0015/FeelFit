// components/CoachQACard.tsx
// Coach mini Q&A card (MVP): presets → chat log → free input → Apply in Suggestion.
import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import type { Plan } from '@/types/plan';
import type { SuggestionCtx } from '@/hooks/usePlanSuggestion';
import type { CoachMessage } from '@/types/coach';
import { useCoachQA } from '@/hooks/useCoachQA';
import { setPendingActions } from '@/state/coachActions';

type Props = {
  plan: Plan;
  ctx: SuggestionCtx;
};

const PRESETS = [
  'Why this plan?',
  'Do you have a 20-minute version?',
  'Indoor only',
  'Be gentle on joints',
  'Increase intensity',
];

export default function CoachQACard({ plan, ctx }: Props) {
  const { messages, busy, ask } = useCoachQA({ plan, ctx });
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const lastCoach = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'coach') return messages[i] as CoachMessage;
    }
    return null;
  }, [messages]);

  const onPreset = (label: string) => {
    ask({ kind: 'preset', label });
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const onSend = () => {
    const t = input.trim();
    if (!t || busy) return;
    setInput('');
    ask({ kind: 'text', text: t });
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const onApply = () => {
    const actions = lastCoach?.actions ?? [];
    setPendingActions(actions);
    router.navigate('/(tabs)/suggestion');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Coach Q&A</Text>

      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <Pressable key={p} style={[styles.chip, busy && styles.disabled]} onPress={() => onPreset(p)} disabled={busy}>
            <Text style={styles.chipText}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView ref={scrollRef} style={styles.log} contentContainerStyle={{ gap: 8 }}>
        {messages.length === 0 && (
          <Text style={styles.hint}>Ask why this plan fits you, request alternatives, or constraints. I’ll keep it brief.</Text>
        )}

        {messages.map((m) => (
          <View key={m.id} style={[styles.bubble, m.role === 'coach' ? styles.coach : styles.user]}>
            <Text style={styles.bubbleText}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a follow-up..."
          value={input}
          onChangeText={setInput}
          editable={!busy}
          onSubmitEditing={onSend}
          returnKeyType="send"
        />
        <Pressable style={[styles.sendBtn, busy && styles.disabled]} onPress={onSend} disabled={busy}>
          <Text style={styles.sendText}>{busy ? '...' : 'Send'}</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.applyBtn, (!lastCoach?.actions?.length || busy) && styles.disabled]}
        onPress={onApply}
        disabled={!lastCoach?.actions?.length || busy}
      >
        <Text style={styles.applyText}>Apply in Suggestion</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', gap: 10 },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },

  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#c7d2fe', backgroundColor: '#eef2ff' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#3730a3' },

  log: { maxHeight: 220, borderRadius: 10, borderWidth: 1, borderColor: '#f3f4f6', padding: 8 },
  hint: { color: '#6b7280', fontStyle: 'italic' },

  bubble: { maxWidth: '88%', padding: 10, borderRadius: 12 },
  user: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6' },
  coach: { alignSelf: 'flex-end', backgroundColor: '#ecfeff' },
  bubbleText: { color: '#111827' },

  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', paddingHorizontal: 10, backgroundColor: '#fff' },
  sendBtn: { height: 40, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
  sendText: { color: '#fff', fontWeight: '700' },

  applyBtn: { height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366f1' },
  applyText: { color: '#fff', fontWeight: '800' },

  disabled: { opacity: 0.6 },
});
