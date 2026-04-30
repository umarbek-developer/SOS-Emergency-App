import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import type { Contact } from "@/types";

interface Props {
  visible: boolean;
  initial: Contact | null;
  onClose: () => void;
  onSave: (contact: Contact) => void;
}

function newId(): string {
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ContactFormSheet({ visible, initial, onClose, onSave }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [relation, setRelation] = useState<string>("");

  useEffect(() => {
    if (visible) {
      setName(initial?.name ?? "");
      setPhone(initial?.phone ?? "");
      setRelation(initial?.relation ?? "");
    }
  }, [visible, initial]);

  const canSave = name.trim().length > 0;
  const phoneMissing = phone.trim().length === 0;

  const submit = () => {
    if (!canSave) return;
    onSave({
      id: initial?.id ?? newId(),
      name: name.trim(),
      phone: phone.trim(),
      relation: relation.trim() || "Contact",
      isService: initial?.isService,
    });
    onClose();
  };

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 12;
  const bottomPad = isWeb ? 34 : insets.bottom + 16;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: topPad,
            paddingBottom: bottomPad,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={[styles.cancel, { color: colors.mutedForeground }]}>
              Cancel
            </Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {initial ? "Edit contact" : "Add contact"}
          </Text>
          <Pressable onPress={submit} disabled={!canSave} hitSlop={10}>
            <Text
              style={[
                styles.save,
                {
                  color: canSave ? colors.primary : colors.mutedForeground,
                  opacity: canSave ? 1 : 0.5,
                },
              ]}
            >
              Save
            </Text>
          </Pressable>
        </View>

        <View style={styles.fields}>
          <Field
            label="Name"
            icon="user"
            value={name}
            onChangeText={setName}
            placeholder="Mom"
            autoFocus
          />
          <Field
            label="Phone"
            icon="phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 555 123 4567"
            keyboardType="phone-pad"
          />
          <Field
            label="Relation"
            icon="users"
            value={relation}
            onChangeText={setRelation}
            placeholder="Mother, friend, neighbor…"
          />
        </View>

        {phoneMissing ? (
          <View
            style={[
              styles.note,
              { borderColor: "#facc1555", backgroundColor: "#facc1511" },
            ]}
          >
            <Feather name="alert-triangle" size={14} color="#fde68a" />
            <Text style={[styles.noteText, { color: "#fde68a" }]}>
              Add a phone number so this contact can be alerted during an SOS.
            </Text>
          </View>
        ) : null}

        <View style={[styles.note, { borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
            Numbers are saved on this device only. They are never uploaded.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

interface FieldProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  value: string;
  onChangeText: (s: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad";
  autoFocus?: boolean;
}

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoFocus,
}: FieldProps) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Feather name={icon} size={16} color={colors.mutedForeground} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.inputText, { color: colors.foreground }]}
          keyboardType={keyboardType ?? "default"}
          autoFocus={autoFocus}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  cancel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  save: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  fields: {
    gap: 18,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  inputText: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    padding: 0,
  },
  note: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    marginTop: 24,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  noteText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
    lineHeight: 18,
  },
});
