// app/dev/tts-test.tsx
import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { synthesize, clearOne, purgeAll, type TTSResult } from '@/audio/TTSService';
import logger, { logger as loggerObj } from '../../lib/logger';

export default function TTSTestScreen() {
  const [voiceId, setVoiceId] = useState<string>('');
  const [script, setScript] = useState<string>('Hi! This is the energetic coach. Let’s get moving!');
  const [result, setResult] = useState<TTSResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [showLogs, setShowLogs] = useState(false);
  const logs = useMemo(() => loggerObj.list(), [showLogs, result, status]); // refresh when toggled or actions

  const setMsg = (m: string) => setStatus(m);

  const playUri = async (uri: string) => {
    if (!uri) return;
    if (Platform.OS === 'web') {
      const audio = new Audio(uri);
      try { await audio.play(); } catch (e) { console.warn('[tts-test] web audio play error', e); }
    } else {
      const AV = await import('expo-av');
      const { sound } = await AV.Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      sound.setOnPlaybackStatusUpdate(async (st: any) => {
        if (!st.isLoaded) return;
        if (st.didJustFinish) await sound.unloadAsync();
      });
    }
  };

  const onSynthesize = async () => {
    if (!voiceId || !script.trim()) { setMsg('Enter voiceId and script.'); return; }
    setBusy(true);
    setMsg('Synthesizing...');
    try {
      const res = await synthesize(script.trim(), voiceId.trim());
      setResult(res);
      setMsg(`Done: source=${res.source}, cached=${res.cached}, uri=${res.uri ?? 'null'}`);
      if (res.uri) await playUri(res.uri);
    } catch (e: any) {
      setMsg(`Error: ${String(e?.message || e)}`);
    } finally {
      setBusy(false);
    }
  };

  const onClearOne = async () => {
    if (!voiceId || !script.trim()) { setMsg('Enter voiceId and script to clear one.'); return; }
    setBusy(true);
    try { await clearOne(script.trim(), voiceId.trim()); setMsg('Cleared cache for current script/voice.'); }
    finally { setBusy(false); }
  };

  const onPurgeAll = async () => {
    setBusy(true);
    try { await purgeAll(); setMsg('Purged all TTS cache.'); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>TTS Test</Text>

      <Text style={styles.label}>Voice ID</Text>
      <TextInput
        style={styles.input}
        value={voiceId}
        onChangeText={setVoiceId}
        placeholder="e.g. <your-elevenlabs-voice-id>"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Script</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={script}
        onChangeText={setScript}
        multiline
      />

      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, busy && styles.btnDisabled]} onPress={onSynthesize} disabled={busy}>
          <Text style={styles.btnText}>Synthesize & Play</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.btnGhost} onPress={onClearOne} disabled={busy}>
          <Text style={styles.btnGhostText}>Clear This Cache</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGhost} onPress={onPurgeAll} disabled={busy}>
          <Text style={styles.btnGhostText}>Purge All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGhost} onPress={() => setShowLogs(s => !s)}>
          <Text style={styles.btnGhostText}>{showLogs ? 'Hide Logs' : 'Logs'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.status}>Status: {status}</Text>
      {result ? (
        <View style={styles.card}>
          <Text style={styles.kv}>source: <Text style={styles.v}>{result.source}</Text></Text>
          <Text style={styles.kv}>cached: <Text style={styles.v}>{String(result.cached)}</Text></Text>
          <Text style={styles.kv}>fallbackUsed: <Text style={styles.v}>{String(result.fallbackUsed)}</Text></Text>
          <Text style={styles.kv}>uri: <Text style={styles.v}>{result.uri ?? 'null'}</Text></Text>
          <Text style={styles.kv}>key: <Text style={styles.v}>{result.key}</Text></Text>
        </View>
      ) : null}

      {showLogs ? (
        <View style={styles.logPanel}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontWeight: '800' }}>Logs (newest first)</Text>
            <TouchableOpacity onPress={() => { logger.clear(); setShowLogs(s => !s); }}>
              <Text style={{ color: '#ef4444', fontWeight: '700' }}>Clear</Text>
            </TouchableOpacity>
          </View>
          {logs.map((e, idx) => (
            <Text key={idx} style={styles.logLine}>
              {new Date(e.ts).toLocaleTimeString()} · {e.tag}
              {e.data !== undefined ? ` · ${safeJson(e.data)}` : ''}
            </Text>
          ))}
          {logs.length === 0 ? <Text style={styles.logLine}>No logs yet.</Text> : null}
        </View>
      ) : null}

      <Text style={styles.hint}>Route: /dev/tts-test</Text>
    </ScrollView>
  );
}

function safeJson(x: unknown) {
  try { return JSON.stringify(x); } catch { return '[unserializable]'; }
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '800', color: '#111' },
  label: { fontWeight: '700', color: '#222' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, backgroundColor: '#fff' },
  multiline: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700' },
  btnGhost: { flex: 1, backgroundColor: '#eef2ff', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnGhostText: { color: '#4f46e5', fontWeight: '700' },
  status: { color: '#374151' },
  card: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', gap: 4 },
  kv: { color: '#111' },
  v: { fontWeight: '700' },
  hint: { color: '#6b7280' },
  logPanel: { padding: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: '#fff', gap: 4 },
  logLine: { color: '#111', fontFamily: 'monospace' as any },
});
