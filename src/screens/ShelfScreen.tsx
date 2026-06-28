import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions, Image, FlatList,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import WeeklyNudgeBanner from '../components/WeeklyNudgeBanner';
import ShelfItemModal from '../components/ShelfItemModal';
import { shouldShowInAppNudge } from '../lib/habitNudge';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';
import { useLogs } from '../hooks/useLogs';
import { fonts } from '../theme/tokens';
import BookSpine     from '../components/shelf/BookSpine';
import FilmFrame     from '../components/shelf/FilmFrame';
import DVDCase       from '../components/shelf/DVDCase';
import VinylRecord   from '../components/shelf/VinylRecord';
import CassetteTape  from '../components/shelf/CassetteTape';
import GameCartridge from '../components/shelf/GameCartridge';
import type { LogEntry } from '../hooks/useLogs';
import { clampAmbient, hexToRgb, ambientToHex, getAmbientColour } from '../lib/ambientColour';
import * as haptics from '../lib/haptics';
import FolioCodeMark from '../components/FolioCodeMark';
import { FOLIO_CODE_COLOURS } from '../theme/tokens';

const { width: SCREEN_W } = Dimensions.get('window');

type Tab = 'all' | 'book' | 'film' | 'tv' | 'album' | 'podcast' | 'game';
type MediaTab = Exclude<Tab, 'all'>;
type TabCounts = Partial<Record<Tab, number>>;
type SortKey = 'date' | 'rating' | 'title' | 'year';
type StatusFilter = 'all' | 'finished' | 'in_progress' | 'dropped' | 'abandoned';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date',   label: 'DATE' },
  { key: 'rating', label: 'RATING' },
  { key: 'title',  label: 'TITLE' },
  { key: 'year',   label: 'YEAR' },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all',         label: 'ALL' },
  { key: 'finished',    label: 'DONE' },
  { key: 'in_progress', label: 'IN PROGRESS' },
  { key: 'dropped',     label: 'DROPPED' },
  { key: 'abandoned',   label: 'ABANDONED' },
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'all',     label: 'ALL'    },
  { key: 'book',    label: 'BOOKS'  },
  { key: 'film',    label: 'FILMS'  },
  { key: 'tv',      label: 'TV'     },
  { key: 'album',   label: 'ALBUMS' },
  { key: 'podcast', label: 'PODS'   },
  { key: 'game',    label: 'GAMES'  },
];

const EMPTY_MESSAGES: Record<Tab, { title: string; sub: string }> = {
  all:     { title: 'NOTHING LOGGED YET', sub: 'Start logging books, films, albums, games, and more.' },
  book:    { title: 'EMPTY SHELF',       sub: 'Your books will line up here as spines, spine by spine.' },
  film:    { title: 'NO REELS YET',      sub: 'Log a film and it appears in its film strip frame.' },
  tv:      { title: 'NO CASES YET',      sub: 'Logged TV shows stack here as DVD cases.' },
  album:   { title: 'EMPTY CRATE',       sub: 'Vinyl sleeves will fill this crate as you log albums.' },
  podcast: { title: 'NO TAPES YET',      sub: 'Podcasts appear as cassette tapes standing upright.' },
  game:    { title: 'NO CARTRIDGES YET', sub: 'Logged games line up here with their notched cartridges.' },
};

// ── Book shelf — rows of spines with a wooden plank beneath each row ──────────
const SPINE_ROW_W = SCREEN_W - 48;

function BookShelf({ logs, colors, onSelect }: { logs: LogEntry[]; colors: any; onSelect: (log: LogEntry) => void }) {
  // Split into rows of ~8 spines each
  const SPINES_PER_ROW = 7;
  const rows: LogEntry[][] = [];
  for (let i = 0; i < logs.length; i += SPINES_PER_ROW) {
    rows.push(logs.slice(i, i + SPINES_PER_ROW));
  }

  return (
    <View style={bookStyles.shelves}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={bookStyles.shelfRow}>
          {/* Spines */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={bookStyles.spineRow}
          >
            {row.map((log, i) => (
              <BookSpine key={log.id} log={log} index={rowIdx * SPINES_PER_ROW + i} onSelect={onSelect} />
            ))}
          </ScrollView>
          {/* Shelf plank */}
          <View style={bookStyles.plankWrap}>
            <View style={[bookStyles.plankTop, { backgroundColor: colors.border2 }]} />
            <View style={[bookStyles.plankBody, { backgroundColor: colors.bg3 }]} />
            <View style={[bookStyles.plankShadow, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const bookStyles = StyleSheet.create({
  shelves: { gap: 0, paddingTop: 32 },
  shelfRow: { paddingHorizontal: 0 },
  spineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    gap: 1,
    paddingBottom: 0,
  },
  plankWrap: { marginHorizontal: 0 },
  plankTop:    { height: 3 },
  plankBody:   { height: 14 },
  plankShadow: { height: 8 },
});

// ── Film strip — horizontal scroll of frames with connecting film strip ───────
function FilmStrip({ logs, colors, onSelect }: { logs: LogEntry[]; colors: any; onSelect: (log: LogEntry) => void }) {
  return (
    <View style={filmStyles.container}>
      {/* Film strip rail top */}
      <View style={[filmStyles.rail, { backgroundColor: '#0E0E0E', borderColor: '#1C1C1C' }]}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={[filmStyles.railHole, { backgroundColor: colors.bg2 }]} />
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filmStyles.frames}>
        {logs.map((log) => (
          <FilmFrame key={log.id} log={log} onSelect={onSelect} />
        ))}
      </ScrollView>

      {/* Film strip rail bottom */}
      <View style={[filmStyles.rail, { backgroundColor: '#0E0E0E', borderColor: '#1C1C1C' }]}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={[filmStyles.railHole, { backgroundColor: colors.bg2 }]} />
        ))}
      </View>
    </View>
  );
}

const filmStyles = StyleSheet.create({
  container: { marginTop: 20 },
  rail: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  railHole: { width: 12, height: 8, borderRadius: 1, flexShrink: 0 },
  frames: {
    flexDirection: 'row',
    gap: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
});

// ── Generic grid for TV, Albums, Podcasts, Games ─────────────────────────────
function ShelfGrid({ logs, type, onSelect }: { logs: LogEntry[]; type: MediaTab; onSelect: (log: LogEntry) => void }) {
  const renderItem = (log: LogEntry) => {
    switch (type) {
      case 'tv':      return <DVDCase      key={log.id} log={log} onSelect={onSelect} />;
      case 'album':   return <VinylRecord  key={log.id} log={log} onSelect={onSelect} />;
      case 'podcast': return <CassetteTape key={log.id} log={log} onSelect={onSelect} />;
      case 'game':    return <GameCartridge key={log.id} log={log} onSelect={onSelect} />;
      default:        return null;
    }
  };

  return (
    <View style={gridStyles.grid}>
      {logs.map((log) => (
        <View key={log.id} style={gridStyles.item}>
          {renderItem(log)}
        </View>
      ))}
    </View>
  );
}

const gridStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 24,
  },
  item: {},
});

// ── Cover grid — 3-column poster grid ─────────────────────────────────────────
const GRID_COLS = 3;
const GRID_ITEM_W = (SCREEN_W - 48 - (GRID_COLS - 1) * 2) / GRID_COLS;

function CoverGrid({ logs, mode, colors, onSelect }: {
  logs: LogEntry[];
  mode: 'dark' | 'light';
  colors: any;
  onSelect: (log: LogEntry) => void;
}) {
  return (
    <FlatList
      data={logs}
      keyExtractor={item => item.id}
      numColumns={GRID_COLS}
      scrollEnabled={false}
      contentContainerStyle={coverGridStyles.container}
      columnWrapperStyle={coverGridStyles.row}
      renderItem={({ item: log }) => {
        const raw = log.dominant_colour ? hexToRgb(log.dominant_colour) : null;
        const accent = raw
          ? ambientToHex(clampAmbient(raw, mode === 'dark'))
          : ambientToHex(clampAmbient(getAmbientColour(log.title), mode === 'dark'));

        return (
          <TouchableOpacity
            style={[coverGridStyles.item, { width: GRID_ITEM_W }]}
            onPress={() => { haptics.tapLight(); onSelect(log); }}
            activeOpacity={0.85}
          >
            {log.cover_url ? (
              <Image
                source={{ uri: log.cover_url }}
                style={[coverGridStyles.cover, { borderColor: colors.border }]}
                resizeMode="cover"
              />
            ) : (
              <View style={[coverGridStyles.cover, coverGridStyles.placeholder, { backgroundColor: accent + '28', borderColor: accent }]}>
                <Text style={[coverGridStyles.placeholderTxt, { color: accent, fontFamily: fonts.mono }]}>
                  {log.title.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
            {log.rating && (
              <View style={[coverGridStyles.ratingBadge, { backgroundColor: accent }]}>
                <Text style={[coverGridStyles.ratingTxt, { fontFamily: fonts.mono }]}>{'★'.repeat(log.rating)}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const coverGridStyles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20 },
  row: { gap: 2, marginBottom: 2 },
  item: { position: 'relative' },
  cover: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderWidth: 1,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTxt: { fontSize: 16, letterSpacing: 2 },
  ratingBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  ratingTxt: { fontSize: 6, color: '#fff', letterSpacing: 0.5 },
});

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ tab, colors, mode }: { tab: Tab; colors: any; mode: 'dark' | 'light' }) {
  const msg = EMPTY_MESSAGES[tab];
  return (
    <View style={emptyStyles.container}>
      <FolioCodeMark
        size="medium"
        blocksColor={FOLIO_CODE_COLOURS[mode].blocks}
        barColor={FOLIO_CODE_COLOURS[mode].bar}
        dotColor={FOLIO_CODE_COLOURS[mode].dot}
      />
      <Text style={[emptyStyles.title, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]}>
        {msg.title}
      </Text>
      <Text style={[emptyStyles.sub, { color: colors.ink3, fontFamily: fonts.body }]}>
        {msg.sub}
      </Text>
      <View style={[emptyStyles.cta, { borderColor: colors.border2 }]}>
        <Text style={[emptyStyles.ctaText, { color: colors.ink3, fontFamily: fonts.mono }]}>
          TAP + TO LOG SOMETHING
        </Text>
      </View>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 40 },
  title: { fontSize: 28, letterSpacing: 4, textAlign: 'center' },
  sub: { fontSize: 15, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },
  cta: { borderWidth: 1, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  ctaText: { fontSize: 10, letterSpacing: 2 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
interface Props { onOpenLog?: () => void }

export default function ShelfScreen({ onOpenLog }: Props) {
  const { colors, mode } = useThemeStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [gridView, setGridView] = useState(false);
  const [counts, setCounts] = useState<TabCounts>({});

  // Fetch per-type counts once
  useEffect(() => {
    if (!user) return;
    supabase
      .from('logs')
      .select('media_type')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const c: TabCounts = { all: 0 };
        for (const row of (data ?? [])) {
          const mt = row.media_type as MediaTab;
          c[mt] = (c[mt] ?? 0) + 1;
          c.all = (c.all ?? 0) + 1;
        }
        setCounts(c);
      });
  }, [user]);

  const mediaTypeForQuery = activeTab === 'all' ? undefined : activeTab;
  const { logs, loading, loadingMore, hasMore, refetch, loadMore } = useLogs(mediaTypeForQuery, sortKey, statusFilter);
  const [refreshing, setRefreshing] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const lastLog = logs[0]?.logged_at ?? null;
  const showNudge = !nudgeDismissed && shouldShowInAppNudge(lastLog);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderShelf = () => {
    if (activeTab === 'all' || gridView)
      return <CoverGrid logs={logs} mode={mode} colors={colors} onSelect={setSelectedLog} />;
    if (activeTab === 'book') return <BookShelf logs={logs} colors={colors} onSelect={setSelectedLog} />;
    if (activeTab === 'film') return <FilmStrip logs={logs} colors={colors} onSelect={setSelectedLog} />;
    return <ShelfGrid logs={logs} type={activeTab as MediaTab} onSelect={setSelectedLog} />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Background watermark */}
      <Text style={[styles.watermark, { color: colors.ink, fontFamily: fonts.display }]}>SHELF</Text>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.heading, { color: colors.ink, fontFamily: fonts.display }]}>MY SHELF</Text>
          <Text style={[styles.count, { color: colors.ink3, fontFamily: fonts.mono }]}>
            {loading ? '…' : `${counts[activeTab] ?? logs.length}${hasMore ? '+' : ''} ${TABS.find(t => t.key === activeTab)?.label.toLowerCase() ?? ''}`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { haptics.tapLight(); setGridView(v => !v); }}
          style={[styles.viewToggle, { borderColor: gridView ? colors.accent : colors.border2, backgroundColor: gridView ? `${colors.accent}18` : 'transparent' }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.viewToggleTxt, { color: gridView ? colors.accent : colors.ink3, fontFamily: fonts.mono }]}>
            {gridView ? '⊞ GRID' : '⊟ ART'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Media type tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsScroll, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={styles.tab}
            onPress={() => { haptics.tapLight(); setActiveTab(t.key); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, {
              color: activeTab === t.key ? colors.accent : colors.ink3,
              fontFamily: fonts.mono,
            }]}>
              {t.label}
            </Text>
            {counts[t.key] !== undefined && (
              <Text style={[styles.tabCount, {
                color: activeTab === t.key ? colors.accent : colors.ink3,
                fontFamily: fonts.mono,
              }]}>
                {counts[t.key]}
              </Text>
            )}
            {activeTab === t.key && (
              <View style={[styles.tabLine, { backgroundColor: colors.accent }]} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter / sort bar */}
      <View style={[controlStyles.bar, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={controlStyles.barContent}>
          {/* Sort toggle chip */}
          {SORT_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[controlStyles.chip, {
                borderColor: sortKey === s.key ? colors.accent : colors.border2,
                backgroundColor: sortKey === s.key ? `${colors.accent}18` : 'transparent',
              }]}
              onPress={() => setSortKey(s.key)}
              activeOpacity={0.7}
            >
              <Text style={[controlStyles.chipText, {
                color: sortKey === s.key ? colors.accent : colors.ink3,
                fontFamily: fonts.mono,
              }]}>
                {sortKey === s.key ? `↕ ${s.label}` : s.label}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={[controlStyles.divider, { backgroundColor: colors.border2 }]} />

          {/* Status filter chips */}
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[controlStyles.chip, {
                borderColor: statusFilter === f.key ? colors.editorial : colors.border2,
                backgroundColor: statusFilter === f.key ? `${colors.editorial}18` : 'transparent',
              }]}
              onPress={() => setStatusFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[controlStyles.chipText, {
                color: statusFilter === f.key ? colors.editorial : colors.ink3,
                fontFamily: fonts.mono,
              }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Weekly nudge banner */}
      {showNudge && !loading && (
        <WeeklyNudgeBanner
          onLog={() => { setNudgeDismissed(true); onOpenLog?.(); }}
          onDismiss={() => setNudgeDismissed(true)}
        />
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : logs.length === 0 ? (
        <EmptyState tab={activeTab} colors={colors} mode={mode} />
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
        >
          {renderShelf()}
          {loadingMore && (
            <ActivityIndicator color={colors.accent} style={{ padding: 20 }} />
          )}
          {hasMore && !loadingMore && (
            <TouchableOpacity onPress={loadMore} style={styles.loadMore}>
              <Text style={[styles.loadMoreText, { color: colors.ink3, fontFamily: fonts.mono }]}>
                LOAD MORE
              </Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 48 }} />
        </ScrollView>
      )}
      <ShelfItemModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        onUpdated={(id, changes) => {
          setSelectedLog(prev => prev && prev.id === id ? { ...prev, ...changes } : prev);
          refetch();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  watermark: {
    position: 'absolute',
    fontSize: 160, opacity: 0.03,
    bottom: -10, right: -10, letterSpacing: 8,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  heading: { fontSize: 32, letterSpacing: 4 },
  count: { fontSize: 10, letterSpacing: 1, marginTop: 2 },
  viewToggle: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  viewToggleTxt: { fontSize: 9, letterSpacing: 1.5 },
  tabsScroll: { borderBottomWidth: 1, maxHeight: 56 },
  tabsContent: { paddingHorizontal: 16 },
  tab: {
    paddingHorizontal: 12, paddingVertical: 10,
    position: 'relative', alignItems: 'center', gap: 2,
  },
  tabText: { fontSize: 9, letterSpacing: 1.5 },
  tabCount: { fontSize: 9, letterSpacing: 0.5, opacity: 0.7 },
  tabLine: {
    position: 'absolute', bottom: 0,
    left: '10%', right: '10%', height: 2,
  },
  scroll: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadMore: { padding: 20, alignItems: 'center' },
  loadMoreText: { fontSize: 10, letterSpacing: 2 },
});

const controlStyles = StyleSheet.create({
  bar: {
    borderBottomWidth: 1,
    maxHeight: 40,
  },
  barContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
    paddingVertical: 6,
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 2,
  },
  chipText: {
    fontSize: 9,
    letterSpacing: 1.5,
  },
  divider: {
    width: 1,
    height: 16,
    marginHorizontal: 4,
  },
});
