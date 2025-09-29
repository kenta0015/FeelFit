// app/coach-qa-test.tsx
// Standalone test screen for CoachQACard (no changes to existing files).
// Navigate to /coach-qa-test to try presets, free text, and "Apply in Suggestion".

import React, { useMemo } from "react";
import { ScrollView, View, StyleSheet, Text } from "react-native";
import CoachQACard from "@/components/CoachQACard";

export default function CoachQATest() {
  // Safe mock plan for testing
  const plan = useMemo(
    () => ({
      title: "Balanced Focus",
      totalTime: 30,
      blocks: [
        { title: "Breathing", duration: 5, intensity: "low", category: "mindfulness" },
        { title: "Walk", duration: 15, intensity: "low", category: "cardio" },
        { title: "Stretch", duration: 10, intensity: "low", category: "mobility" },
      ],
      why: ["Balances calm + light cardio", "Low joint impact", "Fits busy days"],
    }),
    []
  );

  // Minimal SuggestionCtx-like object
  const ctx = useMemo(
    () => ({
      focus: "both",
      emotion: "neutral",
      timeAvailable: 30,
      intensityPref: "auto",
      equipment: [],
      constraints: [],
      disliked: [],
      readiness: undefined,
    }),
    []
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.wrap}>
        <Text style={styles.h1}>Coach Q&A — Test</Text>
        <CoachQACard plan={plan as any} ctx={ctx as any} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  wrap: { maxWidth: 800, width: "100%", alignSelf: "center", gap: 12 },
  h1: { fontSize: 20, fontWeight: "800" },
});
