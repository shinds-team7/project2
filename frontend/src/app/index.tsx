/** 1. 메인(홈) — 오늘/이번 주 사용 가능 금액, 이번 주 소비 일정, 고액 지출 D-day */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AddScheduleModal } from '@/components/AddScheduleModal';
import { AddButton, Badge, Card, IconCircle, Screen, SectionTitle, T } from '@/components/ui';
import { planDailyReserve } from '@/store/budget';
import { useStore } from '@/store/AppStore';
import { colors } from '@/theme';
import { diffDays, endOfWeek, fromKey, isSameDay, md, startOfWeek, toKey, weekLabel } from '@/utils/date';
import { DOW, won } from '@/utils/format';

export default function Home() {
  const { today, summary, scheduled, plans, removeScheduled } = useStore();
  const [open, setOpen] = useState(false);

  const weekEndKey = toKey(endOfWeek(today));
  const thisWeek = scheduled.filter((s) => s.date >= toKey(today) && s.date <= weekEndKey);
  const upcomingPlans = plans.filter((p) => endOfWeek(fromKey(p.weekStart)) >= today);

  const over = summary.todayAvailable < 0;
  const usedRatio = summary.dailyLimit > 0 ? Math.min(1, summary.todaySpent / summary.dailyLimit) : 1;
  const weekTotal = summary.weekSpent + Math.max(0, summary.weekAvailable);
  const weekRatio = weekTotal > 0 ? Math.min(1, summary.weekSpent / weekTotal) : 0;

  return (
    <Screen>
      {/* 오늘 사용 가능한 금액 */}
      <View style={styles.hero}>
        <T size={15} weight="600" color="rgba(255,255,255,0.85)">
          {today.getMonth() + 1}월 {today.getDate()}일 ({DOW[today.getDay()]}) · 오늘 사용 가능한 금액
        </T>
        <T size={38} weight="800" color="#fff" style={{ marginTop: 8, letterSpacing: -1 }}>
          {over ? '-' : ''}
          {won(Math.abs(summary.todayAvailable))}
          <T size={24} weight="700" color="#fff">
            원
          </T>
        </T>
        <View style={styles.heroBar}>
          <View style={[styles.heroFill, { width: `${usedRatio * 100}%`, backgroundColor: over ? '#FDA29B' : '#fff' }]} />
        </View>
        <View style={styles.heroRow}>
          <T size={13} color="rgba(255,255,255,0.9)">
            오늘 {won(summary.todaySpent)}원 사용
          </T>
          <T size={13} color="rgba(255,255,255,0.9)">
            하루 한도 {won(summary.dailyLimit)}원
          </T>
        </View>
        {summary.reserve > 0 && (
          <View style={styles.reserveChip}>
            <Ionicons name="sparkles" size={13} color="#fff" />
            <T size={12} weight="600" color="#fff">
              고액 지출 대비 하루 {won(summary.reserve)}원씩 모으는 중
            </T>
          </View>
        )}
      </View>

      {/* 이번 주 사용 가능한 금액 → 분석 페이지 */}
      <Card onPress={() => router.navigate({ pathname: '/analysis', params: { period: 'week' } })}>
        <View style={styles.rowBetween}>
          <View>
            <T size={14} color={colors.textMuted}>
              이번 주 사용 가능한 금액
            </T>
            <T size={24} weight="800" style={{ marginTop: 4 }}>
              {won(summary.weekAvailable)}원
            </T>
          </View>
          <View style={styles.more}>
            <T size={13} weight="600" color={colors.textSub}>
              분석 보기
            </T>
            <Ionicons name="chevron-forward" size={16} color={colors.textSub} />
          </View>
        </View>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${weekRatio * 100}%` }]} />
        </View>
        <T size={12} color={colors.textMuted}>
          {md(startOfWeek(today))} ~ {md(endOfWeek(today))} · 이번 주 {won(summary.weekSpent)}원 썼어요
          {summary.weekScheduled > 0 ? ` · 예정 소비 ${won(summary.weekScheduled)}원은 따로 빼뒀어요` : ''}
        </T>
      </Card>

      {/* 이번 주 예정된 소비 일정 */}
      <Card>
        <SectionTitle
          title="이번 주 예정된 소비"
          right={
            <T size={13} color={colors.textMuted}>
              {thisWeek.length}건 · {won(thisWeek.reduce((a, s) => a + s.amount, 0))}원
            </T>
          }
        />
        {thisWeek.length === 0 ? (
          <View style={styles.empty}>
            <T size={14} color={colors.textMuted}>
              이번 주에 예정된 소비가 없어요
            </T>
          </View>
        ) : (
          <View style={{ gap: 4, marginBottom: 12 }}>
            {thisWeek.map((s) => {
              const d = fromKey(s.date);
              return (
                <View key={s.id} style={styles.item}>
                  <View style={styles.dateBox}>
                    <T size={11} weight="600" color={colors.brandDark}>
                      {isSameDay(d, today) ? '오늘' : DOW[d.getDay()]}
                    </T>
                    <T size={16} weight="800" color={colors.brandDark}>
                      {d.getDate()}
                    </T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T size={15} weight="600">
                      {s.title}
                    </T>
                    <T size={12} color={colors.textMuted}>
                      {md(d)} ({DOW[d.getDay()]})
                    </T>
                  </View>
                  <T size={15} weight="700">
                    {won(s.amount)}원
                  </T>
                  <Pressable hitSlop={8} onPress={() => removeScheduled(s.id)}>
                    <Ionicons name="close-circle" size={18} color={colors.textFaint} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
        <AddButton label="소비 일정 추가" onPress={() => setOpen(true)} />
      </Card>

      {/* 고액 지출 D-day */}
      <Card>
        <SectionTitle title="다가오는 고액 지출" />
        {upcomingPlans.length === 0 ? (
          <View style={styles.empty}>
            <T size={14} color={colors.textMuted}>
              계획된 고액 지출이 없어요
            </T>
          </View>
        ) : (
          <View style={{ gap: 10, marginBottom: 12 }}>
            {upcomingPlans.map((p) => {
              const ws = fromKey(p.weekStart);
              const dday = diffDays(ws, today);
              const reserve = planDailyReserve(p, today);
              return (
                <View key={p.id} style={styles.plan}>
                  <IconCircle name="flag" color={colors.brand} size={42} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <T size={15} weight="700">
                        {p.title}
                      </T>
                    </View>
                    <T size={12} color={colors.textMuted}>
                      {weekLabel(ws)} · 하루 {won(reserve)}원씩 적립
                    </T>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Badge
                      label={dday <= 0 ? '이번 주' : `D-${dday}`}
                      color={dday <= 7 ? colors.danger : colors.brandDark}
                      bg={dday <= 7 ? colors.dangerSoft : colors.brandSoft}
                    />
                    <T size={14} weight="700">
                      {won(p.amount)}원
                    </T>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <AddButton label="고액 지출 계획하기" onPress={() => router.navigate('/plan')} />
      </Card>

      <AddScheduleModal visible={open} onClose={() => setOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.brand, borderRadius: 24, padding: 22, paddingBottom: 20 },
  heroBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 18, overflow: 'hidden' },
  heroFill: { height: 6, borderRadius: 3 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  reserveChip: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  more: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.bg, marginTop: 16, marginBottom: 10, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.brand },
  empty: { paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  dateBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
