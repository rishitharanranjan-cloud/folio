import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { fonts } from '../theme/tokens';

interface Props {
  logged: number;
  goal: number | null;
  color: string;
  dimColor: string;
  inkColor: string;
  ink3Color: string;
  size?: number;
  onPress?: () => void;
}

export default function GoalRing({
  logged, goal, color, dimColor, inkColor, ink3Color, size = 100, onPress,
}: Props) {
  const r = (size - 12) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const progress = goal && goal > 0 ? Math.min(logged / goal, 1) : 0;

  // Arc path: start at top (−π/2), sweep clockwise
  function describeArc(pct: number) {
    if (pct <= 0) return '';
    const angle = pct >= 1 ? 359.99 : pct * 360;
    const rad = (angle - 90) * (Math.PI / 180);
    const startX = cx + r * Math.cos(-Math.PI / 2);
    const startY = cy + r * Math.sin(-Math.PI / 2);
    const endX = cx + r * Math.cos(rad);
    const endY = cy + r * Math.sin(rad);
    const largeArc = angle > 180 ? 1 : 0;
    return `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`;
  }

  const label = goal
    ? `${logged} / ${goal}`
    : `${logged}`;
  const sublabel = goal ? 'THIS YEAR' : 'LOGGED';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {/* Background track */}
          <Circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={dimColor}
            strokeWidth={6}
          />
          {/* Progress arc */}
          {progress > 0 && (
            <Path
              d={describeArc(progress)}
              fill="none"
              stroke={color}
              strokeWidth={6}
              strokeLinecap="round"
            />
          )}
        </Svg>
        <Text style={{ fontFamily: fonts.display, fontSize: size * 0.22, color: inkColor, lineHeight: size * 0.26 }}>
          {label}
        </Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: size * 0.08, color: ink3Color, letterSpacing: 1 }}>
          {sublabel}
        </Text>
        {!goal && (
          <Text style={{ fontFamily: fonts.mono, fontSize: size * 0.07, color: color, letterSpacing: 1, marginTop: 2 }}>
            SET GOAL
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
