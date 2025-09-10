// app/dev/TempTest.tsx
import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { useAudioMixer } from '@/hooks/useAudioMixer';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';

// Replace these with actual files in your assets folder
const voiceFile = require('../assets/voice_sample.mp3');
const musicFile = require('../assets/music_sample.mp3');

export default function TempTest() {
  const { playBoth, pauseAll } = useAudioMixer(voiceFile, musicFile);

  // Handle voice commands
  useVoiceCommands((cmd) => {
    if (cmd === 'pause') {
      pauseAll();
      Alert.alert('Voice Command', 'Paused all audio');
    }
    if (cmd === 'time left') {
      Alert.alert('Voice Command', '5 minutes left');
    }
  });

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 16 }}>Phase 4 Test: Audio + Voice Commands</Text>
      <Button title="Play Voice + Music" onPress={playBoth} />
      <Button title="Pause All" onPress={pauseAll} style={{ marginTop: 12 }} />
    </View>
  );
}
