import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';
import { useFeed, type FeedLog, type FeedTrailComplete, type ActivityItem } from '../hooks/useFeed';
import CommentSheet from '../components/CommentSheet';
import { fonts, FOLIO_CODE_COLOURS } from '../theme/tokens';
import FolioCodeMark from '../components/FolioCodeMark';
import { hexToRgb, clampAmbient, ambientToHex } from '../lib/ambientColour';
import { timeAgo } from '../lib/timeAgo';

const MEDIA_INITIAL: Record<string, string> = {
  film: 'F', book: 'B', album: 'A', tv: 'TV', podcast: 'P', game: 'G',
};

const STATUS_VERB: Record<string, string> = {
  finished:  'finished',
  current:   'is enjoying',
  want:      'wants to enjoy',
  abandoned: 'abandoned',
};


// ── Log card ───────────────────────────────────────────────────────────────
function LogCard({
  item, colors, mode, onReact, onComment,
}: {
  item: FeedLog;
  colors: any;
  mode: 'dark' | 'light';
  onReact: (id: string, hasReacted: boolean) => void;
  onComment: (id: string, title: string) => void;
}) {
  const rawHex = item.dominant_colour;
  const rawRgb = rawHex ? hexToRgb(rawHex) : null;
  const accentColour = rawRgb
    ? ambientToHex(clampAmbient(rawRgb, mode === 'dark'))
    : colors.accent;

  return (
    <View style={[styles.card, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
      {/* Left colour accent */}
      <View style={[styles.cardAccent, { backgroundColor: accentColour }]} />

      <View style={styles.cardInner}>
        {/* Cover art */}
        <View style={styles.coverWrap}>
          {item.cover_url ? (
            <Image source={{ uri: item.cover_url }} style={styles.cover} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, { backgroundColor: accentColour }]}>
              <Text style={[styles.coverIcon, { color: '#fff', fontFamily: fonts.mono }]}>
                {MEDIA_INITIAL[item.media_type] ?? '·'}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* User row */}
          <View style={styles.metaRow}>
            <View style={[styles.avatar, { backgroundColor: accentColour }]}>
              <Text style={[styles.avatarInitial, { color: '#fff', fontFamily: fonts.display }]}>
                {(item.user_name ?? item.user_handle ?? '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.metaText}>
              <Text style={[styles.userName, { color: colors.ink, fontFamily: fonts.mono }]}>
                {item.isOwn ? 'YOU' : `@${item.user_handle ?? item.user_name ?? 'unknown'}`}
              </Text>
              <Text style={[styles.timeAgo, { color: colors.ink3, fontFamily: fonts.mono }]}>
                {timeAgo(item.logged_at)}
              </Text>
            </View>
          </View>

          {/* Verb */}
          <Text style={[styles.action, { color: colors.ink3, fontFamily: fonts.body }]}>
            {STATUS_VERB[item.status] ?? 'logged'}
          </Text>

          {/* Title */}
          <Text style={[styles.title, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]} numberOfLines={2}>
            {item.title.toUpperCase()}
          </Text>

          {/* Creator · year */}
          {(item.creator || item.year) && (
            <Text style={[styles.creator, { color: colors.ink3, fontFamily: fonts.mono }]}>
              {[item.creator, item.year].filter(Boolean).join('  ·  ')}
            </Text>
          )}

          {/* Stars */}
          {item.rating && item.rating > 0 && (
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Text key={s} style={[styles.star, { color: s <= item.rating! ? accentColour : colors.bg4 }]}>★</Text>
              ))}
            </View>
          )}

          {/* Review snippet */}
          {item.review && (
            <View style={[styles.reviewBox, { borderColor: colors.border2 }]}>
              <Text style={[styles.reviewText, { color: colors.ink2, fontFamily: fonts.bodyRoman }]} numberOfLines={2}>
                "{item.review}"
              </Text>
            </View>
          )}

          {/* Action row: react + comment */}
          <View style={styles.actionRow}>
            {!item.isOwn ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onReact(item.id, item.hasReacted)}
                activeOpacity={0.7}
              >
                <Text style={[styles.reactHeart, { color: item.hasReacted ? '#e05080' : colors.ink3 }]}>
                  {item.hasReacted ? '❤' : '♡'}
                </Text>
                {item.reactionCount > 0 && (
                  <Text style={[styles.reactCount, { color: colors.ink3, fontFamily: fonts.mono }]}>
                    {item.reactionCount}
                  </Text>
                )}
              </TouchableOpacity>
            ) : item.reactionCount > 0 ? (
              <View style={styles.actionBtn}>
                <Text style={[styles.reactHeart, { color: '#e05080' }]}>❤</Text>
                <Text style={[styles.reactCount, { color: colors.ink3, fontFamily: fonts.mono }]}>
                  {item.reactionCount}
                </Text>
              </View>
            ) : <View style={styles.actionBtn} />}

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onComment(item.id, item.title)}
              activeOpacity={0.7}
            >
              <Text style={[styles.commentIcon, { color: item.commentCount > 0 ? colors.accent : colors.ink3 }]}>
                💬
              </Text>
              {item.commentCount > 0 && (
                <Text style={[styles.reactCount, { color: colors.ink3, fontFamily: fonts.mono }]}>
                  {item.commentCount}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Trail completion card ──────────────────────────────────────────────────
function TrailCompleteCard({ item, colors, mode }: { item: FeedTrailComplete; colors: any; mode: 'dark' | 'light' }) {
  return (
    <View style={[styles.trailCard, { backgroundColor: colors.bg2, borderColor: colors.streak }]}>
      <View style={[styles.trailCardAccent, { backgroundColor: colors.streak }]} />
      <View style={styles.trailCardInner}>
        <Text style={[styles.trailTick, { color: colors.streak }]}>✓</Text>
        <View style={styles.trailCardContent}>
          <Text style={[styles.trailCardUser, { color: colors.ink3, fontFamily: fonts.mono }]}>
            {item.isOwn ? 'YOU' : `@${item.user_handle ?? item.user_name ?? 'unknown'}`}
          </Text>
          <Text style={[styles.trailCardTitle, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]}>
            COMPLETED{'\n'}{item.trail_title.toUpperCase()}
          </Text>
          <Text style={[styles.trailCardTime, { color: colors.ink3, fontFamily: fonts.mono }]}>
            {timeAgo(item.completed_at)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Activity item ──────────────────────────────────────────────────────────
function ActivityCard({ item, colors }: { item: ActivityItem; colors: any }) {
  return (
    <View style={[styles.activityRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.activityEmoji]}>{item.emoji}</Text>
      <View style={styles.activityContent}>
        <Text style={[styles.activityText, { color: colors.ink, fontFamily: fonts.ui }]}>
          <Text style={{ fontFamily: fonts.mono }}>
            @{item.reactor_handle ?? item.reactor_name ?? 'someone'}
          </Text>
          {' reacted to '}
          <Text style={{ fontStyle: 'italic' }}>{item.log_title}</Text>
        </Text>
        <Text style={[styles.activityTime, { color: colors.ink3, fontFamily: fonts.mono }]}>
          {timeAgo(item.created_at)}
        </Text>
      </View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
type Tab = 'feed' | 'activity';

export default function SocialScreen() {
  const { colors, mode } = useThemeStore();
  const { events, activity, loading, hasFollowing, refetch, toggleReaction, updateCommentCount } = useFeed();
  const [tab, setTab] = useState<Tab>('feed');
  const [refreshing, setRefreshing] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{ id: string; title: string } | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const ownEvents  = events.filter((e) => e.isOwn);
  const feedEvents = events.filter((e) => !e.isOwn);
  const showFindPeople = !hasFollowing;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.watermark, { color: colors.ink, fontFamily: fonts.display }]}>SOCIAL</Text>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.heading, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]}>FEED</Text>
        {activity.length > 0 && tab === 'feed' && (
          <View style={[styles.badge, { backgroundColor: colors.editorial }]}>
            <Text style={[styles.badgeText, { color: '#fff', fontFamily: fonts.mono }]}>{activity.length}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(['feed', 'activity'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={styles.tab} onPress={() => setTab(t)} activeOpacity={0.7}>
            <Text style={[styles.tabText, {
              color: tab === t ? colors.accent : colors.ink3,
              fontFamily: fonts.mono,
            }]}>
              {t === 'feed' ? 'FEED' : `ACTIVITY${activity.length > 0 ? ` (${activity.length})` : ''}`}
            </Text>
            {tab === t && <View style={[styles.tabLine, { backgroundColor: colors.accent }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator color={colors.accent} /></View>
      ) : tab === 'activity' ? (
        /* ── ACTIVITY TAB ── */
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          showsVerticalScrollIndicator={false}
        >
          {activity.length === 0 ? (
            <View style={styles.empty}>
              <FolioCodeMark size="medium" blocksColor={FOLIO_CODE_COLOURS[mode].blocks} barColor={FOLIO_CODE_COLOURS[mode].bar} dotColor={FOLIO_CODE_COLOURS[mode].dot} />
              <Text style={[styles.emptyTitle, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]}>NO ACTIVITY YET</Text>
              <Text style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.body }]}>
                When people react to your logs, you'll see it here.
              </Text>
            </View>
          ) : (
            activity.map((item) => <ActivityCard key={item.id} item={item} colors={colors} />)
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* ── FEED TAB ── */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Find people prompt */}
          {showFindPeople && (
            <View style={[styles.findPeople, { backgroundColor: colors.bg2, borderColor: colors.border2 }]}>
              <View style={[styles.findPeopleBar, { backgroundColor: colors.accent }]} />
              <View style={styles.findPeopleText}>
                <Text style={[styles.findPeopleTitle, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]}>
                  FIND PEOPLE
                </Text>
                <Text style={[styles.findPeopleSub, { color: colors.ink3, fontFamily: fonts.body }]}>
                  Go to Trails → People to follow readers, watchers, and listeners.
                </Text>
              </View>
            </View>
          )}

          {/* Your own recent logs */}
          {ownEvents.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>YOUR LOGS</Text>
              {ownEvents.slice(0, 5).map((e) =>
                e.type === 'log'
                  ? <LogCard key={e.id} item={e} colors={colors} mode={mode} onReact={toggleReaction} onComment={(id, title) => setCommentTarget({ id, title })} />
                  : <TrailCompleteCard key={e.id} item={e} colors={colors} mode={mode} />
              )}
            </View>
          )}

          {/* Following feed */}
          {hasFollowing && feedEvents.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>FOLLOWING</Text>
              {feedEvents.map((e) =>
                e.type === 'log'
                  ? <LogCard key={e.id} item={e} colors={colors} mode={mode} onReact={toggleReaction} onComment={(id, title) => setCommentTarget({ id, title })} />
                  : <TrailCompleteCard key={e.id} item={e} colors={colors} mode={mode} />
              )}
            </View>
          )}

          {hasFollowing && feedEvents.length === 0 && ownEvents.length === 0 && (
            <View style={styles.empty}>
              <FolioCodeMark size="medium" blocksColor={FOLIO_CODE_COLOURS[mode].blocks} barColor={FOLIO_CODE_COLOURS[mode].bar} dotColor={FOLIO_CODE_COLOURS[mode].dot} />
              <Text style={[styles.emptyTitle, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]}>NOTHING YET</Text>
              <Text style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.body }]}>
                The people you follow haven't logged anything yet.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
      <CommentSheet
        logId={commentTarget?.id ?? null}
        logTitle={commentTarget?.title ?? ''}
        onClose={() => setCommentTarget(null)}
        onCountChange={updateCommentCount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  watermark: {
    position: 'absolute', fontSize: 120, opacity: 0.03,
    bottom: -10, right: -10, letterSpacing: 6,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  heading: { fontSize: 32, letterSpacing: 4 },
  badge: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10 },
  tabs: {
    flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 24,
  },
  tab: { paddingHorizontal: 16, paddingVertical: 12, position: 'relative', alignItems: 'center' },
  tabText: { fontSize: 11, letterSpacing: 1.5 },
  tabLine: { position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 2 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { gap: 0 },
  section: { gap: 0, paddingTop: 16 },
  sectionLabel: {
    fontSize: 9, letterSpacing: 2,
    paddingHorizontal: 24, paddingBottom: 10,
  },

  // Find people banner
  findPeople: {
    flexDirection: 'row', borderWidth: 1, marginHorizontal: 24,
    marginTop: 16, overflow: 'hidden',
  },
  findPeopleBar: { width: 3 },
  findPeopleText: { flex: 1, padding: 14, gap: 4 },
  findPeopleTitle: { fontSize: 16, letterSpacing: 2 },
  findPeopleSub: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },

  // Log card
  card: { borderTopWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  cardAccent: { width: 3 },
  cardInner: { flex: 1, flexDirection: 'row', padding: 16, gap: 14 },
  coverWrap: {},
  cover: { width: 64, height: 96, alignItems: 'center', justifyContent: 'center' },
  coverIcon: { fontSize: 24 },
  content: { flex: 1, gap: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 22, height: 22, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 11, letterSpacing: 0 },
  metaText: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  userName: { fontSize: 10, letterSpacing: 1 },
  timeAgo: { fontSize: 9, letterSpacing: 0.5 },
  action: { fontSize: 12, fontStyle: 'italic', marginTop: -2 },
  title: { fontSize: 20, letterSpacing: 2, lineHeight: 22 },
  creator: { fontSize: 9, letterSpacing: 1 },
  stars: { flexDirection: 'row', gap: 2 },
  star: { fontSize: 13 },
  reviewBox: { borderLeftWidth: 2, paddingLeft: 10, marginTop: 2 },
  reviewText: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reactHeart: { fontSize: 16 },
  commentIcon: { fontSize: 14 },
  reactCount: { fontSize: 10, letterSpacing: 1 },

  // Trail complete card
  trailCard: {
    borderWidth: 1, borderTopWidth: 1, flexDirection: 'row',
    overflow: 'hidden', marginHorizontal: 0,
  },
  trailCardAccent: { width: 3 },
  trailCardInner: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  trailTick: { fontSize: 28 },
  trailCardContent: { flex: 1, gap: 4 },
  trailCardUser: { fontSize: 9, letterSpacing: 2 },
  trailCardTitle: { fontSize: 18, letterSpacing: 2, lineHeight: 20 },
  trailCardTime: { fontSize: 9, letterSpacing: 1 },

  // Activity tab
  activityRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14,
    borderBottomWidth: 1, gap: 14,
  },
  activityEmoji: { fontSize: 20 },
  activityContent: { flex: 1, gap: 3 },
  activityText: { fontSize: 14, lineHeight: 19 },
  activityTime: { fontSize: 9, letterSpacing: 1 },

  // Shared empty
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingTop: 80, gap: 16,
  },
  emptyTitle: { fontSize: 28, letterSpacing: 4, textAlign: 'center' },
  emptyText: { fontSize: 15, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
});
