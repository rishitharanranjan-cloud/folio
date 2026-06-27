/**
 * DVD/Blu-ray case — spine visible at rest. Rotates to reveal front cover on press.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { fonts } from '../../theme/tokens';
import { getAmbientColour, ambientToHex } from '../../lib/ambientColour';
import type { LogEntry } from '../../hooks/useLogs';

interface Props { log: LogEntry }

export default function DVDCase({ log }: Props) {
  const { colors } = useThemeStore();
  const [pressed, setPressed] = useState(false);
  const rotateY = useSharedValue(0);

  const spineStyle = useAnimatedStyle(() => ({
    opacity: withTiming(rotateY.value > 0.5 ? 0 : 1, { duration: 150 }),
  }));
  const frontStyle = useAnimatedStyle(() => ({
    opacity: withTiming(rotateY.value > 0.5 ? 1 : 0, { duration: 150 }),
  }));

  const onPress = () => {
    const next = !pressed;
    setPressed(next);
    rotateY.value = withTiming(next ? 1 : 0, { duration: 300 });
  };

  const colour = log.dominant_colour ?? ambientToHex(getAmbientColour(log.title));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.wrapper}>
      {/* Spine (rest state) */}
      <Animated.View style={[styles.spine, { backgroundColor: colour }, spineStyle]}>
        <Text style={[styles.spineText, { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.mono }]} numberOfLines={5}>
          {log.title.toUpperCase()}
        </Text>
        <Text style={[styles.spineType, { color: 'rgba(255,255,255,0.4)', fontFamily: fonts.mono }]}>
          TV
        </Text>
      </Animated.View>

      {/* Front cover (pressed state) */}
      <Animated.View style={[styles.front, { backgroundColor: colour }, frontStyle]}>
        {log.cover_url ? (
          <Image source={{ uri: log.cover_url }} style={styles.coverImg} resizeMode="cover" />
        ) : (
          <View style={styles.coverFallback}>
            <Text style={[styles.coverTitle, { color: '#fff', fontFamily: fonts.display }]} numberOfLines={4}>
              {log.title.toUpperCase()}
            </Text>
          </View>
        )}
        {log.rating && (
          <View style={[styles.ratingBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <Text style={[styles.ratingText, { color: '#fff', fontFamily: fonts.mono }]}>
              {'★'.repeat(log.rating)}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  spine: {
    width: 24,
    height: 140,
    padding: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
  },
  spineText: {
    fontSize: 8,
    letterSpacing: 0.5,
    transform: [{ rotate: '180deg' }],
    textAlign: 'center',
    lineHeight: 10,
  },
  spineType: { fontSize: 7, letterSpacing: 1 },
  front: {
    width: 80,
    height: 140,
    overflow: 'hidden',
  },
  coverImg: { width: '100%', height: '100%' },
  coverFallback: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  coverTitle: { fontSize: 14, letterSpacing: 1, lineHeight: 16 },
  ratingBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  ratingText: { fontSize: 9, letterSpacing: 1 },
});
