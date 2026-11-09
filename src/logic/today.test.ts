import { describe, expect, it } from 'vitest';
import { emptyState } from '../model/empty';
import type { AppState, Block, Item } from '../model/types';
import { dayCounts, isOverdue, nextUp, todayList } from './today';

const TODAY = '2026-11-09'; // Monday

let n = 0;
function item(over: Partial<Item>): Item {
  return { id: `i${++n}`, kind: 'task', title: 't', areaId: 'work', urgent: false, alert: 'none', planDays: [], status: 'open', ...over };
}
function stateWith(items: Item[], blocks: Block[] = []): AppState {
  return { ...emptyState(), items, blocks };
}

describe('today', () => {
  const late2 = item({ title: 'late 2 days', dueDate: '2026-11-07' });
  const late1 = item({ title: 'late 1 day', dueDate: '2026-11-08' });
  const appt10 = item({ title: 'appt 10', kind: 'appointment', dueDate: TODAY, time: '10:00' });
  const appt9 = item({ title: 'appt 9', kind: 'appointment', dueDate: TODAY, time: '09:00' });
  const task = item({ title: 'task today', dueDate: TODAY });
  const urgent = item({ title: 'urgent today', dueDate: TODAY, urgent: true });
  const planned = item({ title: 'planned today', dueDate: '2026-11-20', planDays: [TODAY] });
  const later = item({ title: 'later', dueDate: '2026-11-20' });
  const todo = item({ title: 'someday', kind: 'todo' });
  const done = item({ title: 'done', dueDate: TODAY, status: 'done' });
  const s = stateWith([task, appt10, later, late1, todo, urgent, appt9, done, planned, late2]);

  it('isOverdue only for open items before today', () => {
    expect(isOverdue(late1, TODAY)).toBe(true);
    expect(isOverdue(task, TODAY)).toBe(false);
    expect(isOverdue(todo, TODAY)).toBe(false);
    expect(isOverdue({ ...late1, status: 'done' }, TODAY)).toBe(false);
  });

  it('order: overdue oldest first, then appointments by time, then tasks (urgent first)', () => {
    expect(todayList(s, TODAY).map((x) => x.title)).toEqual(['late 2 days', 'late 1 day', 'appt 9', 'appt 10', 'urgent today', 'task today', 'planned today']);
  });

  it('no item appears twice; done, later and undated items stay out', () => {
    const ids = todayList(s, TODAY).map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(done.id);
    expect(ids).not.toContain(later.id);
    expect(ids).not.toContain(todo.id);
  });

  it('nextUp prefers the next appointment today', () => {
    expect(nextUp(s, TODAY, '09:30')).toMatchObject({ type: 'appointment', item: { title: 'appt 10' } });
  });

  it('nextUp falls back to urgent, then oldest task', () => {
    expect(nextUp(s, TODAY, '11:00')).toMatchObject({ type: 'task', item: { title: 'urgent today' } });
    const noUrgent = stateWith([task, late1]);
    expect(nextUp(noUrgent, TODAY, '11:00')).toMatchObject({ type: 'task', item: { title: 'late 1 day' } });
  });

  it('nextUp shows a live block first', () => {
    const block: Block = { id: 'b1', areaId: 'work', start: '09:00', end: '13:00', days: [1] };
    expect(nextUp(stateWith([appt10], [block]), TODAY, '09:30')).toMatchObject({ type: 'block', block: { id: 'b1' } });
  });

  it('empty state → none and zero counts', () => {
    expect(nextUp(emptyState(), TODAY, '09:00')).toEqual({ type: 'none' });
    expect(dayCounts(emptyState(), TODAY)).toEqual({ left: 0, appointments: 0, late: 0 });
  });

  it('counts: tasks left (incl. late), appointments today, late items', () => {
    expect(dayCounts(s, TODAY)).toEqual({ left: 5, appointments: 2, late: 2 });
  });
});
