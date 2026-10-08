import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

type Seg = { value: number; color: string };

/** 도넛 차트. segments 합이 total보다 작으면 나머지는 trackColor로 표시(남은 예산). */
export function Donut({
  segments,
  total,
  size = 220,
  stroke = 26,
  trackColor = '#EEF0F3',
  children,
}: {
  segments: Seg[];
  total: number;
  size?: number;
  stroke?: number;
  trackColor?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sum = segments.reduce((a, s) => a + s.value, 0);
  const denom = Math.max(total, sum, 1);
  const gap = segments.length > 1 ? 2 : 0;

  let offset = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          {segments.map((s, i) => {
            const len = (s.value / denom) * c;
            const dash = Math.max(0, len - gap);
            const el = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={s.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return el;
          })}
        </G>
      </Svg>
      {children}
    </View>
  );
}
