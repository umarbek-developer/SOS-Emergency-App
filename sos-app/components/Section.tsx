import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  hint?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}

export function Section({ title, hint, right, children }: Props) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.mutedForeground }]}>
            {title.toUpperCase()}
          </Text>
          {hint ? (
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              {hint}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 11.5,
    letterSpacing: 1.2,
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  body: {
    gap: 8,
  },
});
