/**
 * 캐릭터 홈 상단 — 예산을 잘 지킬수록 부자 캐릭터(Lv.5), 못 지킬수록 Lv.1 로 강등.
 * 좌우 < > 버튼은 시연용(희미하게 표시) — 누르면 레벨이 바뀐다.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import type { BudgetSummary } from '@/store/budget';
import { useStore } from '@/store/AppStore';
import { colors } from '@/theme';
import { diffDays } from '@/utils/date';
import { DOW, won } from '@/utils/format';
import { T } from './ui';

type Level = 1 | 2 | 3 | 4 | 5;

/** 레벨별 캐릭터 (원본: status-1 광부 · status-4 츄리닝 · status-5 직장인 · status-2 플렉스 · status-3 왕) */
const LEVELS: Record<Level, { img: ImageSourcePropType; name: string; msg: string; bg: string; accent: string }> = {
  1: { img: require('../../assets/characters/lv1.png'), name: '텅장 광부냥', msg: '예산을 많이 넘었어요. 오늘은 꼭 한도 안에서만 써요', bg: '#F2F4F6', accent: '#667085' },
  2: { img: require('../../assets/characters/lv2.png'), name: '츄리닝 백수냥', msg: '이번 주가 빠듯해요. 카페 한 번만 줄여볼까요?', bg: '#F5F3EE', accent: '#8A6A3B' },
  3: { img: require('../../assets/characters/lv3.png'), name: '월급 기다리는 직장냥', msg: '예산 근처에서 버티는 중! 오늘 한도만 지키면 돼요', bg: '#EEF2FA', accent: '#1D3A8A' },
  4: { img: require('../../assets/characters/lv4.png'), name: '플렉스냥', msg: '예산을 잘 지키고 있어요. 이 정도면 플렉스 가능!', bg: '#FDF1F1', accent: '#A11D2B' },
  5: { img: require('../../assets/characters/lv5.png'), name: '텅장 탈출 킹냥', msg: '완벽해요! 이번 주기 예산 관리의 왕이에요', bg: '#FFF8E1', accent: '#B7791F' },
};

/** 이번 주기 소비 속도로 레벨 계산: 지금까지 쓴 돈 ÷ (같은 기간 예산) */
export function levelFromBudget(s: BudgetSummary, today: Date): Level {
  const total = diffDays(s.cycleEnd, s.cycleStart) + 1;
  const elapsed = diffDays(today, s.cycleStart) + 1;
  const expected = (s.cycleBudget * elapsed) / total;
  const pace = expected > 0 ? s.cycleSpent / expected : 1;
  if (s.shortage > 0 || pace > 1.2) return 1;
  if (pace > 1.05) return 2;
  if (pace > 0.95) return 3;
  if (pace > 0.8) return 4;
  return 5;
}

export function CharacterHero() {
  const { summary: s, today } = useStore();
  const auto = levelFromBudget(s, today);
  const [level, setLevel] = useState<Level>(auto);
  useEffect(() => setLevel(auto), [auto]);

  const scale = useRef(new Animated.Value(1)).current;
  const bump = () => {
    scale.setValue(0.85);
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: Platform.OS !== 'web' }).start();
  };
  const change = (d: -1 | 1) => {
    const next = Math.min(5, Math.max(1, level + d)) as Level;
    if (next === level) return;
    setLevel(next);
    bump();
  };

  const L = LEVELS[level];
  const over = s.todayAvailable < 0;

  return (
    <View style={[styles.wrap, { backgroundColor: L.bg }]}>
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { backgroundColor: L.accent }]}>
          <T size={12} weight="800" color="#fff">
            Lv.{level}
          </T>
        </View>
        <T size={15} weight="800" color={L.accent}>
          {L.name}
        </T>
      </View>

      <View style={styles.bubble}>
        <T size={14} weight="600" style={{ textAlign: 'center', lineHeight: 20 }}>
          {L.msg}
        </T>
        <View style={styles.tail} />
      </View>

      <View style={styles.stage}>
        <Pressable onPress={() => change(-1)} disabled={level === 1} hitSlop={12} style={[styles.arrow, level === 1 && { opacity: 0 }]}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Image source={L.img} style={styles.char} resizeMode="contain" />
        </Animated.View>
        <Pressable onPress={() => change(1)} disabled={level === 5} hitSlop={12} style={[styles.arrow, level === 5 && { opacity: 0 }]}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.dots}>
        {[1, 2, 3, 4, 5].map((n) => (
          <View key={n} style={[styles.dot, n <= level && { backgroundColor: L.accent }]} />
        ))}
      </View>

      {/* 오늘 쓸 수 있는 돈 (기존 홈의 파란 카드 대신) */}
      <Pressable style={styles.money} onPress={() => router.push('/budget-detail')}>
        <T size={13} weight="600" color={colors.textSub}>
          {today.getMonth() + 1}월 {today.getDate()}일 ({DOW[today.getDay()]}) · 오늘 쓸 수 있는 돈
        </T>
        <T size={34} weight="800" color={over ? colors.danger : colors.brand} style={{ marginTop: 2, letterSpacing: -1 }}>
          {won(Math.max(0, s.todayAvailable))}
          <T size={20} weight="700" color={over ? colors.danger : colors.brand}>
            원
          </T>
        </T>
        <View style={styles.moneyRow}>
          <T size={12} color={colors.textMuted}>
            오늘 {won(s.todaySpent)}원 사용 · 하루 기준 {won(s.dailyLimit)}원
          </T>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </View>
        {s.todayPlanned.length > 0 && (
          <T size={12} color={colors.brandDark} style={{ marginTop: 6 }}>
            오늘 예정 소비 {won(s.todayPlanned.reduce((a, x) => a + x.amount, 0))}원은 따로 확보했어요
          </T>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 28, paddingTop: 18, paddingBottom: 14, paddingHorizontal: 14, alignItems: 'center' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  bubble: { marginTop: 12, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, maxWidth: 300 },
  tail: {
    position: 'absolute',
    bottom: -7,
    left: '50%',
    marginLeft: -7,
    width: 14,
    height: 14,
    backgroundColor: '#fff',
    transform: [{ rotate: '45deg' }],
  },
  stage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4, alignSelf: 'stretch' },
  arrow: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', opacity: 0.22 },
  char: { width: 220, height: 220 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 2 },
  dot: { width: 22, height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.1)' },
  money: { marginTop: 14, alignSelf: 'stretch', backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center' },
  moneyRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
});
