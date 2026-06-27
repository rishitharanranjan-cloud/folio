/**
 * Film frame — proper film strip with sprocket holes.
 * Poster fills frame. Press → lifts + title overlay.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { fonts } from '../../theme/tokens';
import { getAmbientColour, ambientToHex } from '../../lib/ambientColour';
import type { LogEntry } from '../../hooks/useLogs';

interface Props { log: LogEntry }

const FRAME_W = 100;
const FRAME_H = 148;
const HOLE_W  = 10;
const HOLE_H  = 7;
const HOLES   = 5;

export default function FilmFrame({ log }: Props) {
  const { colors } = useThemeStore();
  const [pressed, setPressed] = useState(false);
  const liftY   = useSharedValue(0);
  const overlayO = useSharedValue(0);

  const colour = log.dominant_colour ?? ambientToHex(getAmbientColour(log.title));

  const frameStyle   = useAnimatedStyle(() => ({ transform: [{ translateY: liftY.value }] }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayO.value }));

  const onPress = () => {
    const next = !pressed;
    setPressed(next);
    liftY.value    = withSpring(next ? -20 : 0, { damping: 14 });
    overlayO.value = withTiming(next ? 1 : 0, { duration: 200 });
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <Animated.View style={[styles.strip, frameStyle]}>
        {/* Top sprocket row */}
        <View style={[styles.sprocketRow, { backgroundColor: '#1a1a1a' }]}>
          {Array.from({ length: HOLES }).map((_, i) => (
            <View key={i} style={[styles.hole, { backgroundColor: colors.bg }]} />
          ))}
        </View>

        {/* Poster area */}
        <View style={[styles.poster, { width: FRAME_W, height: FRAME_H }]}>
          {log.cover_url ? (
            <Image source={{ uri: log.cover_url }} style={styles.posterImg} resizeMode="cover" />
          ) : (
            <View style={[styles.posterImg, { backgroundColor: colour }]} />
          )}

          {/* Overlay on press */}
          <Animated.View style={[styles.overlay, { backgroundColor: `${colour}dd` }, overlayStyle]}>
            <Text style={[styles.overlayTitle, { fontFamily: fonts.display, color: '#fff' }]} numberOfLines={3}>
              {log.title.toUpperCase()}
            </Text>
            {log.creator && (
              <Text style={[styles.overlayCreator, { fontFamily: fonts.body, color: 'rgba(255,255,255,0.75)' }]} numberOfLines={1}>
                {log.creator}
              </Text>
            )}
            {log.year && (
              <Text style={[styles.overlayYear, { fontFamily: fonts.mono, color: 'rgba(255,255,255,0.55)' }]}>
                {log.year}
              </Text>
            )}
            {log.rating ? (
              <Text style={[styles.overlayRating, { color: '#fff', fontFamily: fonts.mono }]}>
                {'★'.repeat(log.rating)}
              </Text>
            ) : null}
          </Animated.View>
        </View>

        {/* Bottom sprocket row */}
        <View style={[styles.sprocketRow, { backgroundColor: '#1a1a1a' }]}>
          {Array.from({ length: HOLES }).map((_, i) => (
            <View key={i} style={[styles.hole, { backgroundColor: colors.bg }]} />
          ))}
        </View>

        {/* Frame number */}
        <Text style={[styles.frameNum, { color: 'rgba(255,255,255,0.2)', fontFamily: fonts.mono }]}>
          {String(log.title.charCodeAt(0) % 99 + 1).padStart(2, '0')}A
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    paddingHorizontal: 6,
  },
  sprocketRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  hole: { width: HOLE_W, height: HOLE_H, borderRadius: 1 },
  poster: { overflow: 'hidden' },
  posterImg: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    padding: 10, justifyContent: 'flex-end', gap: 4,
  },
  overlayTitle: { fontSize: 14, letterSpacing: 1, lineHeight: 16 },
  overlayCreator: { fontSize: 11, fontStyle: 'italic' },
  overlayYear: { fontSize: 9, letterSpacing: 1 },
  overlayRating: { fontSize: 11, letterSpacing: 2 },
  frameNum: { fontSize: 7, letterSpacing: 1, textAlign: 'right', padding: 3 },
});
