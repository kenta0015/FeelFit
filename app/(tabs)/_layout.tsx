// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TempTest from '../dev/TempTest'; // <-- added import

const showTest = __DEV__ || process.env.EXPO_PUBLIC_SHOW_TEST === '1';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="suggestion" // ← 起動時は Suggestion を表示
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      {/* ① 一番左：AI提案タブ */}
      <Tabs.Screen
        name="suggestion"
        options={{
          title: 'Suggestion',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" color={color} size={size} />
          ),
        }}
      />

      {/* ② 旧 Workout → ユーザーが選ぶタブに改名 */}
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

      {/* Phase 4 Test Tab */}
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
