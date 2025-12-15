// app/(tabs)/stamina.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { TrendingUp, Brain, Dumbbell } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import AnimatedStaminaIndicator from '@/components/AnimatedStaminaIndicator';

// Coach + store
import CoachCard from '@/components/CoachCard';
import { useAppStore } from '@/state/appStore';

// Demo coach tester (Phase 1 verification)
import { coachWithOpenAI } from '@/ai/openaiClient';
import { getPrefs } from '@/utils/prefs';

export default function StaminaScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // demo coach tester state
  const [coachOut, setCoachOut] = useState<string | null>(null);
  const [testingAI, setTestingAI] = useState(false);

  // publish stamina signal to global store
  const setMetrics = useAppStore((s) => s.setMetrics);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    let session = null;

    for (let i = 0; i < 5; i++) {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      session = currentSession;
      if (session?.user?.id) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('User fetch error:', error);
    }

    if (!data) {
      const { data: inserted, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            email: userEmail,
            mentalStamina: 0,
            physicalStamina: 0,
          },
        ])
        .select()
        .maybeSingle();

      if (insertError) {
        console.error('Insert error:', insertError);
      } else {
        setUser(inserted);
      }
    } else {
      setUser(data);
    }

    setLoading(false);
  };

  const getStaminaLevel = (stamina: number) => {
    if (stamina >= 200) return { level: 'Elite', color: '#7c3aed', progress: 100 };
    if (stamina >= 150) return { level: 'Advanced', color: '#059669', progress: 80 };
    if (stamina >= 100) return { level: 'Intermediate', color: '#0ea5e9', progress: 60 };
    if (stamina >= 50) return { level: 'Beginner+', color: '#f59e0b', progress: 40 };
    if (stamina >= 25) return { level: 'Beginner', color: '#ef4444', progress: 20 };
    return { level: 'Starter', color: '#6b7280', progress: 10 };
  };

  // publish a 0–100 combined stamina to the store
  useEffect(() => {
    if (!user) return;
    const mental = getStaminaLevel(user.mentalStamina).progress;
    const physical = getStaminaLevel(user.physicalStamina).progress;
    const stamina = Math.max(0, Math.min(100, Math.round((mental + physical) / 2)));
    setMetrics({ stamina });
  }, [user, setMetrics]);

  // ---------- Phase 1 demo: Ask Coach with fallback ----------
  const runCoachTest = async () => {
    setTestingAI(true);
    try {
      const prefs = await getPrefs();
      // after
      const useAI = prefs.useAiText !== false; // default ON
      // or more defensive if older prefs might not have the key:
      // const useAI = prefs?.useAiText ?? true;

      if (useAI) {
        const res = await coachWithOpenAI(
          'Give one short, practical stamina tip in about one sentence.'
        );
        setCoachOut(res ?? 'AI unavailable — using fallback: Sip water between sets.');
      } else {
        setCoachOut('AI text is off — fallback: Prioritize sleep for stamina gains.');
      }
    } finally {
      setTestingAI(false);
    }
  };
  // -----------------------------------------------------------

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const mentalStaminaInfo = getStaminaLevel(user.mentalStamina);
  const physicalStaminaInfo = getStaminaLevel(user.physicalStamina);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stamina</Text>
        <View style={styles.totalStamina}>
          <TrendingUp size={20} color="#6366f1" />
          <Text style={styles.totalText}>
            {user.mentalStamina + user.physicalStamina}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Phase 1 demo block: press to verify AI ON/OFF and fallback */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Coach (demo)</Text>
          <TouchableOpacity
            onPress={runCoachTest}
            disabled={testingAI}
            style={[styles.demoBtn, testingAI && { opacity: 0.6 }]}
          >
            <Text style={styles.demoBtnText}>{testingAI ? 'Testing…' : 'Ask Coach'}</Text>
          </TouchableOpacity>
          {coachOut ? <Text style={styles.demoOut}>{coachOut}</Text> : null}
        </View>

        {/* Rules/AI Coach card (your proper Phase-1 component) */}
        <View style={{ marginBottom: 16 }}>
          <CoachCard />
        </View>

        <View style={styles.staminaCard}>
          <View style={styles.cardHeader}>
            <Brain size={24} color="#8b5cf6" />
            <Text style={styles.cardTitle}>Mental Stamina</Text>
          </View>
          <AnimatedStaminaIndicator
            stamina={user.mentalStamina}
            level={mentalStaminaInfo.level}
            color={mentalStaminaInfo.color}
            progress={mentalStaminaInfo.progress}
          />
        </View>

        <View style={styles.staminaCard}>
          <View style={styles.cardHeader}>
            <Dumbbell size={24} color="#059669" />
            <Text style={styles.cardTitle}>Physical Stamina</Text>
          </View>
          <AnimatedStaminaIndicator
            stamina={user.physicalStamina}
            level={physicalStaminaInfo.level}
            color={physicalStaminaInfo.color}
            progress={physicalStaminaInfo.progress}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  totalStamina: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  totalText: { fontSize: 16, fontWeight: 'bold', color: '#6366f1' },
  content: { flex: 1, padding: 20 },

  // cards
  demoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  demoTitle: { fontWeight: '700', fontSize: 16, marginBottom: 8, color: '#111827' },
  demoBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  demoBtnText: { color: 'white', fontWeight: '700' },
  demoOut: { marginTop: 12, color: '#111827' },

  staminaCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    alignItems: 'center',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  loading: { fontSize: 18, color: '#6b7280', textAlign: 'center', marginTop: 100 },
});
