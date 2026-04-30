import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { placeCall } from "@/lib/calling";
import { mapsUrl, reverseGeocode, watchLocation } from "@/lib/location";
import type { LocationFix } from "@/lib/location";
import { EMERGENCY_TYPES } from "@/types";

const COUNTDOWN_SECONDS = 5;

export function ActiveEmergencyOverlay() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth >= 600;
  const { active, contacts, settings, health, endEmergency } = useApp();
  const pulse = useSharedValue(1);
  const [secondsLeft, setSecondsLeft] = useState<number>(COUNTDOWN_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const triggeredRef = useRef<boolean>(false);

  const isVisible = Boolean(active);
  const [dialingNumber, setDialingNumber] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [liveLocation, setLiveLocation] = useState<LocationFix | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const lastGeocodedRef = useRef<number>(0);

  useEffect(() => {
    if (!isVisible) return;
    pulse.value = withRepeat(
      withTiming(1.05, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
        () => {},
      );
    }
  }, [isVisible, pulse]);

  useEffect(() => {
    if (!isVisible) return;
    if (settings.vibration && Platform.OS !== "web") {
      Vibration.vibrate([0, 600, 400, 600], true);
    }
    return () => {
      if (Platform.OS !== "web") {
        Vibration.cancel();
      }
    };
  }, [isVisible, settings.vibration]);

  useEffect(() => {
    if (!isVisible || !settings.sound) return;
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
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    let on = false;
    const interval = setInterval(() => {
      on = !on;
      gain.gain.setValueAtTime(on ? 0.06 : 0, ctx.currentTime);
      osc.frequency.setValueAtTime(on ? 988 : 740, ctx.currentTime);
    }, 450);
    return () => {
      clearInterval(interval);
      try {
        osc.stop();
      } catch {
        // ignore
      }
      ctx.close().catch(() => {});
    };
  }, [isVisible, settings.sound]);

  useEffect(() => {
    if (!active) {
      setElapsedSeconds(0);
      return;
    }
    setElapsedSeconds(Math.floor((Date.now() - active.startedAt) / 1000));
    const id = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - active.startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active) {
      setLiveLocation(null);
      setAddress(null);
      lastGeocodedRef.current = 0;
      return;
    }
    setLiveLocation(active.location);
    const stop = watchLocation((fix) => setLiveLocation(fix));
    return stop;
  }, [active]);

  useEffect(() => {
    if (!liveLocation) return;
    const now = Date.now();
    if (now - lastGeocodedRef.current < 10_000) return;
    lastGeocodedRef.current = now;
    reverseGeocode(liveLocation.latitude, liveLocation.longitude).then((addr) => {
      if (addr) setAddress(addr);
    });
  }, [liveLocation]);

  useEffect(() => {
    if (!active) {
      setSecondsLeft(COUNTDOWN_SECONDS);
      setDialingNumber(null);
      triggeredRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (!settings.autoCall) {
      setSecondsLeft(0);
      return;
    }

    setSecondsLeft(COUNTDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          if (!triggeredRef.current) {
            triggeredRef.current = true;
            const service = contacts.find((c) => c.isService);
            if (service?.phone) {
              placeCall(service.phone);
            }
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, settings.autoCall, contacts]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!active) return null;

  const meta =
    EMERGENCY_TYPES.find((t) => t.key === active.type) ?? EMERGENCY_TYPES[5]!;

  const notified = contacts.filter((c) =>
    active.notifiedContactIds.includes(c.id),
  );
  const services = contacts.filter((c) => c.isService);

  const callPrimary = async () => {
    const svc = services[0];
    if (!svc?.phone) return;
    const fallback = await placeCall(svc.phone);
    if (fallback) setDialingNumber(fallback);
  };

  const callContact = async (phone: string) => {
    if (!phone) return;
    const fallback = await placeCall(phone);
    if (fallback) setDialingNumber(fallback);
  };

  const openMaps = () => {
    if (liveLocation) {
      Linking.openURL(mapsUrl(liveLocation)).catch(() => {});
    }
  };

  const primaryService = services[0];

  return (
    <Modal visible animationType="fade" transparent={false} onRequestClose={endEmergency}>
      <View style={[styles.root, { backgroundColor: meta.color }]}>
        <LinearGradient
          colors={[meta.color, "#0a0c11"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill as object}
        />
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + 24,
              paddingBottom: insets.bottom + 32,
            },
            isWide && { maxWidth: 580, alignSelf: "center" as const, width: "100%" },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statusRow}>
            <Animated.View style={[styles.liveDot, dotStyle]} />
            <Text style={styles.liveText}>EMERGENCY ACTIVE</Text>
            <View style={{ flex: 1 }} />
            <Text style={styles.liveText}>{formatElapsed(elapsedSeconds)}</Text>
          </View>

          <View style={styles.heroBlock}>
            <View style={styles.heroIcon}>
              <Ionicons
                name={meta.icon as keyof typeof Ionicons.glyphMap}
                size={36}
                color="#fff"
              />
            </View>
            <Text style={styles.heroLabel}>{meta.label.toUpperCase()}</Text>
            <Text style={styles.heroSub}>{meta.short}</Text>
          </View>

          {settings.autoCall && secondsLeft > 0 ? (
            <View style={styles.countdownCard}>
              <Text style={styles.countdownLabel}>Calling {primaryService?.name ?? "emergency"} in</Text>
              <Text style={styles.countdownNum}>{secondsLeft}</Text>
              <Text style={styles.countdownHint}>
                Tap "I'm safe" to cancel.
              </Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable
              onPress={callPrimary}
              style={({ pressed }) => [
                styles.bigAction,
                styles.bigActionPrimary,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="phone-call" size={22} color="#0a0c11" />
              <Text style={styles.bigActionPrimaryText}>Call 911 now</Text>
            </Pressable>
            <Pressable
              onPress={endEmergency}
              style={({ pressed }) => [
                styles.bigAction,
                styles.bigActionGhost,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="check" size={22} color="#fff" />
              <Text style={styles.bigActionGhostText}>I'm safe</Text>
            </Pressable>
          </View>

          {dialingNumber ? (
            <Pressable
              onPress={() => setDialingNumber(null)}
              style={styles.dialingBanner}
            >
              <Feather name="phone-outgoing" size={16} color="#0a0c11" />
              <Text style={styles.dialingText}>Dialing {dialingNumber} — tap to dismiss</Text>
            </Pressable>
          ) : null}

          {settings.shareLocation ? (
            <Pressable
              onPress={openMaps}
              style={({ pressed }) => [
                styles.locationCard,
                { opacity: pressed && liveLocation ? 0.85 : 1 },
              ]}
            >
              <View style={styles.locationIconCol}>
                <Ionicons name="location" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationLabel}>Live location</Text>
                <Text style={styles.locationCoords}>
                  {address ?? (liveLocation ? "Searching address…" : "Location unavailable")}
                </Text>
                {liveLocation ? (
                  <Text style={styles.locationAccuracy}>
                    {`${liveLocation.latitude.toFixed(5)}, ${liveLocation.longitude.toFixed(5)}`}
                    {liveLocation.accuracy != null
                      ? ` · ~${Math.round(liveLocation.accuracy)}m`
                      : ""}
                  </Text>
                ) : null}
              </View>
              {liveLocation ? (
                <Feather name="external-link" size={16} color="#fff" />
              ) : null}
            </Pressable>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your circle — tap to call</Text>
            {notified.length === 0 ? (
              <Text style={styles.emptyHint}>
                No personal contacts added yet — tap a number below to call directly.
              </Text>
            ) : (
              notified.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => callContact(c.phone)}
                  style={styles.contactRow}
                >
                  <View style={styles.contactDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <Text style={styles.contactSub}>
                      {c.relation}
                      {c.phone ? ` · ${c.phone}` : ""}
                    </Text>
                  </View>
                  {c.phone ? (
                    <Feather name="phone" size={18} color="#fff" />
                  ) : null}
                </Pressable>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency services</Text>
            {services.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => callContact(c.phone)}
                style={styles.contactRow}
              >
                <View
                  style={[styles.contactDot, { backgroundColor: "#fff" }]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{c.name}</Text>
                  <Text style={styles.contactSub}>{c.relation}</Text>
                </View>
                <Feather name="phone" size={18} color="#fff" />
              </Pressable>
            ))}
          </View>

          {(health.bloodType || health.allergies || health.medications) ? (
            <View style={styles.medCard}>
              <View style={styles.medHeader}>
                <Feather name="activity" size={16} color="#0a0c11" />
                <Text style={styles.medHeaderText}>For first responders</Text>
              </View>
              {health.fullName ? (
                <MedRow label="Name" value={health.fullName} />
              ) : null}
              {health.bloodType ? (
                <MedRow label="Blood type" value={health.bloodType} />
              ) : null}
              {health.allergies ? (
                <MedRow label="Allergies" value={health.allergies} />
              ) : null}
              {health.medications ? (
                <MedRow label="Medications" value={health.medications} />
              ) : null}
              {health.conditions ? (
                <MedRow label="Conditions" value={health.conditions} />
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function MedRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.medRow}>
      <Text style={styles.medLabel}>{label}</Text>
      <Text style={styles.medValue}>{value}</Text>
    </View>
  );
}

function formatElapsed(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 18,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  liveText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    color: "#fff",
    letterSpacing: 1.4,
  },
  heroBlock: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: "#fff",
    letterSpacing: 2,
  },
  heroSub: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  countdownCard: {
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 18,
    alignItems: "center",
    gap: 4,
  },
  countdownLabel: {
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  countdownNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 56,
    color: "#fff",
  },
  countdownHint: {
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  bigAction: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  bigActionPrimary: {
    backgroundColor: "#fff",
  },
  bigActionPrimaryText: {
    fontFamily: "Inter_700Bold",
    color: "#0a0c11",
    fontSize: 15,
  },
  bigActionGhost: {
    borderColor: "rgba(255,255,255,0.5)",
    borderWidth: 1.5,
  },
  bigActionGhostText: {
    fontFamily: "Inter_700Bold",
    color: "#fff",
    fontSize: 15,
  },
  dialingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dialingText: {
    fontFamily: "Inter_600SemiBold",
    color: "#0a0c11",
    fontSize: 13,
    flex: 1,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  locationIconCol: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  locationLabel: {
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    fontSize: 14,
  },
  locationCoords: {
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
    fontSize: 12.5,
    marginTop: 2,
  },
  locationAccuracy: {
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)",
    fontSize: 11.5,
    marginTop: 2,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 14,
    gap: 12,
    marginBottom: 6,
  },
  contactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  contactName: {
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    fontSize: 14,
  },
  contactSub: {
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  emptyHint: {
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    fontSize: 12.5,
    paddingVertical: 8,
  },
  medCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  medHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  medHeaderText: {
    fontFamily: "Inter_700Bold",
    color: "#0a0c11",
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  medRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    gap: 12,
  },
  medLabel: {
    fontFamily: "Inter_500Medium",
    color: "#5b6072",
    fontSize: 13,
  },
  medValue: {
    fontFamily: "Inter_600SemiBold",
    color: "#0a0c11",
    fontSize: 13,
    flex: 1,
    textAlign: "right",
  },
});
