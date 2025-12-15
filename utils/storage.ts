// utils/storage.ts
import { supabase } from '@/lib/supabase';
import { User, WorkoutSession, MoodLog, ImprovementType } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_ID: 'feel_fit_user_id',
  WORKOUT_SESSIONS: 'feel_fit_workout_sessions',
  MOOD_LOGS: 'feel_fit_mood_logs',
};

const upsertById = <T extends { id: string }>(arr: T[], item: T) => {
  const idx = arr.findIndex((x) => x.id === item.id);
  if (idx >= 0) arr[idx] = item;
  else arr.push(item);
  return arr;
};

// ---------- Local helpers ----------
const getUserIdFromLocal = async (): Promise<string | null> => {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
    return v || null;
  } catch {
    return null;
  }
};

const setUserIdToLocal = async (id: string) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, id);
  } catch (e) {
    console.error('Failed to persist user id:', e);
  }
};

const resolveUserId = async (): Promise<string | null> => {
  const local = await getUserIdFromLocal();
  if (local) return local;
  const authUser = (await supabase.auth.getUser()).data.user;
  const id = authUser?.id ?? null;
  if (id) await setUserIdToLocal(id);
  return id;
};

// ========== User ==========
export const getUser = async (): Promise<User | null> => {
  try {
    const userId = await resolveUserId();
    if (!userId) return null;

    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error || !data) {
      console.error('getUser error:', error);
      return null;
    }

    const u = data as any;
    const created =
      typeof u.createdAt === 'string' ? u.createdAt
      : typeof u.created_at === 'string' ? u.created_at
      : new Date().toISOString();

    const user: User = {
      id: u.id,
      name: u.name ?? '',
      mentalStamina: Number(u.mentalStamina ?? u.mental_stamina ?? 0),
      physicalStamina: Number(u.physicalStamina ?? u.physical_stamina ?? 0),
      audioVoicePreference: (u.audioVoicePreference ?? u.audio_voice_preference ?? 'female') as User['audioVoicePreference'],
      createdAt: created,
    };
    return user;
  } catch (e) {
    console.error('getUser exception:', e);
    return null;
  }
};

export const saveUser = async (user: User): Promise<void> => {
  try {
    const payload = {
      id: user.id,
      name: user.name,
      mentalStamina: user.mentalStamina,
      physicalStamina: user.physicalStamina,
      audioVoicePreference: user.audioVoicePreference,
      createdAt: typeof user.createdAt === 'string' ? user.createdAt : new Date(user.createdAt as any).toISOString(),
    } as any;

    const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    await setUserIdToLocal(user.id);
  } catch (e) {
    console.error('saveUser error:', e);
  }
};

export const createUser = async (name: string): Promise<User> => {
  const authUser = (await supabase.auth.getUser()).data.user;
  const id = authUser?.id ?? cryptoRandomUUID();

  const newUser: User = {
    id,
    name,
    mentalStamina: 0,
    physicalStamina: 0,
    audioVoicePreference: 'female',
    createdAt: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from('users').insert(newUser as any);
    if (error) throw error;
  } catch (e) {
    console.error('createUser insert error (continuing with local id persisted):', e);
  }

  await setUserIdToLocal(id);
  return newUser;
};

// ========== Workout Sessions ==========
const toImprovement = (v: any): ImprovementType => {
  const s = String(v ?? '').toLowerCase();
  if (s === 'mental' || s === 'physical' || s === 'both') return s as ImprovementType;
  return 'mental';
};

const normalizeSession = (r: any): WorkoutSession => {
  const workoutId = r.workout_id ?? r.workoutid ?? r.workoutId ?? '';
  const start =
    r.start_time ?? r.starttime ?? r.startTime ?? r.created_at ?? r.createdat ?? r.createdAt ?? new Date().toISOString();

  return {
    id: r.id,
    user_id: r.user_id,
    workoutId: String(workoutId),
    improvementType: toImprovement(r.improvement_type ?? r.improvementtype ?? r.improvementType),
    startTime: String(start),
    endTime: (r.end_time ?? r.endtime ?? r.endTime) ? String(r.end_time ?? r.endtime ?? r.endTime) : undefined,
    completionPercentage: Number(r.completion_percentage ?? r.completionpercentage ?? r.completionPercentage ?? 0),
    staminaGained: Number(r.stamina_gained ?? r.staminagained ?? r.staminaGained ?? 0),
    physicalStaminaGained: Number(r.physical_stamina_gained ?? r.physicalstaminagained ?? r.physicalStaminaGained ?? 0),
    startEmotion: String(r.start_emotion ?? r.startemotion ?? r.startEmotion ?? ''),
    startPhysicalPurpose: (r.start_physical_purpose ?? r.startphysicalpurpose ?? r.startPhysicalPurpose) ?? undefined,
    selectedTime: Number(r.selected_time ?? r.selectedtime ?? r.selectedTime ?? 0),
    postWorkoutRating: r.post_workout_rating ?? r.postworkoutrating ?? r.postWorkoutRating,
  };
};

// 送信はDB列のみ & selectedtimeは整数化
const denormalizeSession = (s: WorkoutSession) => {
  const payload: any = {
    id: s.id,
    user_id: s.user_id,
    workoutid: s.workoutId,
    improvementtype: s.improvementType,
    starttime: s.startTime,
    endtime: s.endTime ?? null,
    completionpercentage: s.completionPercentage ?? 0,
    staminagained: s.staminaGained ?? 0,
    physicalstaminagained: s.physicalStaminaGained ?? 0,
    startemotion: s.startEmotion ?? '',
    startphysicalpurpose: s.startPhysicalPurpose ?? null,
    selectedtime: Math.round(s.selectedTime ?? 0),
  };
  return payload;
};

export const getWorkoutSessions = async (): Promise<WorkoutSession[]> => {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_SESSIONS);
      return json ? (JSON.parse(json) as WorkoutSession[]) : [];
    }

    const { data, error } = await supabase.from('workout_sessions').select('*').eq('user_id', userId);
    if (error || !Array.isArray(data)) {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_SESSIONS);
      return json ? (JSON.parse(json) as WorkoutSession[]) : [];
    }

    const normalized = (data as any[]).map(normalizeSession);
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_SESSIONS, JSON.stringify(normalized));
    return normalized;
  } catch (e) {
    console.error('getWorkoutSessions error:', e);
    const json = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_SESSIONS);
    return json ? (JSON.parse(json) as WorkoutSession[]) : [];
  }
};

export const saveWorkoutSession = async (session: WorkoutSession): Promise<void> => {
  try {
    const payload = denormalizeSession(session);
    const { error } = await supabase.from('workout_sessions').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    const cached = await getWorkoutSessions();
    upsertById(cached, session);
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_SESSIONS, JSON.stringify(cached));
  } catch (e) {
    console.error('saveWorkoutSession error (cached only):', e);
    try {
      const cached = await getWorkoutSessions();
      upsertById(cached, session);
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_SESSIONS, JSON.stringify(cached));
    } catch {}
  }
};

// ========== Mood Logs ==========
const normalizeMood = (r: any): MoodLog => ({
  id: r.id,
  user_id: r.user_id,
  workoutSessionId: r.workout_session_id ?? r.workoutsessionid ?? r.workoutSessionId,
  rating: Number(r.rating ?? 0),
  createdAt: String(r.created_at ?? r.createdat ?? r.createdAt ?? new Date().toISOString()),
});

const denormalizeMood = (m: MoodLog) => ({
  id: m.id,
  user_id: m.user_id,
  workoutsessionid: m.workoutSessionId,
  rating: m.rating,
  createdat: m.createdAt,
});

export const getMoodLogs = async (): Promise<MoodLog[]> => {
  try {
    const userId = await resolveUserId();
    if (!userId) {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.MOOD_LOGS);
      return json ? (JSON.parse(json) as MoodLog[]) : [];
    }

    const { data, error } = await supabase.from('mood_logs').select('*').eq('user_id', userId);
    if (error || !Array.isArray(data)) {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.MOOD_LOGS);
      return json ? (JSON.parse(json) as MoodLog[]) : [];
    }

    const normalized = (data as any[]).map(normalizeMood);
    await AsyncStorage.setItem(STORAGE_KEYS.MOOD_LOGS, JSON.stringify(normalized));
    return normalized;
  } catch (e) {
    console.error('getMoodLogs error:', e);
    const json = await AsyncStorage.getItem(STORAGE_KEYS.MOOD_LOGS);
    return json ? (JSON.parse(json) as MoodLog[]) : [];
  }
};

export const saveMoodLog = async (log: MoodLog): Promise<void> => {
  try {
    const user_id = log.user_id ?? (await resolveUserId());
    if (!user_id) throw new Error('no user id');

    const payload = denormalizeMood({ ...log, user_id });
    const { error } = await supabase.from('mood_logs').upsert(payload, { onConflict: 'id' });
    if (error) throw error;

    const cached = await getMoodLogs();
    upsertById(cached, { ...log, user_id });
    await AsyncStorage.setItem(STORAGE_KEYS.MOOD_LOGS, JSON.stringify(cached));
  } catch (e) {
    console.error('saveMoodLog error (cached only):', e);
    try {
      const cached = await getMoodLogs();
      upsertById(cached, log);
      await AsyncStorage.setItem(STORAGE_KEYS.MOOD_LOGS, JSON.stringify(cached));
    } catch {}
  }
};

// ========== Stamina update ==========
export const updateMentalStamina = async (staminaGain: number): Promise<void> => {
  try {
    const user = await getUser();
    if (!user) return;
    const updated: User = { ...user, mentalStamina: user.mentalStamina + staminaGain };
    await saveUser(updated);
  } catch (e) {
    console.error('updateMentalStamina error:', e);
  }
};

export const updatePhysicalStamina = async (staminaGain: number): Promise<void> => {
  try {
    const user = await getUser();
    if (!user) return;
    const updated: User = { ...user, physicalStamina: user.physicalStamina + staminaGain };
    await saveUser(updated);
  } catch (e) {
    console.error('updatePhysicalStamina error:', e);
  }
};

// ---------- utils ----------
function cryptoRandomUUID() {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}
