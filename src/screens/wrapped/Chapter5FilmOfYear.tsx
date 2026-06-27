import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { fonts } from '../../theme/tokens';
import { W } from './palette';
import type { WrappedData } from '../../lib/wrappedData';

const { width: W_WIDTH } = Dimensions.get('window');
const HOLE_SIZE = 7;
const HOLES = 5;

function FilmStripDecoration({ colour }: { colour: string }) {
  return (
    <View style={[styles.filmStrip, { borderColor: 'rgba(245,237,216,0.15)' }]}>
      {/* Holes */}
      <View style={styles.holesRow}>
        {Array.from({ length: HOLES }).map((_, i) => (
          <View key={i} style={[styles.hole, { backgroundColor: W.ink }]} />
        ))}
      </View>
      {/* Colour band */}
      <View style={[styles.colourBand, { backgroundColor: colour }]} />
      <View style={styles.holesRow}>
        {Array.from({ length: HOLES }).map((_, i) => (
          <View key={i} style={[styles.hole, { backgroundColor: W.ink }]} />
        ))}
      </View>
    </View>
  );
}

export default function Chapter5FilmOfYear({ data }: { data: WrappedData }) {
  const film = data.filmOfYear;
  const colour = film?.dominant_colour ?? W.terracotta;

  return (
    <View style={[styles.container, { backgroundColor: W.ink }]}>
      <Text style={[styles.watermark, { fontFamily: fonts.display }]}>FILM</Text>

      {/* Film strip decorations */}
      <FilmStripDecoration colour={colour} />

      <View style={styles.content}>
        <Text style={[styles.eyebrow, { fontFamily: fonts.mono, color: W.terracotta }]}>
          FILM OF THE YEAR
        </Text>

        {film ? (
          <View style={styles.filmCard}>
            {/* Poster */}
            <View style={[styles.posterWrap, { borderColor: colour }]}>
              {film.cover_url ? (
                <Image source={{ uri: film.cover_url }} style={styles.poster} resizeMode="cover" />
              ) : (
                <View style={[styles.poster, { backgroundColor: colour, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 48 }}>🎬</Text>
                </View>
              )}
            </View>

            <View style={styles.filmMeta}>
              <Text style={[styles.title, { fontFamily: fonts.display, color: W.cream }]} numberOfLines={3}>
                {film.title.toUpperCase()}
              </Text>
              {film.creator && (
                <Text style={[styles.creator, { fontFamily: fonts.body, color: 'rgba(245,237,216,0.6)' }]}>
                  dir. {film.creator}
                </Text>
              )}
              {film.year && (
                <Text style={[styles.year, { fontFamily: fonts.mono, color: 'rgba(245,237,216,0.4)' }]}>
                  {film.year}
                </Text>
              )}
              {film.rating && (
                <Text style={[styles.stars, { color: colour, fontFamily: fonts.mono }]}>
                  {'★'.repeat(film.rating)}
                </Text>
              )}
              {film.review && (
                <Text style={[styles.review, { fontFamily: fonts.body, color: 'rgba(245,237,216,0.5)' }]} numberOfLines={4}>
                  "{film.review}"
                </Text>
              )}
            </View>
          </View>
        ) : (
          <Text style={[styles.empty, { fontFamily: fonts.body, color: 'rgba(245,237,216,0.4)' }]}>
            No films logged this year.
          </Text>
        )}
      </View>

      <FilmStripDecoration colour={colour} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: W_WIDTH },
  watermark: {
    position: 'absolute', fontSize: 180, color: 'rgba(245,237,216,0.04)',
    letterSpacing: 4, bottom: -20, right: -10,
  },
  filmStrip: {
    borderTopWidth: 1, borderBottomWidth: 1,
    paddingVertical: 6, backgroundColor: '#111',
    gap: 4,
  },
  holesRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10 },
  hole: { width: HOLE_SIZE, height: HOLE_SIZE, borderRadius: 2 },
  colourBand: { height: 30, opacity: 0.6 },
  content: { flex: 1, paddingHorizontal: 32, paddingTop: 24, gap: 20 },
  eyebrow: { fontSize: 10, letterSpacing: 3 },
  filmCard: { flexDirection: 'row', gap: 20 },
  posterWrap: { borderWidth: 2 },
  poster: { width: W_WIDTH * 0.35, height: W_WIDTH * 0.35 * 1.4 },
  filmMeta: { flex: 1, gap: 10, justifyContent: 'center' },
  title: { fontSize: 26, letterSpacing: 2, lineHeight: 28 },
  creator: { fontSize: 14, fontStyle: 'italic' },
  year: { fontSize: 11, letterSpacing: 2 },
  stars: { fontSize: 14, letterSpacing: 2 },
  review: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  empty: { fontSize: 16, fontStyle: 'italic', marginTop: 40 },
});
