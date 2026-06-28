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

// ── Continue card — full-bleed cover with gradient overlay ──────────────────
function ContinueCard({ log, isDark, colors }: { log: LogEntry; isDark: boolean; colors: any }) {
  const accent = accentFor(log, isDark, colors.accent);
  const accentRgb = hexToRgb(accent);
  const gradEnd = accentRgb
    ? `rgba(${accentRgb[0]},${accentRgb[1]},${accentRgb[2]},0.95)`
    : 'rgba(10,10,10,0.93)';

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
      {/* Gradient overlay: transparent top → accent bottom */}
      <View style={[styles.continueGradientTop, { backgroundColor: 'transparent' }]} />
      <View style={[styles.continueGradient, { backgroundColor: gradEnd }]}>
        <View style={[styles.continueTypePill, { borderColor: 'rgba(255,255,255,0.4)' }]}>
          <Text style={[styles.continueTypeText, { fontFamily: fonts.mono }]}>
            {log.media_type.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.continueTitle, { fontFamily: fonts.display }]} numberOfLines={2}>
          {log.title.toUpperCase()}
        </Text>
        {log.creator ? (
          <Text style={[styles.continueCreator, { fontFamily: fonts.mono }]} numberOfLines={1}>
            {log.creator}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ── Recent card — cover + accent border + rating dots ───────────────────────
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
        <View style={[styles.recentCover, { backgroundColor: accent, borderColor: accent, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ color: '#fff', fontFamily: fonts.mono, fontSize: 18, letterSpacing: 1 }}>
            {MEDIA_INITIAL[log.media_type] ?? '·'}
          </Text>
        </View>
      )}
      {log.rating && (
        <View style={styles.ratingDots}>
          {[1,2,3,4,5].map(s => (
            <View
              key={s}
              style={[styles.ratingDot, { backgroundColor: s <= log.rating! ? accent : colors.border2 }]}
            />
          ))}
        </View>
      )}
      <Text style={[styles.recentTitle, { color: colors.ink, fontFamily: fonts.body }]} numberOfLines={2}>
        {log.title}
      </Text>
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
          <Text style={[styles.greetingLine, { color: colors.ink3, fontFamily: fonts.body }]}>
            {greeting()},
          </Text>
          <Text style={[styles.greetingName, { color: colors.ink, fontFamily: fonts.display }]}>
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
                <ContinueCard key={log.id} log={log} isDark={isDark} colors={colors} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Additions */}
        {(data?.recentItems?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>
              RECENT ADDITIONS
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
              {data!.recentItems.map((log) => (
                <RecentCard key={log.id} log={log} isDark={isDark} colors={colors} />
              ))}
            </ScrollView>
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
            <Text style={[styles.emptyTitle, { color: colors.ink, fontFamily: fonts.display }]}>
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
  greetingLine: { fontSize: 18, fontStyle: 'italic' },
  greetingName: { fontSize: 52, letterSpacing: 4, lineHeight: 56 },

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
  continueCard: { width: 160, height: 240, overflow: 'hidden' },
  continueCover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  continueGradientTop: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 100,
  },
  continueGradient: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingTop: 20,
    paddingHorizontal: 10,
    paddingBottom: 12,
    gap: 3,
  },
  continueTypePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginBottom: 2,
  },
  continueTypeText: { fontSize: 6, letterSpacing: 2, color: 'rgba(255,255,255,0.8)' },
  continueTitle: { fontSize: 13, letterSpacing: 1.5, lineHeight: 16, color: '#fff' },
  continueCreator: { fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.7)' },

  // Recent card
  recentItem: { width: 96, gap: 6 },
  recentCover: { width: 96, height: 144, borderWidth: 2 },
  ratingDots: { flexDirection: 'row', gap: 3 },
  ratingDot: { width: 5, height: 5, borderRadius: 3 },
  recentTitle: { fontSize: 12, fontStyle: 'italic', lineHeight: 16 },

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
