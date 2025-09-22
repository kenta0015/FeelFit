// app/dev/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";

export default function DevLayout() {
  return (
    <Tabs
      initialRouteName="mixer-test"
      screenOptions={{
        headerShown: true,
        lazy: true, // mount on first focus only
      }}
      detachInactiveScreens={false} // keep screens mounted (audio won’t cut)
    >
      <Tabs.Screen
        name="mixer-test"
        options={{ title: "Mixer", headerTitle: "Mixer Test" }}
      />
      <Tabs.Screen
        name="micro-test"
        options={{ title: "Micro", headerTitle: "Micro Commands" }}
      />
      <Tabs.Screen
        name="tts-test"
        options={{ title: "TTS", headerTitle: "TTS Test" }}
      />
      <Tabs.Screen
        name="coach-test"
        options={{ title: "Coach", headerTitle: "Coach Test" }}
      />
      <Tabs.Screen
        name="interval-timer-test"
        options={{ title: "Timer", headerTitle: "Interval Timer Test" }}
      />

      {/* hide unused/legacy routes */}
      <Tabs.Screen name="TempTest" options={{ href: null }} />
      <Tabs.Screen name="TempTest copy" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
