import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';
import { useTrails } from '../hooks/useTrails';
import { useUserSearch } from '../hooks/useUsers';
import TrailCard from './discover/TrailCard';
import TrailDetailSheet from './discover/TrailDetailSheet';
import { fonts } from '../theme/tokens';

type Tab = 'trails' | 'people';

const TRAIL_CATEGORIES = [
  { key: 'all',         label: 'ALL' },
  { key: 'adaptation',  label: 'ADAPTATIONS' },
  { key: 'influence',   label: 'INFLUENCE' },
  { key: 'mood',        label: 'MOOD' },
  { key: 'context',     label: 'CONTEXT' },
  { key: 'creator',     label: 'CREATOR' },
];

export default function TrailsScreen() {
  const { colors } = useThemeStore();
  const [tab, setTab] = useState<Tab>('trails');
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { trails, loading: trailsLoading, refetch } = useTrails();
  const { results: people, loading: peopleLoading, search, toggleFollow } = useUserSearch();
  const [query, setQuery] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSearchChange = (text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => search(text), 400);
  };

  const filteredTrails = categoryFilter === 'all'
    ? trails
    : trails.filter((t: any) => t.category === categoryFilter);

  const selectedTrail = trails.find((t: any) => t.id === selectedTrailId) ?? null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.watermark, { color: colors.ink, fontFamily: fonts.display }]}>TRAILS</Text>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.heading, { color: colors.ink, fontFamily: fonts.display }]}>TRAILS</Text>
          <Text style={[styles.headingSub, { color: colors.ink3, fontFamily: fonts.mono }]}>
            CROSS-MEDIA CULTURAL JOURNEYS
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(['trails', 'people'] as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={styles.tab} onPress={() => setTab(t)} activeOpacity={0.7}>
            <Text style={[styles.tabText, {
              color: tab === t ? colors.accent : colors.ink3,
              fontFamily: fonts.mono,
            }]}>
              {t.toUpperCase()}
            </Text>
            {tab === t && <View style={[styles.tabLine, { backgroundColor: colors.accent }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'trails' ? (
        <>
          {/* Category filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.categoryScroll, { borderBottomColor: colors.border }]}
            contentContainerStyle={styles.categoryContent}
          >
            {TRAIL_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.categoryChip, {
                  borderColor: categoryFilter === c.key ? colors.editorial : colors.border2,
                  backgroundColor: categoryFilter === c.key ? `${colors.editorial}18` : 'transparent',
                }]}
                onPress={() => setCategoryFilter(c.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryChipText, {
                  color: categoryFilter === c.key ? colors.editorial : colors.ink3,
                  fontFamily: fonts.mono,
                }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Trails list */}
          {trailsLoading ? (
            <View style={styles.loader}><ActivityIndicator color={colors.accent} /></View>
          ) : filteredTrails.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.ink, fontFamily: fonts.display }]}>
                {trails.length === 0 ? 'NO TRAILS YET' : 'NONE IN THIS CATEGORY'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.body }]}>
                {trails.length === 0
                  ? 'Editorial trails are being curated. Check back soon.'
                  : 'Try a different category filter above.'}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
            >
              {/* In progress section */}
              {trails.filter((t: any) => t.joined && !t.completed_at).length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.streak, fontFamily: fonts.mono }]}>
                    IN PROGRESS
                  </Text>
                  {trails
                    .filter((t: any) => t.joined && !t.completed_at)
                    .map((trail: any) => (
                      <TrailCard
                        key={trail.id}
                        trail={trail}
                        onPress={() => setSelectedTrailId(trail.id)}
                      />
                    ))}
                </View>
              )}

              {/* All trails */}
              <View style={styles.section}>
                {trails.filter((t: any) => t.completed_at).length > 0 && (
                  <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>
                    COMPLETED
                  </Text>
                )}
                {filteredTrails
                  .filter((t: any) => !t.joined || t.completed_at)
                  .map((trail: any) => (
                    <TrailCard
                      key={trail.id}
                      trail={trail}
                      onPress={() => setSelectedTrailId(trail.id)}
                    />
                  ))}
              </View>

              <View style={{ height: 48 }} />
            </ScrollView>
          )}
        </>
      ) : (
        /* People tab */
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.searchBox, { backgroundColor: colors.bg2, borderColor: colors.border2 }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.ink, fontFamily: fonts.ui }]}
              placeholder="Find people by name or handle…"
              placeholderTextColor={colors.ink3}
              value={query}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
            />
            {peopleLoading && <ActivityIndicator size="small" color={colors.ink3} />}
          </View>

          {query.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.ink, fontFamily: fonts.display }]}>FIND PEOPLE</Text>
              <Text style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.body }]}>
                Search by name or @handle to follow readers, watchers, and listeners.
              </Text>
            </View>
          ) : people.length === 0 && !peopleLoading ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.ink, fontFamily: fonts.display }]}>NO RESULTS</Text>
              <Text style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.body }]}>
                No one found for "{query}".
              </Text>
            </View>
          ) : (
            people.map((person: any) => (
              <View key={person.id} style={[styles.personRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.personAvatar, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.personInitial, { color: colors.accentt, fontFamily: fonts.display }]}>
                    {(person.name ?? person.handle ?? '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.personInfo}>
                  <Text style={[styles.personName, { color: colors.ink, fontFamily: fonts.display }]}>
                    {person.name ?? '—'}
                  </Text>
                  <Text style={[styles.personHandle, { color: colors.ink3, fontFamily: fonts.mono }]}>
                    @{person.handle ?? '—'}
                  </Text>
                  {person.bio && (
                    <Text style={[styles.personBio, { color: colors.ink2, fontFamily: fonts.ui }]} numberOfLines={1}>
                      {person.bio}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.followBtn, {
                    borderColor: person.isFollowing ? colors.streak : colors.accent,
                    backgroundColor: person.isFollowing ? `${colors.streak}18` : 'transparent',
                  }]}
                  onPress={() => toggleFollow(person.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.followBtnText, {
                    color: person.isFollowing ? colors.streak : colors.accent,
                    fontFamily: fonts.mono,
                  }]}>
                    {person.isFollowing ? 'FOLLOWING' : 'FOLLOW'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          <View style={{ height: 48 }} />
        </ScrollView>
      )}

      {/* Trail detail sheet */}
      {selectedTrail && (
        <TrailDetailSheet
          trailId={selectedTrailId!}
          onClose={() => setSelectedTrailId(null)}
        />
      )}
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
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 14,
    borderBottomWidth: 1,
  },
  heading: { fontSize: 32, letterSpacing: 4 },
  headingSub: { fontSize: 9, letterSpacing: 2, marginTop: 2 },
  tabs: {
    flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 24,
  },
  tab: { paddingHorizontal: 16, paddingVertical: 12, position: 'relative', alignItems: 'center' },
  tabText: { fontSize: 11, letterSpacing: 1.5 },
  tabLine: { position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 2 },

  categoryScroll: { borderBottomWidth: 1, maxHeight: 40 },
  categoryContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 6, paddingVertical: 6 },
  categoryChip: { borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3, borderRadius: 2 },
  categoryChipText: { fontSize: 9, letterSpacing: 1.5 },

  scroll: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { paddingTop: 16 },
  sectionLabel: { fontSize: 9, letterSpacing: 2, paddingHorizontal: 24, paddingBottom: 10 },

  empty: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 40, gap: 14 },
  emptyTitle: { fontSize: 26, letterSpacing: 4, textAlign: 'center' },
  emptyText: { fontSize: 15, fontStyle: 'italic', textAlign: 'center', lineHeight: 22 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, margin: 20, paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15 },

  personRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14,
    borderBottomWidth: 1, gap: 14,
  },
  personAvatar: { width: 40, height: 40, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  personInitial: { fontSize: 20 },
  personInfo: { flex: 1, gap: 2 },
  personName: { fontSize: 16, letterSpacing: 1 },
  personHandle: { fontSize: 10, letterSpacing: 1 },
  personBio: { fontSize: 13, marginTop: 2 },
  followBtn: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  followBtnText: { fontSize: 9, letterSpacing: 1.5 },
});
