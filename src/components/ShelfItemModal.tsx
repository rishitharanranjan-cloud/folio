import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Modal, ScrollView, Animated, Dimensions, TextInput,
  ActivityIndicator, FlatList,
} from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { fonts } from '../theme/tokens';
import { clampAmbient, hexToRgb, ambientToHex, getAmbientColour } from '../lib/ambientColour';
import { updateLog } from '../hooks/useLogs';
import * as haptics from '../lib/haptics';
import type { LogEntry } from '../hooks/useLogs';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.88;

const TMDB_KEY  = process.env.EXPO_PUBLIC_TMDB_KEY ?? '';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG  = (size: string, path: string) => `https://image.tmdb.org/t/p/${size}${path}`;

const STATUS_OPTIONS = [
  { key: 'finished',   label: 'DONE' },
  { key: 'in_progress', label: 'IN PROGRESS' },
  { key: 'dropped',    label: 'DROPPED' },
  { key: 'abandoned',  label: 'ABANDONED' },
];

const MEDIA_LABEL: Record<string, string> = {
  book: 'BOOK', film: 'FILM', tv: 'TV', album: 'ALBUM', podcast: 'PODCAST', game: 'GAME',
};

type Tab = 'details' | 'cast' | 'similar' | 'notes';

interface TMDBDetail {
  overview: string;
  genres: { name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  tagline?: string;
  vote_average?: number;
  number_of_seasons?: number;
}

interface CastMember {
  id: number;
  name: string;
  character?: string;
  job?: string;
  profile_path: string | null;
}

interface SimilarItem {
  id: number;
  title: string;
  poster_path: string | null;
  year: number | null;
}

interface OLDetail {
  description: string | null;
  subjects: string[];
}

interface Props {
  log: LogEntry | null;
  onClose: () => void;
  onUpdated?: (id: string, changes: Partial<LogEntry>) => void;
}

export default function ShelfItemModal({ log, onClose, onUpdated }: Props) {
  const { colors, mode } = useThemeStore();
  const isDark = mode === 'dark';
  const slideY = useRef(new Animated.Value(SHEET_H)).current;
  const bgO    = useRef(new Animated.Value(0)).current;

  const lastLog = useRef<LogEntry | null>(null);
  useEffect(() => { if (log) lastLog.current = log; }, [log]);
  const displayLog = log ?? lastLog.current;

  // Tab
  const [tab, setTab] = useState<Tab>('details');

  // Edit state (Notes tab)
  const [editing, setEditing]         = useState(false);
  const [draftRating, setDraftRating] = useState<number | null>(null);
  const [draftReview, setDraftReview] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);

  // Enrichment state
  const [tmdbDetail, setTmdbDetail]   = useState<TMDBDetail | null>(null);
  const [cast, setCast]               = useState<CastMember[]>([]);
  const [similar, setSimilar]         = useState<SimilarItem[]>([]);
  const [olDetail, setOlDetail]       = useState<OLDetail | null>(null);
  const [enrichLoading, setEnrichLoading] = useState(false);

  useEffect(() => {
    if (log) {
      setTab('details');
      setEditing(false);
      setDraftRating(log.rating);
      setDraftReview(log.review ?? '');
      setDraftStatus(log.status ?? 'finished');
      setSaveError(null);
      setTmdbDetail(null);
      setCast([]);
      setSimilar([]);
      setOlDetail(null);
      fetchEnrichment(log);
    }
  }, [log?.id]);

  useEffect(() => {
    if (log) {
      Animated.parallel([
        Animated.timing(bgO,    { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(slideY, { toValue: 0, damping: 22, stiffness: 260, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(bgO,    { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: SHEET_H, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [log]);

  const fetchEnrichment = async (entry: LogEntry) => {
    if (!entry.external_id) return;
    setEnrichLoading(true);
    try {
      if (entry.media_type === 'film' || entry.media_type === 'tv') {
        await fetchTMDB(entry.media_type, entry.external_id);
      } else if (entry.media_type === 'book') {
        await fetchOL(entry.external_id);
      }
    } catch (_) {}
    setEnrichLoading(false);
  };

  const fetchTMDB = async (type: string, id: string) => {
    const ep = type === 'film' ? 'movie' : 'tv';
    const key = `api_key=${TMDB_KEY}`;

    const [detailRes, creditsRes, similarRes] = await Promise.all([
      fetch(`${TMDB_BASE}/${ep}/${id}?${key}`),
      fetch(`${TMDB_BASE}/${ep}/${id}/credits?${key}`),
      fetch(`${TMDB_BASE}/${ep}/${id}/similar?${key}`),
    ]);

    if (detailRes.ok) setTmdbDetail(await detailRes.json());

    if (creditsRes.ok) {
      const data = await creditsRes.json();
      const castList: CastMember[] = (data.cast ?? []).slice(0, 12).map((c: any) => ({
        id: c.id, name: c.name, character: c.character, profile_path: c.profile_path ?? null,
      }));
      // For TV add key crew
      const crew: CastMember[] = (data.crew ?? [])
        .filter((c: any) => ['Director', 'Creator'].includes(c.job))
        .slice(0, 3)
        .map((c: any) => ({
          id: c.id, name: c.name, job: c.job, profile_path: c.profile_path ?? null,
        }));
      setCast([...crew, ...castList]);
    }

    if (similarRes.ok) {
      const data = await similarRes.json();
      const list: SimilarItem[] = (data.results ?? []).slice(0, 8).map((r: any) => ({
        id: r.id,
        title: r.title ?? r.name ?? '',
        poster_path: r.poster_path ?? null,
        year: r.release_date ? parseInt(r.release_date) : r.first_air_date ? parseInt(r.first_air_date) : null,
      }));
      setSimilar(list);
    }
  };

  const fetchOL = async (key: string) => {
    // key is like /works/OL12345W
    const res = await fetch(`https://openlibrary.org${key}.json`);
    if (!res.ok) return;
    const data = await res.json();
    const desc = typeof data.description === 'string'
      ? data.description
      : data.description?.value ?? null;
    setOlDetail({
      description: desc,
      subjects: (data.subjects ?? []).slice(0, 8),
    });
  };

  if (!displayLog) return null;

  const rawRgb   = displayLog.dominant_colour ? hexToRgb(displayLog.dominant_colour) : null;
  const clamped  = rawRgb ? clampAmbient(rawRgb, isDark) : null;
  const accentHex = clamped
    ? ambientToHex(clamped)
    : ambientToHex(clampAmbient(getAmbientColour(displayLog.title), isDark));

  const accentRgb  = hexToRgb(accentHex);
  const accentFill = accentRgb
    ? `rgba(${accentRgb[0]},${accentRgb[1]},${accentRgb[2]},0.12)`
    : colors.accentg;

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const changes = {
        rating: draftRating,
        review: draftReview.trim() || null,
        status: draftStatus,
      };
      await updateLog(displayLog.id, changes);
      haptics.success();
      onUpdated?.(displayLog.id, changes);
      lastLog.current = { ...displayLog, ...changes };
      setEditing(false);
    } catch (e: any) {
      haptics.warn();
      setSaveError(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'details',  label: 'DETAILS' },
    { key: 'cast',     label: 'CAST' },
    { key: 'similar',  label: 'SIMILAR' },
    { key: 'notes',    label: 'MY LOG' },
  ];

  // ── Tab content ─────────────────────────────────────────────────────────────

  const DetailsTab = () => {
    const runtime = tmdbDetail?.runtime
      ? `${Math.floor(tmdbDetail.runtime / 60)}h ${tmdbDetail.runtime % 60}m`
      : tmdbDetail?.episode_run_time?.[0]
      ? `~${tmdbDetail.episode_run_time[0]}m / ep`
      : null;

    const seasons = tmdbDetail?.number_of_seasons
      ? `${tmdbDetail.number_of_seasons} season${tmdbDetail.number_of_seasons > 1 ? 's' : ''}`
      : null;

    const genres = (tmdbDetail?.genres ?? []).map(g => g.name).join(' · ');
    const overview = tmdbDetail?.overview || olDetail?.description;

    return (
      <View style={styles.tabContent}>
        {enrichLoading && !overview && (
          <ActivityIndicator color={accentHex} style={{ marginTop: 20 }} />
        )}

        {tmdbDetail?.tagline ? (
          <Text style={[styles.tagline, { color: accentHex, fontFamily: fonts.body }]}>
            "{tmdbDetail.tagline}"
          </Text>
        ) : null}

        {genres ? (
          <Text style={[styles.genres, { color: colors.ink3, fontFamily: fonts.mono }]}>
            {genres.toUpperCase()}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {runtime && (
            <View style={[styles.metaChip, { borderColor: colors.border2 }]}>
              <Text style={[styles.metaChipTxt, { color: colors.ink3, fontFamily: fonts.mono }]}>
                {runtime.toUpperCase()}
              </Text>
            </View>
          )}
          {seasons && (
            <View style={[styles.metaChip, { borderColor: colors.border2 }]}>
              <Text style={[styles.metaChipTxt, { color: colors.ink3, fontFamily: fonts.mono }]}>
                {seasons.toUpperCase()}
              </Text>
            </View>
          )}
          {displayLog.year && (
            <View style={[styles.metaChip, { borderColor: colors.border2 }]}>
              <Text style={[styles.metaChipTxt, { color: colors.ink3, fontFamily: fonts.mono }]}>
                {displayLog.year}
              </Text>
            </View>
          )}
        </View>

        {overview ? (
          <Text style={[styles.overview, { color: colors.ink2, fontFamily: fonts.body }]}>
            {overview}
          </Text>
        ) : !enrichLoading && !displayLog.external_id ? (
          <Text style={[styles.emptyNote, { color: colors.ink3, fontFamily: fonts.mono }]}>
            NO EXTRA DATA — ITEM WAS LOGGED MANUALLY
          </Text>
        ) : !enrichLoading ? (
          <Text style={[styles.emptyNote, { color: colors.ink3, fontFamily: fonts.mono }]}>
            NO SYNOPSIS AVAILABLE
          </Text>
        ) : null}

        {(olDetail?.subjects?.length ?? 0) > 0 && (
          <View style={styles.subjects}>
            {olDetail!.subjects.map((s, i) => (
              <View key={i} style={[styles.subjectChip, { borderColor: colors.border2, backgroundColor: colors.bg3 }]}>
                <Text style={[styles.subjectTxt, { color: colors.ink3, fontFamily: fonts.mono }]}>
                  {s.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const CastTab = () => {
    const isFilmOrTV = displayLog.media_type === 'film' || displayLog.media_type === 'tv';

    if (!isFilmOrTV) {
      return (
        <View style={[styles.tabContent, styles.centred]}>
          <Text style={[styles.emptyNote, { color: colors.ink3, fontFamily: fonts.mono }]}>
            CAST DATA IS AVAILABLE FOR FILMS AND TV ONLY
          </Text>
        </View>
      );
    }

    if (enrichLoading && cast.length === 0) {
      return (
        <View style={[styles.tabContent, styles.centred]}>
          <ActivityIndicator color={accentHex} />
        </View>
      );
    }

    if (cast.length === 0) {
      return (
        <View style={[styles.tabContent, styles.centred]}>
          <Text style={[styles.emptyNote, { color: colors.ink3, fontFamily: fonts.mono }]}>
            NO CAST DATA AVAILABLE
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        {cast.map((member) => (
          <View key={`${member.id}-${member.character ?? member.job}`} style={styles.castRow}>
            {member.profile_path ? (
              <Image
                source={{ uri: TMDB_IMG('w92', member.profile_path) }}
                style={[styles.castThumb, { borderColor: colors.border }]}
              />
            ) : (
              <View style={[styles.castThumb, styles.castThumbPlaceholder, { backgroundColor: accentFill, borderColor: accentHex }]}>
                <Text style={[styles.castInitial, { color: accentHex, fontFamily: fonts.mono }]}>
                  {member.name[0]}
                </Text>
              </View>
            )}
            <View style={styles.castMeta}>
              <Text style={[styles.castName, { color: colors.ink, fontFamily: fonts.body }]}>
                {member.name}
              </Text>
              {(member.character || member.job) && (
                <Text style={[styles.castRole, { color: colors.ink3, fontFamily: fonts.mono }]}>
                  {(member.character || member.job)!.toUpperCase()}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const SimilarTab = () => {
    const isFilmOrTV = displayLog.media_type === 'film' || displayLog.media_type === 'tv';

    if (!isFilmOrTV) {
      return (
        <View style={[styles.tabContent, styles.centred]}>
          <Text style={[styles.emptyNote, { color: colors.ink3, fontFamily: fonts.mono }]}>
            SIMILAR TITLES AVAILABLE FOR FILMS AND TV ONLY
          </Text>
        </View>
      );
    }

    if (enrichLoading && similar.length === 0) {
      return (
        <View style={[styles.tabContent, styles.centred]}>
          <ActivityIndicator color={accentHex} />
        </View>
      );
    }

    if (similar.length === 0) {
      return (
        <View style={[styles.tabContent, styles.centred]}>
          <Text style={[styles.emptyNote, { color: colors.ink3, fontFamily: fonts.mono }]}>
            NO SIMILAR TITLES FOUND
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>
          YOU MIGHT ALSO LIKE
        </Text>
        <View style={styles.similarGrid}>
          {similar.map((item) => (
            <View key={item.id} style={styles.similarItem}>
              {item.poster_path ? (
                <Image
                  source={{ uri: TMDB_IMG('w185', item.poster_path) }}
                  style={[styles.similarPoster, { borderColor: colors.border }]}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.similarPoster, styles.similarPosterPlaceholder, { backgroundColor: accentFill, borderColor: accentHex }]}>
                  <Text style={[styles.similarInitial, { color: accentHex, fontFamily: fonts.mono }]}>
                    {item.title.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={[styles.similarTitle, { color: colors.ink2, fontFamily: fonts.mono }]} numberOfLines={2}>
                {item.title.toUpperCase()}
              </Text>
              {item.year && (
                <Text style={[styles.similarYear, { color: colors.ink3, fontFamily: fonts.mono }]}>
                  {item.year}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const NotesTab = () => {
    const viewRating = editing ? draftRating  : displayLog.rating;
    const viewReview = editing ? draftReview  : (displayLog.review ?? '');
    const viewStatus = editing ? draftStatus  : (displayLog.status ?? 'finished');

    return (
      <View style={styles.tabContent}>
        {/* Rating */}
        <View style={styles.notesSection}>
          <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>RATING</Text>
          <View style={styles.ratingRow}>
            {[1,2,3,4,5].map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => { if (!editing) return; haptics.tapLight(); setDraftRating(draftRating === s ? null : s); }}
                activeOpacity={editing ? 0.6 : 1}
                disabled={!editing}
              >
                <Text style={[styles.star, {
                  color: (viewRating ?? 0) >= s ? accentHex : colors.border2,
                  fontSize: editing ? 28 : 24,
                }]}>★</Text>
              </TouchableOpacity>
            ))}
            {editing && viewRating && (
              <TouchableOpacity onPress={() => setDraftRating(null)} activeOpacity={0.6} style={{ marginLeft: 4 }}>
                <Text style={[styles.clearRating, { color: colors.ink3, fontFamily: fonts.mono }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Status */}
        <View style={styles.notesSection}>
          <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>STATUS</Text>
          {editing ? (
            <View style={styles.statusChips}>
              {STATUS_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.statusChip, {
                    borderColor: viewStatus === opt.key ? accentHex : colors.border2,
                    backgroundColor: viewStatus === opt.key ? accentFill : 'transparent',
                  }]}
                  onPress={() => setDraftStatus(opt.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statusChipTxt, {
                    color: viewStatus === opt.key ? accentHex : colors.ink3,
                    fontFamily: fonts.mono,
                  }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.statusPill, { backgroundColor: accentFill, borderColor: accentHex }]}>
              <Text style={[styles.statusText, { color: accentHex, fontFamily: fonts.mono }]}>
                {STATUS_OPTIONS.find(o => o.key === viewStatus)?.label ?? viewStatus.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Review */}
        <View style={styles.notesSection}>
          <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>REVIEW</Text>
          {editing ? (
            <TextInput
              style={[styles.reviewInput, {
                color: colors.ink,
                fontFamily: fonts.body,
                borderColor: colors.border2,
                backgroundColor: colors.bg3,
              }]}
              value={draftReview}
              onChangeText={setDraftReview}
              placeholder="Write a review…"
              placeholderTextColor={colors.ink3}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          ) : viewReview ? (
            <View style={[styles.reviewBox, { borderColor: colors.border, backgroundColor: colors.bg3 }]}>
              <Text style={[styles.quoteGlyph, { color: accentHex, fontFamily: fonts.display }]}>"</Text>
              <Text style={[styles.reviewText, { color: colors.ink2, fontFamily: fonts.body }]}>
                {viewReview}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => { haptics.tapLight(); setEditing(true); }}
              activeOpacity={0.7}
              style={[styles.addReviewBtn, { borderColor: colors.border2 }]}
            >
              <Text style={[styles.addReviewTxt, { color: colors.ink3, fontFamily: fonts.mono }]}>
                + ADD REVIEW
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date */}
        <Text style={[styles.date, { color: colors.ink3, fontFamily: fonts.mono }]}>
          LOGGED {new Date(displayLog.logged_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
          }).toUpperCase()}
        </Text>

        {saveError && (
          <Text style={[styles.errorText, { color: colors.terra, fontFamily: fonts.mono }]}>
            {saveError}
          </Text>
        )}
      </View>
    );
  };

  return (
    <Modal transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Scrim */}
      <Animated.View style={[styles.scrim, { opacity: bgO }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[
        styles.sheet,
        { backgroundColor: colors.bg2, transform: [{ translateY: slideY }] },
      ]}>
        {/* Accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accentHex }]} />

        {/* Handle */}
        <View style={styles.topBar}>
          <View style={[styles.handle, { backgroundColor: colors.border2 }]} />
        </View>

        {/* Cover + title row — always visible */}
        <View style={[styles.heroRow, { borderBottomColor: colors.border }]}>
          {displayLog.cover_url ? (
            <Image source={{ uri: displayLog.cover_url }} style={[styles.cover, { borderColor: colors.border }]} resizeMode="cover" />
          ) : (
            <View style={[styles.cover, { backgroundColor: accentFill, borderColor: accentHex }]}>
              <Text style={[styles.coverFallback, { color: accentHex, fontFamily: fonts.mono }]}>
                {displayLog.title.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.heroMeta}>
            <View style={[styles.typePill, { backgroundColor: accentFill, borderColor: accentHex }]}>
              <Text style={[styles.typeText, { color: accentHex, fontFamily: fonts.mono }]}>
                {MEDIA_LABEL[displayLog.media_type] ?? displayLog.media_type.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.title, { color: colors.ink, fontFamily: fonts.display }]} numberOfLines={3}>
              {displayLog.title.toUpperCase()}
            </Text>
            {displayLog.creator && (
              <Text style={[styles.creator, { color: colors.ink2, fontFamily: fonts.body }]}>
                {displayLog.creator}
              </Text>
            )}
          </View>
        </View>

        {/* Tab bar */}
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabItem, tab === t.key && { borderBottomColor: accentHex, borderBottomWidth: 2 }]}
              onPress={() => { haptics.tapLight(); setTab(t.key); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, {
                color: tab === t.key ? accentHex : colors.ink3,
                fontFamily: fonts.mono,
              }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {tab === 'details'  && <DetailsTab />}
          {tab === 'cast'     && <CastTab />}
          {tab === 'similar'  && <SimilarTab />}
          {tab === 'notes'    && <NotesTab />}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          {tab === 'notes' ? (
            editing ? (
              <View style={styles.footerRow}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border2 }]}
                  onPress={() => { setEditing(false); setSaveError(null); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelTxt, { color: colors.ink3, fontFamily: fonts.mono }]}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: accentHex, flex: 1 }]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving
                    ? <ActivityIndicator color={colors.bg} size="small" />
                    : <Text style={[styles.saveTxt, { color: colors.bg, fontFamily: fonts.mono }]}>SAVE CHANGES</Text>
                  }
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.editBtn, { borderColor: accentHex, backgroundColor: accentFill }]}
                onPress={() => { haptics.tapLight(); setEditing(true); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.editTxt, { color: accentHex, fontFamily: fonts.mono }]}>EDIT LOG</Text>
              </TouchableOpacity>
            )
          ) : (
            <TouchableOpacity
              style={[styles.closeBtn, { borderColor: colors.border2 }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeTxt, { color: colors.ink3, fontFamily: fonts.mono }]}>CLOSE</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: SHEET_H,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    overflow: 'hidden',
  },
  accentBar: { height: 3, width: '100%' },
  topBar: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: { width: 40, height: 3, borderRadius: 2 },

  // Hero row
  heroRow: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  cover: {
    width: 72, height: 100,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  coverFallback: { fontSize: 20, letterSpacing: 2 },
  heroMeta: { flex: 1, gap: 6, justifyContent: 'center' },
  typePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  typeText: { fontSize: 7, letterSpacing: 2 },
  title: { fontSize: 18, letterSpacing: 2, lineHeight: 22 },
  creator: { fontSize: 13, fontStyle: 'italic' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: { fontSize: 8, letterSpacing: 1.5 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },

  // Tab content wrapper
  tabContent: { padding: 20, gap: 16 },
  centred: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },

  // Details tab
  tagline: { fontSize: 15, fontStyle: 'italic', lineHeight: 22 },
  genres: { fontSize: 8, letterSpacing: 2, marginTop: -4 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaChip: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  metaChipTxt: { fontSize: 8, letterSpacing: 1.5 },
  overview: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  emptyNote: { fontSize: 9, letterSpacing: 1.5, textAlign: 'center' },
  subjects: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subjectChip: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  subjectTxt: { fontSize: 7, letterSpacing: 1 },
  sectionLabel: { fontSize: 8, letterSpacing: 2, marginBottom: 2 },

  // Cast tab
  castRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  castThumb: {
    width: 44, height: 44,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  castThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  castInitial: { fontSize: 16, letterSpacing: 1 },
  castMeta: { flex: 1, gap: 2 },
  castName: { fontSize: 14, lineHeight: 18 },
  castRole: { fontSize: 8, letterSpacing: 1.5 },

  // Similar tab
  similarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  similarItem: { width: '22%', gap: 4 },
  similarPoster: {
    width: '100%',
    aspectRatio: 2/3,
    borderWidth: 1,
    overflow: 'hidden',
  },
  similarPosterPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  similarInitial: { fontSize: 14, letterSpacing: 1 },
  similarTitle: { fontSize: 7, letterSpacing: 0.5, lineHeight: 10 },
  similarYear: { fontSize: 7, letterSpacing: 0.5 },

  // Notes tab
  notesSection: { gap: 8 },
  ratingRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  star: { lineHeight: 32 },
  clearRating: { fontSize: 10, lineHeight: 32 },
  statusChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statusChip: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  statusChipTxt: { fontSize: 8, letterSpacing: 1.5 },
  statusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  statusText: { fontSize: 8, letterSpacing: 1.5 },
  reviewBox: { borderWidth: 1, padding: 14, gap: 4 },
  quoteGlyph: { fontSize: 28, lineHeight: 22 },
  reviewText: { fontSize: 14, fontStyle: 'italic', lineHeight: 22 },
  reviewInput: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
    minHeight: 100,
  },
  addReviewBtn: {
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addReviewTxt: { fontSize: 9, letterSpacing: 2 },
  date: { fontSize: 9, letterSpacing: 1.5 },
  errorText: { fontSize: 10, letterSpacing: 1 },

  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerRow: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  cancelTxt: { fontSize: 9, letterSpacing: 2 },
  saveBtn: { paddingVertical: 14, alignItems: 'center' },
  saveTxt: { fontSize: 11, letterSpacing: 3 },
  editBtn: {
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editTxt: { fontSize: 11, letterSpacing: 3 },
  closeBtn: {
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeTxt: { fontSize: 11, letterSpacing: 3 },
});
