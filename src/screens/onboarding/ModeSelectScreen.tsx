import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { fonts, dark, light, THEME_DESCRIPTIONS, FOLIO_CODE_COLOURS } from '../../theme/tokens';
import { useThemeStore } from '../../store/themeStore';
import FolioCodeMark from '../../components/FolioCodeMark';

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
      {/* Nordic Frost half */}
      <TouchableOpacity
        style={[styles.half, { backgroundColor: dark.bg }]}
        onPress={() => choose('dark')}
        activeOpacity={0.85}
      >
        <FolioCodeMark
          size="small"
          blocksColor={FOLIO_CODE_COLOURS.dark.blocks}
          barColor={FOLIO_CODE_COLOURS.dark.bar}
          dotColor={FOLIO_CODE_COLOURS.dark.dot}
        />
        <Text style={[styles.modeName, { color: dark.ink, fontFamily: fonts.display }]}>
          NORDIC{'\n'}FROST
        </Text>
        <Text style={[styles.modeDesc, { color: dark.ink3, fontFamily: fonts.body }]}>
          {THEME_DESCRIPTIONS.dark}
        </Text>
        <View style={[styles.swatch, { backgroundColor: dark.accent }]} />
      </TouchableOpacity>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: dark.border2 }]} />

      {/* Vintage Archive half */}
      <TouchableOpacity
        style={[styles.half, { backgroundColor: light.bg }]}
        onPress={() => choose('light')}
        activeOpacity={0.85}
      >
        <FolioCodeMark
          size="small"
          blocksColor={FOLIO_CODE_COLOURS.light.blocks}
          barColor={FOLIO_CODE_COLOURS.light.bar}
          dotColor={FOLIO_CODE_COLOURS.light.dot}
        />
        <Text style={[styles.modeName, { color: light.ink, fontFamily: fonts.brand }]}>
          Vintage{'\n'}Archive
        </Text>
        <Text style={[styles.modeDesc, { color: light.ink3, fontFamily: fonts.body }]}>
          {THEME_DESCRIPTIONS.light}
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
