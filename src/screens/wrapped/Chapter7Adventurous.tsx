import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { fonts } from '../../theme/tokens';
import { W } from './palette';
import type { WrappedData } from '../../lib/wrappedData';

const { width: W_WIDTH } = Dimensions.get('window');
const MEDIA_ICON: Record<string, string> = { film:'🎬', book:'📖', album:'🎵', tv:'📺', podcast:'🎙', game:'🎮' };

export default function Chapter7Adventurous({ data }: { data: WrappedData }) {
  const pick = data.adventurousPick;

  return (
    // Deliberately cream — jarring contrast per design spec
    <View style={[styles.container, { backgroundColor: W.cream }]}>
      <Text style={[styles.watermark, { fontFamily: fonts.display, color: W.ink }]}>BOLD</Text>

      <View style={styles.content}>
        <Text style={[styles.eyebrow, { fontFamily: fonts.mono, color: W.terracotta }]}>
          YOUR MOST ADVENTUROUS PICK
        </Text>
        <Text style={[styles.subtext, { fontFamily: fonts.body, color: W.ink3 }]}>
          The one that said something about who you are.
        </Text>

        {pick ? (
          <View style={styles.card}>
            {pick.cover_url && (
              <Image source={{ uri: pick.cover_url }} style={styles.cover} resizeMode="cover" />
            )}
            <View style={styles.meta}>
              <Text style={[styles.mediaType, { fontFamily: fonts.mono, color: W.terracotta }]}>
                {MEDIA_ICON[pick.media_type]}  {pick.media_type.toUpperCase()}
              </Text>
              <Text style={[styles.title, { fontFamily: fonts.display, color: W.ink }]} numberOfLines={3}>
                {pick.title.toUpperCase()}
              </Text>
              {pick.creator && (
                <Text style={[styles.creator, { fontFamily: fonts.body, color: W.ink2 }]}>
                  {pick.creator}
                </Text>
              )}
              {pick.year && (
                <Text style={[styles.year, { fontFamily: fonts.mono, color: W.ink3 }]}>{pick.year}</Text>
              )}
              {pick.review && (
                <View style={[styles.reviewBox, { borderColor: W.terracotta }]}>
                  <Text style={[styles.review, { fontFamily: fonts.body, color: W.ink2 }]} numberOfLines={5}>
                    "{pick.review}"
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <Text style={[styles.empty, { fontFamily: fonts.body, color: W.ink3 }]}>
            Keep logging — your adventurous pick will appear here.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: W_WIDTH },
  watermark: {
    position: 'absolute', fontSize: 200, opacity: 0.04,
    letterSpacing: 4, bottom: -30, right: -10,
    fontFamily: fonts.display,
  },
  content: { flex: 1, paddingHorizontal: 32, paddingTop: 80, gap: 20 },
  eyebrow: { fontSize: 10, letterSpacing: 3 },
  subtext: { fontSize: 14, fontStyle: 'italic', marginTop: -8 },
  card: { flexDirection: 'row', gap: 20 },
  cover: { width: W_WIDTH * 0.35, height: W_WIDTH * 0.35 * 1.4 },
  meta: { flex: 1, gap: 10 },
  mediaType: { fontSize: 10, letterSpacing: 2 },
  title: { fontSize: 24, letterSpacing: 2, lineHeight: 26 },
  creator: { fontSize: 15, fontStyle: 'italic' },
  year: { fontSize: 10, letterSpacing: 2 },
  reviewBox: { borderLeftWidth: 2, paddingLeft: 12, marginTop: 4 },
  review: { fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
  empty: { fontSize: 15, fontStyle: 'italic', marginTop: 20 },
});
