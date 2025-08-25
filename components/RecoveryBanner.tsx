import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  /** 表示フラグ（visible or show どちらでも可） */
  visible?: boolean;
  show?: boolean;

  /** 理由（reason or message どちらでも可） */
  reason?: string;
  message?: string;

  /** 押下時のコールバック（任意） */
  onAccept?: () => void;
  onDecline?: () => void;

  /** 押下後に自動で非表示にする（デフォルト true） */
  autoHideOnAction?: boolean;
};

export default function RecoveryBanner({
  visible,
  show,
  reason,
  message,
  onAccept,
  onDecline,
  autoHideOnAction = true,
}: Props) {
  const propShow = typeof visible === 'boolean' ? visible : !!show;
  const text = reason ?? message ?? '';

  // 内部可視状態（押下後の自動クローズに使う）
  const [isShown, setIsShown] = useState<boolean>(propShow);

  useEffect(() => {
    setIsShown(propShow);
  }, [propShow]);

  if (!isShown) return null;

  const handleAccept = () => {
    try { onAccept?.(); } finally { if (autoHideOnAction) setIsShown(false); }
  };
  const handleDecline = () => {
    try { onDecline?.(); } finally { if (autoHideOnAction) setIsShown(false); }
  };

  return (
    <View style={styles.banner} accessibilityRole="summary">
      <Text style={styles.title}>⚠️ Recovery Suggestion</Text>
      <Text style={styles.reason}>{text}</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, styles.accept]}
          onPress={handleAccept}
          accessibilityRole="button"
          accessibilityLabel="Recover Today"
        >
          <Text style={styles.acceptText}>Recover Today 🌿</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.decline]}
          onPress={handleDecline}
          accessibilityRole="button"
          accessibilityLabel="Keep Normal"
        >
          <Text style={styles.declineText}>Keep Normal ➡️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  title: { fontWeight: 'bold', color: '#92400E' },
  reason: { color: '#92400E' },
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  accept: { backgroundColor: '#DCFCE7' },
  decline: { backgroundColor: '#E5E7EB' },
  acceptText: { color: '#065F46', fontWeight: '600' },
  declineText: { color: '#374151', fontWeight: '600' },
});
