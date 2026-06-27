import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Modal, ScrollView, Animated, Dimensions, Platform,
} from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { fonts } from '../theme/tokens';
import { clampAmbient, hexToRgb, ambientToHex, getAmbientColour } from '../lib/ambientColour';
import type { LogEntry } from '../hooks/useLogs';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.72;

const STATUS_LABEL: Record<string, string> = {
  completed:   'COMPLETED',
  in_progress: 'IN PROGRESS',
  dropped:     'DROPPED',
};

const MEDIA_LABEL: Record<string, string> = {
  book: 'BOOK', film: 'FILM', tv: 'TV', album: 'ALBUM', podcast: 'PODCAST', game: 'GAME',
};

interface Props {
  log: LogEntry | null;
  onClose: () => void;
}

export default function ShelfItemModal({ log, onClose }: Props) {
  const { colors, mode } = useThemeStore();
  const isDark = mode === 'dark';
  const slideY = useRef(new Animated.Value(SHEET_H)).current;
  const bgO    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (log) {
      Animated.parallel([
        Animated.timing(bgO,    { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideY, { toValue: 0, damping: 22, stiffness: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(bgO,    { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: SHEET_H, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [log]);

  if (!log) return null;

  const rawRgb  = log.dominant_colour ? hexToRgb(log.dominant_colour) : null;
  const clamped = rawRgb ? clampAmbient(rawRgb, isDark) : null;
  const accentHex = clamped
    ? ambientToHex(clamped)
    : ambientToHex(clampAmbient(getAmbientColour(log.title), isDark));

  const accentRgb = hexToRgb(accentHex);
  const accentFill = accentRgb
    ? `rgba(${accentRgb[0]},${accentRgb[1]},${accentRgb[2]},0.12)`
    : colors.accentg;

  return (
    <Modal transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Scrim */}
      <Animated.View style={[styles.scrim, { opacity: bgO }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[
        styles.sheet,
        { backgroundColor: colors.bg2, transform: [{ translateY: slideY }] },
      ]}>
        {/* Accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accentHex }]} />

        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border2 }]} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover + meta side-by-side */}
          <View style={styles.topRow}>
            {log.cover_url ? (
              <Image source={{ uri: log.cover_url }} style={[styles.cover, { borderColor: colors.border }]} resizeMode="cover" />
            ) : (
              <View style={[styles.cover, { backgroundColor: accentFill, borderColor: accentHex }]}>
                <Text style={[styles.coverFallback, { color: accentHex, fontFamily: fonts.mono }]}>
                  {log.title.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.metaCol}>
              <View style={[styles.typePill, { backgroundColor: accentFill, borderColor: accentHex }]}>
                <Text style={[styles.typeText, { color: accentHex, fontFamily: fonts.mono }]}>
                  {MEDIA_LABEL[log.media_type] ?? log.media_type.toUpperCase()}
                </Text>
              </View>

              <Text style={[styles.title, { color: colors.ink, fontFamily: fonts.display }]} numberOfLines={5}>
                {log.title.toUpperCase()}
              </Text>

              {log.creator && (
                <Text style={[styles.creator, { color: colors.ink2, fontFamily: fonts.body }]}>
                  {log.creator}{log.year ? `  ·  ${log.year}` : ''}
                </Text>
              )}

              {/* Rating */}
              {log.rating ? (
                <View style={styles.ratingRow}>
                  {[1,2,3,4,5].map(s => (
                    <Text key={s} style={[styles.star, { color: s <= log.rating! ? accentHex : colors.border2 }]}>★</Text>
                  ))}
                </View>
              ) : (
                <Text style={[styles.unrated, { color: colors.ink3, fontFamily: fonts.mono }]}>NOT RATED</Text>
              )}

              {/* Status */}
              {log.status && log.status !== 'completed' && (
                <View style={[styles.statusPill, { backgroundColor: colors.bg3, borderColor: colors.border }]}>
                  <Text style={[styles.statusText, { color: colors.ink3, fontFamily: fonts.mono }]}>
                    {STATUS_LABEL[log.status] ?? log.status.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Review */}
          {log.review ? (
            <View style={[styles.reviewBox, { borderColor: colors.border, backgroundColor: colors.bg3 }]}>
              <Text style={[styles.quoteGlyph, { color: accentHex, fontFamily: fonts.display }]}>"</Text>
              <Text style={[styles.reviewText, { color: colors.ink2, fontFamily: fonts.body }]}>
                {log.review}
              </Text>
            </View>
          ) : (
            <Text style={[styles.noReview, { color: colors.ink3, fontFamily: fonts.mono }]}>
              NO REVIEW WRITTEN
            </Text>
          )}

          {/* Logged date */}
          <Text style={[styles.date, { color: colors.ink3, fontFamily: fonts.mono }]}>
            LOGGED {new Date(log.logged_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            }).toUpperCase()}
          </Text>
        </ScrollView>

        {/* Close */}
        <TouchableOpacity
          style={[styles.closeBtn, { borderColor: colors.border2 }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={[styles.closeTxt, { color: colors.ink3, fontFamily: fonts.mono }]}>CLOSE</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: SHEET_H,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    overflow: 'hidden',
  },
  accentBar: { height: 3, width: '100%' },
  handle: {
    alignSelf: 'center',
    width: 40, height: 3,
    borderRadius: 2,
    marginTop: 10, marginBottom: 4,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  topRow: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' },
  cover: {
    width: 100, height: 140,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  coverFallback: { fontSize: 28, letterSpacing: 2 },
  metaCol: { flex: 1, gap: 8 },
  typePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  typeText: { fontSize: 8, letterSpacing: 2 },
  title: { fontSize: 22, letterSpacing: 2, lineHeight: 24 },
  creator: { fontSize: 14, fontStyle: 'italic', lineHeight: 18 },
  ratingRow: { flexDirection: 'row', gap: 3 },
  star: { fontSize: 18 },
  unrated: { fontSize: 9, letterSpacing: 1.5 },
  statusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  statusText: { fontSize: 8, letterSpacing: 1.5 },
  divider: { height: 1 },
  reviewBox: {
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  quoteGlyph: { fontSize: 28, lineHeight: 22 },
  reviewText: { fontSize: 14, fontStyle: 'italic', lineHeight: 22 },
  noReview: { fontSize: 9, letterSpacing: 2 },
  date: { fontSize: 9, letterSpacing: 1.5 },
  closeBtn: {
    margin: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeTxt: { fontSize: 11, letterSpacing: 3 },
});
