import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated';
import { fonts } from '../../theme/tokens';
import { W } from './palette';
import type { WrappedData } from '../../lib/wrappedData';

const { width: W_WIDTH, height: W_HEIGHT } = Dimensions.get('window');

interface Props { data: WrappedData }

export default function Chapter0Intro({ data }: Props) {
  const yearO  = useSharedValue(0);
  const stat1O = useSharedValue(0);
  const stat2O = useSharedValue(0);
  const stat3O = useSharedValue(0);
  const stat4O = useSharedValue(0);

  useEffect(() => {
    yearO.value  = withTiming(1, { duration: 700 });
    stat1O.value = withDelay(400,  withTiming(1, { duration: 500 }));
    stat2O.value = withDelay(600,  withTiming(1, { duration: 500 }));
    stat3O.value = withDelay(800,  withTiming(1, { duration: 500 }));
    stat4O.value = withDelay(1000, withTiming(1, { duration: 500 }));
  }, []);

  const topTypes = Object.entries(data.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t, c]) => `${c} ${t}${c !== 1 ? 's' : ''}`);

  return (
    <View style={[styles.container, { backgroundColor: W.terracotta }]}>
      <Text style={[styles.watermark, { fontFamily: fonts.display }]}>{data.year}</Text>

      <View style={styles.content}>
        <Animated.View style={{ opacity: yearO }}>
          <Text style={[styles.eyebrow, { fontFamily: fonts.mono }]}>YOUR YEAR IN CULTURE</Text>
          <Text style={[styles.year, { fontFamily: fonts.display }]}>{data.year}</Text>
        </Animated.View>

        <View style={styles.stats}>
          {[
            { label: 'THINGS LOGGED',  value: String(data.total) },
            { label: 'TOP MEDIUM',     value: (topTypes[0] ?? '—').toUpperCase() },
            { label: 'AVG RATING',     value: data.avgRating ? `${data.avgRating} ★` : '—' },
            { label: 'PEAK MONTH',     value: (data.peakMonth ?? '—').toUpperCase().slice(0, 3) },
          ].map((s, i) => (
            <Animated.View
              key={s.label}
              style={[styles.statCell, { borderColor: 'rgba(245,237,216,0.3)', opacity: [stat1O, stat2O, stat3O, stat4O][i] }]}
            >
              <Text style={[styles.statValue, { fontFamily: fonts.display, color: W.cream }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { fontFamily: fonts.mono, color: 'rgba(245,237,216,0.6)' }]}>{s.label}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: W_WIDTH },
  watermark: {
    position: 'absolute', fontSize: 260, color: 'rgba(245,237,216,0.06)',
    letterSpacing: 8, bottom: -40, right: -20,
  },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 40, gap: 40 },
  eyebrow: { fontSize: 10, letterSpacing: 3, color: 'rgba(245,237,216,0.6)', marginBottom: 8 },
  year: { fontSize: 96, color: W.cream, letterSpacing: 8, lineHeight: 96 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  statCell: {
    width: '48%', borderWidth: 1, padding: 16, gap: 6,
  },
  statValue: { fontSize: 32, letterSpacing: 2, lineHeight: 34 },
  statLabel: { fontSize: 9, letterSpacing: 2 },
});
