import { describe, expect, it } from 'vitest';
import { addDays, addMonths, daysBetween, daysInMonth, nowHM, relDay, todayOf, weekday, weekOf } from './dates';

describe('dates', () => {
  it('daysInMonth knows leap years', () => {
    expect(daysInMonth('2028-02')).toBe(29);
    expect(daysInMonth('2026-02')).toBe(28);
    expect(daysInMonth('2026-11')).toBe(30);
  });

  it('addMonths crosses years', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
  });

  it('addDays crosses months and years', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('weekday: 2026-11-08 is a Sunday', () => {
    expect(weekday('2026-11-08')).toBe(0);
    expect(weekday('2026-11-14')).toBe(6);
  });

  it('daysBetween counts whole days', () => {
    expect(daysBetween('2026-11-07', '2026-11-09')).toBe(2);
    expect(daysBetween('2026-11-09', '2026-11-07')).toBe(-2);
  });

  it('relDay labels', () => {
    expect(relDay('2026-11-07', '2026-11-09')).toEqual({ key: 'late', n: 2 });
    expect(relDay('2026-11-09', '2026-11-09')).toEqual({ key: 'today', n: 0 });
    expect(relDay('2026-11-10', '2026-11-09')).toEqual({ key: 'tomorrow', n: 1 });
    expect(relDay('2026-11-12', '2026-11-09')).toEqual({ key: 'inDays', n: 3 });
  });

  it('weekOf starts on Sunday', () => {
    const w = weekOf('2026-11-11');
    expect(w[0]).toBe('2026-11-08');
    expect(w[6]).toBe('2026-11-14');
  });

  it('todayOf and nowHM use the local clock, never UTC', () => {
    expect(todayOf(new Date(2026, 10, 9, 23, 59))).toBe('2026-11-09');
    expect(todayOf(new Date(2026, 10, 10, 0, 1))).toBe('2026-11-10');
    expect(nowHM(new Date(2026, 10, 9, 7, 5))).toBe('07:05');
  });
});
