// app/_layout.tsx
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import ConsentModal from '@/components/ConsentModal';
import { getPrefs, setConsentAccepted } from '@/utils/prefs';
import { pingOpenAI } from '@/ai/openaiClient';
import { pingElevenLabs } from '@/audio/ttsClient';



export default function RootLayout() {
  useFrameworkReady();

  const [consentVisible, setConsentVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await getPrefs();
      if (!p.consentAccepted) setConsentVisible(true);

      // DoD: Keys loaded; “ping” success (always log result)
      const oa = await pingOpenAI();
      console.log('[OpenAI ping]', oa.ok ? 'ok' : oa.reason);

      const el = await pingElevenLabs();
      console.log('[ElevenLabs ping]', el.ok ? 'ok' : el.reason);
    })();
  }, []);

  const onAccept = async () => {
    await setConsentAccepted(true);
    setConsentVisible(false);
  };

  const onDecline = async () => {
    await setConsentAccepted(false);
    setConsentVisible(false);
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      <ConsentModal visible={consentVisible} onAccept={onAccept} onDecline={onDecline} />
    </>
  );
}
