// app/workout/index.tsx
import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';

export default function WorkoutIndex() {
  return (
    <SafeAreaView style={styles.c}>
      <Text style={styles.t}>/workout index OK</Text>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  t: { fontSize: 18, fontWeight: '700' },
});
