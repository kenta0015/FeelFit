// app/dev/TempTest.web.tsx
import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import useAudioMixer from '../../hooks/useAudioMixer';
import useVoiceCommands from '../../hooks/useVoiceCommands';

// Web-safe: DO NOT import/require any local audio assets here.
export default function TempTest() {
  const mixer = useAudioMixer();
  const vc = useVoiceCommands();

  const onStart = async () => {
    try { await mixer.start(); Alert.alert('Mixer', 'start() called'); }
    catch (e: any) { Alert.alert('Mixer error', String(e?.message || e)); }
  };
  const onStop = async () => {
    try { await mixer.stop(); Alert.alert('Mixer', 'stop() called'); }
    catch (e: any) { Alert.alert('Mixer error', String(e?.message || e)); }
  };
  const onListen = async () => {
    try { await vc.listen(); Alert.alert('Voice', 'listen() called'); }
    catch (e: any) { Alert.alert('Voice error', String(e?.message || e)); }
  };

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '800' }}>Temp Test (Web)</Text>
      <Text>
        Mixer: ready={String(mixer.state.isReady)} playing={String(mixer.state.isPlaying)}
        {' '}ducking={String(mixer.state.ducking)} bpmTier={mixer.state.bpmTier}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="Start" onPress={onStart} />
        <Button title="Stop" onPress={onStop} />
      </View>
      <Text>Voice Commands: listening={String(vc.isListening)}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="Listen" onPress={onListen} />
        <Button title="Stop Listen" onPress={vc.stop} />
      </View>
      <Text style={{ color: '#6b7280' }}>Web-safe stub (no local audio assets).</Text>
    </View>
  );
}
