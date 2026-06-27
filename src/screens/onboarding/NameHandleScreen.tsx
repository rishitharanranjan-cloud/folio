import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { fonts } from '../../theme/tokens';

interface Props {
  onNext: (name?: string) => void;
}

export default function NameHandleScreen({ onNext }: Props) {
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);

  const canContinue = name.trim().length > 0 && handle.trim().length > 1;

  const handleSave = async () => {
    if (!canContinue || !user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('users').upsert({
        id: user.id,
        name: name.trim(),
        handle: handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        mode: useThemeStore.getState().mode,
      });
      if (error) throw error;
      onNext(name.trim());
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={[styles.watermark, { color: colors.ink }]}>NAME</Text>

      <View style={styles.content}>
        <Text style={[styles.heading, { color: colors.ink, fontFamily: fonts.display }]}>
          WHO ARE YOU?
        </Text>
        <Text style={[styles.sub, { color: colors.ink3, fontFamily: fonts.body }]}>
          You can always change this later.
        </Text>

        <View style={styles.fields}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.ink3, fontFamily: fonts.mono }]}>NAME</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg3, color: colors.ink, borderColor: colors.border2, fontFamily: fonts.ui }]}
              placeholder="Your name"
              placeholderTextColor={colors.ink3}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.ink3, fontFamily: fonts.mono }]}>HANDLE</Text>
            <View style={[styles.handleRow, { backgroundColor: colors.bg3, borderColor: colors.border2 }]}>
              <Text style={[styles.at, { color: colors.ink3, fontFamily: fonts.mono }]}>@</Text>
              <TextInput
                style={[styles.handleInput, { color: colors.ink, fontFamily: fonts.mono }]}
                placeholder="yourhandle"
                placeholderTextColor={colors.ink3}
                value={handle}
                onChangeText={(t) => setHandle(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
        </View>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  watermark: {
    position: 'absolute',
    fontFamily: fonts.display,
    fontSize: 180,
    opacity: 0.03,
    bottom: -10,
    right: -10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 100,
    gap: 24,
  },
  heading: {
    fontSize: 40,
    letterSpacing: 4,
  },
  sub: {
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: -12,
  },
  fields: {
    gap: 20,
    marginTop: 8,
  },
  fieldGroup: { gap: 8 },
  label: {
    fontSize: 10,
    letterSpacing: 2,
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  handleRow: {
    height: 48,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  at: {
    fontSize: 16,
    marginRight: 4,
  },
  handleInput: {
    flex: 1,
    fontSize: 16,
  },
  cta: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ctaText: {
    fontSize: 13,
    letterSpacing: 2,
  },
});
