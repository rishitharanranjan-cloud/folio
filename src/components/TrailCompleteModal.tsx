/**
 * Celebratory modal when a user completes all stops on a trail.
 * Full-screen, editorial 70s palette, minimal animation.
 */
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Dimensions,
} from 'react-native';
import { fonts } from '../theme/tokens';

const { width: W, height: H } = Dimensions.get('window');

// 70s editorial palette (matches Wrapped)
const C = {
  bg:       '#1a1208',
  streak:   '#5aaa74',
  mustard:  '#c8941e',
  cream:    '#f5edd8',
  ink3:     '#907860',
};

interface Props {
  trailTitle: string;
  onClose: () => void;
}

export default function TrailCompleteModal({ trailTitle, onClose }: Props) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Top accent */}
          <View style={[styles.accentLine, { backgroundColor: C.streak }]} />

          {/* Eyebrow */}
          <Text style={styles.eyebrow}>TRAIL COMPLETE</Text>

          {/* Big tick */}
          <Text style={styles.tick}>✓</Text>

          {/* Trail title */}
          <Text style={styles.trailTitle}>{trailTitle.toUpperCase()}</Text>

          {/* Sub copy */}
          <Text style={styles.sub}>
            Every stop logged.{'\n'}This one goes on your constellation.
          </Text>

          {/* Dismiss */}
          <TouchableOpacity style={styles.btn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.btnText}>CONTINUE</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const CARD_W = Math.min(W - 48, 380);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: CARD_W,
    backgroundColor: C.bg,
    alignItems: 'center',
    paddingBottom: 32,
    overflow: 'hidden',
    gap: 0,
  },
  accentLine: {
    width: '100%',
    height: 4,
    marginBottom: 28,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 3,
    color: C.streak,
    marginBottom: 16,
  },
  tick: {
    fontSize: 56,
    color: C.streak,
    lineHeight: 64,
    marginBottom: 16,
  },
  trailTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: 3,
    color: C.cream,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 30,
    marginBottom: 16,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: C.ink3,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 28,
    fontStyle: 'italic',
    marginBottom: 32,
  },
  btn: {
    backgroundColor: C.streak,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  btnText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 3,
    color: '#020408',
  },
});
