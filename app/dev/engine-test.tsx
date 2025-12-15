// app/dev/engine-test.tsx
// Simple dev screen: shows Engine state and dispatches unified events.
// Open: /dev/engine-test

import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, TextInput } from "react-native";

// Ensure engine module is loaded (side effects only)
import "../../lib/workoutEngine";

type AnyObj = { [k: string]: any };

export default function EngineTestScreen() {
  const [total, setTotal] = useState<number>(600);
  const [remain, setRemain] = useState<number>(600);
  const [running, setRunning] = useState<boolean>(false);
  const [origin, setOrigin] = useState<string>("hud");

  useEffect(() => {
    const g: AnyObj = typeof globalThis !== "undefined" ? (globalThis as AnyObj) : {};
    const eng: AnyObj = g.__feelFit && g.__feelFit.engine ? g.__feelFit.engine : null;

    function pull() {
      if (!eng) return;
      try {
        setTotal(Number(eng.getTotalSeconds && eng.getTotalSeconds()) || 0);
        setRemain(Number(eng.getRemainingSeconds && eng.getRemainingSeconds()) || 0);
        setRunning(Boolean(eng.isRunning && eng.isRunning()));
      } catch {}
    }

    let off: any = null;
    try { off = eng && eng.onTick && eng.onTick(pull); } catch {}
    pull();

    return () => { try { off && off(); } catch {} };
  }, []);

  function emit(type: string, detail: AnyObj) {
    try { window.dispatchEvent(new CustomEvent(type, { detail })); } catch {}
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Engine Dev</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Origin</Text>
        <TextInput
          value={origin}
          onChangeText={setOrigin}
          style={styles.input}
          placeholder="hud | player | miniplayer"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Total (sec)</Text>
        <TextInput
          value={String(total)}
          onChangeText={(v) => setTotal(Number(v) || 0)}
          style={styles.input}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.line}>Running: {running ? "YES" : "NO"}</Text>
        <Text style={styles.line}>Remain: {remain}s</Text>
        <Text style={styles.line}>Total : {total}s</Text>
      </View>

      <View style={styles.btnRow}>
        <Pressable style={styles.btn} onPress={() => emit("feelFit:workout-start", { origin, totalSec: total })}>
          <Text style={styles.btnText}>Start</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => emit("feelFit:workout-pause", { origin })}>
          <Text style={styles.btnText}>Pause</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => emit("feelFit:workout-resume", { origin })}>
          <Text style={styles.btnText}>Resume</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => emit("feelFit:workout-finish", { origin })}>
          <Text style={styles.btnText}>Finish</Text>
        </Pressable>
      </View>

      <View style={styles.btnRow}>
        <Pressable style={[styles.btn, styles.danger]} onPress={() => (window as AnyObj).__ffHardReset && (window as AnyObj).__ffHardReset()}>
          <Text style={styles.btnText}>Hard Reset</Text>
        </Pressable>
      </View>

      <Text style={styles.note}>Open this screen at /dev/engine-test</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12 },
  h1: { fontSize: 22, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { width: 100, color: "#374151", fontWeight: "700" },
  input: { flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  card: { padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, backgroundColor: "#f9fafb", gap: 4 },
  line: { fontFamily: "monospace" as any },
  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  btn: { backgroundColor: "#2563eb", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  danger: { backgroundColor: "#ef4444" },
  btnText: { color: "white", fontWeight: "700" },
  note: { marginTop: 8, color: "#6b7280" },
});
