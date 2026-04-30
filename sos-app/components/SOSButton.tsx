import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

import { useColors } from "@/hooks/useColors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 280;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Props {
  holdSeconds: number;
  onActivate: () => void;
  haptics?: boolean;
}

export function SOSButton({ holdSeconds, onActivate, haptics = true }: Props) {
  const colors = useColors();
  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const [holding, setHolding] = useState(false);

  const startedRef = useRef<number>(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.06, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.35 + (1 - pulse.value) * -2,
  }));

  const fire = () => {
    onActivate();
  };

  const handlePressIn = () => {
    setHolding(true);
    startedRef.current = Date.now();
    if (haptics && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
    progress.value = withTiming(
      1,
      { duration: holdSeconds * 1000, easing: Easing.linear },
      (finished) => {
        if (finished) {
          runOnJS(fire)();
        }
      },
    );
  };

  const handlePressOut = () => {
    setHolding(false);
    cancelAnimation(progress);
    progress.value = withTiming(0, { duration: 240 });
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.halo,
          { backgroundColor: colors.primary },
          haloStyle,
        ]}
      />
      <Pressable
        accessibilityLabel={`Hold for ${holdSeconds} seconds to send SOS`}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Svg
          width={SIZE}
          height={SIZE}
          style={StyleSheet.absoluteFill as object}
        >
          <Defs>
            <RadialGradient id="ring-bg" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.15" />
              <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="url(#ring-bg)"
            stroke={colors.border}
            strokeWidth={STROKE}
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.primary}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={`${CIRCUMFERENCE}, ${CIRCUMFERENCE}`}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <LinearGradient
          colors={[colors.primary, "#8b0a14"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Ionicons
            name="alert"
            size={64}
            color={colors.primaryForeground}
          />
          <Text style={[styles.label, { color: colors.primaryForeground }]}>
            SOS
          </Text>
        </LinearGradient>
      </Pressable>
      <Text style={[styles.hint, { color: colors.mutedForeground }]}>
        {holding
          ? `Hold ${holdSeconds}s to send alert…`
          : `Press and hold for ${holdSeconds} seconds`}
      </Text>
    </View>
  );
}

const INNER = SIZE - STROKE * 2 - 24;

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE + 32,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: SIZE + 60,
    height: SIZE + 60,
    borderRadius: (SIZE + 60) / 2,
    top: 0,
    opacity: 0.18,
  },
  pressable: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  label: {
    fontFamily: "Inter_700Bold",
    fontSize: 44,
    letterSpacing: 6,
    marginTop: 4,
  },
  hint: {
    position: "absolute",
    bottom: -4,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
});
