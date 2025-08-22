// components/SuggestionCard.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import type { Plan } from "@/types/plan";

type Props = {
  plan: Plan;
  onStart: (plan: Plan) => void;
  onEdit: (plan: Plan) => void;
  onRefresh: () => void;
};

export default function SuggestionCard({ plan, onStart, onEdit, onRefresh }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.header}>Today’s Plan</Text>
      <Text style={styles.title}>🏷️ {plan.title}</Text>
      <Text style={styles.section}>⏱️ Blocks:</Text>
      <FlatList
        data={plan.blocks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.block}>
            • {item.title} ({item.duration}m{item.met ? `, MET ${item.met}` : ""})
          </Text>
        )}
      />
      <Text style={styles.section}>
        📌 Why this? {plan.why.join(" ")}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={() => onStart(plan)}>
          <Text>▶ Start</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => onEdit(plan)}>
          <Text>✏ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onRefresh}>
          <Text>↻ Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", padding: 16, margin: 12, borderRadius: 12, elevation: 2 },
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  title: { fontSize: 16, marginBottom: 8 },
  section: { marginTop: 8, fontWeight: "600" },
  block: { marginLeft: 12, fontSize: 14 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  btn: { padding: 8, backgroundColor: "#eee", borderRadius: 8 },
});
