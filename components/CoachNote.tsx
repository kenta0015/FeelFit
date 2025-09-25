// components/CoachNote.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type CoachNoteProps = {
  streak: number;
  weeklyStats: string; // e.g. "7d: 4 sessions / 132 min"
  message: string; // e.g. "Solid consistency. Light variety kept strain in check."
  onPlanRecovery: () => void;
  onViewHistory: () => void;
};

export default function CoachNote({
  streak,
  weeklyStats,
  message,
  onPlanRecovery,
  onViewHistory,
}: CoachNoteProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Coach Note (Today)</Text>

      <Text style={styles.meta}>
        Streak: {streak} | {weeklyStats}
      </Text>

      <Text style={styles.message}>"{message}"</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={onPlanRecovery}>
          <Text style={styles.buttonText}>Plan 15m Recovery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onViewHistory}>
          <Text style={styles.buttonText}>View History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 6, color: "#6366f1" },
  meta: { fontSize: 14, color: "#555", marginBottom: 8 },
  message: { fontSize: 14, fontStyle: "italic", marginBottom: 12 },
  actions: { flexDirection: "row", justifyContent: "space-between" },
  button: {
    backgroundColor: "#6366f1",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});

