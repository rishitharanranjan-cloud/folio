import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { fonts } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';

interface Props {
  onAuth: () => void;
}

export default function AuthScreen({ onAuth }: Props) {
  const [loading, setLoading] = useState(false);

  // OAuth providers will be wired once app credentials are configured.
  // For now we use a magic-link / dev bypass so the full flow is testable.
  const handleDevBypass = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        // Anonymous auth not enabled — guide the user
        if (error.message.includes('not enabled') || error.message.includes('anonymous')) {
          Alert.alert(
            'One-time setup needed',
            'Enable Anonymous Sign-ins in your Supabase dashboard:\n\nAuthentication → Providers → Anonymous Sign-ins → toggle ON',
          );
        } else {
          throw error;
        }
        return;
      }
      onAuth();
    } catch (err: any) {
      Alert.alert('Auth error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApple = () => {
    Alert.alert(
      'Apple Sign-In',
      'Requires Apple Developer account + EAS build. Use Dev Login for now.',
    );
  };

  const handleGoogle = () => {
    Alert.alert(
      'Google Sign-In',
      'Requires Google Cloud credentials + EAS build. Use Dev Login for now.',
    );
  };

  return (
    <View style={styles.container}>
      {/* Background watermark */}
      <Text style={styles.watermark}>FOLIO</Text>

      <View style={styles.content}>
        <Text style={styles.wordmark}>FOLIO</Text>
        <Text style={styles.sub}>your cultural life, logged</Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.appleBtn} onPress={handleApple} activeOpacity={0.8}>
            <Text style={styles.appleBtnText}>  Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} activeOpacity={0.8}>
            <Text style={styles.googleBtnText}>G  Continue with Google</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleDevBypass} disabled={loading} style={styles.devBtn}>
          {loading
            ? <ActivityIndicator color="#607890" />
            : <Text style={styles.devBtnText}>Dev login →</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060810',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermark: {
    position: 'absolute',
    fontFamily: fonts.display,
    fontSize: 220,
    color: 'rgba(224,234,248,0.03)',
    letterSpacing: 8,
    bottom: -20,
    right: -20,
  },
  content: {
    width: '100%',
    paddingHorizontal: 32,
    gap: 16,
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 56,
    color: '#e0eaf8',
    letterSpacing: 12,
    marginBottom: 4,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: '#607890',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  appleBtn: {
    backgroundColor: '#e0eaf8',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleBtnText: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: '#060810',
    letterSpacing: 1,
  },
  googleBtn: {
    backgroundColor: 'transparent',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#182030',
  },
  googleBtnText: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: '#e0eaf8',
    letterSpacing: 1,
  },
  devBtn: {
    marginTop: 8,
    padding: 12,
  },
  devBtnText: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: '#607890',
    letterSpacing: 1,
  },
});
