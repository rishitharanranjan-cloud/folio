import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { fonts } from '../theme/tokens';
import { clampAmbient, hexToRgb, ambientToHex, getAmbientColour } from '../lib/ambientColour';
import * as haptics from '../lib/haptics';
import type { LogEntry } from '../hooks/useLogs';
import FolioCodeMark from '../components/FolioCodeMark';
import { FOLIO_CODE_COLOURS } from '../theme/tokens';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5)  return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const MEDIA_INITIAL: Record<string, string> = {
  film: 'F', book: 'B', album: 'A', tv: 'TV', podcast: 'P', game: 'G',
};

interface HomeData {
  name: string;
  totalLogged: number;
  inProgress: number;
  wantToExplore: number;
  continueItems: LogEntry[];
  recentItems: LogEntry[];
  topItems: LogEntry[];
}

function accentFor(log: LogEntry, isDark: boolean, fallback: string): string {
  const raw = log.dominant_colour ? hexToRgb(log.dominant_colour) : getAmbientColour(log.title);
  return raw ? ambientToHex(clampAmbient(raw, isDark)) : fallback;
}

const STATUS_LABEL: Record<string, string> = {
  in_progress: 'IN PROGRESS',
  current:     'IN PROGRESS',
  finished:    'FINISHED',
  want:        'WANT TO READ',
  dropped:     'DROPPED',
  abandoned:   'ABANDONED',
};

// ── Continue card — full-bleed cover with gradient overlay ──────────────────
function ContinueCard({ log, isDark, colors, mode }: { log: LogEntry; isDark: boolean; colors: any; mode: 'dark' | 'light' }) {
  const accent = accentFor(log, isDark, colors.accent);
  const accentRgb = hexToRgb(accent);
  const scrimColor = accentRgb
    ? `rgba(${Math.round(accentRgb[0] * 0.15)},${Math.round(accentRgb[1] * 0.15)},${Math.round(accentRgb[2] * 0.15)},0.92)`
    : 'rgba(8,8,12,0.92)';

  return (
    <View style={styles.continueCard}>
      {log.cover_url ? (
        <Image source={{ uri: log.cover_url }} style={styles.continueCover} resizeMode="cover" />
      ) : (
        <View style={[styles.continueCover, { backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: '#fff', fontFamily: fonts.mono, fontSize: 32, letterSpacing: 2 }}>
            {MEDIA_INITIAL[log.media_type] ?? '·'}
          </Text>
        </View>
      )}
      {/* Bottom scrim */}
      <View style={[styles.continueGradient, { backgroundColor: scrimColor }]}>
        {/* Type + status row */}
        <View style={styles.continueTopRow}>
          <View style={[styles.continueTypePill, { borderColor: 'rgba(255,255,255,0.35)' }]}>
            <Text style={[styles.continueTypeText, { fontFamily: fonts.mono }]}>
              {log.media_type.toUpperCase()}
            </Text>
          </View>
          {log.status && STATUS_LABEL[log.status] && (
            <View style={[styles.continueStatusPill, { borderColor: accent, backgroundColor: `${accent}30` }]}>
              <Text style={[styles.continueStatusText, { color: accent, fontFamily: fonts.mono }]}>
                {STATUS_LABEL[log.status]}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.continueTitle, { fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]} numberOfLines={2}>
          {log.title.toUpperCase()}
        </Text>
        {log.creator ? (
          <Text style={[styles.continueCreator, { fontFamily: fonts.body }]} numberOfLines={1}>
            {log.creator}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ── Recent card — grid item with cover + rating dots + title ────────────────
function RecentCard({ log, isDark, colors }: { log: LogEntry; isDark: boolean; colors: any }) {
  const accent = accentFor(log, isDark, colors.accent);

  return (
    <View style={styles.recentItem}>
      {log.cover_url ? (
        <Image
          source={{ uri: log.cover_url }}
          style={[styles.recentCover, { borderColor: accent }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.recentCover, { backgroundColor: `${accent}28`, borderColor: accent, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: accent, fontFamily: fonts.mono, fontSize: 18, letterSpacing: 1 }}>
            {MEDIA_INITIAL[log.media_type] ?? '·'}
          </Text>
        </View>
      )}
      {log.rating ? (
        <View style={styles.ratingDots}>
          {[1,2,3,4,5].map(s => (
            <View key={s} style={[styles.ratingDot, { backgroundColor: s <= log.rating! ? accent : colors.border2 }]} />
          ))}
        </View>
      ) : <View style={styles.ratingDotsPlaceholder} />}
      <Text style={[styles.recentTitle, { color: colors.ink2, fontFamily: fonts.body }]} numberOfLines={2}>
        {log.title}
      </Text>
      {log.creator ? (
        <Text style={[styles.recentCreator, { color: colors.ink3, fontFamily: fonts.mono }]} numberOfLines={1}>
          {log.creator}
        </Text>
      ) : null}
    </View>
  );
}

// ── Top pick card — compact horizontal row ───────────────────────────────────
function TopPickCard({ log, isDark, colors }: { log: LogEntry; isDark: boolean; colors: any }) {
  const accent = accentFor(log, isDark, colors.accent);

  return (
    <View style={[styles.topPickRow, { borderColor: colors.border }]}>
      {log.cover_url ? (
        <Image source={{ uri: log.cover_url }} style={[styles.topPickThumb, { borderColor: accent }]} resizeMode="cover" />
      ) : (
        <View style={[styles.topPickThumb, { backgroundColor: accent, borderColor: accent, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: '#fff', fontFamily: fonts.mono, fontSize: 12 }}>
            {MEDIA_INITIAL[log.media_type] ?? '·'}
          </Text>
        </View>
      )}
      <View style={styles.topPickMeta}>
        <Text style={[styles.topPickTitle, { color: colors.ink, fontFamily: fonts.display }]} numberOfLines={1}>
          {log.title.toUpperCase()}
        </Text>
        {log.creator && (
          <Text style={[styles.topPickCreator, { color: colors.ink3, fontFamily: fonts.mono }]} numberOfLines={1}>
            {log.creator}
          </Text>
        )}
      </View>
      <Text style={[styles.topPickStars, { color: accent }]}>★★★★★</Text>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { colors, mode } = useThemeStore();
  const isDark = mode === 'dark';
  const { user } = useAuthStore();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const SEL = 'id,media_type,title,creator,year,status,rating,review,cover_url,dominant_colour,logged_at,external_id';
      const [profileRes, statsRes, continueRes, recentRes, topRes] = await Promise.all([
        supabase.from('users').select('name').eq('id', user.id).maybeSingle(),
        supabase.from('logs').select('status', { count: 'exact', head: false }).eq('user_id', user.id),
        supabase.from('logs').select(SEL).eq('user_id', user.id).eq('status', 'current')
          .order('logged_at', { ascending: false }).limit(10),
        supabase.from('logs').select(SEL).eq('user_id', user.id)
          .order('logged_at', { ascending: false }).limit(10),
        supabase.from('logs').select(SEL).eq('user_id', user.id).eq('rating', 5)
          .order('logged_at', { ascending: false }).limit(8),
      ]);

      const allStatuses = (statsRes.data ?? []) as { status: string }[];
      setData({
        name:          profileRes.data?.name ?? '',
        totalLogged:   allStatuses.length,
        inProgress:    allStatuses.filter(r => r.status === 'current').length,
        wantToExplore: allStatuses.filter(r => r.status === 'want').length,
        continueItems: (continueRes.data ?? []) as LogEntry[],
        recentItems:   (recentRes.data ?? []) as LogEntry[],
        topItems:      (topRes.data ?? []) as LogEntry[],
      });
    } catch (_) {}
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loader}><ActivityIndicator color={colors.accent} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.watermark, { color: colors.ink, fontFamily: fonts.display }]}>HOME</Text>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Greeting */}
        <View style={styles.greetingBlock}>
          <FolioCodeMark
            size="small"
            blocksColor={FOLIO_CODE_COLOURS[mode].blocks}
            barColor={FOLIO_CODE_COLOURS[mode].bar}
            dotColor={FOLIO_CODE_COLOURS[mode].dot}
          />
          <Text style={[styles.greetingLine, { color: colors.ink3, fontFamily: fonts.body }]}>
            {greeting()},
          </Text>
          <Text style={[styles.greetingName, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]}>
            {(data?.name || 'Reader').toUpperCase()}.
          </Text>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <View style={styles.statCell}>
            <Text style={[styles.statNum, { color: colors.ink, fontFamily: fonts.display }]}>
              {data?.totalLogged ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>LOGGED</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statNum, { color: colors.accent, fontFamily: fonts.display }]}>
              {data?.inProgress ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>IN PROGRESS</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statNum, { color: colors.editorial, fontFamily: fonts.display }]}>
              {data?.wantToExplore ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>TO EXPLORE</Text>
          </View>
        </View>

        {/* Continue Your Journey */}
        {(data?.continueItems?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>
              CONTINUE YOUR JOURNEY
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {data!.continueItems.map((log) => (
                <ContinueCard key={log.id} log={log} isDark={isDark} colors={colors} mode={mode} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Additions — 3-column grid, max 6 */}
        {(data?.recentItems?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>
              RECENT ADDITIONS
            </Text>
            <View style={styles.recentGrid}>
              {data!.recentItems.slice(0, 6).map((log) => (
                <RecentCard key={log.id} log={log} isDark={isDark} colors={colors} />
              ))}
            </View>
          </View>
        )}

        {/* Top Picks */}
        {(data?.topItems?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>
              YOUR TOP PICKS
            </Text>
            <View style={[styles.topPickList, { borderTopColor: colors.border }]}>
              {data!.topItems.map((log) => (
                <TopPickCard key={log.id} log={log} isDark={isDark} colors={colors} />
              ))}
            </View>
          </View>
        )}

        {/* Empty state */}
        {(data?.totalLogged ?? 0) === 0 && (
          <View style={styles.empty}>
            <FolioCodeMark
              size="medium"
              blocksColor={FOLIO_CODE_COLOURS[mode].blocks}
              barColor={FOLIO_CODE_COLOURS[mode].bar}
              dotColor={FOLIO_CODE_COLOURS[mode].dot}
            />
            <Text style={[styles.emptyTitle, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]}>
              YOUR SHELF AWAITS
            </Text>
            <Text style={[styles.emptySub, { color: colors.ink3, fontFamily: fonts.body }]}>
              Tap + to log your first book, film, album, or game.
            </Text>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  watermark: {
    position: 'absolute', fontSize: 160, opacity: 0.03,
    bottom: -10, right: -10, letterSpacing: 8,
  },

  greetingBlock: {
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 28,
    gap: 4,
  },
  greetingLine: { fontSize: 17, fontStyle: 'italic' },
  greetingName: { fontSize: 40, letterSpacing: 3, lineHeight: 44 },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  statDivider: { width: 1 },
  statNum: { fontSize: 32, letterSpacing: 2, lineHeight: 34 },
  statLabel: { fontSize: 8, letterSpacing: 1.5 },

  section: { paddingTop: 28, gap: 14 },
  sectionLabel: { fontSize: 9, letterSpacing: 2, paddingHorizontal: 28 },
  hScroll: { paddingHorizontal: 28, gap: 12 },

  // Continue card
  continueCard: { width: 185, height: 260, overflow: 'hidden' },
  continueCover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  continueGradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingTop: 28,
    paddingHorizontal: 11,
    paddingBottom: 13,
    gap: 4,
  },
  continueTopRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 2 },
  continueTypePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  continueStatusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  continueTypeText: { fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.7)' },
  continueStatusText: { fontSize: 6, letterSpacing: 1.5 },
  continueTitle: { fontSize: 14, letterSpacing: 1.5, lineHeight: 18, color: '#fff' },
  continueCreator: { fontSize: 10, letterSpacing: 0.5, color: 'rgba(255,255,255,0.65)', fontStyle: 'italic' },

  // Recent grid
  recentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 28,
    gap: 12,
  },
  recentItem: { width: '30%', gap: 5 },
  recentCover: { width: '100%', aspectRatio: 2 / 3, borderWidth: 1.5 },
  ratingDots: { flexDirection: 'row', gap: 3, height: 8, alignItems: 'center' },
  ratingDotsPlaceholder: { height: 8 },
  ratingDot: { width: 5, height: 5, borderRadius: 3 },
  recentTitle: { fontSize: 11, fontStyle: 'italic', lineHeight: 15 },
  recentCreator: { fontSize: 9, letterSpacing: 0.5 },

  // Top pick
  topPickList: { borderTopWidth: 1, marginHorizontal: 28 },
  topPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topPickThumb: { width: 44, height: 60, borderWidth: 1, flexShrink: 0 },
  topPickMeta: { flex: 1, gap: 3 },
  topPickTitle: { fontSize: 14, letterSpacing: 1.5, lineHeight: 16 },
  topPickCreator: { fontSize: 9, letterSpacing: 1 },
  topPickStars: { fontSize: 11, letterSpacing: 1 },

  // Empty
  empty: { paddingHorizontal: 40, paddingTop: 60, gap: 14, alignItems: 'center' },
  emptyTitle: { fontSize: 28, letterSpacing: 4, textAlign: 'center' },
  emptySub: { fontSize: 15, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
});
