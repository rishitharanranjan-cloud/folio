import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { fonts } from '../../theme/tokens';
import { W } from './palette';
import type { WrappedData } from '../../lib/wrappedData';

const { width: W_WIDTH } = Dimensions.get('window');

function tasteDescription(data: WrappedData): string {
  const types = Object.entries(data.byType).sort((a, b) => b[1] - a[1]);
  const top = types[0]?.[0] ?? 'media';
  const creator = data.topCreators[0]?.name;
  const rating = data.avgRating;

  let desc = `Your ${data.year} was defined by `;
  if (top === 'book') desc += 'the written word';
  else if (top === 'film') desc += 'moving image';
  else if (top === 'album') desc += 'recorded sound';
  else if (top === 'tv') desc += 'serialised storytelling';
  else desc += top;

  if (creator) desc += `, and a returning love for ${creator}`;
  desc += '. ';

  if (rating && rating >= 4) desc += 'You rated generously — a year of genuine discoveries.';
  else if (rating && rating <= 3) desc += 'You were a tough critic. High standards, properly applied.';
  else desc += 'You moved through culture with intention.';

  return desc;
}

export default function Chapter3TastePortrait({ data }: { data: WrappedData }) {
  const maxCount = Math.max(...Object.values(data.byType), 1);

  const TYPE_COLOURS: Record<string, string> = {
    book: W.mustard, film: W.terracotta, album: W.olive,
    tv: '#8b6a4a', podcast: '#6a8b4a', game: '#4a6a8b',
  };

  return (
    <View style={[styles.container, { backgroundColor: W.ink }]}>
      <Text style={[styles.watermark, { fontFamily: fonts.display }]}>TASTE</Text>

      <View style={styles.content}>
        <Text style={[styles.eyebrow, { fontFamily: fonts.mono, color: W.mustard }]}>
          TASTE PORTRAIT
        </Text>

        {/* Genre bars */}
        <View style={styles.bars}>
          {Object.entries(data.byType)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <View key={type} style={styles.barRow}>
                <Text style={[styles.barType, { fontFamily: fonts.mono, color: 'rgba(245,237,216,0.5)' }]}>
                  {type.toUpperCase().padEnd(8)}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[
                    styles.barFill,
                    {
                      width: `${(count / maxCount) * 100}%` as any,
                      backgroundColor: TYPE_COLOURS[type] ?? W.mustard,
                    }
                  ]} />
                </View>
                <Text style={[styles.barCount, { fontFamily: fonts.mono, color: W.cream }]}>
                  {count}
                </Text>
              </View>
            ))}
        </View>

        {/* Top creators */}
        {data.topCreators.length > 0 && (
          <View style={styles.creators}>
            <Text style={[styles.creatorsLabel, { fontFamily: fonts.mono, color: 'rgba(245,237,216,0.4)' }]}>
              MOST RETURNED TO
            </Text>
            {data.topCreators.map((c, i) => (
              <Text key={c.name} style={[styles.creator, { fontFamily: fonts.brand, color: i === 0 ? W.mustard : W.cream, opacity: 1 - i * 0.15 }]}>
                {c.name.toUpperCase()}
              </Text>
            ))}
          </View>
        )}

        {/* Editorial description */}
        <View style={[styles.descBox, { borderColor: 'rgba(245,237,216,0.2)' }]}>
          <Text style={[styles.desc, { fontFamily: fonts.body, color: 'rgba(245,237,216,0.75)' }]}>
            {tasteDescription(data)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: W_WIDTH },
  watermark: {
    position: 'absolute', fontSize: 200, color: 'rgba(245,237,216,0.04)',
    letterSpacing: 4, bottom: -30, right: -10,
  },
  content: { flex: 1, paddingHorizontal: 32, paddingTop: 80, gap: 24 },
  eyebrow: { fontSize: 10, letterSpacing: 3 },
  bars: { gap: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barType: { fontSize: 9, letterSpacing: 1, width: 60 },
  barTrack: { flex: 1, height: 6, backgroundColor: 'rgba(245,237,216,0.1)', overflow: 'hidden' },
  barFill: { height: '100%' },
  barCount: { fontSize: 11, letterSpacing: 1, width: 24, textAlign: 'right' },
  creators: { gap: 4 },
  creatorsLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  creator: { fontSize: 22, letterSpacing: 2 },
  descBox: { borderLeftWidth: 2, paddingLeft: 16 },
  desc: { fontSize: 14, fontStyle: 'italic', lineHeight: 22 },
});
