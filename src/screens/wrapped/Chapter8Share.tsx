import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { fonts } from '../../theme/tokens';
import { W } from './palette';
import type { WrappedData } from '../../lib/wrappedData';

const { width: W_WIDTH } = Dimensions.get('window');

interface Props { data: WrappedData; onClose: () => void }

export default function Chapter8Share({ data, onClose }: Props) {
  const handleShare = (format: string) => {
    Alert.alert('Share', `${format} export coming soon — build your audience first!`);
  };

  const topType = Object.entries(data.byType).sort((a, b) => b[1] - a[1])[0];

  return (
    <View style={[styles.container, { backgroundColor: W.mustard }]}>
      <Text style={[styles.watermark, { fontFamily: fonts.display }]}>SHARE</Text>

      <View style={styles.content}>
        <Text style={[styles.eyebrow, { fontFamily: fonts.mono, color: W.ink3 }]}>
          {data.year} · YEAR IN CULTURE
        </Text>

        {/* Summary card preview */}
        <View style={[styles.card, { backgroundColor: W.ink }]}>
          <Text style={[styles.cardYear, { fontFamily: fonts.display, color: W.mustard }]}>{data.year}</Text>
          <View style={styles.cardStats}>
            <View style={styles.cardStat}>
              <Text style={[styles.cardNum, { fontFamily: fonts.display, color: W.cream }]}>{data.total}</Text>
              <Text style={[styles.cardLabel, { fontFamily: fonts.mono, color: 'rgba(245,237,216,0.5)' }]}>LOGGED</Text>
            </View>
            {topType && (
              <View style={styles.cardStat}>
                <Text style={[styles.cardNum, { fontFamily: fonts.display, color: W.cream }]}>{topType[1]}</Text>
                <Text style={[styles.cardLabel, { fontFamily: fonts.mono, color: 'rgba(245,237,216,0.5)' }]}>{topType[0].toUpperCase()}S</Text>
              </View>
            )}
            {data.avgRating && (
              <View style={styles.cardStat}>
                <Text style={[styles.cardNum, { fontFamily: fonts.display, color: W.mustard }]}>{data.avgRating}★</Text>
                <Text style={[styles.cardLabel, { fontFamily: fonts.mono, color: 'rgba(245,237,216,0.5)' }]}>AVG</Text>
              </View>
            )}
          </View>
          {data.grandPick && (
            <Text style={[styles.cardPick, { fontFamily: fonts.body, color: 'rgba(245,237,216,0.6)' }]} numberOfLines={1}>
              Pick of the year: {data.grandPick.title}
            </Text>
          )}
          <Text style={[styles.cardBrand, { fontFamily: fonts.display, color: 'rgba(245,237,216,0.15)' }]}>FOLIO</Text>
        </View>

        {/* Share buttons */}
        <View style={styles.shareButtons}>
          {['INSTAGRAM', 'TWITTER / X', 'SAVE IMAGE'].map((label) => (
            <TouchableOpacity
              key={label}
              style={[styles.shareBtn, { borderColor: W.ink }]}
              onPress={() => handleShare(label)}
              activeOpacity={0.7}
            >
              <Text style={[styles.shareBtnText, { fontFamily: fonts.mono, color: W.ink }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={onClose} style={styles.doneBtn} activeOpacity={0.7}>
          <Text style={[styles.doneBtnText, { fontFamily: fonts.mono, color: W.ink2 }]}>
            CLOSE WRAPPED
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: W_WIDTH },
  watermark: {
    position: 'absolute', fontSize: 180, color: 'rgba(30,20,10,0.06)',
    letterSpacing: 4, bottom: -20, right: -10,
  },
  content: { flex: 1, paddingHorizontal: 32, paddingTop: 80, gap: 24 },
  eyebrow: { fontSize: 10, letterSpacing: 3 },
  card: {
    padding: 20, gap: 12,
  },
  cardYear: { fontSize: 48, letterSpacing: 6, lineHeight: 48 },
  cardStats: { flexDirection: 'row', gap: 24 },
  cardStat: { gap: 2 },
  cardNum: { fontSize: 32, letterSpacing: 2, lineHeight: 32 },
  cardLabel: { fontSize: 8, letterSpacing: 2 },
  cardPick: { fontSize: 13, fontStyle: 'italic' },
  cardBrand: { fontSize: 32, letterSpacing: 6, alignSelf: 'flex-end', lineHeight: 32 },
  shareButtons: { gap: 8 },
  shareBtn: {
    height: 48, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  shareBtnText: { fontSize: 11, letterSpacing: 2 },
  doneBtn: { alignSelf: 'center', padding: 12 },
  doneBtnText: { fontSize: 10, letterSpacing: 2 },
});
