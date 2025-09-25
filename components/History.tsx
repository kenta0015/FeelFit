// components/History.tsx
import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

type HistoryItem = {
  date: string; // e.g. "08/10"
  text: string; // e.g. "20m Monotony↑ → Variety day ✅"
};

type HistoryProps = {
  data: HistoryItem[];
};

export default function History({ data }: HistoryProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>History (14d)</Text>

      <FlatList
        data={data}
        keyExtractor={(item, index) => `${item.date}-${index}`}
        renderItem={({ item }) => (
          <Text style={styles.item}>
            • {item.date} {item.text}
          </Text>
        )}
      />
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
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 8, color: "#6366f1" },
  item: { fontSize: 14, marginBottom: 4, color: "#333" },
});
