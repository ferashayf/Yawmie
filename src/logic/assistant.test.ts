import { describe, expect, it } from 'vitest';
import { emptyState } from '../model/empty';
import type { AppState, Item } from '../model/types';
import { brief, bubbleLine, reply } from './assistant';

const TODAY = '2026-11-09';
let n = 0;
const item = (over: Partial<Item>): Item => ({ id: `i${++n}`, kind: 'task', title: 't', areaId: 'work', urgent: false, alert: 'none', planDays: [], status: 'open', ...over });

const appt = item({ kind: 'appointment', dueDate: TODAY, time: '15:00' });
const task = item({ dueDate: TODAY });
const late = item({ dueDate: '2026-11-07' });
const s: AppState = {
  ...emptyState(),
  items: [appt, task, late],
  bills: [
    { id: 'soon', name: 'Internet', amountHalalas: 30000, dueDay: 11, categoryId: 'home', paid: {}, skipped: {} },
    { id: 'far', name: 'Rent', amountHalalas: 90000, dueDay: 28, categoryId: 'home', paid: {}, skipped: {} },
  ],
  budgets: [{ id: 'f', categoryId: 'food', limitHalalas: 10000, topUps: {} }],
  expenses: [{ id: 'e', date: TODAY, amountHalalas: 8500, categoryId: 'food' }],
};

const keys = (parts: ReturnType<typeof reply>) => parts.map((p) => (p.type === 'text' ? p.key : p.type));

describe('assistant', () => {
  it('«وش عندي اليوم؟» lists today: appointments then tasks', () => {
    const parts = reply('وش عندي اليوم؟', s, TODAY);
    expect(parts[0]).toMatchObject({ type: 'text', key: 'bot.todayHead', vars: { tasks: 1, appointments: 1 } });
    expect(parts[1]).toEqual({ type: 'items', ids: [appt.id, task.id] });
  });

  it("\"what's late?\" lists overdue", () => {
    expect(reply("what's late?", s, TODAY)[1]).toEqual({ type: 'items', ids: [late.id] });
  });

  it('bills question lists bills due within 3 days', () => {
    expect(reply('bills', s, TODAY)).toEqual([{ type: 'text', key: 'bot.billsHead' }, { type: 'bills', ids: ['soon'] }]);
  });

  it('thanks and help', () => {
    expect(keys(reply('شكرا', s, TODAY))).toEqual(['bot.thanks']);
    expect(keys(reply('help', s, TODAY))).toEqual(['bot.help', 'tourButton']);
  });

  it('a sentence with a number becomes one Add card', () => {
    const parts = reply('coffee 45 SAR', s, TODAY);
    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({ type: 'addCard', draft: { kind: 'expense', amountHalalas: 4500 } });
  });

  it('two lines go to the review list', () => {
    expect(reply('meeting tomorrow 11:00\nspent 20 SAR lunch', s, TODAY)[0]).toMatchObject({ type: 'review', drafts: [{}, {}] });
  });

  it('brief: hello, today, late, soon bills, categories at 80%+', () => {
    expect(keys(brief(s, TODAY, '09:00'))).toEqual(['bot.hello', 'bot.todayHead', 'items', 'bot.lateHead', 'items', 'bot.billsHead', 'bills', 'bot.spend', 'bot.warnCats', 'categories']);
  });

  it('empty state brief is a quiet day', () => {
    expect(keys(brief(emptyState(), TODAY, '09:00'))).toEqual(['bot.hello', 'bot.todayNone']);
  });

  it('bubble line: overdue count, else next appointment, else quiet', () => {
    expect(bubbleLine(s, TODAY, '09:00')).toEqual({ type: 'text', key: 'bot.bubbleLate', vars: { n: 1 } });
    expect(bubbleLine({ ...s, items: [appt] }, TODAY, '09:00')).toEqual({ type: 'text', key: 'bot.bubbleAppt', vars: { time: '15:00' } });
    expect(bubbleLine(emptyState(), TODAY, '09:00')).toEqual({ type: 'text', key: 'bot.bubbleFree' });
  });
});
