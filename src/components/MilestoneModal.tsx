import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { fonts } from '../theme/tokens';

export type MilestoneType =
  | { kind: 'logs'; count: number }
  | { kind: 'streak'; weeks: number };

interface Props {
  milestone: MilestoneType | null;
  onDismiss: () => void;
}

function getMilestoneText(m: MilestoneType) {
  if (m.kind === 'logs') {
    return {
      number: `${m.count}`,
      label: 'THINGS LOGGED',
      sub: m.count >= 100 ? 'A century of culture.' : m.count >= 50 ? 'Halfway to a hundred.' : m.count >= 25 ? 'A quarter century.' : 'Getting into it.',
    };
  }
  return {
    number: `${m.weeks}`,
    label: m.weeks === 1 ? 'WEEK STREAK' : 'WEEKS STREAK',
    sub: m.weeks >= 12 ? 'Three months straight.' : m.weeks >= 8 ? 'Two months running.' : 'Consistent culture diet.',
  };
}

export default function MilestoneModal({ milestone, onDismiss }: Props) {
  const { colors } = useThemeStore();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (!milestone) return;
    opacity.setValue(0);
    translateY.setValue(30);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => onDismiss());
    }, 3500);
    return () => clearTimeout(timer);
  }, [milestone]);

  if (!milestone) return null;

  const { number, label, sub } = getMilestoneText(milestone);

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.bg2, borderColor: colors.accent, opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity style={styles.inner} onPress={onDismiss} activeOpacity={0.9}>
        <Text style={[styles.milestone, { color: colors.accent, fontFamily: fonts.mono }]}>MILESTONE</Text>
        <View style={styles.row}>
          <Text style={[styles.number, { color: colors.ink, fontFamily: fonts.display }]}>{number}</Text>
          <Text style={[styles.label, { color: colors.ink3, fontFamily: fonts.mono }]}>{label}</Text>
        </View>
        <Text style={[styles.sub, { color: colors.ink2, fontFamily: fonts.body }]}>{sub}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    borderWidth: 1,
    zIndex: 999,
    elevation: 20,
  },
  inner: {
    padding: 20,
    gap: 6,
  },
  milestone: { fontSize: 9, letterSpacing: 3 },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  number: { fontSize: 48, letterSpacing: 2, lineHeight: 52 },
  label: { fontSize: 11, letterSpacing: 2 },
  sub: { fontSize: 13, fontStyle: 'italic' },
});
