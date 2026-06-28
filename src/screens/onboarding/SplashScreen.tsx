import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { fonts } from '../../theme/tokens';
import FolioCodeMark from '../../components/FolioCodeMark';

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withTiming(1, { duration: 600 });

    opacity.value = withDelay(
      2000,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      })
    );

    // Fallback for web where Reanimated callbacks may not fire
    const timer = setTimeout(onFinish, 2800);
    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.inner, animStyle]}>
        <FolioCodeMark size="medium" mode="dark" />
        <Text style={styles.wordmark}>folio.</Text>
        <Text style={styles.tagline}>your cultural life, logged</Text>
      </Animated.View>
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
  inner: {
    alignItems: 'center',
    gap: 12,
  },
  wordmark: {
    fontFamily: fonts.brand,
    fontSize: 64,
    color: '#EAF0F2',
    letterSpacing: 4,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: '#607890',
    fontStyle: 'italic',
  },
});
