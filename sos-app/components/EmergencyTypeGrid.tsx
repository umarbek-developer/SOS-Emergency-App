import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { EMERGENCY_TYPES, type EmergencyType } from "@/types";

interface Props {
  selected: EmergencyType;
  onSelect: (type: EmergencyType) => void;
}

export function EmergencyTypeGrid({ selected, onSelect }: Props) {
  const colors = useColors();

  return (
    <View style={styles.grid}>
      {EMERGENCY_TYPES.map((meta) => {
        const isSelected = meta.key === selected;
        return (
          <Pressable
            key={meta.key}
            onPress={() => onSelect(meta.key)}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: isSelected ? meta.color + "26" : colors.card,
                borderColor: isSelected ? meta.color : colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.iconBubble,
                {
                  backgroundColor: isSelected ? meta.color : meta.color + "1f",
                },
              ]}
            >
              <Ionicons
                name={meta.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={isSelected ? "#0a0c11" : meta.color}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.foreground : colors.mutedForeground },
              ]}
            >
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  tile: {
    width: "31.5%",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
