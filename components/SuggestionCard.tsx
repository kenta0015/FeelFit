import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import type { Plan } from "@/types/plan";
import { useSuggestionText } from "@/hooks/useSuggestionText";

type Props = {
  plan: Plan;
  ctx?: any; // readiness/time etc.
  onStart: (plan: Plan) => void;
  onEdit: (plan: Plan) => void;
  onRefresh: () => void;
};

export default function SuggestionCard({ plan, ctx, onStart, onEdit, onRefresh }: Props) {
  const aiText = useSuggestionText(plan, ctx);

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
        {aiText
          ? `🤖 Coach: "${aiText}"`
          : `📌 Why this? ${plan.why.join(" ")}`}
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
