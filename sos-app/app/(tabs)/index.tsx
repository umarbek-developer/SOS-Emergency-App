import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmergencyTypeGrid } from "@/components/EmergencyTypeGrid";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SOSButton } from "@/components/SOSButton";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { getCurrentLocation } from "@/lib/location";
import { EMERGENCY_TYPES, type EmergencyType } from "@/types";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { contacts, settings, startEmergency, showToast } = useApp();
  const [selectedType, setSelectedType] = useState<EmergencyType>("medical");

  const personalContacts = contacts.filter(
    (c) => !c.isService && c.phone.trim().length > 0,
  );
  const meta = EMERGENCY_TYPES.find((t) => t.key === selectedType) ?? EMERGENCY_TYPES[0]!;

  const trigger = async () => {
    if (settings.vibration && Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
    const location = settings.shareLocation ? await getCurrentLocation() : null;
    startEmergency({
      type: selectedType,
      startedAt: Date.now(),
      location,
      notifiedContactIds: personalContacts.map((c) => c.id),
    });
    if (settings.notifications) {
      const count = personalContacts.length;
      showToast(
        count > 0
          ? `SOS active — call your ${count} contact${count === 1 ? "" : "s"} from the emergency screen.`
          : "SOS active — use the emergency screen to call for help.",
        "error",
      );
    }
  };

  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 90;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="In an emergency?"
          subtitle={meta.subtitle}
          right={
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    personalContacts.length > 0
                      ? "#22c55e22"
                      : "#facc1522",
                  borderColor:
                    personalContacts.length > 0 ? "#22c55e55" : "#facc1555",
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      personalContacts.length > 0 ? "#22c55e" : "#facc15",
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      personalContacts.length > 0 ? "#86efac" : "#fde68a",
                  },
                ]}
              >
                {personalContacts.length > 0 ? "Ready" : "Setup"}
              </Text>
            </View>
          }
        />

        <View style={styles.gridSection}>
          <EmergencyTypeGrid
            selected={selectedType}
            onSelect={setSelectedType}
          />
        </View>

        <View style={styles.buttonSection}>
          <SOSButton
            holdSeconds={settings.holdSeconds}
            onActivate={trigger}
            haptics={settings.vibration}
          />
        </View>

        <View style={styles.infoStrip}>
          <InfoTile
            icon="map-pin"
            label="Location"
            value={settings.shareLocation ? "On" : "Off"}
            tone={settings.shareLocation ? "good" : "warn"}
          />
          <InfoTile
            icon="users"
            label="Circle"
            value={`${personalContacts.length} ${
              personalContacts.length === 1 ? "person" : "people"
            }`}
            tone={personalContacts.length > 0 ? "good" : "warn"}
          />
          <InfoTile
            icon="phone-call"
            label="Auto-call"
            value={settings.autoCall ? "On" : "Off"}
            tone={settings.autoCall ? "good" : "neutral"}
          />
        </View>

        <View
          style={[
            styles.tipCard,
            {
              backgroundColor: colors.card,
              borderColor: meta.color + "44",
            },
          ]}
        >
          <View style={styles.tipHead}>
            <Feather name="alert-circle" size={14} color={meta.color} />
            <Text style={[styles.tipHeadText, { color: meta.color }]}>
              {meta.label} — what to do
            </Text>
          </View>
          {meta.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipBullet, { backgroundColor: meta.color }]} />
              <Text style={[styles.tipBody, { color: colors.mutedForeground }]}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

interface InfoTileProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  tone: "good" | "warn" | "neutral";
}

function InfoTile({ icon, label, value, tone }: InfoTileProps) {
  const colors = useColors();
  const valueColor =
    tone === "good"
      ? "#86efac"
      : tone === "warn"
      ? "#fde68a"
      : colors.foreground;
  return (
    <View
      style={[
        infoStyles.tile,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Feather name={icon} size={14} color={colors.mutedForeground} />
      <Text style={[infoStyles.label, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[infoStyles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 4,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 11.5,
    marginTop: 4,
    letterSpacing: 0.4,
  },
  value: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 18,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.6,
  },
  gridSection: {
    marginTop: 4,
  },
  buttonSection: {
    alignItems: "center",
    paddingVertical: 18,
  },
  infoStrip: {
    flexDirection: "row",
    gap: 10,
  },
  tipCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  tipHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  tipHeadText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 6,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  tipBody: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
  },
});
