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
import { clampAmbient, hexToRgb, ambientToHex } from '../lib/ambientColour';
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
}

function CoverPlaceholder({ log, size, colors, mode }: { log: LogEntry; size: number; colors: any; mode: 'dark' | 'light' }) {
  const rawRgb = log.dominant_colour ? hexToRgb(log.dominant_colour) : null;
  const accent = rawRgb ? ambientToHex(clampAmbient(rawRgb, mode === 'dark')) : colors.accent;
  return (
    <View style={[{ width: size, height: size * 1.5, backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: '#fff', fontFamily: fonts.mono, fontSize: size * 0.22, letterSpacing: 1 }}>
        {MEDIA_INITIAL[log.media_type] ?? '·'}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const { colors, mode } = useThemeStore();
  const { user } = useAuthStore();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [profileRes, statsRes, continueRes, recentRes] = await Promise.all([
        supabase.from('users').select('name').eq('id', user.id).maybeSingle(),
        supabase.from('logs').select('status', { count: 'exact', head: false }).eq('user_id', user.id),
        supabase.from('logs')
          .select('id,media_type,title,creator,year,status,rating,review,cover_url,dominant_colour,logged_at,external_id')
          .eq('user_id', user.id)
          .eq('status', 'current')
          .order('logged_at', { ascending: false })
          .limit(10),
        supabase.from('logs')
          .select('id,media_type,title,creator,year,status,rating,review,cover_url,dominant_colour,logged_at,external_id')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(8),
      ]);

      const allStatuses = (statsRes.data ?? []) as { status: string }[];
      setData({
        name: profileRes.data?.name ?? '',
        totalLogged:   allStatuses.length,
        inProgress:    allStatuses.filter(r => r.status === 'current').length,
        wantToExplore: allStatuses.filter(r => r.status === 'want').length,
        continueItems: (continueRes.data ?? []) as LogEntry[],
        recentItems:   (recentRes.data ?? []) as LogEntry[],
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
                <View key={log.id} style={styles.continueCard}>
                  {log.cover_url ? (
                    <Image source={{ uri: log.cover_url }} style={styles.continueCover} resizeMode="cover" />
                  ) : (
                    <CoverPlaceholder log={log} size={80} colors={colors} mode={mode} />
                  )}
                  <View style={[styles.continueInfo, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
                    <Text style={[styles.continueTitle, { color: colors.ink, fontFamily: fonts.display }]} numberOfLines={2}>
                      {log.title.toUpperCase()}
                    </Text>
                    {log.creator ? (
                      <Text style={[styles.continueCreator, { color: colors.ink3, fontFamily: fonts.mono }]} numberOfLines={1}>
                        {log.creator}
                      </Text>
                    ) : null}
                    <View style={[styles.progressTrack, { backgroundColor: colors.bg4 }]}>
                      <View style={[styles.progressFill, { backgroundColor: colors.accent, width: '30%' }]} />
                    </View>
                  </View>
                </View>
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
              {data!.recentItems.map((log) => {
                const rawRgb = log.dominant_colour ? hexToRgb(log.dominant_colour) : null;
                const accent = rawRgb ? ambientToHex(clampAmbient(rawRgb, mode === 'dark')) : colors.accent;
                return (
                  <View key={log.id} style={styles.recentItem}>
                    {log.cover_url ? (
                      <Image source={{ uri: log.cover_url }} style={styles.recentCover} resizeMode="cover" />
                    ) : (
                      <View style={[styles.recentCover, { backgroundColor: accent, alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={{ color: '#fff', fontFamily: fonts.mono, fontSize: 18, letterSpacing: 1 }}>
                          {MEDIA_INITIAL[log.media_type] ?? '·'}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.recentTitle, { color: colors.ink, fontFamily: fonts.body }]} numberOfLines={2}>
                      {log.title}
                    </Text>
                    <Text style={[styles.recentMeta, { color: colors.ink3, fontFamily: fonts.mono }]}>
                      {log.media_type.toUpperCase()}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
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
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  statDivider: { width: 1 },
  statNum: { fontSize: 32, letterSpacing: 2, lineHeight: 34 },
  statLabel: { fontSize: 8, letterSpacing: 1.5 },

  section: { paddingTop: 28, gap: 14 },
  sectionLabel: {
    fontSize: 9, letterSpacing: 2,
    paddingHorizontal: 28,
  },
  hScroll: { paddingHorizontal: 28, gap: 16 },

  continueCard: { width: 160, gap: 0 },
  continueCover: { width: 160, height: 240, resizeMode: 'cover' },
  continueInfo: {
    padding: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    gap: 4,
  },
  continueTitle: { fontSize: 13, letterSpacing: 1.5, lineHeight: 16 },
  continueCreator: { fontSize: 9, letterSpacing: 1 },
  progressTrack: { height: 2, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: '100%' },

  recentItem: { width: 96, gap: 6 },
  recentCover: { width: 96, height: 144 },
  recentTitle: { fontSize: 12, fontStyle: 'italic', lineHeight: 16 },
  recentMeta: { fontSize: 8, letterSpacing: 1.5 },

  empty: {
    paddingHorizontal: 40,
    paddingTop: 60,
    gap: 14,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 28, letterSpacing: 4, textAlign: 'center' },
  emptySub: { fontSize: 15, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
});
