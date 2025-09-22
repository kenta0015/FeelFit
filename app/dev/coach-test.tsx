// app/dev/coach-test.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View, Text, Pressable, Switch } from "react-native";
import { useAudioMixer } from "../../hooks/useAudioMixer";
import { useBpmTier } from "../../hooks/useBpmTier";
import { useVoiceIntents } from "../../hooks/useVoiceIntents";

function Btn({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        backgroundColor: "#111827",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        marginRight: 8,
        marginBottom: 8,
      })}
    >
      <Text style={{ color: "white", fontWeight: "700" }}>{title}</Text>
    </Pressable>
  );
}

type TrackItem = { key: string; title: string; uri: string; loop?: boolean };

export default function CoachTest() {
  // ---- mixer / tempo / intents ----
  const mixer = useAudioMixer();
  const { bpmTier, rampTo, slower, faster } = useBpmTier();
  const intents = useVoiceIntents();

  // ---- workout time (dummy 20:00) ----
  const TOTAL = 20 * 60; // 20min
  const [sec, setSec] = useState(12); // demo progress
  useEffect(() => {
    const id = setInterval(() => setSec((s) => Math.min(TOTAL, s + 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const mmss = (n: number) => {
    const m = Math.floor(n / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(n % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  // ---- healing tracks picker ----
  const allTracks: TrackItem[] = useMemo(
    () => [
      { key: "ocean", title: "🌊 Ocean Calm (loop)", uri: "/healing/song1.mp3", loop: true },
      { key: "piano", title: "🎹 Soft Piano", uri: "/healing/song2.mp3" },
      { key: "forest", title: "🌳 Forest Air (loop)", uri: "/healing/song1.mp3", loop: true },
      { key: "binaural", title: "🔉 Binaural Lite", uri: "/healing/song2.mp3" },
    ],
    []
  );
  const [checked, setChecked] = useState<Record<string, boolean>>({ ocean: true, forest: true });
  const [shuffle, setShuffle] = useState(true);

  const selectedTitles = Object.entries(checked)
    .filter(([, v]) => v)
    .map(([k]) => allTracks.find((t) => t.key === k)?.title?.replace(/^[^\s]+\s/, "")?.trim() || k);

  const setTracksFromPick = () => {
    const picks = allTracks.filter((t) => checked[t.key]);
    if (picks.length === 0) return;
    mixer.setTracks({
      tracks: picks.map((t) => ({ uri: t.uri })),
      shuffle,
    });
  };

  // ---- PTT（ダミー） ----
  const pttRef = useRef(false);
  const togglePTT = async () => {
    pttRef.current = !pttRef.current;
    if (pttRef.current) {
      await intents.time(); // demo: ask time-left when pressed
      pttRef.current = false;
    }
  };

  const nowLabel = "Now: Box Breathing (5m)";
  const voiceLabel = "🎧 Neural (ElevenLabs)";
  const musicLabel = "Music: Healing";

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* ┌ Player ─────────────────────────────────────────────┐ */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: 12,
          padding: 14,
          backgroundColor: "white",
        }}
      >
        <Text style={{ fontWeight: "800", fontSize: 18, marginBottom: 8 }}>Workout Player</Text>

        {/* time bar */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ fontFamily: "monospace" }}>{mmss(sec)}</Text>
          <View style={{ flex: 1, height: 10, backgroundColor: "#E5E7EB", marginHorizontal: 8, borderRadius: 8 }}>
            <View
              style={{
                width: `${(sec / TOTAL) * 100}%`,
                height: 10,
                backgroundColor: "#111827",
                borderRadius: 8,
              }}
            />
          </View>
          <Text style={{ fontFamily: "monospace" }}>{mmss(TOTAL)}</Text>
        </View>

        <Text style={{ color: "#111827", marginBottom: 4 }}>{nowLabel}</Text>
        <Text style={{ color: "#4B5563", marginBottom: 6 }}>
          Voice: {voiceLabel}  {musicLabel}
        </Text>

        <Text style={{ color: "#4B5563", marginBottom: 10 }}>
          Ducking: {mixer.state.ducking ? "ON" : "OFF"} | BPM Tier: {bpmTier} {""}
          <Text style={{ color: "#9CA3AF" }}>(Next: {Math.min(150, bpmTier + 20)})</Text>
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 4 }}>
          <Btn title="⏯ Pause" onPress={() => intents.pause()} disabled={intents.coachBusy} />
          <Btn title="⏭ Skip" onPress={() => intents.skip()} disabled={intents.coachBusy} />
          <Btn title="⏱ Time Left?" onPress={() => intents.time()} disabled={intents.coachBusy} />
          <Btn title="🐢 Slower" onPress={() => slower()} disabled={intents.coachBusy} />
          <Btn title="⚡ Faster" onPress={() => faster()} disabled={intents.coachBusy} />
        </View>

        <Btn title={intents.coachBusy ? "🎤 Speaking…" : "🎤 PTT: Hold to ask"}
             onPress={togglePTT}
             disabled={false}
        />
      </View>

      {/* ┌ Healing Tracks ─────────────────────────────────────┐ */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: 12,
          padding: 14,
          backgroundColor: "white",
        }}
      >
        <Text style={{ fontWeight: "800", fontSize: 18, marginBottom: 8 }}>Healing Music Picker</Text>

        {allTracks.map((t) => {
          const on = !!checked[t.key];
          return (
            <Pressable
              key={t.key}
              onPress={() => setChecked((m) => ({ ...m, [t.key]: !on }))}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: on ? "#111827" : "#9CA3AF",
                  backgroundColor: on ? "#111827" : "transparent",
                  marginRight: 10,
                }}
              />
              <Text style={{ flex: 1 }}>{t.title}</Text>
              {t.loop ? <Text style={{ color: "#9CA3AF" }}>loop</Text> : null}
            </Pressable>
          );
        })}

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 6 }}>
          <Text style={{ marginRight: 8 }}>Shuffle</Text>
          <Switch value={shuffle} onValueChange={setShuffle} />
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 4 }}>
          <Btn title="Apply Selection" onPress={setTracksFromPick} />
          <Btn title={mixer.state.isPlayingA ? "Stop" : "Play"} onPress={() => (mixer.state.isPlayingA ? mixer.stop() : mixer.start())} />
          <Btn title="Tempo 90" onPress={() => rampTo(90)} />
          <Btn title="Tempo 110" onPress={() => rampTo(110)} />
          <Btn title="Tempo 130" onPress={() => rampTo(130)} />
          <Btn title="Tempo 150" onPress={() => rampTo(150)} />
        </View>

        <Text style={{ marginTop: 8, color: "#6B7280" }}>
          Selected: {selectedTitles.length ? selectedTitles.join(", ") : "(none)"} {shuffle ? "(shuffle)" : ""}
        </Text>
      </View>

      {/* mixer snapshot */}
      <View style={{ padding: 12 }}>
        <Text style={{ fontWeight: "700" }}>Mixer State</Text>
        <Text style={{ fontFamily: "monospace" }}>
          {JSON.stringify(
            {
              isPlayingA: mixer.state.isPlayingA,
              ducking: mixer.state.ducking,
              bpmTier: mixer.state.bpmTier,
              volumeA: mixer.state.volumeA,
            },
            null,
            2
          )}
        </Text>
      </View>
    </ScrollView>
  );
}
