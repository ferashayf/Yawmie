// Monthly bills (PRD M8, M9). Money is whole halalas.
import type { AppState, Bill, YM, YMD } from '../model/types';
import { daysInMonth } from './dates';

// Day 29–31 falls on the last day of a shorter month.
export const dueDayIn = (b: Bill, ym: YM) => Math.min(b.dueDay, daysInMonth(ym));

const isSkipped = (b: Bill, ym: YM) => !b.paid[ym] && !!b.skipped[ym];

export function billsMonth(s: AppState, ym: YM): { total: number; paid: number; left: number; next?: { bill: Bill; date: YMD } } {
  let total = 0;
  let paid = 0;
  let next: Bill | undefined;
  for (const b of s.bills) {
    if (isSkipped(b, ym)) continue;
    const p = b.paid[ym];
    if (p) {
      total += p.amountHalalas;
      paid += p.amountHalalas;
      continue;
    }
    total += b.amountHalalas;
    if (!next || dueDayIn(b, ym) < dueDayIn(next, ym)) next = b;
  }
  const result = { total, paid, left: total - paid };
  if (!next) return result;
  return { ...result, next: { bill: next, date: `${ym}-${String(dueDayIn(next, ym)).padStart(2, '0')}` } };
}
