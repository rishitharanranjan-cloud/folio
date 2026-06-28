import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { useThemeStore } from '../store/themeStore';

interface Props {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}

export default function Skeleton({ width = '100%', height = 16, style }: Props) {
  const { colors } = useThemeStore();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700 }),
        withTiming(0.4, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.bone,
        { width: width as any, height, backgroundColor: colors.bg3 },
        animStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bone: {},
});
