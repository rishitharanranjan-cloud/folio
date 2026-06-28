import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { fonts } from '../../theme/tokens';

const SUGGESTIONS = [
  { name: 'Wong Kar-wai', type: 'filmmaker' },
  { name: 'Toni Morrison', type: 'author' },
  { name: 'Hayao Miyazaki', type: 'filmmaker' },
  { name: 'Radiohead', type: 'artist' },
  { name: 'Andrei Tarkovsky', type: 'filmmaker' },
  { name: 'Haruki Murakami', type: 'author' },
  { name: 'Kendrick Lamar', type: 'artist' },
  { name: 'Ingmar Bergman', type: 'filmmaker' },
  { name: 'Chimamanda Ngozi Adichie', type: 'author' },
  { name: 'Science Fiction', type: 'genre' },
  { name: 'Post-Rock', type: 'genre' },
  { name: 'Magical Realism', type: 'genre' },
  { name: 'Bong Joon-ho', type: 'filmmaker' },
  { name: 'Wole Soyinka', type: 'author' },
  { name: 'Arca', type: 'artist' },
  { name: 'Abbas Kiarostami', type: 'filmmaker' },
  { name: 'Gabriel García Márquez', type: 'author' },
  { name: 'Nina Simone', type: 'artist' },
  { name: 'New Wave', type: 'genre' },
  { name: 'Afrobeats', type: 'genre' },
  { name: 'Apichatpong Weerasethakul', type: 'filmmaker' },
  { name: 'Clarice Lispector', type: 'author' },
  { name: 'Frank Ocean', type: 'artist' },
  { name: 'Horror', type: 'genre' },
  { name: 'Essay Film', type: 'genre' },
];

interface Props {
  onNext: () => void;
}

export default function TasteSearchScreen({ onNext }: Props) {
  const { colors, mode } = useThemeStore();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const filtered = query.trim()
    ? SUGGESTIONS.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase())
      )
    : SUGGESTIONS;

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size < 3 || !user) return;
    setLoading(true);
    try {
      const seeds = Array.from(selected).map((name) => {
        const match = SUGGESTIONS.find((s) => s.name === name);
        return {
          user_id: user.id,
          name,
          type: match?.type ?? 'custom',
        };
      });
      const { error } = await supabase.from('taste_seeds').insert(seeds);
      if (error) throw error;
      onNext();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const canContinue = selected.size >= 3;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.heading, { color: colors.ink, fontFamily: mode === 'dark' ? fonts.display : fonts.brand }]}>
          YOUR TASTE
        </Text>
        <Text style={[styles.sub, { color: colors.ink3, fontFamily: fonts.body }]}>
          Pick at least 3 — directors, authors, artists, genres, movements.
        </Text>

        <View style={[styles.searchBox, { backgroundColor: colors.bg3, borderColor: colors.border2 }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.ink, fontFamily: fonts.mono }]}
            placeholder="Search anything..."
            placeholderTextColor={colors.ink3}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {query.length === 0 && (
          <Text style={[styles.sectionLabel, { color: colors.ink3, fontFamily: fonts.mono }]}>
            POPULAR PICKS TO GET YOU STARTED
          </Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.chips} showsVerticalScrollIndicator={false}>
        {filtered.map((item) => {
          const isSelected = selected.has(item.name);
          return (
            <TouchableOpacity
              key={item.name}
              onPress={() => toggle(item.name)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.accent : colors.bg3,
                  borderColor: isSelected ? colors.accent : colors.border,
                  opacity: isSelected ? 1 : 0.85,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? colors.accentt : colors.ink2,
                    fontFamily: fonts.mono,
                    textDecorationLine: isSelected ? 'line-through' : 'none',
                  },
                ]}
              >
                {item.name}
              </Text>
              <Text style={[styles.chipType, { color: isSelected ? colors.accentt : colors.ink3, fontFamily: fonts.mono }]}>
                {item.type}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Custom entry */}
        {query.length > 0 && !SUGGESTIONS.find((s) => s.name.toLowerCase() === query.toLowerCase()) && (
          <TouchableOpacity
            onPress={() => { toggle(query); setQuery(''); }}
            style={[styles.chip, { backgroundColor: colors.editorial, borderColor: colors.editorial }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, { color: '#fff', fontFamily: fonts.mono }]}>
              Add "{query}"
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.count, { color: colors.ink3, fontFamily: fonts.mono }]}>
          {selected.size} selected{selected.size < 3 ? ` (${3 - selected.size} more to go)` : ''}
        </Text>
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: canContinue ? colors.accent : colors.bg3 }]}
          onPress={handleSave}
          disabled={!canContinue || loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color={colors.accentt} />
            : <Text style={[styles.ctaText, { color: canContinue ? colors.accentt : colors.ink3, fontFamily: fonts.mono }]}>
                CONTINUE
              </Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 16,
    gap: 10,
  },
  heading: { fontSize: 40, letterSpacing: 4 },
  sub: { fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  searchBox: {
    height: 44,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  searchInput: { fontSize: 13, letterSpacing: 0.5 },
  sectionLabel: { fontSize: 9, letterSpacing: 2, marginTop: 4 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 8,
    paddingBottom: 24,
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  chipText: { fontSize: 12, letterSpacing: 0.5 },
  chipType: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  count: { flex: 1, fontSize: 10, letterSpacing: 1 },
  cta: {
    height: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 12, letterSpacing: 2 },
});
