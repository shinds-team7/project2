/** 1. 메인(홈) — 오늘 사용 가능 금액, 이번 주 금액, 예정 소비, 정산 요청, 고액 지출 D-day */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScheduleRow } from '@/components/ScheduleRow';
import { AddButton, Badge, Card, IconCircle, Screen, SectionTitle, T } from '@/components/ui';
import { planDailyReserve } from '@/store/budget';
import { useStore } from '@/store/AppStore';
import { colors } from '@/theme';
import { diffDays, endOfWeek, fromKey, md, startOfWeek, toKey, weekLabel } from '@/utils/date';
import { DOW, won } from '@/utils/format';

export default function Home() {
  const { today, summary, scheduled, plans, transactions } = useStore();
  const lastPay = transactions.find((t) => t.date === toKey(today) && t.amount < 0);
  const s = summary;

  const weekEndKey = toKey(endOfWeek(today));
  const thisWeek = scheduled.filter((x) => x.status === 'planned' && x.date >= toKey(today) && x.date <= weekEndKey);
  const toSettle = scheduled.filter((x) => x.status === 'planned' && x.date < toKey(today));
  const upcomingPlans = plans.filter((p) => endOfWeek(fromKey(p.weekStart)) >= today);

  const over = s.todayAvailable < 0;
  const usedRatio = s.dailyLimit > 0 ? Math.min(1, s.todaySpent / s.dailyLimit) : 1;
  const weekTotal = s.weekSpent + Math.max(0, s.weekAvailable);
  const weekRatio = weekTotal > 0 ? Math.min(1, s.weekSpent / weekTotal) : 0;
  const dPay = diffDays(s.nextPayday, today);

  return (
    <Screen>
      {/* 오늘 사용 가능한 금액 */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <T size={14} weight="600" color="rgba(255,255,255,0.85)">
            {today.getMonth() + 1}월 {today.getDate()}일 ({DOW[today.getDay()]}) · 오늘 쓸 수 있는 돈
          </T>
        </View>
        <T size={38} weight="800" color="#fff" style={{ marginTop: 8, letterSpacing: -1 }}>
          {won(Math.max(0, s.todayAvailable))}
          <T size={24} weight="700" color="#fff">
            원
          </T>
        </T>
        {over && (
          <T size={13} weight="600" color="#FFE4E2" style={{ marginTop: 2 }}>
            오늘 {won(-s.todayAvailable)}원 초과했어요 · 남은 {s.daysLeft - 1}일에 나눠서 반영돼요
          </T>
        )}
        <View style={styles.heroBar}>
          <View style={[styles.heroFill, { width: `${usedRatio * 100}%`, backgroundColor: over ? '#FDA29B' : '#fff' }]} />
        </View>
        <View style={styles.heroRow}>
          <T size={13} color="rgba(255,255,255,0.9)">
            오늘 {won(s.todaySpent)}원 사용
          </T>
          <T size={13} color="rgba(255,255,255,0.9)">
            하루 기준 {won(s.dailyLimit)}원
          </T>
        </View>

        {s.todayPlanned.length > 0 && (
          <View style={styles.heroPlan}>
            <Ionicons name="calendar" size={14} color="#fff" />
            <T size={13} weight="600" color="#fff" style={{ flex: 1 }}>
              오늘 예정 소비 {won(s.todayPlanned.reduce((a, x) => a + x.amount, 0))}원은 따로 확보했어요 · {s.todayPlanned.map((x) => x.title).join(', ')}
            </T>
          </View>
        )}

        <Pressable style={styles.heroFoot} onPress={() => router.push('/budget-detail')}>
          <T size={12} color="rgba(255,255,255,0.8)" numberOfLines={1} style={{ flex: 1 }}>
            {lastPay ? `최근 반영 · ${lastPay.merchant} ${won(-lastPay.amount)}원 (${lastPay.time})` : '마지막 정산 오늘 05:00'}
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <T size={12} weight="700" color="#fff">
              계산 근거
            </T>
            <Ionicons name="chevron-forward" size={14} color="#fff" />
          </View>
        </Pressable>
      </View>

      {s.shortage > 0 && (
        <Card style={{ backgroundColor: colors.dangerSoft }}>
          <T size={14} weight="700" color={colors.danger}>
            다음 수입일까지 {won(s.shortage)}원이 부족해요
          </T>
          <T size={12} color={colors.textSub} style={{ marginTop: 4 }}>
            예정 지출을 줄이거나 보호 금액을 조정해 보세요
          </T>
        </Card>
      )}

      {/* 다음 수입일 / 남은 생활비 */}
      <View style={styles.stats}>
        <Card style={styles.stat} onPress={() => router.push('/budget-detail')}>
          <T size={12} color={colors.textMuted}>
            다음 수입일
          </T>
          <T size={17} weight="800" style={{ marginTop: 4 }}>
            D-{dPay}{' '}
            <T size={13} weight="500" color={colors.textMuted}>
              {md(s.nextPayday)}
            </T>
          </T>
        </Card>
        <Card style={styles.stat} onPress={() => router.push('/budget-detail')}>
          <T size={12} color={colors.textMuted}>
            남은 생활비 ({s.daysLeft}일)
          </T>
          <T size={17} weight="800" style={{ marginTop: 4 }}>
            {won(Math.max(0, s.remainingNow))}원
          </T>
        </Card>
      </View>

      {/* 이번 주 사용 가능한 금액 → 분석 */}
      <Card onPress={() => router.navigate({ pathname: '/analysis', params: { period: 'week' } })}>
        <View style={styles.rowBetween}>
          <View>
            <T size={14} color={colors.textMuted}>
              이번 주 사용 가능한 금액
            </T>
            <T size={24} weight="800" style={{ marginTop: 4 }}>
              {won(Math.max(0, s.weekAvailable))}원
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
          {md(startOfWeek(today))} ~ {md(endOfWeek(today))} · 이번 주 {won(s.weekSpent)}원 썼어요
          {s.weekScheduled > 0 ? ` · 예정 소비 ${won(s.weekScheduled)}원은 따로 빼뒀어요` : ''}
        </T>
      </Card>

      {/* 지난 일정 정산 요청 */}
      {toSettle.map((x) => (
        <Card key={x.id} onPress={() => router.push(`/settle/${x.id}`)} style={styles.settle}>
          <IconCircle name="receipt" color={colors.info} size={40} />
          <View style={{ flex: 1 }}>
            <T size={14} weight="700">
              ‘{x.title}’ 얼마 썼는지 확인해 주세요
            </T>
            <T size={12} color={colors.textMuted}>
              예상 {won(x.amount)}원 · 실제 결제와 연결하면 AI가 학습해요
            </T>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      ))}

      {/* 이번 주 예정된 소비 */}
      <Card>
        <SectionTitle
          title="이번 주 후보 거래"
          right={
            <Pressable onPress={() => router.push('/schedule')} style={styles.more} hitSlop={8}>
              <T size={13} color={colors.textMuted}>
                {thisWeek.length}건 · {won(thisWeek.reduce((a, x) => a + x.amount, 0))}원
              </T>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </Pressable>
          }
        />
        {thisWeek.length === 0 ? (
          <View style={styles.empty}>
            <T size={14} color={colors.textMuted} style={{ textAlign: 'center', lineHeight: 20 }}>
              이번 주에 예정된 소비가 없어요{'\n'}일정을 적으면 AI가 예상 금액을 미리 빼둘게요
            </T>
          </View>
        ) : (
          <View style={{ gap: 8, marginBottom: 12 }}>
            {thisWeek.map((x) => (
              <ScheduleRow key={x.id} item={x} today={today} />
            ))}
          </View>
        )}
        <AddButton label="소비 일정 추가" onPress={() => router.push('/schedule/new')} />
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
              return (
                <View key={p.id} style={styles.plan}>
                  <IconCircle name="flag" color={colors.brand} size={42} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <T size={15} weight="700">
                      {p.title}
                    </T>
                    <T size={12} color={colors.textMuted}>
                      {weekLabel(ws)} · 하루 {won(planDailyReserve(p, today))}원씩 적립
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.brand, borderRadius: 24, padding: 22, paddingBottom: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 16, overflow: 'hidden' },
  heroFill: { height: 6, borderRadius: 3 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  heroPlan: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  heroFoot: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, padding: 16 },
  settle: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  more: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.bg, marginTop: 16, marginBottom: 10, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: colors.brand },
  empty: { paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
