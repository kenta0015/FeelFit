import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Dumbbell, Clock, StopCircle, PlayCircle } from 'lucide-react-native';
import { WorkoutSession, MoodLog } from '@/types';
import { saveWorkoutSession, saveMoodLog, getUser } from '@/utils/storage';

const formatSec = (s: number) => {
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, '0')}`;
};

const uuid = () => {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

export default function WorkoutTestScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [active, setActive] = useState<WorkoutSession | null>(null);
  const [remaining, setRemaining] = useState<number>(30);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUserId(u?.id ?? null);
    })();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStart30s = async () => {
    if (!userId) return;

    const now = new Date().toISOString();
    const session: WorkoutSession = {
      id: uuid(),
      user_id: userId,
      workoutId: 'debug-30s',
      startEmotion: '',
      improvementType: 'mental',
      selectedTime: 1,            // ← DBはint（実時間は30秒でカウント）
      startTime: now,
      completionPercentage: 0,
      staminaGained: 0,
      physicalStaminaGained: 0,
    };

    // ★ 開始時はDBに書かない（endtimeが必須のため）
    setActive(session);
    setRemaining(30);

    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onEnd = async () => {
    if (!active) return;

    const ended: WorkoutSession = {
      ...active,
      endTime: new Date().toISOString(),
      completionPercentage: 100,
      staminaGained: active.staminaGained || 10,
      physicalStaminaGained: active.physicalStaminaGained || 0,
    };
    // ★ 終了時にまとめて保存（start/end 両方あり）
    await saveWorkoutSession(ended);

    const mood: MoodLog = {
      id: uuid(),
      user_id: active.user_id,
      workoutSessionId: active.id,
      rating: 5,
      createdAt: new Date().toISOString(),
    };
    await saveMoodLog(mood);

    setActive(null);
    setRemaining(30);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Dumbbell size={20} color="#6366f1" />
          <Text style={styles.title}>Workout (Test)</Text>
        </View>

        {!userId && <Text style={styles.note}>Sign-in済みか確認してください。</Text>}

        <View style={styles.row}>
          <Clock size={18} color="#f59e0b" />
          <Text style={styles.label}>Duration</Text>
          <Text style={styles.value}>30 sec</Text>
        </View>

        {!active ? (
          <TouchableOpacity
            style={[styles.btn, styles.startBtn, !userId && styles.disabled]}
            onPress={handleStart30s}
            disabled={!userId}
          >
            <PlayCircle size={20} color="#fff" />
            <Text style={styles.btnText}>Start 30s Test</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.countdown}>{formatSec(remaining)}</Text>
            <TouchableOpacity style={[styles.btn, styles.endBtn]} onPress={onEnd}>
              <StopCircle size={20} color="#fff" />
              <Text style={styles.btnText}>End Now</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: '#6b7280', fontSize: 14 },
  value: { color: '#111827', fontSize: 14, fontWeight: '600' },
  note: { color: '#ef4444', fontSize: 12 },
  countdown: { fontSize: 32, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginVertical: 12 },
  btn: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  startBtn: { backgroundColor: '#10b981' },
  endBtn: { backgroundColor: '#ef4444' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
