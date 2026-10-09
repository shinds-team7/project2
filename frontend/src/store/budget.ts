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
 *  · 거래내역에서 "반영 제외" 하거나 "1/N" 으로 나눈 금액은 생활비로 되돌려 둔다
 *  · 결제가 들어올 때마다(오픈뱅킹/카드 알림 → 서버) 오늘 금액을 다시 계산한다
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
/** 생활비 소비로 세는 거래인지 (반영 제외된 거래는 빠짐) */
export const isSpend = (t: Transaction) => t.status === 'confirmed' && t.amount < 0 && SPEND_IDS.has(t.category) && !t.excluded;
/** 실제 내 부담액 (1/N 적용) */
export const spendOf = (t: Transaction) => (isSpend(t) ? Math.round(-t.amount / (t.splitN && t.splitN > 1 ? t.splitN : 1)) : 0);
/** 반영 제외·1/N 으로 생활비에 되돌려 놓는 금액 */
export const addBackOf = (t: Transaction) => {
  if (t.amount >= 0 || !SPEND_IDS.has(t.category)) return 0;
  if (t.excluded) return -t.amount;
  if (t.splitN && t.splitN > 1) return -t.amount - Math.round(-t.amount / t.splitN);
  return 0;
};

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
  // 반영 제외·1/N: 돌려받을 돈/생활비가 아닌 돈은 생활비 계산에서 되돌려 둔다
  const adjusted = cycleTx.filter((t) => addBackOf(t) > 0);
  const addBack = adjusted.reduce((a, t) => a + addBackOf(t), 0);
  const availableBalance = bankBalance + addBack;

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

  const todaySpent = cycleTx.filter((t) => t.date === todayKey).reduce((a, t) => a + spendOf(t), 0);
  const remainingStart = remainingNow + todaySpent;
  const dailyLimit = Math.max(0, Math.floor(remainingStart / daysLeft));
  const todayAvailable = dailyLimit - todaySpent;
  const shortage = remainingNow < 0 ? -remainingNow : 0;

  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const daysLeftInWeek = Math.min(diffDays(weekEnd, today), diffDays(ce, today)) + 1;
  const weekSpent = transactions
    .filter((t) => t.date >= toKey(weekStart) && t.date <= todayKey)
    .reduce((a, t) => a + spendOf(t), 0);
  const weekScheduled = upcoming.filter((s) => s.date <= toKey(weekEnd)).reduce((a, s) => a + s.amount, 0);
  const weekAvailable = dailyLimit * daysLeftInWeek - todaySpent;

  const cycleSpent = cycleTx.reduce((a, t) => a + spendOf(t), 0);
  const cycleBudget = cycleSpent + Math.max(0, remainingNow);

  return {
    cycleStart: cs,
    cycleEnd: ce,
    nextPayday: np,
    daysLeft,
    bankBalance,
    adjusted,
    addBack,
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

/** 추천 정도 색: 초록(여유) → 노랑(적당) → 주황(빠듯) → 빨강(위험) */
export const STATUS_META: Record<WeekStatus, { label: string; color: string; bg: string; fill: string; msg: string }> = {
  relax: { label: '여유', color: '#039855', bg: '#E8F8EF', fill: '#C6F1D9', msg: '일상 소비에 거의 영향이 없어요' },
  fine: { label: '적당', color: '#B54708', bg: '#FEF7C3', fill: '#FDEFA4', msg: '조금만 아끼면 무리 없이 결제할 수 있어요' },
  tight: { label: '빠듯', color: '#C4320A', bg: '#FFEAD5', fill: '#FDD3AE', msg: '하루 예산이 꽤 줄어요. 외식·카페를 줄여야 해요' },
  danger: { label: '위험', color: '#D92D20', bg: '#FEECEB', fill: '#FECDCA', msg: '생활비가 부족해질 수 있어요. 일정을 미루는 걸 추천해요' },
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
