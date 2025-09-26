// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TempTest from '../dev/TempTest'; // <-- exists only when showTest

const showTest = __DEV__ || process.env.EXPO_PUBLIC_SHOW_TEST === '1';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="suggestion" // Show Suggestion on launch
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      {/* 1) AI suggestion tab (leftmost) */}
      <Tabs.Screen
        name="suggestion"
        options={{
          title: 'Suggestion',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" color={color} size={size} />
          ),
        }}
      />

      {/* 2) Choose tab (formerly Workout) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Choose',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="options-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="stamina"
        options={{
          title: 'Stamina',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" color={color} size={size} />
          ),
        }}
      />

      {/* NEW: Player HUD tab (Phase 3) */}
      <Tabs.Screen
        name="player"
        options={{
          title: 'Player',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Phase 4 Test Tab (dev only) */}
      {showTest && (
        <Tabs.Screen
          name="TempTest"
          options={{
            title: 'Phase4 Test',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="barbell-outline" color={color} size={size} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}
