// components/RecoveryBanner.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  rationale: string;
  onRecover: () => void;
  onKeepNormal: () => void;
};

export default function RecoveryBanner({ rationale, onRecover, onKeepNormal }: Props) {
  return (
    <View style={styles.banner}>
      <Text style={styles.header}>⚠️ Recovery Suggestion</Text>
      <Text style={styles.text}>{rationale}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={onRecover}>
          <Text>🌿 Recover Today</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={onKeepNormal}>
          <Text>➡️ Keep Normal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: "#fffbe6", padding: 16, margin: 12, borderRadius: 12, borderColor: "#ffcc00", borderWidth: 1 },
  header: { fontWeight: "bold", marginBottom: 6 },
  text: { marginBottom: 8 },
  actions: { flexDirection: "row", justifyContent: "space-around" },
  btn: { padding: 8, backgroundColor: "#eee", borderRadius: 6 },
});
