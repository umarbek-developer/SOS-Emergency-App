import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  Vibration,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/ScreenHeader";
import { Section } from "@/components/Section";
import { SettingRow } from "@/components/SettingRow";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

const HOLD_OPTIONS = [2, 3, 5, 7];

function playWebBeep(durationMs = 320) {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  const win = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctor = win.AudioContext ?? win.webkitAudioContext;
  if (!Ctor) return;
  const ctx = new Ctor();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + durationMs / 1000 + 0.05);
  setTimeout(() => ctx.close().catch(() => {}), durationMs + 200);
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, showToast } = useApp();
  const initialMount = useRef<boolean>(true);

  useEffect(() => {
    initialMount.current = false;
  }, []);

  const { width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth >= 600;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 90;

  const cycleHold = () => {
    const idx = HOLD_OPTIONS.indexOf(settings.holdSeconds);
    const next = HOLD_OPTIONS[(idx + 1) % HOLD_OPTIONS.length] ?? 3;
    updateSettings({ holdSeconds: next });
    showToast(`Hold time set to ${next} seconds`, "info");
  };

  const onToggleNotifications = (v: boolean) => {
    updateSettings({ notifications: v });
    if (v) showToast("Notifications enabled — you'll see alert confirmations.");
    else showToast("Notifications muted.", "info");
  };

  const onToggleSound = (v: boolean) => {
    updateSettings({ sound: v });
    if (v) {
      playWebBeep();
      showToast("Sound enabled — alarm will play during SOS.");
    } else {
      showToast("Sound muted.", "info");
    }
  };

  const onToggleVibration = (v: boolean) => {
    updateSettings({ vibration: v });
    if (v) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        Vibration.vibrate(180);
      }
      showToast("Vibration enabled.");
    } else {
      if (Platform.OS !== "web") Vibration.cancel();
      showToast("Vibration muted.", "info");
    }
  };

  const onToggleLocation = (v: boolean) => {
    updateSettings({ shareLocation: v });
    showToast(v ? "Location sharing on." : "Location sharing off.", "info");
  };

  const onToggleAutoCall = (v: boolean) => {
    updateSettings({ autoCall: v });
    showToast(
      v
        ? "Auto-call on — your primary emergency service will be dialed after a 5s countdown."
        : "Auto-call off.",
      "info",
    );
  };

  const openSupport = () => {
    Linking.openURL(
      "https://en.wikipedia.org/wiki/List_of_emergency_telephone_numbers",
    ).catch(() => {});
  };

  const performReset = () => {
    updateSettings({
      notifications: true,
      vibration: true,
      sound: true,
      shareLocation: true,
      autoCall: false,
      holdSeconds: 3,
    });
    showToast("Settings reset to defaults.");
  };

  const confirmReset = () => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && !window.confirm("Reset all settings to defaults? Your contacts and profile are not affected.")) return;
      performReset();
      return;
    }
    Alert.alert(
      "Reset settings",
      "Bring all settings back to their defaults? Your contacts and profile stay safe.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: performReset,
        },
      ],
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: bottomPad },
          isWide && { maxWidth: 580, alignSelf: "center" as const, width: "100%" },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Settings"
          subtitle="Tune the app to how you want it to behave."
        />

        <Section title="Alerts">
          <SettingRow
            type="switch"
            icon="bell"
            label="Notifications"
            hint="Confirmation banner when an alert is sent."
            value={settings.notifications}
            onValueChange={onToggleNotifications}
          />
          <SettingRow
            type="switch"
            icon="volume-2"
            label="Sound"
            hint="Audible alarm while SOS is active."
            value={settings.sound}
            onValueChange={onToggleSound}
          />
          <SettingRow
            type="switch"
            icon="smartphone"
            label="Vibration"
            hint="Haptic feedback while holding the button and during SOS."
            value={settings.vibration}
            onValueChange={onToggleVibration}
          />
        </Section>

        <Section title="Emergency triggers">
          <SettingRow
            type="switch"
            icon="map-pin"
            label="Share location"
            hint="Send precise GPS to your circle when SOS fires."
            value={settings.shareLocation}
            onValueChange={onToggleLocation}
          />
          <SettingRow
            type="switch"
            icon="phone-call"
            label="Auto-call emergency line"
            hint="After 5 seconds, dial your primary emergency service. You can cancel."
            value={settings.autoCall}
            onValueChange={onToggleAutoCall}
          />
          <SettingRow
            type="chevron"
            icon="clock"
            label="SOS hold duration"
            hint="How long you must hold the button to fire."
            value={`${settings.holdSeconds}s`}
            onPress={cycleHold}
          />
        </Section>

        <Section title="About">
          <SettingRow
            type="chevron"
            icon="book-open"
            label="Safety resources"
            hint="External help lines and articles."
            onPress={openSupport}
          />
          <SettingRow
            type="value"
            icon="info"
            label="Version"
            value="1.0.0"
          />
        </Section>

        <Pressable
          onPress={confirmReset}
          style={({ pressed }) => [
            styles.resetBtn,
            {
              borderColor: colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Feather name="rotate-ccw" size={14} color={colors.mutedForeground} />
          <Text style={[styles.resetText, { color: colors.mutedForeground }]}>
            Reset settings to defaults
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 22,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  resetText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13.5,
  },
});
