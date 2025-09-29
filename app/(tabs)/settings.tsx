// app/(tabs)/settings.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { getPrefs, setUseAiText, setUseNeuralVoice } from '@/utils/prefs';

export default function SettingsScreen() {
  const [useAiText, setAi] = useState(true);
  const [useNeuralVoice, setVoice] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await getPrefs();
      setAi(p.useAiText);
      setVoice(p.useNeuralVoice);
    })();
  }, []);

  const onAi = async (v: boolean) => {
    setAi(v);
    await setUseAiText(v);
  };
  const onVoice = async (v: boolean) => {
    setVoice(v);
    await setUseNeuralVoice(v);
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.h1}>Settings</Text>

      <View style={s.row}>
        <Text style={s.label}>Use AI Text</Text>
        <Switch value={useAiText} onValueChange={onAi} />
      </View>

      <View style={s.row}>
        <Text style={s.label}>Use Neural Voice</Text>
        <Switch value={useNeuralVoice} onValueChange={onVoice} />
      </View>

      <Text style={s.note}>ⓘ Sends anonymized aggregates only.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  h1: { fontSize: 24, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee' },
  label: { fontSize: 16, fontWeight: '600' },
  note: { color: '#666', marginTop: 8 },
});


