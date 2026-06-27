/**
 * Game cartridge — spine with notch and gold contacts at rest.
 * Cover card slides out to the right on press.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { fonts } from '../../theme/tokens';
import { getAmbientColour, ambientToHex } from '../../lib/ambientColour';
import type { LogEntry } from '../../hooks/useLogs';

interface Props { log: LogEntry; onSelect?: (log: LogEntry) => void }

const CART_W = 50;
const CART_H = 70;
const NOTCH_W = 16;

export default function GameCartridge({ log, onSelect }: Props) {
  const { colors } = useThemeStore();
  const [pressed, setPressed] = useState(false);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(pressed ? CART_W + 8 : 0, { duration: 280 }) }],
    opacity: withTiming(pressed ? 1 : 0, { duration: 200 }),
  }));

  const onPress = () => setPressed((p) => !p);

  const colour = log.dominant_colour ?? ambientToHex(getAmbientColour(log.title));

  return (
    <TouchableOpacity onPress={onPress} onLongPress={() => onSelect?.(log)} activeOpacity={0.9} style={styles.wrapper}>
      {/* Cartridge body */}
      <View style={[styles.cartridge, { backgroundColor: colour }]}>
        {/* Notch cutout at top */}
        <View style={[styles.notch, { backgroundColor: colors.bg }]} />

        {/* Label area */}
        <View style={styles.labelArea}>
          <Text style={[styles.labelText, { color: '#fff', fontFamily: fonts.display }]} numberOfLines={3}>
            {log.title.toUpperCase()}
          </Text>
        </View>

        {/* Gold contacts at bottom */}
        <View style={styles.contacts}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={[styles.contact, { backgroundColor: '#c8a040' }]} />
          ))}
        </View>
      </View>

      {/* Slide-out cover card */}
      <Animated.View style={[styles.coverCard, { backgroundColor: colors.bg2, borderColor: colour }, cardStyle]}>
        {log.cover_url ? (
          <Image source={{ uri: log.cover_url }} style={styles.coverImg} resizeMode="cover" />
        ) : (
          <View style={[styles.coverFallback, { backgroundColor: colour }]}>
            <Text style={[styles.coverTitle, { color: '#fff', fontFamily: fonts.display }]} numberOfLines={4}>
              {log.title.toUpperCase()}
            </Text>
          </View>
        )}
        {log.rating && (
          <View style={[styles.ratingRow, { backgroundColor: colors.bg2 }]}>
            <Text style={[styles.ratingText, { color: colour, fontFamily: fonts.mono }]}>
              {'★'.repeat(log.rating)}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'flex-start', flexDirection: 'row' },
  cartridge: {
    width: CART_W,
    height: CART_H,
    alignItems: 'center',
    overflow: 'hidden',
  },
  notch: {
    width: NOTCH_W,
    height: 8,
    alignSelf: 'center',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  labelArea: {
    flex: 1,
    padding: 4,
    justifyContent: 'center',
    width: '100%',
  },
  labelText: { fontSize: 10, letterSpacing: 1, lineHeight: 12, textAlign: 'center' },
  contacts: {
    flexDirection: 'row',
    gap: 2,
    paddingBottom: 4,
    paddingHorizontal: 3,
  },
  contact: {
    width: 4,
    height: 10,
    borderRadius: 1,
  },
  coverCard: {
    width: CART_W,
    height: CART_H,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  coverImg: { width: '100%', height: '80%' },
  coverFallback: {
    width: '100%',
    height: '80%',
    padding: 6,
    justifyContent: 'center',
  },
  coverTitle: { fontSize: 10, letterSpacing: 1, lineHeight: 12 },
  ratingRow: {
    height: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: { fontSize: 9, letterSpacing: 1 },
});
