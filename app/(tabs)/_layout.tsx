// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Clock, Activity, User, Dumbbell } from 'lucide-react-native';

const showTest = (__DEV__ || process.env.EXPO_PUBLIC_SHOW_TEST === '1');

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
      }}
    >
      {/* もとの index を「workout」として表示 */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'workout',
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="stamina"
        options={{
          title: 'Stamina',
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />

      {/* 開発時だけ test 画面を表示 */}
      {showTest && (
        <Tabs.Screen
          name="workout"
          options={{
            title: 'workout(test)',
            tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} />,
          }}
        />
      )}
    </Tabs>
  );
}
