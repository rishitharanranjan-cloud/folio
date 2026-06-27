import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { fonts } from '../../theme/tokens';
import { W } from './palette';
import type { WrappedData } from '../../lib/wrappedData';

const { width: W_WIDTH } = Dimensions.get('window');
const VINYL_SIZE = W_WIDTH * 0.52;

export default function Chapter6AlbumOfYear({ data }: { data: WrappedData }) {
  const album = data.albumOfYear;
  const colour = album?.dominant_colour ?? W.olive;

  return (
    <View style={[styles.container, { backgroundColor: W.ink }]}>
      <Text style={[styles.watermark, { fontFamily: fonts.display }]}>ALBUM</Text>

      <View style={styles.content}>
        <Text style={[styles.eyebrow, { fontFamily: fonts.mono, color: W.olive }]}>
          ALBUM OF THE YEAR
        </Text>

        {album ? (
          <>
            {/* Vinyl record decoration */}
            <View style={styles.vinylWrap}>
              {/* Sleeve (square cover) */}
              <View style={[styles.sleeve, { borderColor: colour }]}>
                {album.cover_url ? (
                  <Image source={{ uri: album.cover_url }} style={styles.sleeveImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.sleeveImg, { backgroundColor: colour, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 48 }}>🎵</Text>
                  </View>
                )}
              </View>

              {/* Vinyl disc peeking out */}
              <View style={[styles.vinyl, { backgroundColor: '#111' }]}>
                {/* Grooves */}
                {[0.85, 0.68, 0.52, 0.38].map((r, i) => (
                  <View key={i} style={[styles.groove, {
                    width: VINYL_SIZE * r,
                    height: VINYL_SIZE * r,
                    borderRadius: VINYL_SIZE * r / 2,
                    borderColor: 'rgba(255,255,255,0.05)',
                  }]} />
                ))}
                {/* Label */}
                <View style={[styles.vinylLabel, { backgroundColor: colour }]}>
                  <Text style={[styles.vinylLabelText, { fontFamily: fonts.mono, color: 'rgba(245,237,216,0.8)' }]} numberOfLines={1}>
                    {album.title.slice(0, 8).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Meta */}
            <View style={styles.meta}>
              <Text style={[styles.title, { fontFamily: fonts.display, color: W.cream }]} numberOfLines={2}>
                {album.title.toUpperCase()}
              </Text>
              {album.creator && (
                <Text style={[styles.creator, { fontFamily: fonts.body, color: 'rgba(245,237,216,0.6)' }]}>
                  {album.creator}
                </Text>
              )}
              {album.rating && (
                <Text style={[styles.stars, { color: colour, fontFamily: fonts.mono }]}>
                  {'★'.repeat(album.rating)}
                </Text>
              )}
              {album.review && (
                <Text style={[styles.review, { fontFamily: fonts.body, color: 'rgba(245,237,216,0.45)' }]} numberOfLines={3}>
                  "{album.review}"
                </Text>
              )}
            </View>
          </>
        ) : (
          <Text style={[styles.empty, { fontFamily: fonts.body, color: 'rgba(245,237,216,0.4)' }]}>
            No albums logged this year.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: W_WIDTH },
  watermark: {
    position: 'absolute', fontSize: 160, color: 'rgba(245,237,216,0.04)',
    letterSpacing: 4, bottom: -20, right: -10,
  },
  content: { flex: 1, paddingHorizontal: 32, paddingTop: 80, gap: 20 },
  eyebrow: { fontSize: 10, letterSpacing: 3 },
  vinylWrap: { position: 'relative', height: VINYL_SIZE + 20, width: VINYL_SIZE + 40 },
  sleeve: { position: 'absolute', top: 0, left: 0, width: VINYL_SIZE, height: VINYL_SIZE, borderWidth: 1, zIndex: 2 },
  sleeveImg: { width: '100%', height: '100%' },
  vinyl: {
    position: 'absolute', top: 10, left: 20,
    width: VINYL_SIZE, height: VINYL_SIZE,
    borderRadius: VINYL_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1,
  },
  groove: { position: 'absolute', borderWidth: 1 },
  vinylLabel: {
    width: VINYL_SIZE * 0.32, height: VINYL_SIZE * 0.32,
    borderRadius: VINYL_SIZE * 0.16,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 3,
  },
  vinylLabelText: { fontSize: 7, letterSpacing: 0.5 },
  meta: { gap: 8 },
  title: { fontSize: 28, letterSpacing: 2, lineHeight: 30 },
  creator: { fontSize: 15, fontStyle: 'italic' },
  stars: { fontSize: 14, letterSpacing: 2 },
  review: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  empty: { fontSize: 16, fontStyle: 'italic', marginTop: 40 },
});
