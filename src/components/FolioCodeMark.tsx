import React from 'react';
import Svg, { Rect, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

// Folio Code Mark — morse/barcode-inspired identity mark
// Elements (left to right): sq · sq · tall bar · sq · dot
// ViewBox: 0 0 32 12  →  height = size prop, width = size * (32/12)
export default function FolioCodeMark({ size = 24, color = '#4a90d4' }: Props) {
  const W = size * (32 / 12);
  const H = size;
  const s = size / 12; // scale factor

  // Element dimensions (in viewBox units, scaled by s)
  const sq = 4 * s;       // square side
  const barH = 12 * s;    // tall bar height = full height
  const barW = 4 * s;
  const gap = 3 * s;
  const r = 2 * s;        // dot radius
  const cy = H / 2;       // vertical center

  // X positions
  const x1 = 0;
  const x2 = x1 + sq + gap;
  const x3 = x2 + sq + gap;       // tall bar
  const x4 = x3 + barW + gap;
  const x5 = x4 + sq + gap + r;   // dot center

  const sqY = cy - sq / 2;        // vertical center for squares

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* sq 1 */}
      <Rect x={x1} y={sqY} width={sq} height={sq} fill={color} />
      {/* sq 2 */}
      <Rect x={x2} y={sqY} width={sq} height={sq} fill={color} />
      {/* tall bar */}
      <Rect x={x3} y={0} width={barW} height={barH} fill={color} />
      {/* sq 3 */}
      <Rect x={x4} y={sqY} width={sq} height={sq} fill={color} />
      {/* dot */}
      <Circle cx={x5} cy={cy} r={r} fill={color} />
    </Svg>
  );
}
