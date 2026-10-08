/**
 * 예산 계산 엔진 (Mock).
 * 실제 서비스에서는 AI 서버(FastAPI)가 거래내역을 분석해 내려줄 값들을 클라이언트에서 흉내낸다.
 *
 * 개념
 *  - 생활비 예산(월)에서 이미 쓴 돈과 "예정된 소비 일정"을 먼저 빼고, 남은 일수로 나눈 값이 기본 하루 예산.
 *  - 고액 지출 계획은 "오늘 ~ 결제 주의 마지막 날"까지 매일 조금씩 떼어 모은다(적립).
 *    → 결제 주를 앞당길수록 하루에 떼는 돈이 커지고, 미룰수록 작아진다.
 */
import type { Transaction } from '@/data/mock';
import { addDays, diffDays, endOfMonth, endOfWeek, fromKey, startOfMonth, startOfWeek, toKey } from '@/utils/date';

export type ScheduledSpend = { id: string; title: string; date: string; amount: number };
export type LargePlan = { id: string; title: string; amount: number; weekStart: string };

export type BudgetInput = {
  today: Date;
  monthlyBudget: number;
  transactions: Transaction[];
  scheduled: ScheduledSpend[];
  plans: LargePlan[];
};

const isSpend = (t: Transaction) => t.amount < 0 && t.category !== 'fixed';

export function planDailyReserve(plan: { amount: number; weekStart: string }, today: Date): number {
  const payDay = endOfWeek(fromKey(plan.weekStart));
  const days = diffDays(payDay, today) + 1;
  if (days <= 0) return 0;
  return plan.amount / days;
}

export function computeBudget({ today, monthlyBudget, transactions, scheduled, plans }: BudgetInput) {
  const todayKey = toKey(today);
  const monthStartKey = toKey(startOfMonth(today));
  const monthEnd = endOfMonth(today);
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);

  const monthSpend = transactions.filter((t) => isSpend(t) && t.date >= monthStartKey && t.date <= todayKey);
  const spentBeforeToday = monthSpend.filter((t) => t.date < todayKey).reduce((a, t) => a - t.amount, 0);
  const todaySpent = monthSpend.filter((t) => t.date === todayKey).reduce((a, t) => a - t.amount, 0);
  const monthSpent = spentBeforeToday + todaySpent;

  const upcoming = scheduled.filter((s) => s.date >= todayKey && fromKey(s.date) <= monthEnd);
  const scheduledTotal = upcoming.reduce((a, s) => a + s.amount, 0);

  const daysLeft = diffDays(monthEnd, today) + 1;
  const pool = monthlyBudget - spentBeforeToday - scheduledTotal;
  const dailyBase = Math.max(0, pool / daysLeft);

  const reserve = plans.reduce((a, p) => a + planDailyReserve(p, today), 0);
  const dailyLimit = Math.max(0, dailyBase - reserve);

  const todayAvailable = dailyLimit - todaySpent;

  const daysLeftInWeek = Math.min(diffDays(weekEnd, today), diffDays(monthEnd, today)) + 1;
  const weekSpent = monthSpend
    .filter((t) => t.date >= toKey(weekStart) && t.date <= todayKey)
    .reduce((a, t) => a - t.amount, 0);
  const weekScheduled = scheduled
    .filter((s) => s.date >= todayKey && s.date <= toKey(weekEnd))
    .reduce((a, s) => a + s.amount, 0);
  const weekAvailable = dailyLimit * daysLeftInWeek - todaySpent;

  return {
    dailyBase,
    reserve,
    dailyLimit,
    todaySpent,
    todayAvailable,
    weekAvailable,
    weekSpent,
    weekScheduled,
    monthSpent,
    monthRemain: monthlyBudget - monthSpent,
    daysLeft,
  };
}

export type BudgetSummary = ReturnType<typeof computeBudget>;

// ───────────────────────── 고액 지출 AI 추천 (Mock) ─────────────────────────

export type WeekStatus = 'relax' | 'fine' | 'tight' | 'danger';

export const STATUS_META: Record<WeekStatus, { label: string; color: string; bg: string; msg: string }> = {
  relax: { label: '여유', color: '#039855', bg: '#E8F8EF', msg: '일상 소비에 거의 영향이 없어요' },
  fine: { label: '적당', color: '#0E9384', bg: '#E6F7F5', msg: '조금만 아끼면 무리 없이 결제할 수 있어요' },
  tight: { label: '빠듯', color: '#DC6803', bg: '#FEF4E6', msg: '하루 예산이 꽤 줄어요. 외식·카페를 줄여야 해요' },
  danger: { label: '위험', color: '#D92D20', bg: '#FEECEB', msg: '생활비가 부족해질 수 있어요. 일정을 미루는 걸 추천해요' },
};

export function evaluateWeek(base: BudgetInput, amount: number, weekStart: Date) {
  const before = computeBudget(base).dailyLimit;
  const extra = planDailyReserve({ amount, weekStart: toKey(weekStart) }, base.today);
  const after = Math.max(0, before - extra);
  const ratio = before > 0 ? after / before : 0;
  const sameWeekPlans = base.plans.filter((p) => p.weekStart === toKey(weekStart)).length;

  let status: WeekStatus;
  if (after < 10000 || ratio < 0.45) status = 'danger';
  else if (ratio < 0.6) status = 'tight';
  else if (ratio < 0.75 || sameWeekPlans > 0) status = 'fine';
  else status = 'relax';

  return { before, after, ratio, status, sameWeekPlans };
}

/** 이번 주부터 최대 26주 뒤까지 탐색해 "하루 예산 감소가 25% 이하"인 가장 빠른 주를 추천 */
export function recommendWeek(base: BudgetInput, amount: number): Date {
  const first = startOfWeek(base.today);
  for (let i = 0; i < 26; i++) {
    const ws = addDays(first, i * 7);
    const r = evaluateWeek(base, amount, ws);
    if (r.ratio >= 0.75 && r.sameWeekPlans === 0) return ws;
  }
  return addDays(first, 25 * 7);
}
