/**
 * Book spine — vertical coloured spine on a shelf plank.
 * Varying heights for realism. Press → lifts + title card.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { fonts } from '../../theme/tokens';
import type { LogEntry } from '../../hooks/useLogs';

interface Props { log: LogEntry; index: number; onSelect?: (log: LogEntry) => void }

// Deterministic spine width and height from title hash
function hashInt(str: string, seed = 0): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h ^ str.charCodeAt(i), 0x9e3779b9)) ^ (h >>> 16);
  return Math.abs(h);
}

const SPINE_COLOURS = [
  '#8b3a2a','#2a5a8b','#4a7a3a','#7a4a8b','#8b7a2a',
  '#2a7a7a','#8b4a2a','#3a4a8b','#6a8b3a','#8b2a5a',
];

function spineColour(log: LogEntry, index: number): string {
  if (log.dominant_colour) return log.dominant_colour;
  return SPINE_COLOURS[hashInt(log.id) % SPINE_COLOURS.length];
}

export default function BookSpine({ log, index, onSelect }: Props) {
  const { colors } = useThemeStore();
  const [pressed, setPressed] = useState(false);
  const liftY   = useSharedValue(0);
  const cardO   = useSharedValue(0);

  const colour = spineColour(log, index);

  // Vary spine dimensions per book for realism
  const h = hashInt(log.id, 3);
  const spineH = 160 + (h % 80);         // 160–240px
  const spineW = 28 + (h % 20);          // 28–48px — wide enough to read title

  const spineStyle  = useAnimatedStyle(() => ({ transform: [{ translateY: liftY.value }] }));
  const cardStyle   = useAnimatedStyle(() => ({ opacity: cardO.value }));

  const onPress = () => {
    const next = !pressed;
    setPressed(next);
    liftY.value = withSpring(next ? -24 : 0, { damping: 14 });
    cardO.value = withTiming(next ? 1 : 0, { duration: 180 });
  };

  const isWide = spineW >= 36;

  return (
    <TouchableOpacity onPress={onPress} onLongPress={() => onSelect?.(log)} activeOpacity={0.9} style={styles.wrapper}>
      <Animated.View style={spineStyle}>
        {/* Spine body */}
        <View style={[styles.spine, { height: spineH, width: spineW, backgroundColor: colour }]}>
          {/* Top cap — slightly lighter */}
          <View style={[styles.topCap, { backgroundColor: 'rgba(255,255,255,0.15)', width: spineW }]} />
          {/* Title text rotated */}
          {isWide && (
            <Text
              style={[styles.spineTitle, { fontFamily: fonts.body, width: spineH - 24, color: 'rgba(255,255,255,0.9)' }]}
              numberOfLines={1}
            >
              {log.title}
            </Text>
          )}
          {/* Bottom author strip */}
          <View style={[styles.bottomStrip, { backgroundColor: 'rgba(0,0,0,0.25)', width: spineW }]}>
            {isWide && log.creator && (
              <Text style={[styles.spineAuthor, { fontFamily: fonts.mono }]} numberOfLines={1}>
                {log.creator.split(' ').pop()?.slice(0, 6).toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        {/* Title card — hovers above spine on press */}
        <Animated.View style={[
          styles.card,
          { backgroundColor: colors.bg, borderColor: colour, left: -(140 - spineW) / 2 },
          cardStyle,
        ]}>
          <View style={[styles.cardAccent, { backgroundColor: colour }]} />
          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: colors.ink, fontFamily: fonts.display }]} numberOfLines={3}>
              {log.title.toUpperCase()}
            </Text>
            {log.creator && (
              <Text style={[styles.cardCreator, { color: colors.ink3, fontFamily: fonts.body }]} numberOfLines={1}>
                {log.creator}
              </Text>
            )}
            {log.rating ? (
              <Text style={[styles.cardRating, { color: colour, fontFamily: fonts.mono }]}>
                {'★'.repeat(log.rating)}
              </Text>
            ) : null}
          </View>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  spine: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topCap: { position: 'absolute', top: 0, height: 6 },
  bottomStrip: { position: 'absolute', bottom: 0, height: 20, alignItems: 'center', justifyContent: 'center' },
  spineAuthor: { fontSize: 6, letterSpacing: 0.5, color: 'rgba(255,255,255,0.6)' },
  spineTitle: {
    fontSize: 10,
    fontStyle: 'italic',
    transform: [{ rotate: '-90deg' }],
    textAlign: 'center',
    lineHeight: 13,
  },
  card: {
    position: 'absolute',
    top: -130,
    width: 140,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  cardAccent: { width: 3 },
  cardBody: { flex: 1, padding: 10, gap: 4 },
  cardTitle: { fontSize: 14, letterSpacing: 1, lineHeight: 16 },
  cardCreator: { fontSize: 11, fontStyle: 'italic' },
  cardRating: { fontSize: 10, letterSpacing: 2, marginTop: 2 },
});
