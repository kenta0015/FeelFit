// app/dev/_layout.tsx
import React from "react";
import { Tabs } from "expo-router";

export default function DevLayout() {
  return (
    <Tabs
      initialRouteName="micro-test"
      screenOptions={{
        headerShown: true,
        lazy: true,            // 初回フォーカス時にマウント
      }}
      detachInactiveScreens={false} // 切替でアンマウントしない（音切れ防止）
    >
      {/* 本番で使う検証画面だけ表示 */}
      <Tabs.Screen
        name="micro-test"
        options={{ title: "Micro", headerTitle: "Micro Commands" }}
      />
      <Tabs.Screen
        name="interval-timer-test"
        options={{ title: "Timer", headerTitle: "Interval Timer Test" }}
      />
      <Tabs.Screen
        name="coach-test"
        options={{ title: "Coach", headerTitle: "Coach Test" }}
      />

      {/* dev専用は非表示（URL直打ちでアクセスは可） */}
      <Tabs.Screen name="mixer-test" options={{ href: null }} />
      <Tabs.Screen name="tts-test" options={{ href: null }} />

      {/* 不要ルートを明示的に隠す */}
      <Tabs.Screen name="TempTest" options={{ href: null }} />
      <Tabs.Screen name="TempTest copy" options={{ href: null }} />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}
