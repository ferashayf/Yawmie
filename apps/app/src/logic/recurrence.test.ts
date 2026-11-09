import { describe, expect, it } from 'vitest';
import type { Item, Recurrence } from '../model/types';
import { finishItem, nextDate, PRESETS, recurrencePreset } from './recurrence';

const monthly = (start: string): Recurrence => ({ freq: 'month', every: 1, start });

function item(over: Partial<Item> = {}): Item {
  return { id: 'i1', kind: 'task', title: 'x', areaId: 'work', urgent: false, alert: 'none', planDays: [], status: 'open', dueDate: '2026-11-01', ...over };
}

describe('nextDate', () => {
  it('monthly on the 31st lands on the last day, then back to the 31st', () => {
    const r = monthly('2026-01-31');
    expect(nextDate(r, '2026-01-31', '2026-01-31')).toBe('2026-02-28');
    expect(nextDate(r, '2026-02-28', '2026-02-28')).toBe('2026-03-31');
  });

  it('yearly Feb 29 lands on Feb 28', () => {
    expect(nextDate({ freq: 'year', every: 1, start: '2028-02-29' }, '2028-02-29', '2028-02-29')).toBe('2029-02-28');
  });

  it('finished late keeps the original schedule', () => {
    const weekly = PRESETS.weekly('2026-11-01');
    expect(nextDate(weekly, '2026-11-01', '2026-11-09')).toBe('2026-11-15');
  });

  it('workdays skip Friday and Saturday', () => {
    expect(nextDate(PRESETS.workdays('2026-11-12'), '2026-11-12', '2026-11-12')).toBe('2026-11-15'); // Thu → Sun
  });

  it('every 2 weeks on Sunday and Wednesday', () => {
    const r: Recurrence = { freq: 'week', every: 2, days: [0, 3], start: '2026-11-01' };
    expect(nextDate(r, '2026-11-01', '2026-11-01')).toBe('2026-11-04');
    expect(nextDate(r, '2026-11-04', '2026-11-04')).toBe('2026-11-15');
  });

  it('daily steps one day', () => {
    expect(nextDate(PRESETS.daily('2026-11-09'), '2026-11-09', '2026-11-09')).toBe('2026-11-10');
  });

  it('past the end returns null', () => {
    expect(nextDate({ ...monthly('2026-10-05'), end: '2026-11-30' }, '2026-11-05', '2026-11-05')).toBeNull();
  });
});

describe('finishItem', () => {
  it('moves a recurring item to its next date', () => {
    const it2 = finishItem(item({ recurrence: PRESETS.weekly('2026-11-01') }), '2026-11-09');
    expect(it2.status).toBe('open');
    expect(it2.dueDate).toBe('2026-11-15');
  });

  it('marks done when the series has ended', () => {
    const it2 = finishItem(item({ dueDate: '2026-11-05', recurrence: { ...monthly('2026-10-05'), end: '2026-11-30' } }), '2026-11-09');
    expect(it2).toMatchObject({ status: 'done', doneAt: '2026-11-09' });
  });

  it('non-recurring item becomes done with doneAt', () => {
    expect(finishItem(item(), '2026-11-09')).toMatchObject({ status: 'done', doneAt: '2026-11-09' });
  });

  it('never mutates its input', () => {
    const before = Object.freeze(item({ recurrence: Object.freeze(PRESETS.daily('2026-11-01')) }));
    expect(() => finishItem(before, '2026-11-09')).not.toThrow();
    expect(before.dueDate).toBe('2026-11-01');
  });
});

describe('recurrencePreset', () => {
  it('names the presets and custom shapes', () => {
    expect(recurrencePreset(PRESETS.workdays('2026-11-09'))).toBe('workdays');
    expect(recurrencePreset(PRESETS.weekly('2026-11-09'))).toBe('weekly');
    expect(recurrencePreset(monthly('2026-11-09'))).toBe('monthly');
    expect(recurrencePreset({ freq: 'day', every: 2, start: '2026-11-09' })).toBe('custom');
    expect(recurrencePreset({ ...monthly('2026-11-09'), end: '2026-12-31' })).toBe('custom');
  });
});
