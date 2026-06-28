import React from 'react';
import Svg, { Rect, Circle } from 'react-native-svg';
import { FOLIO_CODE_COLOURS, type ThemeMode } from '../theme/tokens';

// Named size → numeric height. Width is always height × (32/12).
const SIZE_MAP = { small: 12, medium: 20, large: 32 } as const;
type SizeVariant = keyof typeof SIZE_MAP;

interface Props {
  // Named size variant (preferred)
  size?: SizeVariant;
  // Raw numeric height override (legacy / fine-grained)
  height?: number;
  // Per-element colours — pass all three or none
  blocksColor?: string;
  barColor?: string;
  dotColor?: string;
  // Convenience: single colour for all elements (lowest priority)
  color?: string;
  // Auto-colour from theme when no colour props are provided
  mode?: ThemeMode;
}

/**
 * Folio Code Mark — morse/barcode-inspired identity mark.
 * Elements (left → right): sq · sq · tall bar · sq · dot
 *
 * Colour resolution order (first wins):
 *   1. blocksColor / barColor / dotColor  (explicit per-element)
 *   2. color                              (single colour for all)
 *   3. FOLIO_CODE_COLOURS[mode]           (theme-aware defaults)
 *   4. FOLIO_CODE_COLOURS.dark            (absolute fallback)
 */
export default function FolioCodeMark({
  size = 'small',
  height: heightProp,
  blocksColor,
  barColor,
  dotColor,
  color,
  mode = 'dark',
}: Props) {
  const H = heightProp ?? SIZE_MAP[size];
  const W = H * (32 / 12);
  const s = H / 12;

  const themed = FOLIO_CODE_COLOURS[mode];
  const resolvedBlocks = blocksColor ?? color ?? themed.blocks;
  const resolvedBar    = barColor    ?? color ?? themed.bar;
  const resolvedDot    = dotColor    ?? color ?? themed.dot;

  // Element dimensions (scaled by s)
  const sq   = 4 * s;
  const barH = 12 * s;
  const barW = 4 * s;
  const gap  = 3 * s;
  const r    = 2 * s;
  const cy   = H / 2;

  const x1 = 0;
  const x2 = x1 + sq + gap;
  const x3 = x2 + sq + gap;
  const x4 = x3 + barW + gap;
  const x5 = x4 + sq + gap + r;

  const sqY = cy - sq / 2;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={x1} y={sqY} width={sq} height={sq} fill={resolvedBlocks} />
      <Rect x={x2} y={sqY} width={sq} height={sq} fill={resolvedBlocks} />
      <Rect x={x3} y={0}   width={barW} height={barH} fill={resolvedBar} />
      <Rect x={x4} y={sqY} width={sq} height={sq} fill={resolvedBlocks} />
      <Circle cx={x5} cy={cy} r={r} fill={resolvedDot} />
    </Svg>
  );
}
