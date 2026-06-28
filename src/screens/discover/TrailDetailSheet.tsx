import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useTrailDetail } from '../../hooks/useTrails';
import { fonts } from '../../theme/tokens';

const MEDIA_LABEL: Record<string, string> = {
  film: 'FILM', book: 'BOOK', album: 'ALBUM', tv: 'TV', podcast: 'POD', game: 'GAME',
};

const NODE_SIZE   = 18;
const NODE_COL    = 48;          // width of the left column holding the path
const LINE_LEFT   = NODE_COL / 2 - 1;  // centre of node column, minus half line width

interface Props {
  trailId: string;
  onClose: () => void;
}

export default function TrailDetailSheet({ trailId, onClose }: Props) {
  const { colors, mode } = useThemeStore();
  const isDark = mode === 'dark';
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
            <Text style={[styles.headerBadge, { color: colors.accent, fontFamily: fonts.mono }]}>
              {justJoined ? '✓ JOINED' : 'IN PROGRESS'}
            </Text>
          )}
          {trail?.completed_at && (
            <Text style={[styles.headerBadge, { color: colors.streak, fontFamily: fonts.mono }]}>
              ✓ COMPLETE
            </Text>
          )}
        </View>

        {loading || !trail ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Trail info block */}
            <View style={[styles.info, { borderBottomColor: colors.border }]}>
              {trail.tag && (
                <Text style={[styles.tag, { color: colors.editorial, fontFamily: fonts.mono }]}>
                  {trail.tag.toUpperCase()}
                </Text>
              )}
              <Text style={[styles.trailTitle, { color: colors.ink, fontFamily: fonts.display }]}>
                {trail.title.toUpperCase()}
              </Text>
              <Text style={[styles.desc, { color: colors.ink2, fontFamily: fonts.body }]}>
                {trail.description}
              </Text>

              {/* Progress row */}
              <View style={styles.progressRow}>
                <Text style={[styles.progressCount, { color: colors.ink3, fontFamily: fonts.mono }]}>
                  {trail.joined
                    ? `${trail.stopsLogged} / ${trail.stop_count} STOPS`
                    : `${trail.stop_count} STOPS`}
                </Text>
                {trail.joined && trail.completed_at && (
                  <Text style={[styles.completePill, { color: colors.streak, borderColor: colors.streak, fontFamily: fonts.mono }]}>
                    COMPLETE
                  </Text>
                )}
              </View>

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

            {/* Journey path */}
            <View style={styles.pathWrapper}>
              {/* Continuous background track line */}
              <View style={[styles.trackLine, { left: LINE_LEFT, backgroundColor: colors.border2 }]} />

              {stops.map((stop, idx) => {
                const isLogged    = loggedTitles.has(stop.title.toLowerCase());
                const isLast      = idx === stops.length - 1;
                const stopColour  = stop.cover_colour ?? colors.accent;

                return (
                  <View key={stop.id} style={styles.stopRow}>
                    {/* Node column */}
                    <View style={[styles.nodeCol, { width: NODE_COL }]}>
                      {/* Logged segment — overlay on the track to colour it */}
                      {isLogged && !isLast && (
                        <View style={[styles.nodeSegmentFill, { left: LINE_LEFT, backgroundColor: stopColour }]} />
                      )}

                      {/* Circle node */}
                      <View style={[
                        styles.node,
                        {
                          width: NODE_SIZE,
                          height: NODE_SIZE,
                          borderRadius: NODE_SIZE / 2,
                          borderColor: isLogged ? stopColour : colors.border2,
                          backgroundColor: isLogged ? stopColour : colors.bg,
                        }
                      ]}>
                        {isLogged && (
                          <Text style={styles.nodeCheck}>✓</Text>
                        )}
                      </View>

                      {/* Stop number below node */}
                      <Text style={[styles.stopNum, { color: colors.ink3, fontFamily: fonts.mono }]}>
                        {String(idx + 1).padStart(2, '0')}
                      </Text>
                    </View>

                    {/* Stop card */}
                    <View style={[
                      styles.stopCard,
                      {
                        backgroundColor: isLogged ? `${stopColour}14` : colors.bg2,
                        borderColor: isLogged ? stopColour : colors.border,
                        borderLeftColor: stopColour,
                      }
                    ]}>
                      <View style={styles.stopCardTop}>
                        <View style={[styles.mediaChip, { borderColor: isLogged ? stopColour : colors.border2 }]}>
                          <Text style={[styles.mediaChipTxt, { color: isLogged ? stopColour : colors.ink3, fontFamily: fonts.mono }]}>
                            {MEDIA_LABEL[stop.media_type] ?? stop.media_type.toUpperCase()}
                          </Text>
                        </View>
                        {isLogged && (
                          <Text style={[styles.loggedTag, { color: stopColour, fontFamily: fonts.mono }]}>
                            LOGGED
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.stopTitle, {
                        color: isLogged ? colors.ink : colors.ink2,
                        fontFamily: fonts.display,
                      }]} numberOfLines={2}>
                        {stop.title.toUpperCase()}
                      </Text>
                      {stop.creator && (
                        <Text style={[styles.stopCreator, { color: colors.ink3, fontFamily: fonts.mono }]} numberOfLines={1}>
                          {stop.creator}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={{ height: 48 }} />
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
  headerBadge: { fontSize: 11, letterSpacing: 1.5 },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  // Trail info
  info: { padding: 24, gap: 10, borderBottomWidth: 1 },
  tag: { fontSize: 10, letterSpacing: 2 },
  trailTitle: { fontSize: 32, letterSpacing: 3, lineHeight: 34 },
  desc: { fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 2 },
  progressCount: { fontSize: 9, letterSpacing: 2 },
  completePill: {
    fontSize: 9, letterSpacing: 2,
    borderWidth: 1,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  progressTrack: { height: 2, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%' },

  // Path
  pathWrapper: {
    paddingTop: 24,
    paddingRight: 24,
    position: 'relative',
  },
  trackLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
  },

  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    minHeight: NODE_SIZE + 20,
  },
  nodeCol: {
    alignItems: 'center',
    paddingTop: 4,
    gap: 4,
    position: 'relative',
    zIndex: 1,
  },
  nodeSegmentFill: {
    position: 'absolute',
    top: NODE_SIZE / 2 + 4,
    bottom: -20,
    width: 2,
    zIndex: 0,
  },
  node: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeCheck: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    lineHeight: NODE_SIZE,
  },
  stopNum: {
    fontSize: 8,
    letterSpacing: 1,
  },

  // Stop card
  stopCard: {
    flex: 1,
    marginLeft: 12,
    padding: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    gap: 5,
  },
  stopCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaChip: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mediaChipTxt: { fontSize: 7, letterSpacing: 1.5 },
  loggedTag: { fontSize: 7, letterSpacing: 2 },
  stopTitle: { fontSize: 16, letterSpacing: 1.5, lineHeight: 19 },
  stopCreator: { fontSize: 9, letterSpacing: 1 },
});
