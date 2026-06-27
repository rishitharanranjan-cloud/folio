import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useThemeStore } from '../../store/themeStore';
import { fonts } from '../../theme/tokens';

interface Props {
  name: string;
  onEnter: () => void;
}

export default function ReadyScreen({ name, onEnter }: Props) {
  const { colors } = useThemeStore();
  const opacity1 = useSharedValue(0);
  const opacity2 = useSharedValue(0);
  const opacity3 = useSharedValue(0);

  useEffect(() => {
    opacity1.value = withTiming(1, { duration: 600 });
    opacity2.value = withDelay(400, withTiming(1, { duration: 600 }));
    opacity3.value = withDelay(900, withTiming(1, { duration: 600 }));
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: opacity1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: opacity2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: opacity3.value }));

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <Animated.Text style={[styles.greeting, { color: colors.ink3, fontFamily: fonts.body }, s1]}>
          welcome,
        </Animated.Text>
        <Animated.Text style={[styles.name, { color: colors.ink, fontFamily: fonts.display }, s2]}>
          {name.toUpperCase() || 'READER'}
        </Animated.Text>
        <Animated.Text style={[styles.sub, { color: colors.ink2, fontFamily: fonts.body }, s2]}>
          Your cultural life starts now.
        </Animated.Text>

        <Animated.View style={s3}>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: colors.accent }]}
            onPress={onEnter}
            activeOpacity={0.8}
          >
            <Text style={[styles.ctaText, { color: colors.accentt, fontFamily: fonts.mono }]}>
              OPEN FOLIO
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', gap: 12, paddingHorizontal: 32 },
  greeting: { fontSize: 18, fontStyle: 'italic' },
  name: { fontSize: 56, letterSpacing: 6, textAlign: 'center' },
  sub: { fontSize: 15, fontStyle: 'italic', marginBottom: 32 },
  cta: { paddingHorizontal: 40, height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 13, letterSpacing: 3 },
});
