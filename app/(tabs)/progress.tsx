// app/(tabs)/progress.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { Calendar, Clock, Star, TrendingUp, Award, Target, Brain, Dumbbell } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWorkoutSessions as getLocalWorkoutSessions, getMoodLogs as getLocalMoodLogs, getUser as getAppUser } from '@/utils/storage';
import { EXERCISES } from '@/data/exercises';
import { WorkoutSession, MoodLog, User, ImprovementType } from '@/types';

const STORAGE_KEYS = {
  WORKOUT_SESSIONS: 'feel_fit_workout_sessions',
  MOOD_LOGS: 'feel_fit_mood_logs',
};

// NULLセーフに Capitalize
const safeCapitalize = (v?: string): string => {
  const s = (v ?? '').toString();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
};

export default function ProgressScreen() {
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const exerciseMap = useMemo(() => {
    const m = new Map<string, { name: string; duration: number; intensity: number }>();
    EXERCISES.forEach((e) => m.set(e.id, { name: e.name, duration: e.duration, intensity: e.intensity }));
    return m;
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const writeCache = async (sessions: WorkoutSession[], logs: MoodLog[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_SESSIONS, JSON.stringify(sessions)),
        AsyncStorage.setItem(STORAGE_KEYS.MOOD_LOGS, JSON.stringify(logs)),
      ]);
    } catch (e) {
      console.error('Cache write error:', e);
    }
  };

  // 列名ゆれ吸収。型は `types.ts` と一致させる
  const normalizeSession = (r: any): WorkoutSession => {
    const improvement =
      r.improvement_type ?? r.improvementtype ?? r.improvementType ?? 'mental';
    const start =
      r.start_time ?? r.starttime ?? r.startTime ?? r.created_at ?? r.createdat ?? r.createdAt ?? new Date().toISOString();
    const selectedTime =
      r.selected_time ?? r.selectedtime ?? r.selectedTime ?? 0;

    const workoutId = String(r.workout_id ?? r.workoutid ?? r.workoutId ?? '');
    const type: ImprovementType = ((): ImprovementType => {
      const s = String(improvement).toLowerCase();
      return s === 'mental' || s === 'physical' || s === 'both' ? (s as ImprovementType) : 'mental';
    })();

    return {
      id: r.id,
      user_id: r.user_id,
      workoutId,
      improvementType: type,
      startTime: String(start),
      endTime: (r.end_time ?? r.endtime ?? r.endTime) ? String(r.end_time ?? r.endtime ?? r.endTime) : undefined,
      completionPercentage: Number(r.completion_percentage ?? r.completionpercentage ?? r.completionPercentage ?? 0),
      staminaGained: Number(r.stamina_gained ?? r.staminagained ?? r.staminaGained ?? 0),
      physicalStaminaGained: Number(r.physical_stamina_gained ?? r.physicalstaminagained ?? r.physicalStaminaGained ?? 0),
      startEmotion: String(r.start_emotion ?? r.startemotion ?? r.startEmotion ?? ''), // 必須（空文字OK）
      startPhysicalPurpose: (r.start_physical_purpose ?? r.startphysicalpurpose ?? r.startPhysicalPurpose) ?? undefined,
      selectedTime: Number(selectedTime) || 0,
      postWorkoutRating: r.post_workout_rating ?? r.postworkoutrating ?? r.postWorkoutRating,
    };
  };

  const normalizeMood = (r: any): MoodLog => ({
    id: r.id,
    user_id: r.user_id,
    workoutSessionId: r.workout_session_id ?? r.workoutsessionid ?? r.workoutSessionId,
    rating: Number(r.rating ?? 0),
    createdAt: String(r.created_at ?? r.createdat ?? r.createdAt ?? new Date().toISOString()),
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // 1) キャッシュ即時表示
      const [cachedSessions, cachedLogs, appUser] = await Promise.all([
        getLocalWorkoutSessions(),
        getLocalMoodLogs(),
        getAppUser(),
      ]);
      setWorkoutSessions(
        cachedSessions.sort((a, b) => {
          const ad = a?.startTime ? new Date(a.startTime).getTime() : 0;
          const bd = b?.startTime ? new Date(b.startTime).getTime() : 0;
          return bd - ad;
        })
      );
      setMoodLogs(cachedLogs);
      setUser(appUser || null);

      // 2) Supabase 取得（.order は使わず、クライアントで sort）
      const authUser = (await supabase.auth.getUser()).data.user;
      const userId = appUser?.id ?? authUser?.id ?? null;
      if (!userId) throw new Error('no user id');

      const [{ data: sData, error: sErr }, { data: mData, error: mErr }] = await Promise.all([
        supabase.from('workout_sessions').select('*').eq('user_id', userId),
        supabase.from('mood_logs').select('*').eq('user_id', userId),
      ]);

      if (sErr) throw sErr;
      if (mErr) throw mErr;

      const normalizedSessions = (sData as any[]).map(normalizeSession).sort((a, b) => {
        const ad = a?.startTime ? new Date(a.startTime).getTime() : 0;
        const bd = b?.startTime ? new Date(b.startTime).getTime() : 0;
        return bd - ad;
      });

      const normalizedMoods = (mData as any[]).map(normalizeMood).sort((a, b) => {
        const ad = a?.createdAt ? new Date(a.createdAt as any).getTime() : 0;
        const bd = b?.createdAt ? new Date(b.createdAt as any).getTime() : 0;
        return bd - ad;
      });

      setWorkoutSessions(normalizedSessions);
      setMoodLogs(normalizedMoods);
      await writeCache(normalizedSessions, normalizedMoods);
    } catch (e) {
      console.error('Progress load error:', e);
      // 失敗時はキャッシュのみ
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const getTotalWorkouts = () => workoutSessions.length;

  const getTotalMinutes = () =>
    workoutSessions.reduce((total, session) => {
      const ex = exerciseMap.get(session.workoutId);
      const duration = ex?.duration || 0;
      return total + (duration * (session.completionPercentage ?? 0)) / 100;
    }, 0);

  const getWeeklyStreak = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return workoutSessions.filter((s) => (s?.startTime ? new Date(s.startTime) >= oneWeekAgo : false)).length;
  };

  const getTotalMentalStamina = () =>
    workoutSessions.reduce((total, s) => total + (s.staminaGained ?? 0), 0);

  const getTotalPhysicalStamina = () =>
    workoutSessions.reduce((total, s) => total + (s.physicalStaminaGained ?? 0), 0);

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getExerciseName = (workoutId: string) => exerciseMap.get(workoutId)?.name || 'Unknown Exercise';

  const getMoodRating = (sessionId: string) => moodLogs.find((log) => log.workoutSessionId === sessionId)?.rating;

  const getImprovementTypeIcon = (type: ImprovementType | string) => {
    const t = (String(type).toLowerCase() as ImprovementType);
    switch (t) {
      case 'mental':
        return <Brain size={16} color="#8b5cf6" />;
      case 'physical':
        return <Dumbbell size={16} color="#059669" />;
      case 'both':
        return <TrendingUp size={16} color="#f59e0b" />;
      default:
        return null;
    }
  };

  const renderStars = (rating: number) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          color={star <= rating ? '#fbbf24' : '#d1d5db'}
          fill={star <= rating ? '#fbbf24' : 'transparent'}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        {user && (
          <View style={styles.staminaContainer}>
            <View style={styles.staminaPreview}>
              <Brain size={16} color="#8b5cf6" />
              <Text style={styles.staminaText}>{user.mentalStamina}</Text>
            </View>
            <View style={styles.staminaPreview}>
              <Dumbbell size={16} color="#059669" />
              <Text style={styles.staminaText}>{user.physicalStamina}</Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Award size={24} color="#6366f1" />
            <Text style={styles.statValue}>{getTotalWorkouts()}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </View>

          <View style={styles.statCard}>
            <Brain size={24} color="#8b5cf6" />
            <Text style={styles.statValue}>{getTotalMentalStamina()}</Text>
            <Text style={styles.statLabel}>Mental Stamina</Text>
          </View>

          <View style={styles.statCard}>
            <Dumbbell size={24} color="#059669" />
            <Text style={styles.statValue}>{getTotalPhysicalStamina()}</Text>
            <Text style={styles.statLabel}>Physical Stamina</Text>
          </View>

          <View style={styles.statCard}>
            <Clock size={24} color="#f59e0b" />
            <Text style={styles.statValue}>{Math.round(getTotalMinutes())}</Text>
            <Text style={styles.statLabel}>Minutes Exercised</Text>
          </View>

          <View style={styles.statCard}>
            <Calendar size={24} color="#f59e0b" />
            <Text style={styles.statValue}>{getWeeklyStreak()}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>

          <View style={styles.statCard}>
            <Target size={24} color="#ef4444" />
            <Text style={styles.statValue}>
              {workoutSessions.filter((s) => s.completionPercentage === 100).length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Workout History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Workout History</Text>
          {loading ? (
            <Text style={styles.emptySubtitle}>Loading...</Text>
          ) : workoutSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No workouts yet</Text>
              <Text style={styles.emptySubtitle}>Complete your first workout to see your progress here!</Text>
            </View>
          ) : (
            workoutSessions.map((session) => {
              const moodRating = getMoodRating(session.id);
              const type = (session.improvementType ?? (session as any).improvementtype ?? 'mental') as ImprovementType;
              return (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.exerciseName}>{getExerciseName(session.workoutId)}</Text>
                      <View style={styles.sessionTypeContainer}>
                        {getImprovementTypeIcon(type)}
                        <Text style={styles.sessionTypeText}>{safeCapitalize(type)}</Text>
                      </View>
                      {!!session.startEmotion && <Text style={styles.emotionText}>Feeling: {session.startEmotion}</Text>}
                      {!!session.startPhysicalPurpose && (
                        <Text style={styles.purposeText}>Goal: {session.startPhysicalPurpose}</Text>
                      )}
                    </View>
                    <View style={styles.sessionMeta}>
                      <View style={styles.metaItem}>
                        <Calendar size={16} color="#6b7280" />
                        <Text style={styles.metaText}>
                          {session?.startTime ? formatDate(session.startTime) : '—'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.sessionStats}>
                    <View style={styles.statItem}>
                      <Clock size={16} color="#6b7280" />
                      <Text style={styles.statText}>{session.completionPercentage}% Complete</Text>
                    </View>
                    <View style={styles.statItem}>
                      {session.staminaGained > 0 && (
                        <>
                          <Brain size={16} color="#8b5cf6" />
                          <Text style={styles.statText}>+{session.staminaGained} Mental</Text>
                        </>
                      )}
                      {session.physicalStaminaGained > 0 && (
                        <>
                          <Dumbbell size={16} color="#059669" />
                          <Text style={styles.statText}>+{session.physicalStaminaGained} Physical</Text>
                        </>
                      )}
                    </View>
                  </View>

                  {moodRating && (
                    <View style={styles.moodSection}>
                      <Text style={styles.moodLabel}>Post-workout mood:</Text>
                      {renderStars(moodRating)}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Achievements */}
        {user && (
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsList}>
              {user.mentalStamina >= 25 && (
                <View style={styles.achievementItem}>
                  <Text style={styles.achievementEmoji}>🧠</Text>
                  <Text style={styles.achievementText}>First 25 Mental Stamina</Text>
                </View>
              )}
              {user.physicalStamina >= 25 && (
                <View style={styles.achievementItem}>
                  <Text style={styles.achievementEmoji}>💪</Text>
                  <Text style={styles.achievementText}>First 25 Physical Stamina</Text>
                </View>
              )}
              {getTotalWorkouts() >= 5 && (
                <View style={styles.achievementItem}>
                  <Text style={styles.achievementEmoji}>🔥</Text>
                  <Text style={styles.achievementText}>5 Workouts Completed</Text>
                </View>
              )}
              {workoutSessions.filter((s) => s.completionPercentage === 100).length >= 3 && (
                <View style={styles.achievementItem}>
                  <Text style={styles.achievementEmoji}>💪</Text>
                  <Text style={styles.achievementText}>3 Perfect Workouts</Text>
                </View>
              )}
              {user.mentalStamina >= 100 && user.physicalStamina >= 100 && (
                <View style={styles.achievementItem}>
                  <Text style={styles.achievementEmoji}>🌟</Text>
                  <Text style={styles.achievementText}>Balanced Warrior - 100 Both</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  staminaContainer: { flexDirection: 'row', gap: 12 },
  scrollView: { flex: 1, padding: 20 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500', textAlign: 'center', marginTop: 4 },

  historySection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },

  emptyState: { paddingVertical: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 },
  emptySubtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center' },

  sessionCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sessionHeader: { marginBottom: 12 },
  sessionInfo: { marginBottom: 8 },
  exerciseName: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  emotionText: { fontSize: 14, color: '#6b7280', fontStyle: 'italic' },
  purposeText: { fontSize: 14, color: '#6b7280', fontStyle: 'italic' },
  sessionTypeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sessionTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionMeta: { flexDirection: 'row', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#9ca3af' },

  sessionStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14, color: '#4b5563', fontWeight: '500' },

  moodSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  moodLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  starsContainer: { flexDirection: 'row', gap: 2 },

  achievementsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  achievementsList: { gap: 12 },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    gap: 12,
  },
  achievementEmoji: { fontSize: 24 },
  achievementText: { fontSize: 16, fontWeight: '600', color: '#1f2937' },

  staminaPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  staminaText: { fontSize: 16, fontWeight: 'bold', color: '#6366f1' },

  content: { flex: 1, padding: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
});
