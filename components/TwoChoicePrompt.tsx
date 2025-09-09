// components/TwoChoicePrompt.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  onPushHarder: () => void;
  onTakeEasy: () => void;
  autoCloseMs?: number;
  // 互換のため（親で条件付きレンダー推奨だが、型エラー回避で残す）
  visible?: boolean;
};

export default function TwoChoicePrompt({
  onPushHarder,
  onTakeEasy,
  autoCloseMs = 3000,
}: Props) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setOpen(false), autoCloseMs);
    return () => clearTimeout(id);
  }, [autoCloseMs]);

  if (!open) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>How do you feel today? (auto close in {Math.round(autoCloseMs / 1000)}s)</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.choice, styles.left]} onPress={() => { onPushHarder(); setOpen(false); }}>
          <Text style={styles.leftText}>💥 Push harder</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.choice, styles.right]} onPress={() => { onTakeEasy(); setOpen(false); }}>
          <Text style={styles.rightText}>🌿 Take it easy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#f3f4f6', padding: 12, borderRadius: 12, gap: 8,
  },
  title: { color: '#111827', fontWeight: '700' },
  row: { flexDirection: 'row', gap: 12 },
  choice: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  left: { backgroundColor: '#fef3c7' },
  right: { backgroundColor: '#dcfce7' },
  leftText: { color: '#92400e', fontWeight: '700' },
  rightText: { color: '#065f46', fontWeight: '700' },
});
