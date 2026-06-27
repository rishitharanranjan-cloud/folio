import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useTrailDetail } from '../../hooks/useTrails';
import { fonts } from '../../theme/tokens';

const MEDIA_ICON: Record<string, string> = {
  film: '🎬', book: '📖', album: '🎵', tv: '📺', podcast: '🎙', game: '🎮',
};

interface Props {
  trailId: string;
  onClose: () => void;
}

export default function TrailDetailSheet({ trailId, onClose }: Props) {
  const { colors } = useThemeStore();
  const { trail, stops, loggedTitles, loading, joinTrail } = useTrailDetail(trailId);
  const [joining, setJoining] = useState(false);
  const [justJoined, setJustJoined] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    await joinTrail();
    setJoining(false);
    setJustJoined(true);
    setTimeout(() => setJustJoined(false), 3000);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Accent line */}
        <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[styles.back, { color: colors.ink3, fontFamily: fonts.mono }]}>← BACK</Text>
          </TouchableOpacity>
          {trail && !trail.joined && (
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: joining ? colors.bg3 : colors.accent }]}
              onPress={handleJoin}
              activeOpacity={0.8}
              disabled={joining}
            >
              {joining
                ? <ActivityIndicator size="small" color={colors.accent} />
                : <Text style={[styles.joinBtnText, { color: colors.accentt, fontFamily: fonts.mono }]}>
                    JOIN TRAIL
                  </Text>
              }
            </TouchableOpacity>
          )}
          {trail?.joined && !trail.completed_at && (
            <Text style={[styles.joinedBadge, { color: colors.accent, fontFamily: fonts.mono }]}>
              {justJoined ? '✓ JOINED' : 'IN PROGRESS'}
            </Text>
          )}
          {trail?.completed_at && (
            <Text style={[styles.completeBadge, { color: colors.streak, fontFamily: fonts.mono }]}>
              ✓ COMPLETE
            </Text>
          )}
        </View>

        {loading || !trail ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Trail info */}
            <View style={[styles.info, { borderBottomColor: colors.border }]}>
              {trail.tag && (
                <Text style={[styles.tag, { color: colors.editorial, fontFamily: fonts.mono }]}>
                  {trail.tag.toUpperCase()}
                </Text>
              )}
              <Text style={[styles.title, { color: colors.ink, fontFamily: fonts.display }]}>
                {trail.title.toUpperCase()}
              </Text>
              <Text style={[styles.desc, { color: colors.ink2, fontFamily: fonts.body }]}>
                {trail.description}
              </Text>
              <View style={styles.metaRow}>
                <Text style={[styles.meta, { color: colors.ink3, fontFamily: fonts.mono }]}>
                  {trail.stop_count} STOPS
                </Text>
                {trail.joined && (
                  <Text style={[styles.meta, { color: colors.accent, fontFamily: fonts.mono }]}>
                    {trail.stopsLogged}/{trail.stop_count} LOGGED
                  </Text>
                )}
              </View>

              {/* Progress bar */}
              {trail.joined && (
                <View style={[styles.progressTrack, { backgroundColor: colors.bg3 }]}>
                  <View style={[
                    styles.progressFill,
                    {
                      backgroundColor: trail.completed_at ? colors.streak : colors.accent,
                      width: `${Math.round((trail.stopsLogged / trail.stop_count) * 100)}%` as any,
                    }
                  ]} />
                </View>
              )}
            </View>

            {/* Stops list */}
            <View style={styles.stops}>
              {stops.map((stop, idx) => {
                const isLogged = loggedTitles.has(stop.title.toLowerCase());
                return (
                  <View
                    key={stop.id}
                    style={[
                      styles.stopRow,
                      {
                        borderLeftColor: isLogged ? colors.streak : colors.border2,
                        backgroundColor: isLogged ? `${colors.streak}10` : 'transparent',
                      }
                    ]}
                  >
                    {/* Position + colour dot */}
                    <View style={styles.stopLeft}>
                      <Text style={[styles.stopNum, { color: colors.ink3, fontFamily: fonts.mono }]}>
                        {String(idx + 1).padStart(2, '0')}
                      </Text>
                      <View style={[styles.colourDot, { backgroundColor: stop.cover_colour ?? colors.border2 }]} />
                    </View>

                    {/* Stop info */}
                    <View style={styles.stopInfo}>
                      <View style={styles.stopTitleRow}>
                        <Text style={[styles.stopIcon]}>{MEDIA_ICON[stop.media_type] ?? '·'}</Text>
                        <Text style={[styles.stopTitle, { color: isLogged ? colors.ink : colors.ink2, fontFamily: fonts.body }]} numberOfLines={1}>
                          {stop.title}
                        </Text>
                      </View>
                      {stop.creator && (
                        <Text style={[styles.stopCreator, { color: colors.ink3, fontFamily: fonts.mono }]}>
                          {stop.creator}
                        </Text>
                      )}
                    </View>

                    {/* Logged indicator */}
                    {isLogged && (
                      <Text style={[styles.check, { color: colors.streak }]}>✓</Text>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  accentLine: { height: 3 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  back: { fontSize: 11, letterSpacing: 1.5 },
  joinBtn: { paddingHorizontal: 16, paddingVertical: 8, minWidth: 100, alignItems: 'center' },
  joinBtnText: { fontSize: 11, letterSpacing: 1.5 },
  joinedBadge: { fontSize: 11, letterSpacing: 1.5 },
  completeBadge: { fontSize: 11, letterSpacing: 1.5 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  info: {
    padding: 24,
    gap: 10,
    borderBottomWidth: 1,
  },
  tag: { fontSize: 10, letterSpacing: 2 },
  title: { fontSize: 32, letterSpacing: 3, lineHeight: 34 },
  desc: { fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  metaRow: { flexDirection: 'row', gap: 20 },
  meta: { fontSize: 9, letterSpacing: 2 },
  progressTrack: {
    height: 3,
    width: '100%',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: { height: '100%' },
  stops: { paddingTop: 8 },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderLeftWidth: 3,
    marginLeft: 0,
    gap: 12,
  },
  stopLeft: { alignItems: 'center', gap: 4, width: 28 },
  stopNum: { fontSize: 9, letterSpacing: 1 },
  colourDot: { width: 8, height: 8, borderRadius: 4 },
  stopInfo: { flex: 1, gap: 2 },
  stopTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stopIcon: { fontSize: 12 },
  stopTitle: { flex: 1, fontSize: 15, fontStyle: 'italic' },
  stopCreator: { fontSize: 9, letterSpacing: 1 },
  check: { fontSize: 16, fontWeight: 'bold' },
});
