import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Modal, ScrollView, Animated, Dimensions, TextInput, ActivityIndicator,
} from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { fonts } from '../theme/tokens';
import { clampAmbient, hexToRgb, ambientToHex, getAmbientColour } from '../lib/ambientColour';
import { updateLog } from '../hooks/useLogs';
import type { LogEntry } from '../hooks/useLogs';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.78;

const STATUS_OPTIONS = [
  { key: 'completed',   label: 'DONE' },
  { key: 'in_progress', label: 'IN PROGRESS' },
  { key: 'dropped',     label: 'DROPPED' },
];

const MEDIA_LABEL: Record<string, string> = {
  book: 'BOOK', film: 'FILM', tv: 'TV', album: 'ALBUM', podcast: 'PODCAST', game: 'GAME',
};

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

  // Keep last non-null log so content stays visible during the exit animation.
  const lastLog = useRef<LogEntry | null>(null);
  useEffect(() => { if (log) lastLog.current = log; }, [log]);
  const displayLog = log ?? lastLog.current;

  const [editing, setEditing]     = useState(false);
  const [draftRating, setDraftRating] = useState<number | null>(null);
  const [draftReview, setDraftReview] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset edit state whenever a new log is shown
  useEffect(() => {
    if (log) {
      setEditing(false);
      setDraftRating(log.rating);
      setDraftReview(log.review ?? '');
      setDraftStatus(log.status ?? 'completed');
      setSaveError(null);
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

  if (!displayLog) return null;

  const rawRgb  = displayLog.dominant_colour ? hexToRgb(displayLog.dominant_colour) : null;
  const clamped = rawRgb ? clampAmbient(rawRgb, isDark) : null;
  const accentHex = clamped
    ? ambientToHex(clamped)
    : ambientToHex(clampAmbient(getAmbientColour(displayLog.title), isDark));

  const accentRgb = hexToRgb(accentHex);
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
      onUpdated?.(displayLog.id, changes);
      // Update lastLog so display reflects the save without closing
      lastLog.current = { ...displayLog, ...changes };
      setEditing(false);
    } catch (e: any) {
      setSaveError(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const viewRating  = editing ? draftRating  : displayLog.rating;
  const viewReview  = editing ? draftReview  : (displayLog.review ?? '');
  const viewStatus  = editing ? draftStatus  : (displayLog.status ?? 'completed');

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

        {/* Handle + edit toggle */}
        <View style={styles.topBar}>
          <View style={[styles.handle, { backgroundColor: colors.border2 }]} />
          <TouchableOpacity
            style={[styles.editToggle, {
              borderColor: editing ? accentHex : colors.border2,
              backgroundColor: editing ? accentFill : 'transparent',
            }]}
            onPress={() => { setEditing(e => !e); setSaveError(null); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.editToggleTxt, {
              color: editing ? accentHex : colors.ink3,
              fontFamily: fonts.mono,
            }]}>
              {editing ? 'CANCEL' : 'EDIT'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cover + meta */}
          <View style={styles.topRow}>
            {displayLog.cover_url ? (
              <Image source={{ uri: displayLog.cover_url }} style={[styles.cover, { borderColor: colors.border }]} resizeMode="cover" />
            ) : (
              <View style={[styles.cover, { backgroundColor: accentFill, borderColor: accentHex }]}>
                <Text style={[styles.coverFallback, { color: accentHex, fontFamily: fonts.mono }]}>
                  {displayLog.title.slice(0, 2).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={styles.metaCol}>
              <View style={[styles.typePill, { backgroundColor: accentFill, borderColor: accentHex }]}>
                <Text style={[styles.typeText, { color: accentHex, fontFamily: fonts.mono }]}>
                  {MEDIA_LABEL[displayLog.media_type] ?? displayLog.media_type.toUpperCase()}
                </Text>
              </View>

              <Text style={[styles.title, { color: colors.ink, fontFamily: fonts.display }]} numberOfLines={5}>
                {displayLog.title.toUpperCase()}
              </Text>

              {displayLog.creator && (
                <Text style={[styles.creator, { color: colors.ink2, fontFamily: fonts.body }]}>
                  {displayLog.creator}{displayLog.year ? `  ·  ${displayLog.year}` : ''}
                </Text>
              )}

              {/* Rating — tappable stars in edit mode */}
              <View style={styles.ratingRow}>
                {[1,2,3,4,5].map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => editing && setDraftRating(draftRating === s ? null : s)}
                    activeOpacity={editing ? 0.6 : 1}
                    disabled={!editing}
                  >
                    <Text style={[styles.star, {
                      color: (viewRating ?? 0) >= s ? accentHex : colors.border2,
                      fontSize: editing ? 22 : 18,
                    }]}>★</Text>
                  </TouchableOpacity>
                ))}
                {editing && viewRating && (
                  <TouchableOpacity onPress={() => setDraftRating(null)} activeOpacity={0.6}>
                    <Text style={[styles.clearRating, { color: colors.ink3, fontFamily: fonts.mono }]}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Status chips — only in edit mode */}
              {editing && (
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
              )}

              {/* Status pill — read mode only */}
              {!editing && displayLog.status && displayLog.status !== 'completed' && (
                <View style={[styles.statusPill, { backgroundColor: colors.bg3, borderColor: colors.border }]}>
                  <Text style={[styles.statusText, { color: colors.ink3, fontFamily: fonts.mono }]}>
                    {STATUS_OPTIONS.find(o => o.key === displayLog.status)?.label ?? displayLog.status.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Review */}
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
              numberOfLines={4}
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
            <Text style={[styles.noReview, { color: colors.ink3, fontFamily: fonts.mono }]}>
              NO REVIEW WRITTEN
            </Text>
          )}

          {saveError && (
            <Text style={[styles.errorText, { color: colors.terra, fontFamily: fonts.mono }]}>
              {saveError}
            </Text>
          )}

          {/* Logged date */}
          <Text style={[styles.date, { color: colors.ink3, fontFamily: fonts.mono }]}>
            LOGGED {new Date(displayLog.logged_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            }).toUpperCase()}
          </Text>
        </ScrollView>

        {/* Footer buttons */}
        <View style={styles.footer}>
          {editing ? (
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: accentHex }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator color={colors.bg} size="small" />
                : <Text style={[styles.saveTxt, { color: colors.bg, fontFamily: fonts.mono }]}>SAVE CHANGES</Text>
              }
            </TouchableOpacity>
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
    ...StyleSheet.absoluteFillObject,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    position: 'relative',
  },
  handle: {
    width: 40, height: 3,
    borderRadius: 2,
  },
  editToggle: {
    position: 'absolute',
    right: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editToggleTxt: { fontSize: 9, letterSpacing: 2 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 16,
  },
  topRow: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' },
  cover: {
    width: 100, height: 140,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  coverFallback: { fontSize: 28, letterSpacing: 2 },
  metaCol: { flex: 1, gap: 8 },
  typePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  typeText: { fontSize: 8, letterSpacing: 2 },
  title: { fontSize: 22, letterSpacing: 2, lineHeight: 24 },
  creator: { fontSize: 14, fontStyle: 'italic', lineHeight: 18 },
  ratingRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  star: { lineHeight: 26 },
  clearRating: { fontSize: 10, marginLeft: 4, lineHeight: 26 },
  statusChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  statusChip: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusChipTxt: { fontSize: 8, letterSpacing: 1.5 },
  statusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  statusText: { fontSize: 8, letterSpacing: 1.5 },
  divider: { height: 1 },
  reviewBox: { borderWidth: 1, padding: 14, gap: 6 },
  quoteGlyph: { fontSize: 28, lineHeight: 22 },
  reviewText: { fontSize: 14, fontStyle: 'italic', lineHeight: 22 },
  noReview: { fontSize: 9, letterSpacing: 2 },
  reviewInput: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
    minHeight: 100,
  },
  errorText: { fontSize: 10, letterSpacing: 1 },
  date: { fontSize: 9, letterSpacing: 1.5 },
  footer: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 },
  saveBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveTxt: { fontSize: 11, letterSpacing: 3 },
  closeBtn: {
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeTxt: { fontSize: 11, letterSpacing: 3 },
});
