import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';
import { useTrails } from '../hooks/useTrails';
import { useUserSearch } from '../hooks/useUsers';
import TrailCard from './discover/TrailCard';
import TrailDetailSheet from './discover/TrailDetailSheet';
import { fonts } from '../theme/tokens';

type Tab = 'trails' | 'people';

export default function DiscoverScreen() {
  const { colors } = useThemeStore();
  const [tab, setTab] = useState<Tab>('trails');
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Watermark */}
      <Text style={[styles.watermark, { color: colors.ink, fontFamily: fonts.display }]}>DISCOVER</Text>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.heading, { color: colors.ink, fontFamily: fonts.display }]}>DISCOVER</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {(['trails', 'people'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={styles.tab}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
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

      {/* ── TRAILS ── */}
      {tab === 'trails' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          showsVerticalScrollIndicator={false}
        >
          {trailsLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 60 }} />
          ) : trails.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.body }]}>
                No trails yet.{'\n'}Run seed_trails.sql in your Supabase SQL Editor to add some.
              </Text>
            </View>
          ) : (
            <>
              {/* Joined trails first */}
              {trails.filter((t) => t.joined && !t.completed_at).length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.editorial, fontFamily: fonts.mono }]}>
                    IN PROGRESS
                  </Text>
                  {trails
                    .filter((t) => t.joined && !t.completed_at)
                    .map((trail) => (
                      <TrailCard key={trail.id} trail={trail} onPress={() => setSelectedTrailId(trail.id)} />
                    ))}
                </View>
              )}

              {/* Completed */}
              {trails.filter((t) => t.completed_at).length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.streak, fontFamily: fonts.mono }]}>
                    COMPLETED
                  </Text>
                  {trails
                    .filter((t) => t.completed_at)
                    .map((trail) => (
                      <TrailCard key={trail.id} trail={trail} onPress={() => setSelectedTrailId(trail.id)} />
                    ))}
                </View>
              )}

              {/* All trails */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>
                  ALL TRAILS
                </Text>
                {trails
                  .filter((t) => !t.joined)
                  .map((trail) => (
                    <TrailCard key={trail.id} trail={trail} onPress={() => setSelectedTrailId(trail.id)} />
                  ))}
              </View>
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── PEOPLE ── */}
      {tab === 'people' && (
        <View style={styles.peopleContainer}>
          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: colors.bg3, borderColor: colors.border2, borderBottomColor: colors.border }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.ink, fontFamily: fonts.mono }]}
              placeholder="Search by name or @handle…"
              placeholderTextColor={colors.ink3}
              value={query}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {peopleLoading && <ActivityIndicator size="small" color={colors.ink3} />}
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {query.length === 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.body }]}>
                  Search for people by name or handle to follow them.
                </Text>
              </View>
            ) : people.length === 0 && !peopleLoading ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.ink3, fontFamily: fonts.body }]}>
                  No one found for "{query}".
                </Text>
              </View>
            ) : (
              people.map((person) => (
                <View
                  key={person.id}
                  style={[styles.personRow, { borderBottomColor: colors.border }]}
                >
                  {/* Avatar */}
                  <View style={[styles.personAvatar, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.personInitial, { color: colors.accentt, fontFamily: fonts.display }]}>
                      {(person.name ?? person.handle ?? '?')[0].toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.personInfo}>
                    <Text style={[styles.personName, { color: colors.ink, fontFamily: fonts.display }]}>
                      {(person.name ?? person.handle ?? 'Unknown').toUpperCase()}
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
                    style={[
                      styles.followBtn,
                      {
                        backgroundColor: person.isFollowing ? 'transparent' : colors.accent,
                        borderColor: person.isFollowing ? colors.border2 : colors.accent,
                      }
                    ]}
                    onPress={() => toggleFollow(person.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.followBtnText, {
                      color: person.isFollowing ? colors.ink3 : colors.accentt,
                      fontFamily: fonts.mono,
                    }]}>
                      {person.isFollowing ? 'FOLLOWING' : 'FOLLOW'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}

      {/* Trail detail modal */}
      {selectedTrailId && (
        <TrailDetailSheet
          trailId={selectedTrailId}
          onClose={() => setSelectedTrailId(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  watermark: {
    position: 'absolute',
    fontSize: 120,
    opacity: 0.03,
    bottom: -10,
    right: -10,
    letterSpacing: 6,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  heading: { fontSize: 32, letterSpacing: 4 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 24,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
    alignItems: 'center',
  },
  tabText: { fontSize: 11, letterSpacing: 2 },
  tabLine: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: 2,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, gap: 0 },
  section: { gap: 12, marginBottom: 28 },
  sectionLabel: { fontSize: 9, letterSpacing: 2 },
  empty: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  peopleContainer: { flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, letterSpacing: 0.5 },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personInitial: { fontSize: 20, letterSpacing: 0 },
  personInfo: { flex: 1, gap: 2 },
  personName: { fontSize: 16, letterSpacing: 1 },
  personHandle: { fontSize: 10, letterSpacing: 1 },
  personBio: { fontSize: 12, fontStyle: 'italic' },
  followBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  followBtnText: { fontSize: 9, letterSpacing: 1.5 },
});
