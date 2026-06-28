/**
 * Share card — three colour variants, three formats.
 * Captured via react-native-view-shot and shared via expo-sharing.
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Modal, Dimensions,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useThemeStore } from '../store/themeStore';
import { getAmbientColour, ambientToRgb, ambientToHex } from '../lib/ambientColour';
import { fonts, FOLIO_CODE_COLOURS } from '../theme/tokens';
import FolioCodeMark from './FolioCodeMark';
import type { SearchResult } from '../lib/mediaSearch';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W - 48, 360);

type Variant = 'deep' | 'saturated' | 'mode';
type Format  = 'square' | 'story' | 'wide';

interface Props {
  item: SearchResult;
  rating: number;
  review?: string;
  onClose: () => void;
}

function deriveColours(rgb: [number, number, number], mode: string, modeAccent: string) {
  const [r, g, b] = rgb;
  return {
    deep: {
      bg:     `rgb(${Math.round(r*0.3)},${Math.round(g*0.3)},${Math.round(b*0.3)})`,
      accent: `rgb(${Math.round(r*0.7)},${Math.round(g*0.7)},${Math.round(b*0.7)})`,
    },
    saturated: {
      bg:     `rgb(${r},${g},${b})`,
      accent: `rgb(${Math.min(255,Math.round(r*1.3))},${Math.min(255,Math.round(g*1.3))},${Math.min(255,Math.round(b*1.3))})`,
    },
    mode: {
      bg:     `rgb(${Math.round(r*0.25)},${Math.round(g*0.25)},${Math.round(b*0.25)})`,
      accent: modeAccent,
    },
  };
}

const FORMAT_ASPECT: Record<Format, number> = { square: 1, story: 16/9, wide: 9/16 };

function CardContent({
  item, rating, review, variant, colours, format, mode,
}: {
  item: SearchResult; rating: number; review?: string;
  variant: Variant; colours: ReturnType<typeof deriveColours>;
  format: Format; mode: 'dark' | 'light';
}) {
  const c = colours[variant];
  const isWide = format === 'wide';
  const cardH  = format === 'story' ? CARD_W * (16/9) : format === 'wide' ? CARD_W * (9/16) : CARD_W;

  return (
    <View style={[styles.card, { width: CARD_W, height: cardH, backgroundColor: c.bg }]}>
      {/* Full-bleed cover underlay */}
      {(item.coverUrlHD ?? item.coverUrl) && (
        <Image
          source={{ uri: item.coverUrlHD ?? item.coverUrl ?? '' }}
          style={[styles.coverUnderlay, { width: CARD_W, height: cardH }]}
          resizeMode="cover"
        />
      )}
      {/* Gradient scrim */}
      <View style={[
        styles.scrim,
        isWide
          ? { backgroundColor: `${c.bg}cc` }
          : { backgroundColor: `${c.bg}cc` },
      ]} />

      {/* Content */}
      <View style={[styles.cardContent, isWide ? styles.cardContentWide : styles.cardContentPortrait]}>
        <Text style={[styles.cardLogged, { color: 'rgba(255,255,255,0.5)', fontFamily: fonts.mono }]}>
          {item.mediaType.toUpperCase()} · LOGGED
        </Text>
        <Text style={[styles.cardTitle, { color: '#fff', fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]} numberOfLines={3}>
          {item.title.toUpperCase()}
        </Text>
        {item.creator && (
          <Text style={[styles.cardCreator, { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.body }]}>
            {item.creator}
          </Text>
        )}
        {rating > 0 && (
          <Text style={[styles.cardStars, { color: c.accent, fontFamily: fonts.mono }]}>
            {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
          </Text>
        )}
        {review && (
          <Text style={[styles.cardReview, { color: 'rgba(255,255,255,0.6)', fontFamily: fonts.body }]} numberOfLines={2}>
            "{review}"
          </Text>
        )}
        <View style={styles.cardBrandRow}>
          <FolioCodeMark
            size="small"
            blocksColor="rgba(255,255,255,0.2)"
            barColor={FOLIO_CODE_COLOURS[mode].bar}
            dotColor={FOLIO_CODE_COLOURS[mode].dot}
          />
          <Text style={[styles.cardBrand, { color: 'rgba(255,255,255,0.2)', fontFamily: fonts.brand }]}>
            folio.
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ShareCard({ item, rating, review, onClose }: Props) {
  const { colors, mode } = useThemeStore();
  const [variant, setVariant] = useState<Variant>('deep');
  const [format, setFormat]   = useState<Format>('square');
  const [sharing, setSharing] = useState(false);
  const shotRef = useRef<any>(null);

  const rgb = getAmbientColour(item.title);
  const modeAccent = mode === 'dark' ? '#6098c8' : '#a87030';
  const colours = deriveColours(rgb, mode, modeAccent);

  const handleShare = async () => {
    setSharing(true);
    try {
      const uri = await (shotRef.current as any)?.capture();
      if (!uri) throw new Error('Capture failed');
      await Sharing.shareAsync(uri, { mimeType: 'image/png' });
    } catch (err: any) {
      console.warn('Share error:', err.message);
    } finally {
      setSharing(false);
    }
  };

  const VARIANTS: { key: Variant; label: string }[] = [
    { key: 'deep',      label: 'DEEP'      },
    { key: 'saturated', label: 'SATURATED' },
    { key: 'mode',      label: mode === 'dark' ? 'NORDIC' : 'PARCHMENT' },
  ];

  const FORMATS: { key: Format; label: string }[] = [
    { key: 'square', label: '1:1' },
    { key: 'story',  label: '9:16' },
    { key: 'wide',   label: '16:9' },
  ];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.ink, fontFamily: fonts.display }]}>SHARE</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.close, { color: colors.ink3, fontFamily: fonts.mono }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Card preview */}
        <View style={styles.preview}>
          <ViewShot ref={shotRef} options={{ format: 'png', quality: 1 }}>
            <CardContent
              item={item} rating={rating} review={review}
              variant={variant} colours={colours} format={format} mode={mode}
            />
          </ViewShot>
        </View>

        {/* Variant selector */}
        <View style={[styles.selectorRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.selectorLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>COLOUR</Text>
          <View style={styles.chips}>
            {VARIANTS.map(v => (
              <TouchableOpacity
                key={v.key}
                style={[styles.chip, {
                  backgroundColor: variant === v.key ? colors.accent : colors.bg3,
                  borderColor: variant === v.key ? colors.accent : colors.border,
                }]}
                onPress={() => setVariant(v.key)}
              >
                <Text style={[styles.chipText, {
                  color: variant === v.key ? colors.accentt : colors.ink3,
                  fontFamily: fonts.mono,
                }]}>{v.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Format selector */}
        <View style={[styles.selectorRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.selectorLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>FORMAT</Text>
          <View style={styles.chips}>
            {FORMATS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, {
                  backgroundColor: format === f.key ? colors.accent : colors.bg3,
                  borderColor: format === f.key ? colors.accent : colors.border,
                }]}
                onPress={() => setFormat(f.key)}
              >
                <Text style={[styles.chipText, {
                  color: format === f.key ? colors.accentt : colors.ink3,
                  fontFamily: fonts.mono,
                }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Share button */}
        <View style={styles.shareWrap}>
          <TouchableOpacity
            style={[styles.shareBtn, { backgroundColor: colors.accent }]}
            onPress={handleShare}
            disabled={sharing}
            activeOpacity={0.8}
          >
            {sharing
              ? <ActivityIndicator color={colors.accentt} />
              : <Text style={[styles.shareBtnText, { color: colors.accentt, fontFamily: fonts.mono }]}>
                  SHARE IMAGE
                </Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, letterSpacing: 4 },
  close: { fontSize: 16 },
  preview: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { overflow: 'hidden' },
  coverUnderlay: { position: 'absolute', top: 0, left: 0 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  cardContent: { position: 'absolute', padding: 20, gap: 8 },
  cardContentPortrait: { bottom: 0, left: 0, right: 0 },
  cardContentWide: { top: 0, left: 0, bottom: 0, width: '55%', justifyContent: 'flex-end' },
  cardLogged: { fontSize: 9, letterSpacing: 2 },
  cardTitle: { fontSize: 28, letterSpacing: 2, lineHeight: 30 },
  cardCreator: { fontSize: 14, fontStyle: 'italic' },
  cardStars: { fontSize: 14, letterSpacing: 2 },
  cardReview: { fontSize: 12, fontStyle: 'italic', lineHeight: 17 },
  cardBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cardBrand: { fontSize: 18, letterSpacing: 2 },
  selectorRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14,
    borderBottomWidth: 1, gap: 16,
  },
  selectorLabel: { fontSize: 9, letterSpacing: 2, width: 52 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 9, letterSpacing: 1.5 },
  shareWrap: { padding: 24 },
  shareBtn: { height: 52, alignItems: 'center', justifyContent: 'center' },
  shareBtnText: { fontSize: 13, letterSpacing: 3 },
});
