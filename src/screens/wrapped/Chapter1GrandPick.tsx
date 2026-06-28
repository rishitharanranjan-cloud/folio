import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { fonts } from '../../theme/tokens';
import { W } from './palette';
import type { WrappedData } from '../../lib/wrappedData';

const { width: W_WIDTH } = Dimensions.get('window');
const MEDIA_ICON: Record<string, string> = { film:'🎬', book:'📖', album:'🎵', tv:'📺', podcast:'🎙', game:'🎮' };

export default function Chapter1GrandPick({ data }: { data: WrappedData }) {
  const pick = data.grandPick;
  const colour = pick?.dominant_colour ?? W.mustard;

  return (
    <View style={[styles.container, { backgroundColor: W.ink }]}>
      <Text style={[styles.watermark, { fontFamily: fonts.display }]}>PICK</Text>

      {/* Colour slab behind cover */}
      <View style={[styles.slab, { backgroundColor: colour }]} />

      <View style={styles.content}>
        <Text style={[styles.eyebrow, { fontFamily: fonts.mono, color: W.mustard }]}>
          WORK OF THE YEAR
        </Text>

        {pick ? (
          <>
            {pick.cover_url ? (
              <Image source={{ uri: pick.cover_url }} style={styles.cover} resizeMode="cover" />
            ) : (
              <View style={[styles.cover, { backgroundColor: colour, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 48 }}>{MEDIA_ICON[pick.media_type] ?? '·'}</Text>
              </View>
            )}

            <View style={styles.meta}>
              <Text style={[styles.mediaType, { fontFamily: fonts.mono, color: W.mustard }]}>
                {pick.media_type.toUpperCase()}  ·  {pick.year ?? ''}
              </Text>
              <Text style={[styles.title, { fontFamily: fonts.brand, color: W.cream }]} numberOfLines={3}>
                {pick.title.toUpperCase()}
              </Text>
              {pick.creator && (
                <Text style={[styles.creator, { fontFamily: fonts.body, color: 'rgba(245,237,216,0.65)' }]}>
                  {pick.creator}
                </Text>
              )}
              {pick.rating && (
                <Text style={[styles.stars, { color: colour, fontFamily: fonts.mono }]}>
                  {'★'.repeat(pick.rating)}{'☆'.repeat(5 - pick.rating)}
                </Text>
              )}
              {pick.review && (
                <Text style={[styles.review, { fontFamily: fonts.body, color: 'rgba(245,237,216,0.5)' }]} numberOfLines={3}>
                  "{pick.review}"
                </Text>
              )}
            </View>
          </>
        ) : (
          <Text style={[styles.empty, { fontFamily: fonts.body, color: 'rgba(245,237,216,0.4)' }]}>
            Log some things and come back.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: W_WIDTH },
  watermark: {
    position: 'absolute', fontSize: 220, color: 'rgba(245,237,216,0.04)',
    letterSpacing: 6, bottom: -30, left: -10,
  },
  slab: {
    position: 'absolute', top: 0, right: 0,
    width: W_WIDTH * 0.45, bottom: 0, opacity: 0.15,
  },
  content: { flex: 1, paddingHorizontal: 36, paddingTop: 80, gap: 20 },
  eyebrow: { fontSize: 10, letterSpacing: 3 },
  cover: { width: W_WIDTH * 0.42, height: W_WIDTH * 0.42 * 1.4 },
  meta: { gap: 8 },
  mediaType: { fontSize: 9, letterSpacing: 2 },
  title: { fontSize: 36, letterSpacing: 3, lineHeight: 38 },
  creator: { fontSize: 16, fontStyle: 'italic' },
  stars: { fontSize: 16, letterSpacing: 2 },
  review: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  empty: { fontSize: 16, fontStyle: 'italic', marginTop: 40 },
});
