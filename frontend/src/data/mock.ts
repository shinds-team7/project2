/**
 * Mock 데이터 — 실제 서비스에서는 계좌 연동(오픈뱅킹) 거래내역 + AI 서버 분석 결과로 대체된다.
 * 오늘 날짜 기준으로 생성되므로 언제 열어도 "이번 달" 데이터가 보인다.
 * 시드 고정 난수를 써서 새로고침해도 같은 내역이 나온다.
 */
import type { CategoryId } from './categories';
import { addDays, endOfMonth, startOfDay, startOfMonth, toKey } from '@/utils/date';

export type Transaction = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  merchant: string;
  category: CategoryId;
  amount: number; // 지출은 음수, 수입은 양수
  account: string;
};

export type Account = {
  id: string;
  bank: string;
  name: string;
  number: string;
  balance: number;
  type: 'bank' | 'card';
};

export const USER = {
  name: '김플렉스',
  email: 'flex@shinhan-ds.dev',
};

export const ACCOUNTS: Account[] = [
  { id: 'a1', bank: '신한은행', name: '쏠편한 입출금통장', number: '110-***-482910', balance: 1284300, type: 'bank' },
  { id: 'a2', bank: '신한카드', name: 'Deep Dream 체크', number: '5107-****-****-2231', balance: 0, type: 'card' },
];

export const INCOME = { amount: 2600000, payday: 25, source: '급여 (주)한빛소프트' };

export const FIXED_EXPENSES = [
  { day: 1, name: '청년도약계좌 자동이체', amount: 400000 },
  { day: 5, name: '월세', amount: 450000 },
  { day: 10, name: '넷플릭스', amount: 13500 },
  { day: 15, name: '휴대폰 요금', amount: 59000 },
  { day: 17, name: '유튜브 프리미엄', amount: 14900 },
  { day: 20, name: '실손보험', amount: 32000 },
];

export const DEFAULT_MONTHLY_BUDGET = 1200000;

// ───────────────────────── 거래내역 생성 ─────────────────────────

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

type Tpl = { c: CategoryId; m: string[]; min: number; max: number; w: number; t: [number, number] };

const TEMPLATES: Tpl[] = [
  { c: 'food', m: ['김밥천국', '본죽&비빔밥', '맘스터치', '배달의민족', '쿠팡이츠', '홍콩반점', '서브웨이', '한솥도시락'], min: 7000, max: 19000, w: 30, t: [11, 20] },
  { c: 'cafe', m: ['스타벅스', '메가MGC커피', '투썸플레이스', '컴포즈커피', '파리바게뜨', 'GS25'], min: 2000, max: 7500, w: 26, t: [8, 17] },
  { c: 'transport', m: ['티머니 교통', '카카오T 택시', '코레일'], min: 1500, max: 14000, w: 16, t: [7, 23] },
  { c: 'living', m: ['이마트24', '다이소', '홈플러스 익스프레스', '올리브영'], min: 3000, max: 28000, w: 12, t: [12, 22] },
  { c: 'shopping', m: ['무신사', '쿠팡', '29CM', '네이버페이'], min: 12000, max: 59000, w: 8, t: [13, 23] },
  { c: 'culture', m: ['CGV', '인터파크 티켓', '교보문고', '코인노래방'], min: 6000, max: 22000, w: 6, t: [15, 23] },
  { c: 'etc', m: ['편의점 택배', '세탁특공대', '토스 송금'], min: 3000, max: 15000, w: 2, t: [10, 20] },
];

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function pickTpl(rnd: () => number): Tpl {
  const total = TEMPLATES.reduce((a, t) => a + t.w, 0);
  let r = rnd() * total;
  for (const t of TEMPLATES) {
    if ((r -= t.w) <= 0) return t;
  }
  return TEMPLATES[0];
}

function genDay(date: Date, rnd: () => number, out: Transaction[], scale: number, isToday: boolean) {
  const key = toKey(date);
  const count = isToday ? 2 : 1 + Math.floor(rnd() * 3.2);
  const items: Transaction[] = [];
  for (let i = 0; i < count; i++) {
    const t = pickTpl(rnd);
    const raw = t.min + rnd() * (t.max - t.min);
    const amount = Math.round((raw * scale) / 100) * 100;
    const hour = isToday ? [8, 12][i] : t.t[0] + Math.floor(rnd() * (t.t[1] - t.t[0]));
    const minute = Math.floor(rnd() * 60);
    items.push({
      id: `${key}-${i}`,
      date: key,
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      merchant: isToday ? (i === 0 ? '메가MGC커피' : '한솥도시락') : pick(rnd, t.m),
      category: isToday ? (i === 0 ? 'cafe' : 'food') : t.c,
      amount: isToday ? -(i === 0 ? 2000 : 6900) : -amount,
      account: rnd() < 0.7 ? 'Deep Dream 체크' : '쏠편한 입출금통장',
    });
  }
  out.push(...items);
}

function genFixed(monthStart: Date, until: Date, out: Transaction[]) {
  for (const f of FIXED_EXPENSES) {
    const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), f.day);
    if (d > until) continue;
    out.push({
      id: `${toKey(d)}-fx-${f.day}`,
      date: toKey(d),
      time: '09:00',
      merchant: f.name,
      category: 'fixed',
      amount: -f.amount,
      account: '쏠편한 입출금통장',
    });
  }
  const pay = new Date(monthStart.getFullYear(), monthStart.getMonth(), INCOME.payday);
  if (pay <= until) {
    out.push({
      id: `${toKey(pay)}-income`,
      date: toKey(pay),
      time: '10:12',
      merchant: INCOME.source,
      category: 'income',
      amount: INCOME.amount,
      account: '쏠편한 입출금통장',
    });
  }
}

export function buildTransactions(today: Date): Transaction[] {
  const t0 = startOfDay(today);
  const thisMonth = startOfMonth(t0);
  const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);
  const out: Transaction[] = [];

  // 지난달: 전체 (비교용, 살짝 덜 씀)
  const rndL = seeded(lastMonth.getFullYear() * 100 + lastMonth.getMonth() + 7);
  for (let d = lastMonth; d <= endOfMonth(lastMonth); d = addDays(d, 1)) {
    genDay(d, rndL, out, 1.35, false);
  }
  genFixed(lastMonth, endOfMonth(lastMonth), out);

  // 이번달: 1일 ~ 어제 + 오늘 일부
  const rndT = seeded(thisMonth.getFullYear() * 100 + thisMonth.getMonth() + 11);
  for (let d = thisMonth; d < t0; d = addDays(d, 1)) {
    genDay(d, rndT, out, 1.45, false);
  }
  genDay(t0, rndT, out, 1, true);
  genFixed(thisMonth, t0, out);

  return out.sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));
}
