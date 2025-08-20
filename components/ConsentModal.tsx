// components/ConsentModal.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export default function ConsentModal({ visible, onAccept, onDecline }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>🔐 Allow AI Coaching?</Text>
          <Text style={styles.desc}>AI uses anonymized metrics only.</Text>
          <View style={styles.row}>
            <TouchableOpacity style={[styles.btn, styles.decline]} onPress={onDecline}>
              <Text style={styles.btnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.accept]} onPress={onAccept}>
              <Text style={[styles.btnText, styles.acceptText]}>Accept ✅</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  card: { width: '86%', backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  desc: { color: '#555' },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  decline: { backgroundColor: '#fff' },
  accept: { backgroundColor: '#eaf4ff', borderColor: '#cfe7ff' },
  btnText: { fontWeight: '600', color: '#333' },
  acceptText: { color: '#0b62d6' },
});

