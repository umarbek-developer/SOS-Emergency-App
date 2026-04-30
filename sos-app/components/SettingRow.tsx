import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface BaseProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  hint?: string;
}

interface SwitchProps extends BaseProps {
  type: "switch";
  value: boolean;
  onValueChange: (v: boolean) => void;
}

interface ChevronProps extends BaseProps {
  type: "chevron";
  value?: string;
  onPress: () => void;
}

interface ValueProps extends BaseProps {
  type: "value";
  value: string;
}

type Props = SwitchProps | ChevronProps | ValueProps;

export function SettingRow(props: Props) {
  const colors = useColors();

  const inner = (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.iconBubble,
          { backgroundColor: colors.cardElevated },
        ]}
      >
        <Feather name={props.icon} size={16} color={colors.foreground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {props.label}
        </Text>
        {props.hint ? (
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            {props.hint}
          </Text>
        ) : null}
      </View>
      {props.type === "switch" ? (
        <Switch
          value={props.value}
          onValueChange={props.onValueChange}
          trackColor={{ false: colors.muted, true: colors.primary }}
          thumbColor="#fff"
        />
      ) : null}
      {props.type === "chevron" ? (
        <View style={styles.chevronWrap}>
          {props.value ? (
            <Text style={[styles.chevValue, { color: colors.mutedForeground }]}>
              {props.value}
            </Text>
          ) : null}
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>
      ) : null}
      {props.type === "value" ? (
        <Text style={[styles.chevValue, { color: colors.foreground }]}>
          {props.value}
        </Text>
      ) : null}
    </View>
  );

  if (props.type === "chevron") {
    return (
      <Pressable
        onPress={props.onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14.5,
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  chevronWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chevValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
});
