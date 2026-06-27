import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
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

const { width: SCREEN_W } = Dimensions.get('window');

type Tab = 'book' | 'film' | 'tv' | 'album' | 'podcast' | 'game';
type SortKey = 'date' | 'rating' | 'title' | 'year';
type StatusFilter = 'all' | 'completed' | 'in_progress' | 'dropped';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date',   label: 'DATE' },
  { key: 'rating', label: 'RATING' },
  { key: 'title',  label: 'TITLE' },
  { key: 'year',   label: 'YEAR' },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all',         label: 'ALL' },
  { key: 'completed',   label: 'DONE' },
  { key: 'in_progress', label: 'IN PROGRESS' },
  { key: 'dropped',     label: 'DROPPED' },
];

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'book',    label: 'BOOKS',   icon: '📖' },
  { key: 'film',    label: 'FILMS',   icon: '🎬' },
  { key: 'tv',      label: 'TV',      icon: '📺' },
  { key: 'album',   label: 'ALBUMS',  icon: '🎵' },
  { key: 'podcast', label: 'PODS',    icon: '🎙' },
  { key: 'game',    label: 'GAMES',   icon: '🎮' },
];

const EMPTY_MESSAGES: Record<Tab, { title: string; sub: string }> = {
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
      <View style={[filmStyles.rail, { backgroundColor: '#1a1a1a', borderColor: '#333' }]}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={[filmStyles.railHole, { backgroundColor: colors.bg }]} />
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filmStyles.frames}>
        {logs.map((log) => (
          <FilmFrame key={log.id} log={log} onSelect={onSelect} />
        ))}
      </ScrollView>

      {/* Film strip rail bottom */}
      <View style={[filmStyles.rail, { backgroundColor: '#1a1a1a', borderColor: '#333' }]}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={[filmStyles.railHole, { backgroundColor: colors.bg }]} />
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
function ShelfGrid({ logs, type, onSelect }: { logs: LogEntry[]; type: Tab; onSelect: (log: LogEntry) => void }) {
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

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ tab, colors }: { tab: Tab; colors: any }) {
  const msg = EMPTY_MESSAGES[tab];
  return (
    <View style={emptyStyles.container}>
      <Text style={[emptyStyles.title, { color: colors.ink, fontFamily: fonts.display }]}>
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
export default function ShelfScreen() {
  const { colors } = useThemeStore();
  const [activeTab, setActiveTab] = useState<Tab>('book');
  const { logs: rawLogs, loading, refetch } = useLogs(activeTab);
  const [refreshing, setRefreshing] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showControls, setShowControls] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const lastLog = rawLogs[0]?.logged_at ?? null;
  const showNudge = !nudgeDismissed && shouldShowInAppNudge(lastLog);

  const logs = useMemo(() => {
    let filtered = statusFilter === 'all'
      ? rawLogs
      : rawLogs.filter((l) => l.status === statusFilter);

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'rating':
          return (b.rating ?? -1) - (a.rating ?? -1);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'year':
          return (b.year ?? 0) - (a.year ?? 0);
        case 'date':
        default:
          return new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime();
      }
    });
  }, [rawLogs, sortKey, statusFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderShelf = () => {
    if (activeTab === 'book') return <BookShelf logs={logs} colors={colors} onSelect={setSelectedLog} />;
    if (activeTab === 'film') return <FilmStrip logs={logs} colors={colors} onSelect={setSelectedLog} />;
    return <ShelfGrid logs={logs} type={activeTab} onSelect={setSelectedLog} />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Background watermark */}
      <Text style={[styles.watermark, { color: colors.ink, fontFamily: fonts.display }]}>SHELF</Text>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.heading, { color: colors.ink, fontFamily: fonts.display }]}>MY SHELF</Text>
        <Text style={[styles.count, { color: colors.ink3, fontFamily: fonts.mono }]}>
          {loading ? '…' : `${logs.length}${statusFilter !== 'all' ? `/${rawLogs.length}` : ''} ${TABS.find(t => t.key === activeTab)?.label.toLowerCase() ?? ''}`}
        </Text>
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
            onPress={() => setActiveTab(t.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, {
              color: activeTab === t.key ? colors.accent : colors.ink3,
              fontFamily: fonts.mono,
            }]}>
              {t.label}
            </Text>
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
          onLog={() => setNudgeDismissed(true)}
          onDismiss={() => setNudgeDismissed(true)}
        />
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : logs.length === 0 ? (
        <EmptyState tab={activeTab} colors={colors} />
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
        >
          {renderShelf()}
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
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  heading: { fontSize: 32, letterSpacing: 4 },
  count: { fontSize: 10, letterSpacing: 1 },
  tabsScroll: { borderBottomWidth: 1, maxHeight: 44 },
  tabsContent: { paddingHorizontal: 16 },
  tab: {
    paddingHorizontal: 12, paddingVertical: 12,
    position: 'relative', alignItems: 'center',
  },
  tabText: { fontSize: 10, letterSpacing: 1.5 },
  tabLine: {
    position: 'absolute', bottom: 0,
    left: '10%', right: '10%', height: 2,
  },
  scroll: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
