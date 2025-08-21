// components/EditPlanSheet.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import type { Plan } from "@/types/plan";

type Props = {
  plan: Plan;
  visible: boolean;
  onSave: (updated: Plan) => void;
  onCancel: () => void;
};

export default function EditPlanSheet({ plan, visible, onSave, onCancel }: Props) {
  const [time, setTime] = useState(plan.totalTime);
  const [intensity, setIntensity] = useState<"low" | "med" | "high">(plan.blocks[0].intensity);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.sheet}>
        <Text style={styles.header}>Edit Plan</Text>

        <Text>Time:</Text>
        <View style={styles.row}>
          {[15, 20, 25, 30].map((t) => (
            <TouchableOpacity key={t} style={styles.choice} onPress={() => setTime(t)}>
              <Text style={{ fontWeight: t === time ? "bold" : "normal" }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text>Intensity:</Text>
        <View style={styles.row}>
          {["low", "med", "high"].map((i) => (
            <TouchableOpacity key={i} style={styles.choice} onPress={() => setIntensity(i as any)}>
              <Text style={{ fontWeight: i === intensity ? "bold" : "normal" }}>{i}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onSave({ ...plan, totalTime: time })}>
            <Text>✅ Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel}>
            <Text>❌ Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: "#fff", marginTop: "auto", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  row: { flexDirection: "row", marginVertical: 8 },
  choice: { marginHorizontal: 8, padding: 6, backgroundColor: "#eee", borderRadius: 6 },
  actions: { flexDirection: "row", justifyContent: "space-around", marginTop: 16 },
});
