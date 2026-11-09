import { describe, expect, it } from 'vitest';
import { emptyState } from '../model/empty';
import type { AppState, Bill } from '../model/types';
import { savePasted, setBudget, togglePaid, toggleSkip, type PastedLine } from './money-edits';

const bill: Bill = { id: 'b1', name: 'Internet', amountHalalas: 30000, dueDay: 27, categoryId: 'home', paid: {}, skipped: {} };
const withBill = (): AppState => ({ ...emptyState(), bills: [bill] });
let n = 0;
const id = () => `x${++n}`;

describe('setBudget', () => {
  it('creates, updates, and removes (0) a budget', () => {
    let s = setBudget(emptyState(), null, 500000, id);
    expect(s.budgets).toMatchObject([{ categoryId: null, limitHalalas: 500000, topUps: {} }]);
    s = setBudget(s, null, 400000, id);
    expect(s.budgets).toHaveLength(1);
    expect(s.budgets[0].limitHalalas).toBe(400000);
    expect(setBudget(s, null, 0, id).budgets).toEqual([]);
  });
});

describe('bills paid and skipped', () => {
  it('the paid switch records this month at the current amount, and turns off', () => {
    const s = togglePaid(withBill(), 'b1', '2026-11', '2026-11-09');
    expect(s.bills[0].paid['2026-11']).toEqual({ amountHalalas: 30000, at: '2026-11-09' });
    expect(togglePaid(s, 'b1', '2026-11', '2026-11-09').bills[0].paid).toEqual({});
  });

  it('skip and bring back', () => {
    const s = toggleSkip(withBill(), 'b1', '2026-11');
    expect(s.bills[0].skipped).toEqual({ '2026-11': true });
    expect(toggleSkip(s, 'b1', '2026-11').bills[0].skipped).toEqual({});
  });
});

describe('savePasted', () => {
  const line = (over: Partial<PastedLine>): PastedLine => ({ kind: 'expense', amountHalalas: 2300, merchant: 'Corner Cafe', date: '2026-11-09', time: '08:14', categoryId: 'food', on: true, ...over });

  it('switched-on lines become spending; switched-off ones are skipped', () => {
    const { state, saved, paid } = savePasted(emptyState(), [line({}), line({ on: false })], id, { cash: 'Cash', transfer: 'Transfer', purchase: 'Purchase' });
    expect([saved, paid]).toEqual([1, 0]);
    expect(state.expenses[0]).toMatchObject({ amountHalalas: 2300, note: 'Corner Cafe', time: '08:14', categoryId: 'food' });
  });

  it('a refund is saved negative with the refund flag', () => {
    const { state } = savePasted(emptyState(), [line({ kind: 'refund', amountHalalas: 8900 })], id, { cash: 'Cash', transfer: 'Transfer', purchase: 'Purchase' });
    expect(state.expenses[0]).toMatchObject({ amountHalalas: -8900, refund: true });
  });

  it('a matched bill is marked paid and adds no spending line', () => {
    const { state, saved, paid } = savePasted(withBill(), [line({ amountHalalas: 30000, billId: 'b1', payBill: true })], id, { cash: 'Cash', transfer: 'Transfer', purchase: 'Purchase' });
    expect([saved, paid]).toEqual([0, 1]);
    expect(state.expenses).toEqual([]);
    expect(state.bills[0].paid['2026-11']).toEqual({ amountHalalas: 30000, at: '2026-11-09' });
  });

  it('a cash line without a shop gets a plain label', () => {
    const { state } = savePasted(emptyState(), [line({ kind: 'cash', merchant: '' })], id, { cash: 'Cash', transfer: 'Transfer', purchase: 'Purchase' });
    expect(state.expenses[0].note).toBe('Cash');
  });
});
