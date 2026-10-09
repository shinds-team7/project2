/**
 * 등급 뱃지 — 돌 → 브론즈 → 실버 → 골드 → 다이아로 모양과 크기가 성장한다.
 * "Lv.N" 텍스트를 등급 모양(SVG)이 감싼다.
 */
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';

import { T } from './ui';

export type Tier = 1 | 2 | 3 | 4 | 5;

export const TIER_NAME: Record<Tier, string> = { 1: '돌', 2: '브론즈', 3: '실버', 4: '골드', 5: '다이아' };

type Spec = {
  vb: [number, number]; // viewBox 크기
  h: number; // 화면 높이(px) — 등급이 오를수록 커짐
  stops: string[]; // 그라데이션
  stroke: string;
  text: string;
  textTop: number; // 텍스트 세로 위치 보정(비율)
  shape: string; // 외곽
  extra?: string; // 장식(왕관 등)
  facets?: [number, number, number, number][]; // 다이아 면 라인
};

const SPECS: Record<Tier, Spec> = {
  // 돌: 울퉁불퉁한 바위
  1: {
    vb: [120, 64],
    h: 30,
    stops: ['#A3A9B1', '#6B7280'],
    stroke: '#4B5563',
    text: '#FFFFFF',
    textTop: 0,
    shape: 'M10 22 L26 7 L60 3 L94 9 L114 25 L110 48 L84 61 L34 61 L8 49 Z',
  },
  // 브론즈: 육각 명판
  2: {
    vb: [120, 64],
    h: 32,
    stops: ['#E9B07A', '#A2622C'],
    stroke: '#7A4518',
    text: '#FFFFFF',
    textTop: 0,
    shape: 'M18 3 H102 L117 32 L102 61 H18 L3 32 Z',
  },
  // 실버: 날개 달린 명판
  3: {
    vb: [140, 64],
    h: 35,
    stops: ['#FFFFFF', '#AAB4C0'],
    stroke: '#7B8794',
    text: '#334155',
    textTop: 0,
    shape: 'M28 3 H112 L126 32 L112 61 H28 L14 32 Z',
    extra: 'M14 32 L2 18 L10 32 L2 46 Z M126 32 L138 18 L130 32 L138 46 Z',
  },
  // 골드: 왕관이 올라간 명판
  4: {
    vb: [140, 84],
    h: 44,
    stops: ['#FFE58A', '#D99A00'],
    stroke: '#A16207',
    text: '#5B3A00',
    textTop: 0.24,
    shape: 'M28 23 H112 L126 52 L112 81 H28 L14 52 Z',
    extra: 'M44 24 L48 4 L60 16 L70 1 L80 16 L92 4 L96 24 Z M14 52 L2 38 L10 52 L2 66 Z M126 52 L138 38 L130 52 L138 66 Z',
  },
  // 다이아: 보석
  5: {
    vb: [140, 90],
    h: 52,
    stops: ['#B9F3FF', '#4F8CFF', '#A78BFA'],
    stroke: '#3B4FD8',
    text: '#FFFFFF',
    textTop: -0.34,
    shape: 'M34 4 H106 L136 30 L70 87 L4 30 Z',
    facets: [
      [4, 30, 136, 30],
      [34, 4, 52, 30],
      [106, 4, 88, 30],
      [52, 30, 70, 87],
      [88, 30, 70, 87],
      [70, 4, 52, 30],
      [70, 4, 88, 30],
    ],
  },
};

export function TierBadge({ tier }: { tier: Tier }) {
  const s = SPECS[tier];
  const [vw, vh] = s.vb;
  const w = (s.h * vw) / vh;
  const id = `tier${tier}`;

  return (
    <View style={{ width: w, height: s.h }}>
      <Svg width={w} height={s.h} viewBox={`0 0 ${vw} ${vh}`}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {s.stops.map((c, i) => (
              <Stop key={i} offset={i / (s.stops.length - 1)} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
        {s.extra && <Path d={s.extra} fill={`url(#${id})`} stroke={s.stroke} strokeWidth={2.5} strokeLinejoin="round" />}
        <Path d={s.shape} fill={`url(#${id})`} stroke={s.stroke} strokeWidth={3} strokeLinejoin="round" />
        {s.facets?.map(([x1, y1, x2, y2], i) => (
          <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.55)" strokeWidth={1.6} />
        ))}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center, { top: s.h * s.textTop }]}>
        <T size={Math.round(s.h * 0.38)} weight="800" color={s.text} style={tier === 5 ? styles.glow : undefined}>
          Lv.{tier}
        </T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  glow: { textShadowColor: 'rgba(30,40,140,0.6)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } },
});
