// components/TwoChoicePrompt.tsx
import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  onChoice: (bias: "harder" | "easier" | "none") => void;
};

export default function TwoChoicePrompt({ onChoice }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => onChoice("none"), 3000);
    return () => clearTimeout(timer);
  }, [onChoice]);

  return (
    <View style={styles.card}>
      <Text style={styles.header}>How do you feel today? (auto close in 3s)</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.choice} onPress={() => onChoice("harder")}>
          <Text>💥 Push harder</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.choice} onPress={() => onChoice("easier")}>
          <Text>🌿 Take it easy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", padding: 16, margin: 12, borderRadius: 12, elevation: 2 },
  header: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-around" },
  choice: { padding: 12, backgroundColor: "#eee", borderRadius: 8 },
});
