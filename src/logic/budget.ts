// Budgets, Safe to spend and the month comparison (PRD M1, M4, M5).
import type { AppState, YM, YMD } from '../model/types';
import { billsMonth } from './bills';
import { addMonths, daysInMonth, monthOf } from './dates';

const WARN_PCT = 80;
const FULL_PCT = 100;
const LAST_DAY = 31;

const dayOf = (d: YMD) => Number(d.slice(8));

// Expenses (refunds are negative) + bills paid that month. `upToDay` cuts expenses only.
export function spentMonth(s: AppState, ym: YM, categoryId?: string, upToDay = LAST_DAY): number {
  const matches = (cat: string) => categoryId === undefined || cat === categoryId;
  const expenses = s.expenses
    .filter((e) => monthOf(e.date) === ym && dayOf(e.date) <= upToDay && matches(e.categoryId))
    .reduce((sum, e) => sum + e.amountHalalas, 0);
  const bills = s.bills.filter((b) => b.paid[ym] && matches(b.categoryId)).reduce((sum, b) => sum + b.paid[ym].amountHalalas, 0);
  return expenses + bills;
}

export function budgetLevel(spent: number, limit: number): 'ok' | 'warn' | 'over' {
  if (spent * 100 >= limit * FULL_PCT) return 'over';
  return spent * 100 >= limit * WARN_PCT ? 'warn' : 'ok';
}

export function limitFor(s: AppState, ym: YM, categoryId: string | null = null): number | null {
  const b = s.budgets.find((x) => x.categoryId === categoryId);
  return b ? b.limitHalalas + (b.topUps[ym] ?? 0) : null;
}

// (budget left − unpaid bills this month) ÷ days left including today, rounded down, never below 0.
export function safeToSpend(s: AppState, today: YMD): { perDay: number; left: number; unpaid: number; days: number } | null {
  const ym = monthOf(today);
  const limit = limitFor(s, ym);
  if (limit === null) return null;
  const left = limit - spentMonth(s, ym);
  const unpaid = billsMonth(s, ym).left;
  const days = daysInMonth(ym) - dayOf(today) + 1;
  const free = left - unpaid;
  return { perDay: free > 0 ? Math.floor(free / days) : 0, left, unpaid, days };
}

// The current month is compared with last month cut at the same day.
export function vsLastMonth(s: AppState, today: YMD, ym: YM = monthOf(today)): { pct: number; less: boolean } | null {
  const cut = ym === monthOf(today) ? dayOf(today) : LAST_DAY;
  const now = spentMonth(s, ym, undefined, cut);
  const before = spentMonth(s, addMonths(ym, -1), undefined, cut);
  if (before <= 0) return null;
  return { pct: Math.round((Math.abs(now - before) / before) * FULL_PCT), less: now < before };
}
