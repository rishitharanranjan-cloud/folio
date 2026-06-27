import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { fonts, dark, light, THEME_NAMES } from '../../theme/tokens';
import { useThemeStore } from '../../store/themeStore';

const { width } = Dimensions.get('window');

interface Props {
  onSelect: () => void;
}

export default function ModeSelectScreen({ onSelect }: Props) {
  const { setMode } = useThemeStore();

  const choose = (mode: 'dark' | 'light') => {
    setMode(mode);
    onSelect();
  };

  return (
    <View style={styles.container}>
      {/* Dark half */}
      <TouchableOpacity
        style={[styles.half, { backgroundColor: dark.bg }]}
        onPress={() => choose('dark')}
        activeOpacity={0.85}
      >
        <Text style={[styles.modeName, { color: dark.ink, fontFamily: fonts.display }]}>
          NORDIC{'\n'}FROST
        </Text>
        <Text style={[styles.modeDesc, { color: dark.ink3, fontFamily: fonts.body }]}>
          midnight fjord, arctic blue
        </Text>
        <View style={[styles.swatch, { backgroundColor: dark.accent }]} />
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Light half */}
      <TouchableOpacity
        style={[styles.half, { backgroundColor: light.bg }]}
        onPress={() => choose('light')}
        activeOpacity={0.85}
      >
        <Text style={[styles.modeName, { color: light.ink, fontFamily: fonts.display }]}>
          VINTAGE{'\n'}ARCHIVE
        </Text>
        <Text style={[styles.modeDesc, { color: light.ink3, fontFamily: fonts.body }]}>
          archive paper, tamarind
        </Text>
        <View style={[styles.swatch, { backgroundColor: light.accent }]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  half: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  modeName: {
    fontSize: 36,
    letterSpacing: 4,
    textAlign: 'center',
    lineHeight: 40,
  },
  modeDesc: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  swatch: {
    width: 32,
    height: 4,
    marginTop: 8,
  },
  divider: {
    width: 1,
    backgroundColor: '#333',
  },
});
