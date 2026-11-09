import { describe, expect, it } from 'vitest';
import { emptyState } from '../model/empty';
import type { Draft } from '../model/types';
import { saveDraft } from './drafts';

const TODAY = '2026-11-09';
const draft = (over: Partial<Draft>): Draft => ({ kind: 'task', title: 'x', date: TODAY, time: '', amountHalalas: null, areaId: 'work', categoryId: 'food', recurrence: null, urgent: false, ...over });
const ids = { n: 0 };
const nextId = () => `id${++ids.n}`;

describe('saveDraft', () => {
  it('a task becomes an open item', () => {
    const s = saveDraft(emptyState(), draft({ title: 'Call the bank', urgent: true, time: '10:00' }), nextId);
    expect(s.items[0]).toMatchObject({ kind: 'task', title: 'Call the bank', dueDate: TODAY, time: '10:00', urgent: true, status: 'open', alert: 'none', planDays: [] });
  });

  it('a to-do has no date or time', () => {
    const s = saveDraft(emptyState(), draft({ kind: 'todo', date: '', time: '' }), nextId);
    expect(s.items[0].dueDate).toBeUndefined();
    expect(s.items[0].time).toBeUndefined();
  });

  it('an appointment is never urgent', () => {
    expect(saveDraft(emptyState(), draft({ kind: 'appointment', urgent: true }), nextId).items[0].urgent).toBe(false);
  });

  it('spending becomes an expense with the title as its note', () => {
    const s = saveDraft(emptyState(), draft({ kind: 'expense', title: 'coffee', amountHalalas: 4500, categoryId: 'food' }), nextId);
    expect(s.expenses[0]).toMatchObject({ date: TODAY, amountHalalas: 4500, categoryId: 'food', note: 'coffee' });
    expect(s.items).toEqual([]);
  });

  it('a bill takes its due day from the date', () => {
    const s = saveDraft(emptyState(), draft({ kind: 'bill', title: 'Internet', amountHalalas: 30000, date: '2026-11-27', categoryId: 'home' }), nextId);
    expect(s.bills[0]).toMatchObject({ name: 'Internet', amountHalalas: 30000, dueDay: 27, categoryId: 'home', paid: {}, skipped: {} });
  });

  it('keeps the recurrence, starting on the date', () => {
    const s = saveDraft(emptyState(), draft({ recurrence: { freq: 'day', every: 1, start: '2026-01-01' } }), nextId);
    expect(s.items[0].recurrence).toEqual({ freq: 'day', every: 1, start: TODAY });
  });
});
