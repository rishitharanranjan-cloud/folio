import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, ScrollView, Modal } from 'react-native';
import ShareCard from '../../components/ShareCard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { type SearchResult } from '../../lib/mediaSearch';
import { getAmbientColour, clampAmbient, ambientToRgb } from '../../lib/ambientColour';
import { fonts } from '../../theme/tokens';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

interface Props {
  item: SearchResult;
  rating: number;
  review?: string;
  onDone: () => void;
}

export default function ConfirmationScreen({ item, rating, review, onDone }: Props) {
  const { colors, mode } = useThemeStore();
  const { user } = useAuthStore();
  const ambientRgb = clampAmbient(getAmbientColour(item.title), mode === 'dark');
  const bgColour  = ambientToRgb(ambientRgb, 0.85);
  const accentCol = ambientToRgb(ambientRgb);

  const [totalLogged, setTotalLogged] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // Fetch quick stat — total items logged by user
  useEffect(() => {
    if (!user) return;
    supabase
      .from('logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .then(({ count }) => setTotalLogged(count ?? 0));
  }, [user]);

  const bgOpacity    = useSharedValue(0);
  const coverY       = useSharedValue(60);
  const coverOpacity = useSharedValue(0);
  const textOpacity  = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const btnOpacity   = useSharedValue(0);

  useEffect(() => {
    bgOpacity.value    = withTiming(1, { duration: 500 });
    coverY.value       = withDelay(200, withSpring(0, { damping: 18 }));
    coverOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    textOpacity.value  = withDelay(500, withTiming(1, { duration: 400 }));
    statsOpacity.value = withDelay(750, withTiming(1, { duration: 400 }));
    btnOpacity.value   = withDelay(1000, withTiming(1, { duration: 400 }));
  }, []);

  const bgStyle     = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const coverStyle  = useAnimatedStyle(() => ({
    opacity: coverOpacity.value,
    transform: [{ translateY: coverY.value }],
  }));
  const textStyle   = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const statsStyle  = useAnimatedStyle(() => ({ opacity: statsOpacity.value }));
  const btnStyle    = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  const mediaLabel = item.mediaType.charAt(0).toUpperCase() + item.mediaType.slice(1);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.container}
      scrollEnabled={false}
    >
      {/* Ambient fill */}
      <Animated.View style={[styles.fill, { backgroundColor: bgColour }, bgStyle]} />

      {/* Cover art */}
      <Animated.View style={[styles.coverWrap, coverStyle]}>
        {(item.coverUrlHD ?? item.coverUrl) ? (
          <Image source={{ uri: item.coverUrlHD ?? item.coverUrl ?? '' }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, { backgroundColor: accentCol }]} />
        )}
      </Animated.View>

      {/* Title + creator + rating */}
      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={[styles.loggedLabel, { color: 'rgba(255,255,255,0.5)', fontFamily: fonts.mono }]}>
          {mediaLabel.toUpperCase()} LOGGED
        </Text>
        <Text style={[styles.itemTitle, { color: '#fff', fontFamily: fonts.display }]} numberOfLines={3}>
          {item.title.toUpperCase()}
        </Text>
        {item.creator ? (
          <Text style={[styles.creator, { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.body }]}>
            {item.creator}{item.year ? `  ·  ${item.year}` : ''}
          </Text>
        ) : null}

        {/* Stars */}
        {rating > 0 && (
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Text key={s} style={[styles.star, { color: s <= rating ? accentCol : 'rgba(255,255,255,0.2)' }]}>
                ★
              </Text>
            ))}
          </View>
        )}

        {/* Review snippet */}
        {review ? (
          <View style={[styles.reviewBox, { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)' }]}>
            <Text style={[styles.reviewQuote, { color: 'rgba(255,255,255,0.35)', fontFamily: fonts.mono }]}>"</Text>
            <Text style={[styles.reviewText, { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.body }]} numberOfLines={4}>
              {review}
            </Text>
          </View>
        ) : null}
      </Animated.View>

      {/* Quick stat */}
      <Animated.View style={[styles.stat, statsStyle]}>
        {totalLogged !== null && (
          <Text style={[styles.statText, { color: 'rgba(255,255,255,0.45)', fontFamily: fonts.mono }]}>
            {totalLogged === 1
              ? 'YOUR FIRST LOG. THE SHELF BEGINS.'
              : `${totalLogged} THINGS LOGGED ON FOLIO`}
          </Text>
        )}
      </Animated.View>

      {/* Buttons */}
      <Animated.View style={[styles.btnWrap, btnStyle]}>
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }]}
          onPress={() => setShareOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.shareBtnText, { fontFamily: fonts.mono }]}>SHARE ↗</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.doneBtn, { borderColor: 'rgba(255,255,255,0.4)' }]}
          onPress={onDone}
          activeOpacity={0.8}
        >
          <Text style={[styles.doneBtnText, { fontFamily: fonts.mono }]}>TO MY SHELF →</Text>
        </TouchableOpacity>
      </Animated.View>

      {shareOpen && (
        <ShareCard
          item={item}
          rating={rating}
          review={review}
          onClose={() => setShareOpen(false)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: {
    minHeight: SCREEN_H,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 0,
  },
  fill: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  coverWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 24,
    marginBottom: 28,
  },
  cover: {
    width: SCREEN_W * 0.48,
    height: SCREEN_W * 0.48 * 1.5,
  },
  textWrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
    width: '100%',
  },
  loggedLabel: { fontSize: 10, letterSpacing: 4 },
  itemTitle: {
    fontSize: 36,
    letterSpacing: 3,
    textAlign: 'center',
    lineHeight: 40,
  },
  creator: { fontSize: 15, fontStyle: 'italic' },
  stars: { flexDirection: 'row', gap: 6, marginTop: 4 },
  star: { fontSize: 22 },
  reviewBox: {
    width: '100%',
    marginTop: 8,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  reviewQuote: { fontSize: 24, lineHeight: 20 },
  reviewText: { fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  stat: {
    marginTop: 24,
    paddingHorizontal: 32,
  },
  statText: {
    fontSize: 10,
    letterSpacing: 2,
    textAlign: 'center',
  },
  btnWrap: {
    marginTop: 32,
    flexDirection: 'row',
    gap: 12,
  },
  shareBtn: {
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 12,
    letterSpacing: 2,
  },
  doneBtn: {
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 12,
    letterSpacing: 3,
  },
});
