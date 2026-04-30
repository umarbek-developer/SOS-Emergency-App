import { Feather, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";
import { placeCall } from "@/lib/calling";
import type { Contact } from "@/types";

interface Props {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  compact?: boolean;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

export function ContactCard({ contact, onEdit, onDelete, compact }: Props) {
  const colors = useColors();
  const { showToast } = useApp();
  const hasPhone = Boolean(contact.phone);

  const callContact = async () => {
    if (!hasPhone) {
      onEdit?.(contact);
      return;
    }
    const fallbackNumber = await placeCall(contact.phone);
    if (fallbackNumber) {
      showToast(`Call: ${fallbackNumber}`, "info");
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          paddingVertical: compact ? 10 : 14,
        },
      ]}
    >
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: contact.isService
              ? colors.primary
              : colors.cardElevated,
          },
        ]}
      >
        {contact.isService ? (
          <Ionicons name="shield-checkmark" size={20} color="#fff" />
        ) : (
          <Text style={[styles.initials, { color: colors.foreground }]}>
            {initialsOf(contact.name)}
          </Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {contact.name}
        </Text>
        <Text
          style={[styles.relation, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {contact.relation}
          {hasPhone ? ` · ${contact.phone}` : " · No number set"}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={callContact}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: hasPhone ? colors.primary : colors.muted,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          accessibilityLabel={hasPhone ? `Call ${contact.name}` : `Add number for ${contact.name}`}
        >
          <Feather
            name={hasPhone ? "phone" : "plus"}
            size={16}
            color={hasPhone ? "#fff" : colors.foreground}
          />
        </Pressable>
        {onEdit ? (
          <Pressable
            onPress={() => onEdit(contact)}
            style={({ pressed }) => [
              styles.iconBtnGhost,
              { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
            ]}
            accessibilityLabel={`Edit ${contact.name}`}
          >
            <Feather name="edit-2" size={14} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
        {onDelete ? (
          <Pressable
            onPress={() => onDelete(contact)}
            style={({ pressed }) => [
              styles.iconBtnGhost,
              { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
            ]}
            accessibilityLabel={`Delete ${contact.name}`}
          >
            <Feather name="trash-2" size={14} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    ...(Platform.OS === "web" ? { width: "100%" } : {}),
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginBottom: 2,
  },
  relation: {
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnGhost: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
