/**
 * 예산 계산 엔진 (Mock) — 기획서 §4 "예산 계산 원칙" 구현.
 * 실제 서비스에서는 백엔드가 같은 규칙으로 계산한다. AI는 금액 "제안"만, 산술은 이 고정 로직이 담당.
 *
 *  계산 구간: 오늘 ~ 다음 수입일 전날
 *  남은 일반 생활비 = 사용 가능 잔액
 *                    − 미납 고정지출 − 미결제 카드 이용액
 *                    − 보호 금액(저축·비상금) − 확정한 예정 지출 − 고액 지출 적립분
 *  일일 기준액     = (남은 일반 생활비 + 오늘 쓴 돈) ÷ 남은 날짜 수(오늘 포함)
 *  오늘 남은 금액  = 일일 기준액 − 오늘의 일반 소비
 *
 *  · 확인 필요(미확인) 거래는 "확정 기준"으로 계산 → 잔액에서 빠진 금액을 다시 더해 두고 홈에 경고 표시
 *  · 계산값이 음수면 0원 + 부족액을 따로 안내 (초과 지출을 숨기지 않음)
 */
import type { DraftItem } from '@/ai/parsePlan';
import { SPEND_CATEGORIES } from '@/data/categories';
import type { FixedExpense, Protected, Transaction } from '@/data/mock';
import { addDays, cycleEnd, cycleStart, diffDays, endOfMonth, endOfWeek, fromKey, nextPayday, startOfWeek, toKey } from '@/utils/date';

export type ScheduledSpend = {
  id: string;
  title: string;
  date: string;
  amount: number;
  items?: DraftItem[];
  source: 'ai' | 'manual' | 'calendar';
  status: 'planned' | 'settled';
  actual?: number;
  dateGuessed?: boolean;
};
export type LargePlan = { id: string; title: string; amount: number; weekStart: string };

export type BudgetInput = {
  today: Date;
  transactions: Transaction[];
  scheduled: ScheduledSpend[];
  plans: LargePlan[];
  income: { amount: number; payday: number };
  fixed: FixedExpense[];
  protectedList: Protected[];
  openingBalance: number;
};

const SPEND_IDS = new Set<string>([...SPEND_CATEGORIES.map((c) => c.id), 'transfer']);
export const isSpend = (t: Transaction) => t.status === 'confirmed' && t.amount < 0 && SPEND_IDS.has(t.category);

export function planDailyReserve(plan: { amount: number; weekStart: string }, today: Date): number {
  const payDay = endOfWeek(fromKey(plan.weekStart));
  const days = diffDays(payDay, today) + 1;
  if (days <= 0) return 0;
  return plan.amount / days;
}

/** 이번 주기에 아직 빠져나가지 않은 고정지출 */
export function unpaidFixedList(fixed: FixedExpense[], today: Date, payday: number) {
  const cs = cycleStart(today, payday);
  const ce = cycleEnd(today, payday);
  const out: { item: FixedExpense; date: Date }[] = [];
  for (let d = addDays(today, 1); d <= ce; d = addDays(d, 1)) {
    for (const f of fixed) if (Math.min(f.day, endOfMonth(d).getDate()) === d.getDate()) out.push({ item: f, date: d });
  }
  return { list: out, cycleStart: cs };
}

export function computeBudget(input: BudgetInput) {
  const { today, transactions, scheduled, plans, income, fixed, protectedList, openingBalance } = input;
  const todayKey = toKey(today);
  const cs = cycleStart(today, income.payday);
  const ce = cycleEnd(today, income.payday);
  const np = nextPayday(today, income.payday);
  const csKey = toKey(cs);
  const ceKey = toKey(ce);

  const cycleTx = transactions.filter((t) => t.date >= csKey && t.date <= todayKey);

  // 통장 잔액 (계좌 연동 기준) — 신용카드 결제는 잔액에서 바로 빠지지 않음
  const bankBalance = openingBalance + cycleTx.filter((t) => t.debit).reduce((a, t) => a + t.amount, 0);
  const pendingTx = transactions.filter((t) => t.status === 'pending');
  const pendingOut = pendingTx.filter((t) => t.debit && t.amount < 0 && t.date >= csKey).reduce((a, t) => a - t.amount, 0);
  const availableBalance = bankBalance + pendingOut;

  const unpaidFixed = unpaidFixedList(fixed, today, income.payday).list;
  const unpaidFixedTotal = unpaidFixed.reduce((a, f) => a + f.item.amount, 0);

  const cardTx = cycleTx.filter((t) => !t.debit && t.amount < 0);
  const cardUnpaid = cardTx.reduce((a, t) => a - t.amount, 0);

  const protectedTotal = protectedList.reduce((a, p) => a + p.amount, 0);

  const upcoming = scheduled.filter((s) => s.status === 'planned' && s.date >= todayKey && s.date <= ceKey);
  const plannedTotal = upcoming.reduce((a, s) => a + s.amount, 0);
  const todayPlanned = upcoming.filter((s) => s.date === todayKey);

  const daysLeft = diffDays(ce, today) + 1;
  const planReserves = plans
    .map((p) => {
      const daily = planDailyReserve(p, today);
      const payDay = endOfWeek(fromKey(p.weekStart));
      const days = Math.max(0, Math.min(daysLeft, diffDays(payDay, today) + 1));
      return { plan: p, daily, total: Math.round(daily * days) };
    })
    .filter((r) => r.total > 0);
  const reserveTotal = planReserves.reduce((a, r) => a + r.total, 0);
  const reserveDaily = planReserves.reduce((a, r) => a + r.daily, 0);

  const remainingNow = availableBalance - unpaidFixedTotal - cardUnpaid - protectedTotal - plannedTotal - reserveTotal;

  const todaySpent = cycleTx.filter((t) => t.date === todayKey && isSpend(t)).reduce((a, t) => a - t.amount, 0);
  const remainingStart = remainingNow + todaySpent;
  const dailyLimit = Math.max(0, Math.floor(remainingStart / daysLeft));
  const todayAvailable = dailyLimit - todaySpent;
  const shortage = remainingNow < 0 ? -remainingNow : 0;

  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const daysLeftInWeek = Math.min(diffDays(weekEnd, today), diffDays(ce, today)) + 1;
  const weekSpent = transactions
    .filter((t) => isSpend(t) && t.date >= toKey(weekStart) && t.date <= todayKey)
    .reduce((a, t) => a - t.amount, 0);
  const weekScheduled = upcoming.filter((s) => s.date <= toKey(weekEnd)).reduce((a, s) => a + s.amount, 0);
  const weekAvailable = dailyLimit * daysLeftInWeek - todaySpent;

  const cycleSpent = cycleTx.filter(isSpend).reduce((a, t) => a - t.amount, 0);
  const cycleBudget = cycleSpent + Math.max(0, remainingNow);

  return {
    cycleStart: cs,
    cycleEnd: ce,
    nextPayday: np,
    daysLeft,
    bankBalance,
    pendingTx,
    pendingOut,
    availableBalance,
    unpaidFixed,
    unpaidFixedTotal,
    cardUnpaid,
    cardCount: cardTx.length,
    protectedTotal,
    upcoming,
    plannedTotal,
    todayPlanned,
    planReserves,
    reserveTotal,
    reserveDaily,
    remainingNow,
    todaySpent,
    dailyLimit,
    todayAvailable,
    shortage,
    weekSpent,
    weekScheduled,
    weekAvailable,
    cycleSpent,
    cycleBudget,
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
  const after = computeBudget({ ...base, plans: [...base.plans, { id: 'tmp', title: '', amount, weekStart: toKey(weekStart) }] }).dailyLimit;
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
