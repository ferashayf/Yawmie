import { describe, expect, it } from 'vitest';
import { emptyState } from '../model/empty';
import type { AppState, Bill, Budget, Expense } from '../model/types';
import { billsMonth, dueDayIn } from './bills';
import { budgetLevel, safeToSpend, spentMonth, vsLastMonth } from './budget';

const bill = (over: Partial<Bill>): Bill => ({ id: 'b', name: 'b', amountHalalas: 10000, dueDay: 10, categoryId: 'home', paid: {}, skipped: {}, ...over });
const exp = (date: string, amountHalalas: number, categoryId = 'food', over: Partial<Expense> = {}): Expense => ({ id: date + amountHalalas, date, amountHalalas, categoryId, ...over });
const overall = (limitHalalas: number, topUps = {}): Budget => ({ id: 'g', categoryId: null, limitHalalas, topUps });
const withMoney = (m: Partial<AppState>): AppState => ({ ...emptyState(), ...m });

describe('bills', () => {
  it('due day 31 in November is the 30th; February 2028 the 29th', () => {
    expect(dueDayIn(bill({ dueDay: 31 }), '2026-11')).toBe(30);
    expect(dueDayIn(bill({ dueDay: 31 }), '2028-02')).toBe(29);
  });

  it('month totals: paid amount per month, skipped left out, next = earliest unpaid', () => {
    const s = withMoney({
      bills: [
        bill({ id: 'paid', amountHalalas: 20000, paid: { '2026-11': { amountHalalas: 18000 } } }),
        bill({ id: 'late', amountHalalas: 5000, dueDay: 27 }),
        bill({ id: 'soon', amountHalalas: 3000, dueDay: 12 }),
        bill({ id: 'skip', amountHalalas: 9900, skipped: { '2026-11': true } }),
      ],
    });
    const t = billsMonth(s, '2026-11');
    expect([t.total, t.paid, t.left]).toEqual([26000, 18000, 8000]);
    expect(t.next).toMatchObject({ bill: { id: 'soon' }, date: '2026-11-12' });
  });

  it('all paid → no next bill', () => {
    expect(billsMonth(withMoney({ bills: [bill({ paid: { '2026-11': { amountHalalas: 1 } } })] }), '2026-11').next).toBeUndefined();
  });
});

describe('budget', () => {
  it('paid bills count toward spent, and refunds lower it', () => {
    const s = withMoney({
      expenses: [exp('2026-11-02', 4500), exp('2026-11-03', -1500, 'food', { refund: true }), exp('2026-10-30', 9999)],
      bills: [bill({ categoryId: 'home', paid: { '2026-11': { amountHalalas: 30000 } } })],
    });
    expect(spentMonth(s, '2026-11')).toBe(33000);
    expect(spentMonth(s, '2026-11', 'food')).toBe(3000);
    expect(spentMonth(s, '2026-11', 'home')).toBe(30000);
  });

  it('budgetLevel warns at 80% and is over at 100%', () => {
    expect(budgetLevel(7900, 10000)).toBe('ok');
    expect(budgetLevel(8000, 10000)).toBe('warn');
    expect(budgetLevel(9999, 10000)).toBe('warn');
    expect(budgetLevel(10000, 10000)).toBe('over');
  });

  const mid = withMoney({
    budgets: [overall(500000)],
    expenses: [exp('2026-11-05', 267700)],
    bills: [bill({ amountHalalas: 65000, dueDay: 20 })],
  });

  it('safe to spend, mid-month example', () => {
    expect(safeToSpend(mid, '2026-11-09')).toEqual({ perDay: 7604, left: 232300, unpaid: 65000, days: 22 });
  });

  it('last day of the month: 1 day left', () => {
    expect(safeToSpend(mid, '2026-11-30')?.days).toBe(1);
  });

  it('first day of the month: whole month left', () => {
    expect(safeToSpend(withMoney({ budgets: [overall(300000)] }), '2026-11-01')).toEqual({ perDay: 10000, left: 300000, unpaid: 0, days: 30 });
  });

  it('over budget → 0 per day', () => {
    expect(safeToSpend(withMoney({ budgets: [overall(1000)], expenses: [exp('2026-11-02', 5000)] }), '2026-11-09')?.perDay).toBe(0);
  });

  it('unpaid bills larger than what is left → 0 per day', () => {
    expect(safeToSpend(withMoney({ budgets: [overall(50000)], bills: [bill({ amountHalalas: 60000 })] }), '2026-11-09')?.perDay).toBe(0);
  });

  it('top-ups add to this month only', () => {
    const s = withMoney({ budgets: [overall(100000, { '2026-11': 10000 })] });
    expect(safeToSpend(s, '2026-11-01')?.left).toBe(110000);
    expect(safeToSpend(s, '2026-12-01')?.left).toBe(100000);
  });

  it('no budget → null', () => {
    expect(safeToSpend(emptyState(), '2026-11-09')).toBeNull();
  });

  it('vs last month cuts last month at the same day', () => {
    const s = withMoney({ expenses: [exp('2026-11-05', 9000), exp('2026-10-05', 10000), exp('2026-10-20', 50000)] });
    expect(vsLastMonth(s, '2026-11-09')).toEqual({ pct: 10, less: true });
  });

  it('no spending last month → null', () => {
    expect(vsLastMonth(withMoney({ expenses: [exp('2026-11-05', 9000)] }), '2026-11-09')).toBeNull();
  });
});
