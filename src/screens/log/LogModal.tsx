import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { searchMedia, buildManualEntry, type MediaType, type SearchResult } from '../../lib/mediaSearch';
import { getAmbientColour, clampAmbient, ambientToRgb, ambientToHex } from '../../lib/ambientColour';
import * as haptics from '../../lib/haptics';
import { checkTrailCompletion } from '../../lib/trailCompletion';
import { fonts } from '../../theme/tokens';

const { height: SCREEN_H } = Dimensions.get('window');

const MEDIA_TYPES: { key: MediaType; label: string }[] = [
  { key: 'book',    label: 'BOOK'    },
  { key: 'film',    label: 'FILM'    },
  { key: 'tv',      label: 'TV'      },
  { key: 'album',   label: 'ALBUM'   },
  { key: 'podcast', label: 'PODCAST' },
  { key: 'game',    label: 'GAME'    },
];

const STATUS_OPTIONS = [
  { key: 'finished',  label: 'FINISHED'   },
  { key: 'current',   label: 'CURRENTLY'  },
  { key: 'want',      label: 'WANT TO'    },
  { key: 'abandoned', label: 'ABANDONED'  },
];

interface Props {
  onClose: () => void;
  onLogged: (item: SearchResult, rating: number, review?: string, completedTrail?: { id: string; title: string }) => void;
  initialItem?: SearchResult;
}

export default function LogModal({ onClose, onLogged, initialItem }: Props) {
  const { colors, mode } = useThemeStore();
  const { user } = useAuthStore();

  const [mediaType, setMediaType] = useState<MediaType>(initialItem?.mediaType ?? 'film');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(initialItem ?? null);
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState('finished');
  const [review, setReview] = useState('');
  const [consumedDate, setConsumedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualCreator, setManualCreator] = useState('');
  const [manualYear, setManualYear] = useState('');

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ambient colour based on selected item — clamped for UI chrome
  const ambientRaw = selected ? getAmbientColour(selected.title) : null;
  const ambientRgb = ambientRaw ? clampAmbient(ambientRaw, mode === 'dark') : null;
  const accentColour = ambientRgb ? ambientToRgb(ambientRgb) : colors.accent;
  const glowColour   = ambientRgb ? ambientToRgb(ambientRgb, 0.18) : 'transparent';

  // Animate glow opacity
  const glowOpacity = useSharedValue(0);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  const handleSelectItem = (item: SearchResult) => {
    setSelected(item);
    setResults([]);
    setQuery(item.title);
    glowOpacity.value = withTiming(1, { duration: 400 });
    haptics.tapMedium();
  };

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    setSelected(null);
    glowOpacity.value = withTiming(0, { duration: 200 });
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchMedia(text, mediaType);
      setResults(res);
      setSearching(false);
    }, 400);
  }, [mediaType]);

  const handleMediaTypeChange = (type: MediaType) => {
    setMediaType(type);
    setSelected(null);
    setResults([]);
    setQuery('');
    setShowManual(false);
    setManualTitle('');
    setManualCreator('');
    setManualYear('');
    glowOpacity.value = withTiming(0, { duration: 200 });
  };

  const handleSave = async () => {
    if (!selected || !user) {
      Alert.alert('Almost there', 'Select a title to log.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('logs').insert({
        user_id: user.id,
        media_type: selected.mediaType,
        title: selected.title,
        creator: selected.creator,
        year: selected.year,
        status,
        rating: rating > 0 ? rating : null,
        review: review.trim() || null,
        logged_at: consumedDate.toISOString(),
        cover_url: selected.coverUrl,
        dominant_colour: ambientRaw ? ambientToHex(ambientRaw) : null,
        external_id: selected.externalId,
      });
      if (error) throw error;
      // Check if this log completed any trail
      const completedTrail = user
        ? await checkTrailCompletion(user.id, selected.title)
        : null;
      haptics.success();
      onLogged(selected, rating, review.trim() || undefined, completedTrail ?? undefined);
    } catch (err: any) {
      haptics.warn();
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg2 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Ambient glow */}
      <Animated.View
        style={[
          styles.glow,
          { backgroundColor: glowColour },
          glowStyle,
        ]}
        pointerEvents="none"
      />

      {/* Accent line at top */}
      <View style={[styles.accentLine, { backgroundColor: accentColour }]} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]}>LOG IT</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.closeBtn, { color: colors.ink3, fontFamily: fonts.mono }]}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Media type tabs — scrollable so all 6 fit */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.tabsScroll, { borderBottomColor: colors.border }]}
          contentContainerStyle={styles.tabsContent}
        >
          {MEDIA_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={styles.tab}
              onPress={() => handleMediaTypeChange(t.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: mediaType === t.key ? accentColour : colors.ink3,
                    fontFamily: fonts.mono,
                  },
                ]}
              >
                {t.label}
              </Text>
              {mediaType === t.key && (
                <View style={[styles.tabBar, { backgroundColor: accentColour }]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.form}>
          {/* Search field */}
          <View style={[styles.searchBox, { backgroundColor: colors.bg3, borderColor: colors.border2 }]}>
            <TextInput
              style={[styles.searchInput, { color: colors.ink, fontFamily: fonts.ui }]}
              placeholder={`Search ${mediaType}s…`}
              placeholderTextColor={colors.ink3}
              value={query}
              onChangeText={handleSearch}
            />
            {searching && <ActivityIndicator size="small" color={colors.ink3} style={styles.spinner} />}
          </View>

          {/* Search results */}
          {results.length > 0 && !showManual && (
            <View style={[styles.results, { backgroundColor: colors.bg3, borderColor: colors.border2 }]}>
              {results.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.resultRow, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectItem(item)}
                  activeOpacity={0.75}
                >
                  {item.coverUrl ? (
                    <Image source={{ uri: item.coverUrl }} style={styles.resultThumb} />
                  ) : (
                    <View style={[styles.resultThumb, { backgroundColor: colors.bg4 }]} />
                  )}
                  <View style={styles.resultMeta}>
                    <Text style={[styles.resultTitle, { color: colors.ink, fontFamily: fonts.ui }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.resultSub, { color: colors.ink3, fontFamily: fonts.mono }]} numberOfLines={1}>
                      {[item.creator, item.year].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* "Can't find it?" — shown after a search with no results */}
          {!searching && query.length > 1 && results.length === 0 && !selected && !showManual && (
            <TouchableOpacity
              style={[styles.manualTrigger, { borderColor: colors.border2 }]}
              onPress={() => { setShowManual(true); setManualTitle(query); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.manualTriggerText, { color: colors.ink3, fontFamily: fonts.mono }]}>
                CAN'T FIND IT? ADD MANUALLY →
              </Text>
            </TouchableOpacity>
          )}

          {/* Manual entry form */}
          {showManual && !selected && (
            <View style={[styles.manualForm, { backgroundColor: colors.bg3, borderColor: colors.border2 }]}>
              <Text style={[styles.manualLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>ADD MANUALLY</Text>
              <TextInput
                style={[styles.manualInput, { color: colors.ink, borderColor: colors.border2, fontFamily: fonts.ui }]}
                placeholder="Title *"
                placeholderTextColor={colors.ink3}
                value={manualTitle}
                onChangeText={setManualTitle}
              />
              <TextInput
                style={[styles.manualInput, { color: colors.ink, borderColor: colors.border2, fontFamily: fonts.ui }]}
                placeholder="Author / Director / Artist"
                placeholderTextColor={colors.ink3}
                value={manualCreator}
                onChangeText={setManualCreator}
              />
              <TextInput
                style={[styles.manualInput, { color: colors.ink, borderColor: colors.border2, fontFamily: fonts.ui }]}
                placeholder="Year"
                placeholderTextColor={colors.ink3}
                value={manualYear}
                onChangeText={setManualYear}
                keyboardType="numeric"
                maxLength={4}
              />
              <View style={styles.manualActions}>
                <TouchableOpacity
                  style={[styles.manualCancel, { borderColor: colors.border2 }]}
                  onPress={() => setShowManual(false)}
                >
                  <Text style={[styles.manualCancelText, { color: colors.ink3, fontFamily: fonts.mono }]}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.manualConfirm, { backgroundColor: manualTitle.trim() ? colors.accent : colors.bg4 }]}
                  onPress={() => {
                    if (!manualTitle.trim()) return;
                    const entry = buildManualEntry(manualTitle, manualCreator, manualYear, mediaType);
                    handleSelectItem(entry);
                    setShowManual(false);
                  }}
                  disabled={!manualTitle.trim()}
                >
                  <Text style={[styles.manualConfirmText, { color: colors.accentt, fontFamily: fonts.mono }]}>USE THIS</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Selected item card */}
          {selected && (
            <View style={[styles.selectedCard, { borderColor: accentColour, backgroundColor: colors.bg3 }]}>
              {selected.coverUrl && (
                <Image source={{ uri: selected.coverUrl }} style={styles.selectedCover} />
              )}
              <View style={styles.selectedMeta}>
                <Text style={[styles.selectedTitle, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]}>
                  {selected.title.toUpperCase()}
                </Text>
                {selected.creator ? (
                  <Text style={[styles.selectedCreator, { color: colors.ink2, fontFamily: fonts.ui }]}>
                    {selected.creator}
                  </Text>
                ) : null}
                {selected.year ? (
                  <Text style={[styles.selectedYear, { color: colors.ink3, fontFamily: fonts.mono }]}>
                    {selected.year}
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          {/* Star rating */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>RATING</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => { haptics.tapLight(); setRating(rating === star ? 0 : star); }} activeOpacity={0.7}>
                  <Text style={[styles.star, { color: star <= rating ? accentColour : colors.bg4 }]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>STATUS</Text>
            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: status === s.key ? accentColour : colors.bg3,
                      borderColor: status === s.key ? accentColour : colors.border,
                    },
                  ]}
                  onPress={() => setStatus(s.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: status === s.key ? colors.accentt : colors.ink3,
                        fontFamily: fonts.mono,
                      },
                    ]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date consumed */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>
              WHEN DID YOU {status === 'want' ? 'PLAN TO' : status === 'current' ? 'START' : status === 'abandoned' ? 'ABANDON' : 'FINISH'} IT?
            </Text>
            <TouchableOpacity
              style={[styles.dateBtn, { backgroundColor: colors.bg3, borderColor: colors.border2 }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateBtnText, { color: colors.ink, fontFamily: fonts.mono }]}>
                {consumedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <Text style={[styles.dateBtnIcon, { color: colors.ink3, fontFamily: fonts.mono }]}>→</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={consumedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                maximumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) setConsumedDate(date);
                }}
                style={{ backgroundColor: colors.bg3 }}
              />
            )}
          </View>

          {/* Reflective prompt */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.editorial, fontFamily: fonts.mono }]}>
              WHAT STAYED WITH YOU?
            </Text>
            <TextInput
              style={[
                styles.reflectInput,
                { backgroundColor: colors.bg3, color: colors.ink, borderColor: colors.editorial + '60', fontFamily: fonts.ui },
              ]}
              placeholder="One line. Anything. Optional."
              placeholderTextColor={colors.ink3}
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>

          {/* Log button */}
          <TouchableOpacity
            style={[styles.logBtn, { backgroundColor: selected ? accentColour : colors.bg4 }]}
            onPress={handleSave}
            disabled={saving || !selected}
            activeOpacity={0.8}
          >
            {saving
              ? <ActivityIndicator color={colors.accentt} />
              : <Text style={[styles.logBtnText, { color: colors.accentt, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]}>
                  LOG IT
                </Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.4,
  },
  accentLine: { height: 3, width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 28, letterSpacing: 4 },
  closeBtn: { fontSize: 16, letterSpacing: 1 },
  body: { flex: 1 },
  tabsScroll: { borderBottomWidth: 1, maxHeight: 48 },
  tabsContent: { paddingHorizontal: 16 },
  tab: {
    paddingHorizontal: 14,
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  tabText: { fontSize: 11, letterSpacing: 1.5 },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: 2,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 20,
  },
  searchBox: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: { flex: 1, fontSize: 16, fontStyle: 'italic' },
  spinner: { marginLeft: 8 },
  results: {
    borderWidth: 1,
    marginTop: -12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 12,
    borderBottomWidth: 1,
  },
  resultThumb: { width: 36, height: 54, borderRadius: 0 },
  resultMeta: { flex: 1 },
  resultTitle: { fontSize: 14, fontStyle: 'italic', marginBottom: 2 },
  resultSub: { fontSize: 10, letterSpacing: 1 },
  manualTrigger: {
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  manualTriggerText: { fontSize: 10, letterSpacing: 1.5 },
  manualForm: {
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginTop: 4,
  },
  manualLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  manualInput: {
    borderBottomWidth: 1,
    paddingVertical: 10,
    fontSize: 15,
    fontStyle: 'italic',
  },
  manualActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  manualCancel: {
    flex: 1,
    borderWidth: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualCancelText: { fontSize: 10, letterSpacing: 1.5 },
  manualConfirm: {
    flex: 2,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualConfirmText: { fontSize: 10, letterSpacing: 1.5 },
  selectedCard: {
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 12,
  },
  selectedCover: { width: 60, height: 90 },
  selectedMeta: { flex: 1, justifyContent: 'center', gap: 4 },
  selectedTitle: { fontSize: 20, letterSpacing: 2, lineHeight: 22 },
  selectedCreator: { fontSize: 14, fontStyle: 'italic' },
  selectedYear: { fontSize: 11, letterSpacing: 1 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 10, letterSpacing: 2 },
  stars: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 36 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: { fontSize: 10, letterSpacing: 1.5 },
  reflectInput: {
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 12,
    fontSize: 15,
    minHeight: 64,
    fontStyle: 'italic',
  },
  dateBtn: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateBtnText: { fontSize: 13, letterSpacing: 1 },
  dateBtnIcon: { fontSize: 16 },
  logBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logBtnText: { fontSize: 24, letterSpacing: 6 },
});
