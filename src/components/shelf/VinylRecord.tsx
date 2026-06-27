/**
 * Vinyl record in a crate — sleeve visible at rest, vinyl peeks above on press.
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
const SIZE = 110;

export default function VinylRecord({ log }: Props) {
  const { colors } = useThemeStore();
  const [pressed, setPressed] = useState(false);
  const vinylY  = useSharedValue(0);
  const labelO  = useSharedValue(0);

  const colour = log.dominant_colour ?? ambientToHex(getAmbientColour(log.title));

  const vinylStyle = useAnimatedStyle(() => ({ transform: [{ translateY: vinylY.value }] }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: labelO.value }));

  const onPress = () => {
    const next = !pressed;
    setPressed(next);
    vinylY.value = withSpring(next ? -32 : 0, { damping: 14 });
    labelO.value = withTiming(next ? 1 : 0, { duration: 200 });
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.wrapper}>
      {/* Vinyl disc (behind sleeve) */}
      <Animated.View style={[styles.vinyl, vinylStyle]}>
        <View style={[styles.vinylDisc, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: '#111' }]}>
          {/* Grooves */}
          {[0.82, 0.64, 0.48, 0.34].map((r, i) => (
            <View key={i} style={[styles.groove, {
              width: SIZE * r, height: SIZE * r,
              borderRadius: SIZE * r / 2,
              borderColor: 'rgba(255,255,255,0.06)',
            }]} />
          ))}
          {/* Label */}
          <View style={[styles.vinylLabel, { backgroundColor: colour, width: SIZE * 0.33, height: SIZE * 0.33, borderRadius: SIZE * 0.165 }]}>
            <Text style={[styles.vinylText, { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.mono }]} numberOfLines={1}>
              {log.title.slice(0, 5).toUpperCase()}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Sleeve */}
      <View style={[styles.sleeve, { width: SIZE, height: SIZE, borderColor: colors.border2 }]}>
        {log.cover_url ? (
          <Image source={{ uri: log.cover_url }} style={styles.sleeveImg} resizeMode="cover" />
        ) : (
          <View style={[styles.sleeveImg, { backgroundColor: colour }]} />
        )}
      </View>

      {/* Label — title + artist beneath on press */}
      <Animated.View style={[styles.metaLabel, labelStyle]}>
        <Text style={[styles.metaTitle, { color: colors.ink, fontFamily: fonts.display }]} numberOfLines={1}>
          {log.title.toUpperCase().slice(0, 16)}
        </Text>
        {log.creator && (
          <Text style={[styles.metaCreator, { color: colors.ink3, fontFamily: fonts.mono }]} numberOfLines={1}>
            {log.creator.slice(0, 16)}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', width: SIZE, gap: 6 },
  vinyl: { position: 'absolute', top: -SIZE * 0.15, zIndex: 0 },
  vinylDisc: { alignItems: 'center', justifyContent: 'center' },
  groove: { position: 'absolute', borderWidth: 1 },
  vinylLabel: { alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  vinylText: { fontSize: 6, letterSpacing: 0.5 },
  sleeve: {
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1,
    marginTop: SIZE * 0.2,
  },
  sleeveImg: { width: '100%', height: '100%' },
  metaLabel: { alignItems: 'center', gap: 2, width: SIZE },
  metaTitle: { fontSize: 10, letterSpacing: 1, textAlign: 'center' },
  metaCreator: { fontSize: 8, letterSpacing: 0.5, textAlign: 'center' },
});
