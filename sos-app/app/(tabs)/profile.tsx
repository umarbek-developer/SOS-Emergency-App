import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProfileField } from "@/components/ProfileField";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Section } from "@/components/Section";
import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import type { HealthProfile } from "@/types";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { health, setHealth, showToast } = useApp();
  const [editing, setEditing] = useState<boolean>(false);
  const [draft, setDraft] = useState<HealthProfile>(health);

  const view = editing ? draft : health;

  const startEdit = () => {
    setDraft(health);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(health);
    setEditing(false);
  };

  const save = () => {
    setHealth(draft);
    setEditing(false);
    showToast("Profile saved");
  };

  const patch = (next: Partial<HealthProfile>) => {
    setDraft((prev) => ({ ...prev, ...next }));
  };

  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 90;
  const completion = computeCompletion(view);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          title="Profile"
          subtitle="Visible to first responders during an emergency."
          right={
            editing ? (
              <View style={styles.headerActions}>
                <Pressable
                  onPress={cancelEdit}
                  style={({ pressed }) => [
                    styles.btnGhost,
                    { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Text style={[styles.btnGhostText, { color: colors.mutedForeground }]}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={save}
                  style={({ pressed }) => [
                    styles.btnPrimary,
                    {
                      backgroundColor: colors.primary,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Feather name="check" size={14} color="#fff" />
                  <Text style={styles.btnPrimaryText}>Save</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={startEdit}
                style={({ pressed }) => [
                  styles.btnPrimary,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Feather name="edit-2" size={14} color="#fff" />
                <Text style={styles.btnPrimaryText}>Edit</Text>
              </Pressable>
            )
          }
        />

        <View
          style={[
            styles.heroCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.primary + "22" },
            ]}
          >
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroName, { color: colors.foreground }]}>
              {view.fullName || "Tell us who you are"}
            </Text>
            <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
              {view.bloodType
                ? `Blood type ${view.bloodType}`
                : "Add your medical info"}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${completion}%`,
                    backgroundColor:
                      completion === 100
                        ? "#22c55e"
                        : completion > 40
                        ? colors.accent
                        : colors.primary,
                  },
                ]}
              />
            </View>
            <Text
              style={[styles.progressLabel, { color: colors.mutedForeground }]}
            >
              {completion}% complete
            </Text>
          </View>
        </View>

        {editing ? (
          <View
            style={[
              styles.editingBanner,
              { backgroundColor: colors.primary + "11", borderColor: colors.primary + "55" },
            ]}
          >
            <Feather name="edit-3" size={14} color={colors.primary} />
            <Text style={[styles.editingText, { color: colors.foreground }]}>
              Editing — tap Save when you're done.
            </Text>
          </View>
        ) : null}

        <Section title="Personal">
          <ProfileField
            label="Full name"
            value={view.fullName}
            onChangeText={(v) => patch({ fullName: v })}
            placeholder="Alex Morgan"
            editable={editing}
          />
          <ProfileField
            label="Date of birth"
            value={view.dateOfBirth}
            onChangeText={(v) => patch({ dateOfBirth: v })}
            placeholder="1995-04-12"
            editable={editing}
          />
        </Section>

        <Section
          title="Blood type"
          hint={editing ? "Select what's on your medical records." : undefined}
        >
          <View style={styles.bloodGrid}>
            {BLOOD_TYPES.map((bt) => {
              const active = view.bloodType === bt;
              const disabled = !editing;
              return (
                <Pressable
                  key={bt}
                  disabled={disabled}
                  onPress={() => patch({ bloodType: active ? "" : bt })}
                  style={({ pressed }) => [
                    styles.bloodChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                      opacity: disabled && !active ? 0.4 : pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.bloodChipText,
                      { color: active ? "#fff" : colors.foreground },
                    ]}
                  >
                    {bt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Medical details">
          <ProfileField
            label="Allergies"
            value={view.allergies}
            onChangeText={(v) => patch({ allergies: v })}
            placeholder="Penicillin, peanuts…"
            multiline
            editable={editing}
          />
          <ProfileField
            label="Medications"
            value={view.medications}
            onChangeText={(v) => patch({ medications: v })}
            placeholder="Insulin (10 IU twice daily)…"
            multiline
            editable={editing}
          />
          <ProfileField
            label="Conditions"
            value={view.conditions}
            onChangeText={(v) => patch({ conditions: v })}
            placeholder="Type 1 diabetes, asthma…"
            multiline
            editable={editing}
          />
          <ProfileField
            label="Notes for responders"
            value={view.notes}
            onChangeText={(v) => patch({ notes: v })}
            placeholder="Speaks English & Spanish. ICE: Mom +1 555…"
            multiline
            editable={editing}
          />
        </Section>

        {editing ? (
          <View style={styles.footerActions}>
            <Pressable
              onPress={cancelEdit}
              style={({ pressed }) => [
                styles.btnGhostLarge,
                { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Text style={[styles.btnGhostText, { color: colors.mutedForeground }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={save}
              style={({ pressed }) => [
                styles.btnPrimaryLarge,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={styles.btnPrimaryText}>Save profile</Text>
            </Pressable>
          </View>
        ) : null}

        <View
          style={[
            styles.privacy,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="lock" size={14} color={colors.mutedForeground} />
          <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>
            Your profile lives only on this device. Nothing is synced or shared
            unless you trigger an SOS.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function computeCompletion(h: HealthProfile): number {
  const fields = [
    h.fullName,
    h.dateOfBirth,
    h.bloodType,
    h.allergies,
    h.medications,
    h.conditions,
    h.notes,
  ];
  const filled = fields.filter((f) => f.trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 22,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  btnGhost: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  btnGhostLarge: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGhostText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  btnPrimaryLarge: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnPrimaryText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  heroCard: {
    flexDirection: "row",
    gap: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  heroSub: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    marginTop: 12,
  },
  progressFill: {
    height: "100%",
  },
  progressLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11.5,
    marginTop: 6,
  },
  editingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  editingText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  bloodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bloodChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 56,
    alignItems: "center",
  },
  bloodChipText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  footerActions: {
    flexDirection: "row",
    gap: 12,
  },
  privacy: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  privacyText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
    lineHeight: 18,
  },
});
