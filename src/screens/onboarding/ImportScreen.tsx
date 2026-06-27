import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { parseGoodreads, parseLetterboxd } from '../../lib/importParsers';
import { fonts } from '../../theme/tokens';

interface Props {
  onNext: () => void;
  onSkip: () => void;
}

type Service = 'goodreads' | 'letterboxd';

interface ImportResult { imported: number; skipped: number }

const SERVICES = [
  {
    id: 'goodreads' as Service,
    label: 'GOODREADS',
    sub: 'Export from goodreads.com → My Books → Import/Export',
    colour: '#4a7a5a',
    instructions: 'Go to goodreads.com → My Books → Import and Export → Export Library. Download the CSV then pick it here.',
  },
  {
    id: 'letterboxd' as Service,
    label: 'LETTERBOXD',
    sub: 'Export from letterboxd.com → Settings → Import & Export',
    colour: '#6098c8',
    instructions: 'Go to letterboxd.com → Settings → Import & Export → Export your data. Pick diary.csv or watchlist.csv here.',
  },
];

export default function ImportScreen({ onNext, onSkip }: Props) {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<Service | null>(null);
  const [results, setResults] = useState<Record<Service, ImportResult | null>>({
    goodreads: null, letterboxd: null,
  });

  const handleImport = async (service: Service) => {
    const svc = SERVICES.find(s => s.id === service)!;
    Alert.alert(
      `Import from ${svc.label}`,
      svc.instructions,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pick CSV', onPress: () => pickAndImport(service) },
      ]
    );
  };

  const pickAndImport = async (service: Service) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      setLoading(service);
      const file = result.assets[0];
      const text = await fetch(file.uri).then(r => r.text());

      const logs = service === 'goodreads'
        ? parseGoodreads(text)
        : parseLetterboxd(text);

      if (logs.length === 0) {
        Alert.alert('No data found', 'Make sure you picked the correct CSV file.');
        setLoading(null);
        return;
      }

      // Insert in batches of 50
      let imported = 0, skipped = 0;
      const batches = [];
      for (let i = 0; i < logs.length; i += 50) batches.push(logs.slice(i, i + 50));

      for (const batch of batches) {
        const rows = batch.map(l => ({ ...l, user_id: user!.id }));
        const { error, data } = await supabase.from('logs').upsert(rows, { onConflict: 'user_id,title,media_type' }).select('id');
        if (error) { skipped += batch.length; }
        else { imported += (data?.length ?? 0); skipped += batch.length - (data?.length ?? 0); }
      }

      setResults(prev => ({ ...prev, [service]: { imported, skipped } }));
      Alert.alert(
        'Import complete',
        `${imported} items added to your shelf.\n${skipped > 0 ? `${skipped} skipped (already logged or errors).` : ''}`,
      );
    } catch (err: any) {
      Alert.alert('Import failed', err.message);
    } finally {
      setLoading(null);
    }
  };

  const anyImported = Object.values(results).some(r => r && r.imported > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.watermark, { color: colors.ink, fontFamily: fonts.display }]}>IMPORT</Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.heading, { color: colors.ink, fontFamily: fonts.display }]}>
          BRING YOUR{'\n'}HISTORY IN
        </Text>
        <Text style={[styles.sub, { color: colors.ink3, fontFamily: fonts.body }]}>
          Import your existing logs. Nothing gets overwritten — we only add what isn't already there.
        </Text>

        <View style={styles.services}>
          {SERVICES.map((s) => {
            const result = results[s.id];
            const isLoading = loading === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.service, { borderColor: result ? s.colour : colors.border2, backgroundColor: colors.bg2 }]}
                onPress={() => handleImport(s.id)}
                activeOpacity={0.75}
                disabled={isLoading}
              >
                <View style={[styles.serviceBar, { backgroundColor: s.colour }]} />
                <View style={styles.serviceText}>
                  <Text style={[styles.serviceLabel, { color: colors.ink, fontFamily: fonts.display }]}>
                    {s.label}
                  </Text>
                  <Text style={[styles.serviceSub, { color: colors.ink3, fontFamily: fonts.body }]}>
                    {result
                      ? `✓ ${result.imported} items imported`
                      : s.sub}
                  </Text>
                </View>
                {isLoading
                  ? <ActivityIndicator color={s.colour} style={{ marginRight: 16 }} />
                  : <Text style={[styles.arrow, { color: result ? s.colour : colors.ink3, fontFamily: fonts.mono }]}>
                      {result ? '✓' : '→'}
                    </Text>
                }
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.hint, { borderColor: colors.border2, backgroundColor: colors.bg2 }]}>
          <Text style={[styles.hintTitle, { color: colors.ink3, fontFamily: fonts.mono }]}>SPOTIFY</Text>
          <Text style={[styles.hintText, { color: colors.ink3, fontFamily: fonts.body }]}>
            Spotify import requires OAuth and is coming in a future update. Your albums can be logged manually from the + button.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: colors.accent }]}
            onPress={onNext}
            activeOpacity={0.8}
          >
            <Text style={[styles.continueBtnText, { color: colors.accentt, fontFamily: fonts.mono }]}>
              {anyImported ? 'CONTINUE →' : 'CONTINUE WITHOUT IMPORTING →'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={[styles.skipText, { color: colors.ink3, fontFamily: fonts.mono }]}>
              SKIP FOR NOW
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  watermark: {
    position: 'absolute', fontSize: 120, opacity: 0.03,
    bottom: -10, right: -10, letterSpacing: 6,
  },
  content: { paddingHorizontal: 32, paddingTop: 100, paddingBottom: 40, gap: 20 },
  heading: { fontSize: 40, letterSpacing: 3, lineHeight: 44 },
  sub: { fontSize: 14, fontStyle: 'italic', lineHeight: 20, marginTop: -8 },
  services: { gap: 12, marginTop: 8 },
  service: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, overflow: 'hidden',
  },
  serviceBar: { width: 3, alignSelf: 'stretch' },
  serviceText: { flex: 1, padding: 16, gap: 4 },
  serviceLabel: { fontSize: 20, letterSpacing: 2 },
  serviceSub: { fontSize: 13, fontStyle: 'italic' },
  arrow: { paddingRight: 16, fontSize: 16 },
  hint: {
    borderWidth: 1, padding: 14, gap: 6,
  },
  hintTitle: { fontSize: 9, letterSpacing: 2 },
  hintText: { fontSize: 13, fontStyle: 'italic', lineHeight: 18 },
  actions: { gap: 12, marginTop: 8 },
  continueBtn: {
    height: 52, alignItems: 'center', justifyContent: 'center',
  },
  continueBtnText: { fontSize: 12, letterSpacing: 2 },
  skipBtn: { alignSelf: 'center', padding: 12 },
  skipText: { fontSize: 10, letterSpacing: 2 },
});
