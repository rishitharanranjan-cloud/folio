import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { fonts } from '../../theme/tokens';

interface Props {
  onImport: () => void;
  onLogFirst: () => void;
  onTaste: () => void;
}

export default function PathSelectScreen({ onImport, onLogFirst, onTaste }: Props) {
  const { colors } = useThemeStore();

  const options = [
    {
      label: 'IMPORT MY LISTS',
      sub: 'Bring in your Goodreads, Letterboxd or Spotify history',
      onPress: onImport,
      accent: colors.accent,
    },
    {
      label: 'LOG SOMETHING',
      sub: 'Add the first thing on your shelf right now',
      onPress: onLogFirst,
      accent: colors.editorial,
    },
    {
      label: 'SET UP MY TASTE',
      sub: "Tell Folio what you're into and explore from there",
      onPress: onTaste,
      accent: colors.ink3,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.watermark, { color: colors.ink, fontFamily: fonts.display }]}>PATH</Text>

      <View style={styles.content}>
        <Text style={[styles.heading, { color: colors.ink, fontFamily: fonts.display }]}>
          HOW DO YOU{'\n'}WANT TO START?
        </Text>
        <Text style={[styles.sub, { color: colors.ink3, fontFamily: fonts.body }]}>
          You can do all of these later too.
        </Text>

        <View style={styles.options}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.option, { borderColor: colors.border2, backgroundColor: colors.bg2 }]}
              onPress={opt.onPress}
              activeOpacity={0.75}
            >
              <View style={[styles.optionBar, { backgroundColor: opt.accent }]} />
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: colors.ink, fontFamily: fonts.display }]}>
                  {opt.label}
                </Text>
                <Text style={[styles.optionSub, { color: colors.ink3, fontFamily: fonts.body }]}>
                  {opt.sub}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  watermark: {
    position: 'absolute',
    fontSize: 180,
    opacity: 0.03,
    bottom: -10,
    right: -10,
    letterSpacing: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 100,
    gap: 20,
  },
  heading: { fontSize: 40, letterSpacing: 3, lineHeight: 44 },
  sub: { fontSize: 14, fontStyle: 'italic', marginTop: -8 },
  options: { gap: 12, marginTop: 8 },
  option: {
    flexDirection: 'row',
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionBar: { width: 3 },
  optionText: { flex: 1, padding: 16, gap: 4 },
  optionLabel: { fontSize: 20, letterSpacing: 2 },
  optionSub: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
});
