import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { fonts } from '../../theme/tokens';
import type { Trail } from '../../hooks/useTrails';

interface Props {
  trail: Trail;
  onPress: () => void;
}

export default function TrailCard({ trail, onPress }: Props) {
  const { colors, mode } = useThemeStore();
  const TAG_COLOURS: Record<string, string> = {
    filmmaker: colors.accent,
    movement:  colors.editorial,
    genre:     colors.streak,
    author:    colors.terra,
    artist:    colors.accentd,
  };
  const tagColour = TAG_COLOURS[trail.tag ?? ''] ?? colors.editorial;
  const progress = trail.stop_count > 0
    ? Math.round((trail.stopsLogged / trail.stop_count) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.bg2, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Tag */}
      <View style={styles.topRow}>
        <View style={[styles.tag, { backgroundColor: tagColour }]}>
          <Text style={[styles.tagText, { color: '#fff', fontFamily: fonts.mono }]}>
            {(trail.tag ?? 'trail').toUpperCase()}
          </Text>
        </View>
        {trail.completed_at && (
          <Text style={[styles.completedBadge, { color: colors.streak, fontFamily: fonts.mono }]}>
            ✓ COMPLETE
          </Text>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.title, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]} numberOfLines={2}>
        {trail.title.toUpperCase()}
      </Text>

      {/* Description */}
      <Text style={[styles.desc, { color: colors.ink2, fontFamily: fonts.body }]} numberOfLines={2}>
        {trail.description}
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.meta, { color: colors.ink3, fontFamily: fonts.mono }]}>
          {trail.stop_count} STOPS
        </Text>
        {trail.joined && (
          <>
            <View style={[styles.progressTrack, { backgroundColor: colors.bg4 }]}>
              <View style={[styles.progressFill, { backgroundColor: progress === 100 ? colors.streak : colors.accent, width: `${progress}%` as any }]} />
            </View>
            <Text style={[styles.meta, { color: colors.ink3, fontFamily: fonts.mono }]}>
              {progress}%
            </Text>
          </>
        )}
        {!trail.joined && (
          <Text style={[styles.meta, { color: colors.ink3, fontFamily: fonts.mono }]}>
            JOIN TRAIL →
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: { fontSize: 9, letterSpacing: 1.5 },
  completedBadge: { fontSize: 9, letterSpacing: 1.5 },
  title: { fontSize: 22, letterSpacing: 2, lineHeight: 24 },
  desc: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  meta: { fontSize: 9, letterSpacing: 1.5 },
  progressTrack: {
    flex: 1,
    height: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%' },
});
