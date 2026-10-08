/**
 * 앱 전역 상태 (Mock, 메모리 저장).
 * 백엔드 연동 시 각 액션을 API 호출로 교체하면 된다.
 *   - scheduled  → GET/POST /api/schedules
 *   - plans      → GET/POST /api/large-expenses
 *   - transactions → GET /api/transactions (오픈뱅킹 연동 결과)
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { buildTransactions, DEFAULT_MONTHLY_BUDGET, type Transaction } from '@/data/mock';
import { addDays, diffDays, endOfWeek, startOfDay, startOfWeek, toKey } from '@/utils/date';
import { computeBudget, type BudgetInput, type BudgetSummary, type LargePlan, type ScheduledSpend } from './budget';

type Store = {
  today: Date;
  transactions: Transaction[];
  monthlyBudget: number;
  setMonthlyBudget: (n: number) => void;
  scheduled: ScheduledSpend[];
  addScheduled: (s: Omit<ScheduledSpend, 'id'>) => void;
  removeScheduled: (id: string) => void;
  plans: LargePlan[];
  addPlan: (p: Omit<LargePlan, 'id'>) => void;
  removePlan: (id: string) => void;
  budgetInput: BudgetInput;
  summary: BudgetSummary;
};

const Ctx = createContext<Store | null>(null);

let seq = 100;
const nextId = (p: string) => `${p}-${++seq}`;

function initialScheduled(today: Date): ScheduledSpend[] {
  const weekEnd = endOfWeek(today);
  const left = diffDays(weekEnd, today);
  const d1 = addDays(today, Math.min(1, left));
  const d2 = weekEnd;
  return [
    { id: 's1', title: '동기 생일 저녁 모임', date: toKey(d1), amount: 35000 },
    { id: 's2', title: '주말 영화 + 팝콘', date: toKey(d2), amount: 24000 },
  ];
}

function initialPlans(today: Date): LargePlan[] {
  return [{ id: 'p1', title: '연말 콘서트 티켓', amount: 165000, weekStart: toKey(addDays(startOfWeek(today), 7 * 6)) }];
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [today] = useState(() => startOfDay(new Date()));
  const [transactions] = useState(() => buildTransactions(today));
  const [monthlyBudget, setMonthlyBudget] = useState(DEFAULT_MONTHLY_BUDGET);
  const [scheduled, setScheduled] = useState<ScheduledSpend[]>(() => initialScheduled(today));
  const [plans, setPlans] = useState<LargePlan[]>(() => initialPlans(today));

  const value = useMemo<Store>(() => {
    const budgetInput: BudgetInput = { today, monthlyBudget, transactions, scheduled, plans };
    return {
      today,
      transactions,
      monthlyBudget,
      setMonthlyBudget,
      scheduled,
      addScheduled: (s) =>
        setScheduled((prev) => [...prev, { ...s, id: nextId('s') }].sort((a, b) => (a.date < b.date ? -1 : 1))),
      removeScheduled: (id) => setScheduled((prev) => prev.filter((s) => s.id !== id)),
      plans,
      addPlan: (p) =>
        setPlans((prev) => [...prev, { ...p, id: nextId('p') }].sort((a, b) => (a.weekStart < b.weekStart ? -1 : 1))),
      removePlan: (id) => setPlans((prev) => prev.filter((p) => p.id !== id)),
      budgetInput,
      summary: computeBudget(budgetInput),
    };
  }, [today, transactions, monthlyBudget, scheduled, plans]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used within AppStoreProvider');
  return v;
}
