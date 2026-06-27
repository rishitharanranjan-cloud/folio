/**
 * In-app weekly nudge banner — shown on Shelf/Home when user hasn't logged in 7+ days.
 * Web-safe (no push notifications on web).
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { fonts } from '../theme/tokens';

interface Props {
  onLog: () => void;
  onDismiss: () => void;
}

export default function WeeklyNudgeBanner({ onLog, onDismiss }: Props) {
  const { colors } = useThemeStore();

  return (
    <View style={[styles.banner, { backgroundColor: colors.bg2, borderColor: colors.editorial }]}>
      <View style={[styles.accent, { backgroundColor: colors.editorial }]} />
      <View style={styles.content}>
        <Text style={[styles.text, { color: colors.ink2, fontFamily: fonts.body }]}>
          What did you finish this week?
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.logBtn, { backgroundColor: colors.editorial }]}
            onPress={onLog}
            activeOpacity={0.8}
          >
            <Text style={[styles.logBtnText, { color: '#fff', fontFamily: fonts.mono }]}>LOG IT</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.dismiss, { color: colors.ink3, fontFamily: fonts.mono }]}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    borderWidth: 1,
    marginHorizontal: 24,
    marginTop: 12,
    overflow: 'hidden',
  },
  accent: { width: 3 },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  text: { flex: 1, fontSize: 14, fontStyle: 'italic' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  logBtnText: { fontSize: 9, letterSpacing: 2 },
  dismiss: { fontSize: 14 },
});
