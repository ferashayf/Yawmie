// Changes on the Money tab, as pure state-in, state-out functions.
import type { AppState, YM, YMD } from '../model/types';
import type { BankLine } from './bankMessages';
import { monthOf } from './dates';

// limit 0 removes the budget. categoryId null = the overall monthly budget.
export function setBudget(s: AppState, categoryId: string | null, limitHalalas: number, newId: () => string): AppState {
  const rest = s.budgets.filter((b) => b.categoryId !== categoryId);
  if (limitHalalas <= 0) return { ...s, budgets: rest };
  const existing = s.budgets.find((b) => b.categoryId === categoryId);
  const budget = existing ? { ...existing, limitHalalas } : { id: newId(), categoryId, limitHalalas, topUps: {} };
  return { ...s, budgets: existing ? s.budgets.map((b) => (b.categoryId === categoryId ? budget : b)) : [...s.budgets, budget] };
}

// The paid switch: records this month at today's bill amount (kept per month, PRD M9).
export function togglePaid(s: AppState, billId: string, ym: YM, today: YMD): AppState {
  return {
    ...s,
    bills: s.bills.map((b) => {
      if (b.id !== billId) return b;
      const { [ym]: was, ...others } = b.paid;
      return { ...b, paid: was ? others : { ...b.paid, [ym]: { amountHalalas: b.amountHalalas, at: today } } };
    }),
  };
}

export function toggleSkip(s: AppState, billId: string, ym: YM): AppState {
  return {
    ...s,
    bills: s.bills.map((b) => {
      if (b.id !== billId) return b;
      const { [ym]: was, ...others } = b.skipped;
      return { ...b, skipped: was ? others : { ...b.skipped, [ym]: true } };
    }),
  };
}

export interface PastedLine extends BankLine { on: boolean; billId?: string; payBill?: boolean }

// Review → save: matched bills are marked paid (no spending line); the rest become spending, refunds negative.
export function savePasted(s: AppState, lines: PastedLine[], newId: () => string, labels: { cash: string; transfer: string; purchase: string }): { state: AppState; saved: number; paid: number } {
  let state = s;
  let saved = 0;
  let paid = 0;
  for (const f of lines.filter((x) => x.on)) {
    const bill = f.billId && f.payBill ? state.bills.find((b) => b.id === f.billId) : undefined;
    if (bill) {
      const ym = monthOf(f.date);
      state = { ...state, bills: state.bills.map((b) => (b.id === bill.id ? { ...b, paid: { ...b.paid, [ym]: { amountHalalas: f.amountHalalas, at: f.date } } } : b)) };
      paid++;
      continue;
    }
    const refund = f.kind === 'refund';
    const note = f.merchant || (f.kind === 'cash' ? labels.cash : f.kind === 'transfer' ? labels.transfer : labels.purchase);
    state = {
      ...state,
      expenses: [...state.expenses, { id: newId(), date: f.date, time: f.time || undefined, amountHalalas: refund ? -f.amountHalalas : f.amountHalalas, categoryId: f.categoryId, note, ...(refund ? { refund: true as const } : {}) }],
    };
    saved++;
  }
  return { state, saved, paid };
}
