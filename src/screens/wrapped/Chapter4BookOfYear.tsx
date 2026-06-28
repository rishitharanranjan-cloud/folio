import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, ScrollView } from 'react-native';
import { fonts } from '../../theme/tokens';
import { W } from './palette';
import type { WrappedData } from '../../lib/wrappedData';

const { width: W_WIDTH, height: W_HEIGHT } = Dimensions.get('window');

export default function Chapter4BookOfYear({ data }: { data: WrappedData }) {
  const book = data.bookOfYear;
  const colour = book?.dominant_colour ?? W.mustard;

  return (
    <View style={[styles.container, { backgroundColor: W.cream }]}>
      <View style={styles.row}>
        {/* Left panel — cover on dominant colour */}
        <View style={[styles.leftPanel, { backgroundColor: colour }]}>
          <Text style={[styles.panelLabel, { fontFamily: fonts.mono, color: 'rgba(245,237,216,0.5)' }]}>
            BOOK OF THE YEAR
          </Text>
          {book?.cover_url ? (
            <Image source={{ uri: book.cover_url }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, { backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 48 }}>📖</Text>
            </View>
          )}
        </View>

        {/* Right panel — review + meta */}
        <ScrollView style={styles.rightPanel} showsVerticalScrollIndicator={false}>
          {book ? (
            <View style={styles.rightContent}>
              {book.rating && (
                <Text style={[styles.stars, { color: colour, fontFamily: fonts.mono }]}>
                  {'★'.repeat(book.rating)}
                </Text>
              )}
              <Text style={[styles.title, { fontFamily: fonts.brand, color: W.ink }]} numberOfLines={4}>
                {book.title.toUpperCase()}
              </Text>
              {book.creator && (
                <Text style={[styles.creator, { fontFamily: fonts.body, color: W.ink2 }]}>
                  {book.creator}
                </Text>
              )}
              {book.year && (
                <Text style={[styles.year, { fontFamily: fonts.mono, color: W.ink3 }]}>
                  {book.year}
                </Text>
              )}
              {book.review ? (
                <Text style={[styles.review, { fontFamily: fonts.body, color: W.ink2 }]}>
                  "{book.review}"
                </Text>
              ) : (
                <Text style={[styles.review, { fontFamily: fonts.body, color: W.ink3 }]}>
                  No review written.
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.empty, { fontFamily: fonts.body, color: W.ink3 }]}>
              No books logged this year.
            </Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: W_WIDTH },
  row: { flex: 1, flexDirection: 'row' },
  leftPanel: {
    width: W_WIDTH * 0.42,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 20,
  },
  panelLabel: { fontSize: 8, letterSpacing: 2, textAlign: 'center' },
  cover: { width: W_WIDTH * 0.36, height: W_WIDTH * 0.36 * 1.45 },
  rightPanel: { flex: 1 },
  rightContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  stars: { fontSize: 14, letterSpacing: 2 },
  title: { fontSize: 28, letterSpacing: 2, lineHeight: 30 },
  creator: { fontSize: 16, fontStyle: 'italic' },
  year: { fontSize: 11, letterSpacing: 2 },
  review: { fontSize: 14, fontStyle: 'italic', lineHeight: 22, marginTop: 8 },
  empty: { padding: 40, fontSize: 15, fontStyle: 'italic' },
});
