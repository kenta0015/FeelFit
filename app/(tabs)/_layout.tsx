// app/(tabs)/_layout.tsx
import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import WorkoutOrchestrator from '@/components/WorkoutOrchestrator';
import BgmAutoplay from '@/components/BgmAutoplay';
import DailySummaryAgent from '@/features/dailySummary/DailySummaryAgent';

export default function TabLayout() {
  return (
    <>
      {/* Mount once */}
      <WorkoutOrchestrator />
      <BgmAutoplay />
      <DailySummaryAgent />

      <Tabs
        initialRouteName="suggestion"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            height: Platform.OS === 'web' ? 86 : 60,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'web' ? 20 : 8,
          },
          tabBarItemStyle: {
            paddingBottom: Platform.OS === 'web' ? 6 : 0,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarHideOnKeyboard: true,
        }}
      >
        {/* 1) Suggestion (AI) */}
        <Tabs.Screen
          name="suggestion"
          options={{
            title: 'Suggestion',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="sparkles-outline" color={color} size={size} />
            ),
          }}
        />

        {/* 2) Choose (manual) */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Choose',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="sparkles-outline" color={color} size={size} />
            ),
          }}
        />

        {/* 3) Stamina */}
        <Tabs.Screen
          name="stamina"
          options={{
            title: 'Stamina',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="barbell-outline" color={color} size={size} />
            ),
          }}
        />

        {/* 4) Player */}
        <Tabs.Screen
          name="player"
          options={{
            title: 'Player',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="musical-notes-outline" color={color} size={size} />
            ),
          }}
        />

        {/* 5) Progress */}
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trending-up-outline" color={color} size={size} />
            ),
          }}
        />

        {/* 6) Profile */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle-outline" color={color} size={size} />
            ),
          }}
        />

        {/* 7) Coach (prod) */}
        <Tabs.Screen
          name="coach"
          options={{
            title: 'Coach',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-ellipses-outline" color={color} size={size} />
            ),
          }}
        />

        {/* 8) Coach Debug (hidden from tabs, route remains) */}
        <Tabs.Screen
          name="coach-debug"
          options={{
            tabBarButton: () => null,
            title: 'Coach Debug',
          }}
        />

        {/* 9) Settings */}
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
