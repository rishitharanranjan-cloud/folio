/**
 * Cassette tape standing upright — tape side visible at rest.
 * Flips face-forward on press, reels and title visible.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { fonts } from '../../theme/tokens';
import { getAmbientColour, ambientToHex } from '../../lib/ambientColour';
import type { LogEntry } from '../../hooks/useLogs';

interface Props { log: LogEntry; onSelect?: (log: LogEntry) => void }

export default function CassetteTape({ log, onSelect }: Props) {
  const { colors } = useThemeStore();
  const [pressed, setPressed] = useState(false);
  const flip = useSharedValue(0);

  const sideStyle  = useAnimatedStyle(() => ({ opacity: withTiming(pressed ? 0 : 1, { duration: 200 }) }));
  const frontStyle = useAnimatedStyle(() => ({ opacity: withTiming(pressed ? 1 : 0, { duration: 200 }) }));

  const colour = log.dominant_colour ?? ambientToHex(getAmbientColour(log.title));

  return (
    <TouchableOpacity onPress={() => setPressed((p) => !p)} onLongPress={() => onSelect?.(log)} activeOpacity={0.9} style={styles.wrapper}>
      {/* Side (rest) */}
      <Animated.View style={[styles.side, { backgroundColor: colour }, sideStyle]}>
        <Text style={[styles.sideText, { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.mono }]} numberOfLines={6}>
          {log.title.toUpperCase()}
        </Text>
      </Animated.View>

      {/* Front (pressed) */}
      <Animated.View style={[styles.front, { backgroundColor: colours.cassette ?? '#1a1a1a', borderColor: colour }, frontStyle]}>
        {/* Label strip */}
        <View style={[styles.labelStrip, { backgroundColor: colour }]}>
          <Text style={[styles.labelTitle, { color: '#fff', fontFamily: fonts.display }]} numberOfLines={2}>
            {log.title.toUpperCase()}
          </Text>
          {log.creator && (
            <Text style={[styles.labelCreator, { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.body }]} numberOfLines={1}>
              {log.creator}
            </Text>
          )}
        </View>
        {/* Reel window */}
        <View style={styles.reelRow}>
          <View style={[styles.reel, { borderColor: colour }]}>
            <View style={[styles.reelHub, { backgroundColor: colour }]} />
          </View>
          <View style={[styles.reelRow, { gap: 2, alignItems: 'center' }]}>
            <View style={[styles.tapeGuide, { backgroundColor: colors.border2 }]} />
            <View style={[styles.tapeGuide, { backgroundColor: colors.border2 }]} />
          </View>
          <View style={[styles.reel, { borderColor: colour }]}>
            <View style={[styles.reelHub, { backgroundColor: colour }]} />
          </View>
        </View>
        {log.rating && (
          <Text style={[styles.rating, { color: colour, fontFamily: fonts.mono }]}>
            {'★'.repeat(log.rating)}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// fallback colours object
const colours: Record<string, string> = { cassette: '#1e1e1e' };

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  side: {
    width: 16,
    height: 110,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  sideText: {
    fontSize: 7,
    transform: [{ rotate: '180deg' }],
    textAlign: 'center',
    lineHeight: 9,
    letterSpacing: 0.5,
  },
  front: {
    width: 90,
    height: 56,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginTop: 27,
  },
  labelStrip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 1,
  },
  labelTitle: { fontSize: 10, letterSpacing: 1, lineHeight: 11 },
  labelCreator: { fontSize: 8, fontStyle: 'italic' },
  reelRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  reel: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reelHub: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tapeGuide: {
    width: 4,
    height: 8,
    borderRadius: 1,
  },
  rating: { fontSize: 9, letterSpacing: 1, textAlign: 'center' },
});
