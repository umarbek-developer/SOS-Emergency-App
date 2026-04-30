import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top + 12;

  return (
    <View style={[styles.wrap, { paddingTop: topPad }]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: -0.4,
  },
  sub: {
    fontFamily: "Inter_500Medium",
    fontSize: 13.5,
    marginTop: 4,
  },
});
