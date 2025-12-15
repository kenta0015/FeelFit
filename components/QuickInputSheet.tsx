// components/QuickInputSheet.tsx
import React, { useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, Animated, Easing, Platform } from 'react-native';
import { usePlanStore } from '@/store/usePlanStore';
import QuickPlanBar from '@/components/QuickPlanBar';

export default function QuickInputSheet() {
  const isOpen = usePlanStore((s) => s.isQuickOpen);
  const closeQuick = usePlanStore((s) => s.closeQuick);

  const translateY = useRef(new Animated.Value(400)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(translateY, {
          toValue: 400,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, opacity, translateY]);

  return (
    <Modal visible={isOpen} transparent animationType="none" statusBarTranslucent onRequestClose={closeQuick}>
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeQuick} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Quick Input</Text>
          <TouchableOpacity onPress={closeQuick} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* 既存のQuickPlanBarをそのまま利用 */}
        <QuickPlanBar />

        <View style={styles.footerHint}>
          <Text style={styles.hintText}>Select Focus → Emotion → Time, then close.</Text>
        </View>
      </Animated.View>
    </Modal>
  );
}

const SHEET_BORDER = Platform.select({ ios: 16, android: 12, default: 12 });

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000066' },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingTop: 8, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: SHEET_BORDER!, borderTopRightRadius: SHEET_BORDER!,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 10,
  },
  handle: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E5E7EB', marginBottom: 8,
  },
  header: {
    paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  close: { fontSize: 14, fontWeight: '600', color: '#6366F1' },
  footerHint: { marginTop: 8, marginBottom: 4 },
  hintText: { fontSize: 12, color: '#6B7280' },
});
