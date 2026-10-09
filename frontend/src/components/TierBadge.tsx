/**
 * 등급 뱃지 — 돌 → 브론즈 → 실버 → 골드(금괴) → 다이아로 모양이 성장한다.
 * 높이는 모두 같고 모양만 바뀐다. 캐릭터 그림체에 맞춰 진한 펜 선으로 그린다.
 */
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';

export type Tier = 1 | 2 | 3 | 4 | 5;

/** 캐릭터 그림체와 맞춘 진한 펜 선 */
const INK = '#1B1B1B';
const HEIGHT = 34;

type Spec = {
  vb: [number, number]; // viewBox 크기
  stops: string[]; // 그라데이션
  shape: string; // 외곽
  extra?: string; // 장식 면(날개, 금괴 윗면 등)
  extraFill?: string;
  facets?: [number, number, number, number][]; // 다이아 면 라인
};

const SPECS: Record<Tier, Spec> = {
  // 돌: 울퉁불퉁한 바위
  1: {
    vb: [120, 64],
    stops: ['#A3A9B1', '#6B7280'],
    shape: 'M10 22 L26 7 L60 3 L94 9 L114 25 L110 48 L84 61 L34 61 L8 49 Z',
  },
  // 브론즈: 육각 명판
  2: {
    vb: [120, 64],
    stops: ['#E9B07A', '#A2622C'],
    shape: 'M18 4 C45 2 75 5 102 3 L117 32 L101 60 C75 62 45 59 18 61 L3 32 Z',
  },
  // 실버: 방패
  3: {
    vb: [120, 64],
    stops: ['#FFFFFF', '#AAB4C0'],
    shape: 'M14 5 C40 2 80 2 106 5 L104 30 C99 47 80 56 60 61 C40 56 21 47 16 30 Z',
  },
  // 골드: 금괴 (밝은 윗면 + 앞면)
  4: {
    vb: [120, 64],
    stops: ['#FFE07A', '#D99A00'],
    shape: 'M17 23 L103 23 L114 59 L6 59 Z',
    extra: 'M31 5 C50 4 70 6 89 5 L103 23 L17 23 Z',
    extraFill: '#FFF1A6',
  },
  // 다이아: 보석
  5: {
    vb: [140, 90],
    stops: ['#B9F3FF', '#4F8CFF', '#A78BFA'],
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
  const w = (HEIGHT * vw) / vh;
  const id = `tier${tier}`;
  // 다이아는 세로가 길어서 선이 얇아 보이지 않게 보정
  const sw = (5.5 * vh) / 64;

  return (
    <View style={{ width: w, height: HEIGHT }}>
      <Svg width={w} height={HEIGHT} viewBox={`0 0 ${vw} ${vh}`}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            {s.stops.map((c, i) => (
              <Stop key={i} offset={i / (s.stops.length - 1)} stopColor={c} />
            ))}
          </LinearGradient>
        </Defs>
        {/* 날개 등은 본체 뒤에 */}
        {s.extra && !s.extraFill && (
          <Path d={s.extra} fill={s.extraFill ?? `url(#${id})`} stroke={INK} strokeWidth={sw * 0.9} strokeLinejoin="round" strokeLinecap="round" />
        )}
        <Path d={s.shape} fill={`url(#${id})`} stroke={INK} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
        {/* 금괴 윗면은 본체 위에 */}
        {s.extra && s.extraFill && (
          <Path d={s.extra} fill={s.extraFill ?? `url(#${id})`} stroke={INK} strokeWidth={sw * 0.9} strokeLinejoin="round" strokeLinecap="round" />
        )}
        {s.facets?.map(([x1, y1, x2, y2], i) => (
          <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={sw * 0.5} strokeLinecap="round" />
        ))}
        {/* 펜으로 그린 듯한 하이라이트 */}
        <Path
          d={`M${vw * 0.3} ${vh * 0.62} Q${vw * 0.42} ${vh * 0.56} ${vw * 0.55} ${vh * 0.6}`}
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={sw * 0.7}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}
