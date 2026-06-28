/**
 * Onboarding step: pick a trail to join before entering the app.
 * Shows 3 featured trails. Users can join one (or skip).
 * Joining gives them an immediate to-do list on their shelf.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { fonts } from '../../theme/tokens';

interface FeaturedTrail {
  id: string;
  title: string;
  description: string | null;
  tag: string | null;
  stop_count: number;
}

// Curated list of trail titles to feature in onboarding
const FEATURED_TITLES = [
  'The Kurosawa Trail',
  'The Bowie Decade',
  'The Le Guin Library',
  'The Hip-Hop Canon',
  'The Miyazaki Universe',
];

interface Props {
  onNext: () => void;
}

export default function TrailPickScreen({ onNext }: Props) {
  const { colors, mode } = useThemeStore();
  const { user } = useAuthStore();
  const [trails, setTrails] = useState<FeaturedTrail[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [joined, setJoined] = useState<Set<string>>(new Set());

  const tagColour = useMemo<Record<string, string>>(() => ({
    filmmaker: colors.accent,
    movement:  colors.editorial,
    genre:     colors.streak,
    author:    colors.terra,
    artist:    colors.accentd,
  }), [colors]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('trails')
        .select('id, title, description, tag, stop_count')
        .in('title', FEATURED_TITLES)
        .limit(3);
      setTrails(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const handleJoin = async (trailId: string) => {
    if (!user || joining) return;
    setJoining(trailId);
    const { error } = await supabase.from('user_trails').upsert({
      user_id: user.id,
      trail_id: trailId,
    });
    if (!error) setJoined((prev) => new Set([...prev, trailId]));
    setJoining(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.watermark, { color: colors.ink, fontFamily: fonts.display }]}>TRAILS</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]}>
          JOIN A TRAIL
        </Text>
        <Text style={[styles.sub, { color: colors.ink3, fontFamily: fonts.body }]}>
          Trails are curated reading and watching lists. Join one and it becomes your guide — log each stop as you go.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.cards}>
            {trails.map((trail) => {
              const isJoined = joined.has(trail.id);
              const isJoining = joining === trail.id;
              const colour = tagColour[trail.tag ?? ''] ?? colors.editorial;
              return (
                <View
                  key={trail.id}
                  style={[styles.card, {
                    backgroundColor: colors.bg2,
                    borderColor: isJoined ? colors.accent : colors.border,
                  }]}
                >
                  {isJoined && (
                    <View style={[styles.joinedAccent, { backgroundColor: colors.accent }]} />
                  )}

                  <View style={styles.cardTop}>
                    <View style={[styles.tag, { backgroundColor: colour }]}>
                      <Text style={[styles.tagText, { color: '#fff', fontFamily: fonts.mono }]}>
                        {(trail.tag ?? 'TRAIL').toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.stops, { color: colors.ink3, fontFamily: fonts.mono }]}>
                      {trail.stop_count} STOPS
                    </Text>
                  </View>

                  <Text style={[styles.cardTitle, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]}>
                    {trail.title.toUpperCase()}
                  </Text>
                  {trail.description && (
                    <Text style={[styles.cardDesc, { color: colors.ink2, fontFamily: fonts.body }]} numberOfLines={2}>
                      {trail.description}
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.joinBtn,
                      {
                        backgroundColor: isJoined ? 'transparent' : colors.accent,
                        borderWidth: isJoined ? 1 : 0,
                        borderColor: colors.accent,
                      },
                    ]}
                    onPress={() => !isJoined && handleJoin(trail.id)}
                    activeOpacity={isJoined ? 1 : 0.8}
                    disabled={isJoined || isJoining}
                  >
                    {isJoining
                      ? <ActivityIndicator size="small" color={colors.accentt} />
                      : <Text style={[
                          styles.joinBtnText,
                          {
                            color: isJoined ? colors.accent : colors.accentt,
                            fontFamily: fonts.mono,
                          }
                        ]}>
                          {isJoined ? '✓ JOINED' : 'JOIN TRAIL'}
                        </Text>
                    }
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: colors.accent }]}
            onPress={onNext}
            activeOpacity={0.8}
          >
            <Text style={[styles.continueBtnText, { color: colors.accentt, fontFamily: fonts.mono }]}>
              {joined.size > 0 ? 'CONTINUE →' : 'SKIP FOR NOW →'}
            </Text>
          </TouchableOpacity>
          {joined.size === 0 && (
            <Text style={[styles.skipNote, { color: colors.ink3, fontFamily: fonts.body }]}>
              You can browse all trails in the Trails tab.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  watermark: {
    position: 'absolute',
    fontSize: 140,
    opacity: 0.03,
    bottom: -10,
    right: -10,
    letterSpacing: 8,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 48,
    gap: 16,
  },
  heading: { fontSize: 40, letterSpacing: 3, lineHeight: 42 },
  sub: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: -4,
    marginBottom: 8,
  },
  cards: { gap: 12 },
  card: {
    borderWidth: 1,
    padding: 16,
    gap: 8,
    overflow: 'hidden',
  },
  joinedAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: { paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 9, letterSpacing: 1.5 },
  stops: { fontSize: 9, letterSpacing: 1.5 },
  cardTitle: { fontSize: 22, letterSpacing: 2, lineHeight: 24 },
  cardDesc: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  joinBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  joinBtnText: { fontSize: 11, letterSpacing: 2 },
  footer: { gap: 12, marginTop: 8 },
  continueBtn: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: { fontSize: 12, letterSpacing: 3 },
  skipNote: { textAlign: 'center', fontSize: 12, fontStyle: 'italic' },
});
