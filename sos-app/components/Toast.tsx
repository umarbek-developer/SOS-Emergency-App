import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/contexts/AppContext";
import { useColors } from "@/hooks/useColors";

export function Toast() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toast } = useApp();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  useEffect(() => {
    if (toast) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(-20, { duration: 180 });
    }
  }, [toast, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const top = Platform.OS === "web" ? 24 : insets.top + 8;
  const accent = toast?.tone === "error" ? colors.primary : "#22c55e";
  const iconName: keyof typeof Feather.glyphMap =
    toast?.tone === "error"
      ? "alert-triangle"
      : toast?.tone === "info"
      ? "info"
      : "check-circle";

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          top,
          backgroundColor: colors.cardElevated,
          borderColor: accent + "55",
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.iconBubble, { backgroundColor: accent + "22" }]}>
        <Feather name={iconName} size={14} color={accent} />
      </View>
      <Text style={[styles.text, { color: colors.foreground }]}>
        {toast?.message ?? ""}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
});
