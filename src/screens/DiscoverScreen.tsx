import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';
import { fonts, FOLIO_CODE_COLOURS } from '../theme/tokens';
import FolioCodeMark from '../components/FolioCodeMark';
import { searchMedia, type MediaType, type SearchResult } from '../lib/mediaSearch';
import { useTrails } from '../hooks/useTrails';
import TrailCard from './discover/TrailCard';
import TrailDetailSheet from './discover/TrailDetailSheet';
import * as haptics from '../lib/haptics';

const TYPES: { key: MediaType; label: string }[] = [
  { key: 'film',    label: 'FILM'    },
  { key: 'book',    label: 'BOOK'    },
  { key: 'album',   label: 'ALBUM'   },
  { key: 'tv',      label: 'TV'      },
  { key: 'podcast', label: 'PODCAST' },
  { key: 'game',    label: 'GAME'    },
];

interface Props {
  onLogItem: (item: SearchResult) => void;
}

export default function DiscoverScreen({ onLogItem }: Props) {
  const { colors, mode } = useThemeStore();
  const [query, setQuery]           = useState('');
  const [mediaType, setMediaType]   = useState<MediaType>('film');
  const [results, setResults]       = useState<SearchResult[]>([]);
  const [searching, setSearching]   = useState(false);
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null);

  const { trails, loading: trailsLoading } = useTrails();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string, type: MediaType) => {
    if (!q.trim()) { setResults([]); setSearching(false); return; }
    setSearching(true);
    const res = await searchMedia(q, type).catch(() => []);
    setResults(res);
    setSearching(false);
  }, []);

  const onQueryChange = (text: string) => {
    setQuery(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => runSearch(text, mediaType), 400);
  };

  const onTypeChange = (type: MediaType) => {
    haptics.tapLight();
    setMediaType(type);
    if (query.trim()) runSearch(query, type);
  };

  const isSearching = query.trim().length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.watermark, { color: colors.ink, fontFamily: fonts.display }]}>SEARCH</Text>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
        <Text style={[styles.searchIcon, { color: colors.ink3 }]}>⌕</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.ink, fontFamily: fonts.body }]}
          value={query}
          onChangeText={onQueryChange}
          placeholder="Search films, books, albums…"
          placeholderTextColor={colors.ink3}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.clearBtn, { color: colors.ink3, fontFamily: fonts.mono }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Media type filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typeRow}
        style={[styles.typeScroll, { borderBottomColor: colors.border }]}
      >
        {TYPES.map(t => (
          <TouchableOpacity
            key={t.key}
            onPress={() => onTypeChange(t.key)}
            activeOpacity={0.7}
            style={[
              styles.typeChip,
              mediaType === t.key && { backgroundColor: colors.accent },
              mediaType !== t.key && { borderColor: colors.border2, borderWidth: 1 },
            ]}
          >
            <Text style={[styles.typeChipTxt, {
              color: mediaType === t.key ? colors.accentt : colors.ink3,
              fontFamily: fonts.mono,
            }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {isSearching ? (
        // ── Search results ──────────────────────────────────────────────────
        searching ? (
          <View style={styles.centre}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centre}>
            <FolioCodeMark size="medium" blocksColor={FOLIO_CODE_COLOURS[mode].blocks} barColor={FOLIO_CODE_COLOURS[mode].bar} dotColor={FOLIO_CODE_COLOURS[mode].dot} />
            <Text style={[styles.emptyTxt, { color: colors.ink3, fontFamily: fonts.mono }]}>
              NO RESULTS FOR "{query.toUpperCase()}"
            </Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ResultCard item={item} colors={colors} onLog={() => { haptics.tapLight(); onLogItem(item); }} />
            )}
          />
        )
      ) : (
        // ── Idle: trail discovery ───────────────────────────────────────────
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.idleContent}>
          <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>
            DISCOVER TRAILS
          </Text>
          {trailsLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
          ) : trails.length === 0 ? (
            <View style={[styles.centre, { marginTop: 40 }]}>
              <FolioCodeMark size="medium" blocksColor={FOLIO_CODE_COLOURS[mode].blocks} barColor={FOLIO_CODE_COLOURS[mode].bar} dotColor={FOLIO_CODE_COLOURS[mode].dot} />
              <Text style={[styles.emptyTxt, { color: colors.ink3, fontFamily: fonts.mono }]}>
                NO TRAILS AVAILABLE YET
              </Text>
            </View>
          ) : (
            <View style={styles.trailList}>
              {trails.map(trail => (
                <TrailCard
                  key={trail.id}
                  trail={trail}
                  onPress={() => { haptics.tapLight(); setSelectedTrailId(trail.id); }}
                />
              ))}
            </View>
          )}
          <View style={{ height: 48 }} />
        </ScrollView>
      )}

      {selectedTrailId && (
        <TrailDetailSheet
          trailId={selectedTrailId}
          onClose={() => setSelectedTrailId(null)}
        />
      )}
    </SafeAreaView>
  );
}

function ResultCard({ item, colors, onLog }: { item: SearchResult; colors: any; onLog: () => void }) {
  return (
    <View style={[styles.resultCard, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
      {item.coverUrl ? (
        <Image source={{ uri: item.coverUrl }} style={styles.resultCover} resizeMode="cover" />
      ) : (
        <View style={[styles.resultCover, styles.resultCoverPlaceholder, { backgroundColor: colors.bg3 }]}>
          <Text style={[styles.resultInitial, { color: colors.ink3, fontFamily: fonts.mono }]}>
            {item.title.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.resultMeta}>
        <Text style={[styles.resultTitle, { color: colors.ink, fontFamily: fonts.body }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.creator ? (
          <Text style={[styles.resultCreator, { color: colors.ink3, fontFamily: fonts.mono }]} numberOfLines={1}>
            {item.creator}
          </Text>
        ) : null}
        {item.year ? (
          <Text style={[styles.resultYear, { color: colors.ink3, fontFamily: fonts.mono }]}>
            {item.year}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={[styles.logBtn, { backgroundColor: colors.accent }]}
        onPress={onLog}
        activeOpacity={0.8}
      >
        <Text style={[styles.logBtnTxt, { color: colors.accentt, fontFamily: fonts.mono }]}>LOG</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  watermark: {
    position: 'absolute', fontSize: 120, opacity: 0.03,
    bottom: -10, right: -10, letterSpacing: 6,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 0,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchIcon: { fontSize: 20, lineHeight: 24 },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  clearBtn: { fontSize: 11, letterSpacing: 1 },

  typeScroll: { borderBottomWidth: 1, maxHeight: 52 },
  typeRow: { paddingHorizontal: 20, paddingVertical: 10, gap: 8, alignItems: 'center' },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  typeChipTxt: { fontSize: 9, letterSpacing: 2 },

  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTxt: { fontSize: 10, letterSpacing: 2, textAlign: 'center', paddingHorizontal: 40 },

  // Results grid
  grid: { padding: 16, paddingBottom: 40 },
  gridRow: { gap: 12, marginBottom: 12 },
  resultCard: {
    flex: 1,
    borderWidth: 1,
    overflow: 'hidden',
  },
  resultCover: { width: '100%', aspectRatio: 2/3 },
  resultCoverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  resultInitial: { fontSize: 24, letterSpacing: 2 },
  resultMeta: { padding: 8, gap: 3, flex: 1 },
  resultTitle: { fontSize: 13, fontStyle: 'italic', lineHeight: 17 },
  resultCreator: { fontSize: 8, letterSpacing: 1 },
  resultYear: { fontSize: 8, letterSpacing: 1 },
  logBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  logBtnTxt: { fontSize: 9, letterSpacing: 3 },

  // Idle
  idleContent: { paddingTop: 24 },
  sectionLabel: {
    fontSize: 9, letterSpacing: 2,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  trailList: { paddingHorizontal: 20, gap: 14 },
});
