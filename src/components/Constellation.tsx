/**
 * Constellation component — four views of your logged cultural life.
 * MAP: media-type star clusters · TIMELINE: chronological scatter
 * MEDIUM: bar chart by type   · LINKS: creator connection graph
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Rect, G } from 'react-native-svg';
import { useThemeStore } from '../store/themeStore';
import { buildConstellation, buildConnectionGroups } from '../lib/constellation';
import { clampAmbient, hexToRgb, ambientToHex } from '../lib/ambientColour';
import { fonts } from '../theme/tokens';
import type { LogEntry } from '../hooks/useLogs';

type ConstellationView = 'map' | 'timeline' | 'medium' | 'links';

interface Props {
  logs: LogEntry[];
  tasteSeeds: { id: string; name: string; type: string }[];
  width?: number;
  height?: number;
  showLabels?: boolean;
}

const DEFAULT_W = Dimensions.get('window').width - 48;
const DEFAULT_H = DEFAULT_W * 0.75;

const VIEWS: ConstellationView[] = ['map', 'timeline', 'medium', 'links'];
const VIEW_LABEL: Record<ConstellationView, string> = {
  map: 'MAP', timeline: 'TIME', medium: 'MEDIUM', links: 'LINKS',
};

const MEDIA_ORDER = ['book', 'film', 'album', 'tv', 'podcast', 'game'];
const MEDIA_DISPLAY: Record<string, string> = {
  book: 'BOOKS', film: 'FILMS', album: 'ALBUMS',
  tv: 'TV', podcast: 'PODS', game: 'GAMES',
};

const REGION_LABELS = [
  { label: 'BOOKS',  x: 0.04, y: 0.03 },
  { label: 'FILMS',  x: 0.56, y: 0.03 },
  { label: 'ALBUMS', x: 0.04, y: 0.97 },
  { label: 'TV',     x: 0.56, y: 0.97 },
];

// Shared SVG canvas with background rect — avoids repeating in every view branch
function SvgCanvas({ width, height, bg, children }: {
  width: number; height: number; bg: string; children: React.ReactNode;
}) {
  return (
    <Svg width={width} height={height}>
      <Rect x={0} y={0} width={width} height={height} fill={bg} />
      {children}
    </Svg>
  );
}

export default function Constellation({
  logs,
  tasteSeeds,
  width = DEFAULT_W,
  height = DEFAULT_H,
  showLabels = true,
}: Props) {
  const { mode, colors } = useThemeStore();
  const [view, setView] = useState<ConstellationView>('map');
  const isDark = mode === 'dark';

  // Memoised so timelineStars doesn't invalidate on every render
  const mediaColour = useMemo<Record<string, string>>(() => ({
    book:    colors.editorial,
    film:    colors.accent,
    album:   colors.streak,
    tv:      colors.ink2,
    podcast: colors.terra,
    game:    colors.accentd,
  }), [colors.editorial, colors.accent, colors.streak, colors.ink2, colors.terra, colors.accentd]);

  // Mode-specific colours
  const bgColour         = isDark ? '#030508'                : colors.bg3;
  const lineColour       = isDark ? 'rgba(138,184,232,0.42)' : colors.accentg;
  const starColour       = isDark ? '#8ab8e8'                : colors.editorial;
  const dimColour        = isDark ? 'rgba(138,184,232,0.25)' : colors.accentg;
  const labelColour      = isDark ? 'rgba(224,234,248,0.5)'  : colors.ink3;
  const gridColour       = isDark ? 'rgba(96,152,200,0.06)'  : 'rgba(0,0,0,0.04)';
  const regionLabelColour = isDark ? 'rgba(96,152,200,0.25)' : colors.ink3;

  // ── MAP data ───────────────────────────────────────────────────────────────
  const { stars: mapStars, lines: mapLines } = useMemo(
    () => buildConstellation(logs, tasteSeeds, starColour, dimColour),
    [logs, tasteSeeds, starColour, dimColour],
  );

  // Clamp dominant colours for map stars (UI chrome rule)
  const mapStarsClamped = useMemo(() => mapStars.map(s => {
    if (s.mediaType === 'taste') return s;
    const raw = hexToRgb(s.colour);
    if (!raw) return s;
    return { ...s, colour: ambientToHex(clampAmbient(raw, isDark)) };
  }), [mapStars, isDark]);

  // ── TIMELINE data ──────────────────────────────────────────────────────────
  const { timelineStars, earliestLoggedAt } = useMemo(() => {
    if (!logs.length) return { timelineStars: [], earliestLoggedAt: null };
    const sorted = [...logs].sort(
      (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
    );
    const t0 = new Date(sorted[0].logged_at).getTime();
    const t1 = new Date(sorted[sorted.length - 1].logged_at).getTime();
    const tRange = t1 - t0 || 1;
    const stars = sorted.map((log, i) => {
      const x = 0.04 + ((new Date(log.logged_at).getTime() - t0) / tRange) * 0.92;
      const y = log.rating
        ? 0.04 + (1 - (log.rating - 1) / 4) * 0.82   // high rating = top
        : 0.45 + (i % 7) * 0.02;                       // unrated: gentle scatter
      return {
        id: log.id,
        x, y,
        r: log.rating ? 1.8 + (log.rating - 1) * 0.5 : 2,
        colour: mediaColour[log.media_type] ?? starColour,
        label: log.title,
        mediaType: log.media_type,
        rating: log.rating,
      };
    });
    return { timelineStars: stars, earliestLoggedAt: sorted[0].logged_at };
  }, [logs, mediaColour, starColour]);

  // ── MEDIUM data ────────────────────────────────────────────────────────────
  const mediumCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of logs) {
      counts[log.media_type] = (counts[log.media_type] ?? 0) + 1;
    }
    return MEDIA_ORDER
      .map(k => ({ key: k, count: counts[k] ?? 0 }))
      .filter(m => m.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [logs]);

  const maxCount = mediumCounts[0]?.count ?? 1;

  // ── LINKS data ─────────────────────────────────────────────────────────────
  const { linkedStars, linkLines, connectedIds, groupCount } = useMemo(() => {
    const logStars = mapStarsClamped.filter(s => s.mediaType !== 'taste');
    const groups = buildConnectionGroups(logStars);
    const connectedIds = new Set<string>();
    const linkLines: { x1: number; y1: number; x2: number; y2: number; colour: string }[] = [];
    for (const [, group] of groups) {
      group.forEach(s => connectedIds.add(s.id));
      for (let i = 0; i < group.length - 1; i++) {
        linkLines.push({
          x1: group[i].x, y1: group[i].y,
          x2: group[i + 1].x, y2: group[i + 1].y,
          colour: starColour,
        });
      }
    }
    return { linkedStars: mapStarsClamped, linkLines, connectedIds, groupCount: groups.size };
  }, [mapStarsClamped, starColour]);

  // ── Grid lines ─────────────────────────────────────────────────────────────
  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 1; i < 6; i++) {
      const x = (i / 6) * width;
      const y = (i / 6) * height;
      lines.push({ x1: x, y1: 0, x2: x, y2: height });
      lines.push({ x1: 0, y1: y, x2: width, y2: y });
    }
    return lines;
  }, [width, height]);

  // Scale helpers
  const sx = (x: number) => x * width;
  const sy = (y: number) => y * height;

  // ── Insight text ───────────────────────────────────────────────────────────
  const insight = useMemo(() => {
    if (!logs.length) return 'Log things to build your star map';
    const total = logs.length;
    const rated = logs.filter(l => l.rating);
    const avg = rated.length
      ? (rated.reduce((s, l) => s + (l.rating ?? 0), 0) / rated.length).toFixed(1)
      : null;
    const topMedium = mediumCounts[0];

    if (view === 'map') {
      const types = mediumCounts.length;
      return avg
        ? `${total} logged across ${types} media type${types !== 1 ? 's' : ''} · avg rating ${avg}`
        : `${total} logged across ${types} media type${types !== 1 ? 's' : ''}`;
    }
    if (view === 'timeline') {
      const monthName = earliestLoggedAt
        ? new Date(earliestLoggedAt).toLocaleString('en-GB', { month: 'long', year: 'numeric' })
        : '';
      const thisYear = new Date().getFullYear();
      const yearCount = logs.filter(l => new Date(l.logged_at).getFullYear() === thisYear).length;
      return `Logging since ${monthName} · ${yearCount} logged this year`;
    }
    if (view === 'medium') {
      if (!topMedium) return 'No logs yet';
      const pct = Math.round((topMedium.count / total) * 100);
      return `Mostly ${MEDIA_DISPLAY[topMedium.key] ?? topMedium.key} · ${pct}% of your shelf`;
    }
    if (view === 'links') {
      if (!groupCount) return 'No creators appear more than once yet';
      return `${groupCount} creator${groupCount !== 1 ? 's' : ''} with multiple entries · ${connectedIds.size} connected log${connectedIds.size !== 1 ? 's' : ''}`;
    }
    return '';
  }, [logs, view, mediumCounts, connectedIds, groupCount, earliestLoggedAt]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.outer}>
      {/* View switcher */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {VIEWS.map(v => (
          <TouchableOpacity
            key={v}
            style={styles.tab}
            onPress={() => setView(v)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.tabText,
              { fontFamily: fonts.mono, color: view === v ? colors.accent : colors.ink3 },
            ]}>
              {VIEW_LABEL[v]}
            </Text>
            {view === v && (
              <View style={[styles.tabUnderline, { backgroundColor: colors.accent }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Canvas */}
      <View style={[styles.canvas, { width, height }]}>
        {view === 'map' && (
          <SvgCanvas width={width} height={height} bg={bgColour}>
            {gridLines.map((l, i) => (
              <Line key={`g${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke={gridColour} strokeWidth={0.5} />
            ))}
            {mapLines.map((l, i) => (
              <Line key={`l${i}`} x1={sx(l.x1)} y1={sy(l.y1)} x2={sx(l.x2)} y2={sy(l.y2)}
                stroke={lineColour} strokeWidth={0.75} strokeDasharray="2,4" />
            ))}
            {mapStarsClamped.map(star => (
              <G key={star.id}>
                <Circle cx={sx(star.x)} cy={sy(star.y)} r={star.r * 2.5}
                  fill={star.colour} opacity={0.08} />
                <Circle cx={sx(star.x)} cy={sy(star.y)} r={star.r}
                  fill={star.colour} opacity={star.mediaType === 'taste' ? 0.4 : 1} />
                {showLabels && star.mediaType !== 'taste' && (
                  <SvgText x={sx(star.x) + star.r + 3} y={sy(star.y) + 3}
                    fontSize={7} fill={labelColour} fontFamily="SpaceMono_400Regular">
                    {star.label.length > 18 ? star.label.slice(0, 16) + '…' : star.label}
                  </SvgText>
                )}
              </G>
            ))}
            {REGION_LABELS.map(r => (
              <SvgText key={r.label} x={sx(r.x)} y={sy(r.y)}
                fontSize={6} fill={regionLabelColour}
                fontFamily="SpaceMono_400Regular">
                {r.label}
              </SvgText>
            ))}
          </SvgCanvas>
        )}

        {view === 'timeline' && (
          <SvgCanvas width={width} height={height} bg={bgColour}>
            {[1,2,3,4,5].map(r => {
              const y = sy(0.04 + (1 - (r - 1) / 4) * 0.82);
              return (
                <G key={r}>
                  <Line x1={sx(0.02)} y1={y} x2={sx(0.98)} y2={y}
                    stroke={gridColour} strokeWidth={0.5} />
                  <SvgText x={sx(0.01)} y={y + 3} fontSize={6}
                    fill={labelColour} fontFamily="SpaceMono_400Regular">
                    {r}★
                  </SvgText>
                </G>
              );
            })}
            {timelineStars.map(star => (
              <G key={star.id}>
                <Circle cx={sx(star.x)} cy={sy(star.y)} r={star.r * 2}
                  fill={star.colour} opacity={0.1} />
                <Circle cx={sx(star.x)} cy={sy(star.y)} r={star.r}
                  fill={star.colour} opacity={0.9} />
              </G>
            ))}
            <SvgText x={sx(0.04)} y={height - 4} fontSize={6}
              fill={labelColour} fontFamily="SpaceMono_400Regular">
              EARLIER
            </SvgText>
            <SvgText x={sx(0.75)} y={height - 4} fontSize={6}
              fill={labelColour} fontFamily="SpaceMono_400Regular">
              MORE RECENT →
            </SvgText>
          </SvgCanvas>
        )}

        {view === 'medium' && (
          <SvgCanvas width={width} height={height} bg={bgColour}>
            {mediumCounts.length === 0 ? (
              <SvgText x={sx(0.5)} y={sy(0.5)} fontSize={11}
                fill={labelColour} fontFamily="SpaceMono_400Regular" textAnchor="middle">
                NO LOGS YET
              </SvgText>
            ) : mediumCounts.map((m, i) => {
              const barMaxW = width * 0.68;
              const barW = (m.count / maxCount) * barMaxW;
              const rowH = Math.min(28, (height - 40) / mediumCounts.length);
              const y = 20 + i * (rowH + 6);
              const colour = mediaColour[m.key] ?? starColour;
              return (
                <G key={m.key}>
                  <SvgText x={8} y={y + rowH * 0.7} fontSize={8}
                    fill={colour} fontFamily="SpaceMono_400Regular">
                    {MEDIA_DISPLAY[m.key] ?? m.key}
                  </SvgText>
                  <Rect x={width * 0.22} y={y} width={barMaxW} height={rowH}
                    fill={colour} opacity={0.08} rx={2} />
                  <Rect x={width * 0.22} y={y} width={barW} height={rowH}
                    fill={colour} opacity={0.7} rx={2} />
                  <SvgText x={width * 0.22 + barW + 6} y={y + rowH * 0.7}
                    fontSize={8} fill={labelColour} fontFamily="SpaceMono_400Regular">
                    {m.count}
                  </SvgText>
                </G>
              );
            })}
          </SvgCanvas>
        )}

        {view === 'links' && (
          <SvgCanvas width={width} height={height} bg={bgColour}>
            {gridLines.map((l, i) => (
              <Line key={`g${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                stroke={gridColour} strokeWidth={0.5} />
            ))}
            {linkedStars.filter(s => s.mediaType !== 'taste' && !connectedIds.has(s.id)).map(s => (
              <Circle key={s.id} cx={sx(s.x)} cy={sy(s.y)} r={s.r * 0.7}
                fill={starColour} opacity={0.12} />
            ))}
            {linkLines.map((l, i) => (
              <Line key={`ll${i}`} x1={sx(l.x1)} y1={sy(l.y1)} x2={sx(l.x2)} y2={sy(l.y2)}
                stroke={l.colour} strokeWidth={1} opacity={0.6} />
            ))}
            {linkedStars.filter(s => connectedIds.has(s.id)).map(s => (
              <G key={s.id}>
                <Circle cx={sx(s.x)} cy={sy(s.y)} r={s.r * 2.5}
                  fill={s.colour} opacity={0.12} />
                <Circle cx={sx(s.x)} cy={sy(s.y)} r={s.r}
                  fill={s.colour} opacity={1} />
                {showLabels && (
                  <SvgText x={sx(s.x) + s.r + 3} y={sy(s.y) + 3}
                    fontSize={7} fill={labelColour} fontFamily="SpaceMono_400Regular">
                    {s.label.length > 16 ? s.label.slice(0, 14) + '…' : s.label}
                  </SvgText>
                )}
              </G>
            ))}
            {connectedIds.size === 0 && (
              <SvgText x={sx(0.5)} y={sy(0.5)} fontSize={9}
                fill={labelColour} fontFamily="SpaceMono_400Regular" textAnchor="middle">
                LOG MORE BY THE SAME CREATOR
              </SvgText>
            )}
          </SvgCanvas>
        )}
      </View>

      {/* Insight */}
      <View style={[styles.insightRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.insightText, { color: colors.ink3, fontFamily: fonts.mono }]}
          numberOfLines={2}>
          {insight}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { gap: 0 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 24,
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'relative',
    alignItems: 'center',
  },
  tabText: { fontSize: 9, letterSpacing: 1.5 },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: 1.5,
  },
  canvas: { overflow: 'hidden' },
  insightRow: {
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 10,
    minHeight: 36,
    justifyContent: 'center',
  },
  insightText: { fontSize: 9, letterSpacing: 1, lineHeight: 14 },
});
