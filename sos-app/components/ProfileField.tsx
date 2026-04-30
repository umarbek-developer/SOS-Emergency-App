import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  editable?: boolean;
}

export function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  editable = true,
}: Props) {
  const colors = useColors();
  const isEmpty = value.trim().length === 0;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label.toUpperCase()}
      </Text>
      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          multiline={multiline}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.foreground,
              minHeight: multiline ? 88 : 48,
              textAlignVertical: multiline ? "top" : "center",
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.input,
            styles.readonly,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              minHeight: multiline ? 88 : 48,
            },
          ]}
        >
          <Text
            style={[
              styles.readonlyText,
              { color: isEmpty ? colors.mutedForeground : colors.foreground },
            ]}
          >
            {isEmpty ? placeholder ?? "Not set" : value}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.1,
    paddingHorizontal: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  readonly: {
    justifyContent: "center",
  },
  readonlyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
});
