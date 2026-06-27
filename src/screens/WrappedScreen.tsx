import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Modal,
} from 'react-native';
import { useLogs } from '../hooks/useLogs';
import { computeWrapped } from '../lib/wrappedData';
import Chapter0Intro         from './wrapped/Chapter0Intro';
import Chapter1GrandPick     from './wrapped/Chapter1GrandPick';
import Chapter2Numbers       from './wrapped/Chapter2Numbers';
import Chapter3TastePortrait from './wrapped/Chapter3TastePortrait';
import Chapter4BookOfYear    from './wrapped/Chapter4BookOfYear';
import Chapter5FilmOfYear    from './wrapped/Chapter5FilmOfYear';
import Chapter6AlbumOfYear   from './wrapped/Chapter6AlbumOfYear';
import Chapter7Adventurous   from './wrapped/Chapter7Adventurous';
import Chapter8Share         from './wrapped/Chapter8Share';
import { W } from './wrapped/palette';
import { fonts } from '../theme/tokens';

const { width: SCREEN_W } = Dimensions.get('window');
const CHAPTER_COUNT = 9;

interface Props {
  year?: number;
  onClose: () => void;
}

export default function WrappedScreen({ year = new Date().getFullYear(), onClose }: Props) {
  const { logs, loading } = useLogs();
  const [chapter, setChapter] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const data = React.useMemo(() => computeWrapped(logs, year), [logs, year]);

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= CHAPTER_COUNT) return;
    setChapter(idx);
    scrollRef.current?.scrollTo({ x: idx * SCREEN_W, animated: true });
  };

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (idx !== chapter) setChapter(idx);
  };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: W.ink }]}>
        <ActivityIndicator color={W.mustard} size="large" />
      </View>
    );
  }

  const chapters = [
    <Chapter0Intro         key={0} data={data} />,
    <Chapter1GrandPick     key={1} data={data} />,
    <Chapter2Numbers       key={2} data={data} />,
    <Chapter3TastePortrait key={3} data={data} />,
    <Chapter4BookOfYear    key={4} data={data} />,
    <Chapter5FilmOfYear    key={5} data={data} />,
    <Chapter6AlbumOfYear   key={6} data={data} />,
    <Chapter7Adventurous   key={7} data={data} />,
    <Chapter8Share         key={8} data={data} onClose={onClose} />,
  ];

  return (
    <View style={styles.container}>
      {/* Horizontal pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {chapters}
      </ScrollView>

      {/* Navigation overlay */}
      <View style={styles.nav} pointerEvents="box-none">
        {/* Left tap zone */}
        {chapter > 0 && (
          <TouchableOpacity style={styles.navLeft} onPress={() => goTo(chapter - 1)} activeOpacity={0.0} />
        )}

        {/* Dots */}
        <View style={styles.dots}>
          {Array.from({ length: CHAPTER_COUNT }).map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <View style={[
                styles.dot,
                {
                  backgroundColor: i === chapter ? W.cream : 'rgba(245,237,216,0.3)',
                  width: i === chapter ? 16 : 6,
                }
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Right tap zone */}
        {chapter < CHAPTER_COUNT - 1 && (
          <TouchableOpacity style={styles.navRight} onPress={() => goTo(chapter + 1)} activeOpacity={0.0} />
        )}
      </View>

      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
        <Text style={[styles.closeBtnText, { fontFamily: fonts.mono }]}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pager: { flex: 1 },
  nav: {
    position: 'absolute',
    left: 0, right: 0, bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLeft: {
    position: 'absolute',
    left: 0, top: -300, bottom: -40,
    width: SCREEN_W * 0.25,
  },
  navRight: {
    position: 'absolute',
    right: 0, top: -300, bottom: -40,
    width: SCREEN_W * 0.25,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  closeBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    padding: 10,
  },
  closeBtnText: {
    color: 'rgba(245,237,216,0.6)',
    fontSize: 16,
  },
});
