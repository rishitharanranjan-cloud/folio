/**
 * Constellation component — SVG star map.
 * Dark mode: deep space, cold blue-white stars, lines rgba(138,184,232,0.42)
 * Light mode: cognac background, cream stars, atlas grid lines at low opacity
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, Rect, G } from 'react-native-svg';
import { useThemeStore } from '../store/themeStore';
import { buildConstellation } from '../lib/constellation';
import type { LogEntry } from '../hooks/useLogs';

interface Props {
  logs: LogEntry[];
  tasteSeeds: { id: string; name: string; type: string }[];
  width?: number;
  height?: number;
  showLabels?: boolean;
}

const DEFAULT_W = Dimensions.get('window').width - 48;
const DEFAULT_H = DEFAULT_W * 0.75;

export default function Constellation({
  logs,
  tasteSeeds,
  width = DEFAULT_W,
  height = DEFAULT_H,
  showLabels = true,
}: Props) {
  const { mode, colors } = useThemeStore();

  const isDark = mode === 'dark';

  // Mode-specific colours
  const bgColour    = isDark ? '#030508' : '#a87030';
  const lineColour  = isDark ? 'rgba(138,184,232,0.42)' : 'rgba(245,237,216,0.3)';
  const starColour  = isDark ? '#8ab8e8' : '#f5edd8';
  const dimColour   = isDark ? 'rgba(138,184,232,0.25)' : 'rgba(245,237,216,0.25)';
  const labelColour = isDark ? 'rgba(224,234,248,0.5)' : 'rgba(245,237,216,0.6)';
  const gridColour  = isDark ? 'rgba(96,152,200,0.06)' : 'rgba(245,237,216,0.08)';

  const { stars, lines } = useMemo(
    () => buildConstellation(logs, tasteSeeds, starColour, dimColour),
    [logs, tasteSeeds, starColour, dimColour],
  );

  // Scale normalised coords to canvas
  const sx = (x: number) => x * width;
  const sy = (y: number) => y * height;

  // Atlas grid lines (light mode) or subtle grid (dark)
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

  return (
    <View style={[styles.wrapper, { width, height }]}>
      <Svg width={width} height={height}>
        {/* Background */}
        <Rect x={0} y={0} width={width} height={height} fill={bgColour} />

        {/* Grid */}
        {gridLines.map((l, i) => (
          <Line key={`g${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={gridColour} strokeWidth={0.5} />
        ))}

        {/* Connection lines */}
        {lines.map((l, i) => (
          <Line
            key={`l${i}`}
            x1={sx(l.x1)} y1={sy(l.y1)}
            x2={sx(l.x2)} y2={sy(l.y2)}
            stroke={lineColour}
            strokeWidth={0.75}
            strokeDasharray="2,4"
          />
        ))}

        {/* Stars */}
        {stars.map((star) => (
          <G key={star.id}>
            {/* Glow halo */}
            <Circle
              cx={sx(star.x)} cy={sy(star.y)}
              r={star.r * 2.5}
              fill={star.colour}
              opacity={0.08}
            />
            {/* Star body */}
            <Circle
              cx={sx(star.x)} cy={sy(star.y)}
              r={star.r}
              fill={star.colour}
              opacity={star.mediaType === 'taste' ? 0.4 : 1}
            />
            {/* Label */}
            {showLabels && star.mediaType !== 'taste' && (
              <SvgText
                x={sx(star.x) + star.r + 3}
                y={sy(star.y) + 3}
                fontSize={7}
                fill={labelColour}
                fontFamily="SpaceMono_400Regular"
              >
                {star.label.length > 18 ? star.label.slice(0, 16) + '…' : star.label}
              </SvgText>
            )}
          </G>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
});
