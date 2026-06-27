import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { fonts } from '../../theme/tokens';
import { W } from './palette';
import type { WrappedData } from '../../lib/wrappedData';

const { width: W_WIDTH } = Dimensions.get('window');
const BAR_MAX_H = 80;

const TYPE_COLOURS: Record<string, string> = {
  book: W.mustard, film: W.terracotta, album: W.olive,
  tv: '#8b6a4a', podcast: '#6a8b4a', game: '#4a6a8b',
};

export default function Chapter2Numbers({ data }: { data: WrappedData }) {
  const maxMonth = Math.max(...data.monthlyActivity.map(m => m.count), 1);

  const statCells = [
    { value: String(data.total),                       label: 'TOTAL LOGGED' },
    { value: String(data.byType.book  ?? 0),           label: 'BOOKS' },
    { value: String(data.byType.film  ?? 0),           label: 'FILMS' },
    { value: String(data.byType.album ?? 0),           label: 'ALBUMS' },
    { value: data.avgRating ? `${data.avgRating}★`:'—', label: 'AVG RATING' },
    { value: `${data.longestStreak}d`,                 label: 'BEST STREAK' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: W.olive }]}>
      <Text style={[styles.watermark, { fontFamily: fonts.display }]}>DATA</Text>

      <View style={styles.content}>
        <Text style={[styles.eyebrow, { fontFamily: fonts.mono }]}>BY THE NUMBERS</Text>

        {/* 6 stat cells */}
        <View style={styles.grid}>
          {statCells.map((s) => (
            <View key={s.label} style={[styles.cell, { borderColor: 'rgba(245,237,216,0.25)' }]}>
              <Text style={[styles.cellValue, { fontFamily: fonts.display, color: W.cream }]}>{s.value}</Text>
              <Text style={[styles.cellLabel, { fontFamily: fonts.mono, color: 'rgba(245,237,216,0.55)' }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Monthly bar chart */}
        <View style={styles.chartSection}>
          <Text style={[styles.chartLabel, { fontFamily: fonts.mono, color: 'rgba(245,237,216,0.55)' }]}>
            MONTHLY ACTIVITY
          </Text>
          <View style={styles.chart}>
            {data.monthlyActivity.map((m, i) => (
              <View key={m.short} style={styles.barCol}>
                <View style={styles.barWrap}>
                  <View style={[
                    styles.bar,
                    {
                      height: m.count > 0 ? Math.max(4, (m.count / maxMonth) * BAR_MAX_H) : 2,
                      backgroundColor: m.count === Math.max(...data.monthlyActivity.map(x => x.count))
                        ? W.mustard : 'rgba(245,237,216,0.35)',
                    }
                  ]} />
                </View>
                <Text style={[styles.barLabel, { fontFamily: fonts.mono, color: 'rgba(245,237,216,0.45)' }]}>
                  {m.short[0]}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[styles.peakLabel, { fontFamily: fonts.body, color: W.mustard }]}>
            Peak: {data.peakMonth}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: W_WIDTH },
  watermark: {
    position: 'absolute', fontSize: 200, color: 'rgba(245,237,216,0.05)',
    letterSpacing: 4, bottom: -30, right: -10,
  },
  content: { flex: 1, paddingHorizontal: 32, paddingTop: 80, gap: 24 },
  eyebrow: { fontSize: 10, letterSpacing: 3, color: 'rgba(245,237,216,0.6)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  cell: { width: '31.5%', borderWidth: 1, padding: 12, gap: 4 },
  cellValue: { fontSize: 28, letterSpacing: 2, lineHeight: 30 },
  cellLabel: { fontSize: 8, letterSpacing: 1.5 },
  chartSection: { gap: 10 },
  chartLabel: { fontSize: 9, letterSpacing: 2 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: BAR_MAX_H + 20, gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barWrap: { height: BAR_MAX_H, justifyContent: 'flex-end' },
  bar: { width: '100%' },
  barLabel: { fontSize: 7, letterSpacing: 0 },
  peakLabel: { fontSize: 13, fontStyle: 'italic' },
});
