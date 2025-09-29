// app/(tabs)/progress/history.tsx
import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import History from '@/features/dailySummary/History';

export default function HistoryScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          title: 'History (14d)',
          headerShown: true,
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>History (14 days)</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <History days={14} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { padding: 16, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  backText: { color: '#3730a3', fontWeight: '700' },
});
