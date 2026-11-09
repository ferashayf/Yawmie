// Repeating items. Finishing late keeps the original schedule (PRD D7).
import type { Item, Recurrence, Weekday, YMD } from '../model/types';
import { addDays, addMonths, daysBetween, daysInMonth, weekday } from './dates';

const DAYS_IN_WEEK = 7;
const MONTHS_IN_YEAR = 12;
const MAX_STEPS = 10_000; // guards against a bad rule looping forever
const WORK_WEEK: Weekday[] = [0, 1, 2, 3, 4]; // Sunday–Thursday

export type Preset = 'daily' | 'workdays' | 'weekly' | 'monthly' | 'yearly';

export const PRESETS: Record<Preset, (start: YMD) => Recurrence> = {
  daily: (start) => ({ freq: 'day', every: 1, start }),
  workdays: (start) => ({ freq: 'week', every: 1, days: [...WORK_WEEK], start }),
  weekly: (start) => ({ freq: 'week', every: 1, days: [weekday(start)], start }),
  monthly: (start) => ({ freq: 'month', every: 1, start }),
  yearly: (start) => ({ freq: 'year', every: 1, start }),
};

const sundayOf = (d: YMD) => addDays(d, -weekday(d));

function step(rec: Recurrence, from: YMD): YMD {
  const every = rec.every || 1;
  if (rec.freq === 'day') return addDays(from, every);
  if (rec.freq === 'week') {
    if (!rec.days?.length) return addDays(from, DAYS_IN_WEEK * every);
    for (let i = 1; i <= DAYS_IN_WEEK * (every + 1); i++) {
      const x = addDays(from, i);
      const weeks = daysBetween(sundayOf(rec.start), sundayOf(x)) / DAYS_IN_WEEK;
      if (rec.days.includes(weekday(x)) && weeks % every === 0) return x;
    }
    return addDays(from, DAYS_IN_WEEK * every);
  }
  const months = rec.freq === 'year' ? MONTHS_IN_YEAR * every : every;
  const ym = addMonths(from.slice(0, 7), months);
  const day = Math.min(Number(rec.start.slice(8)), daysInMonth(ym)); // the 31st → last day of short months
  return `${ym}-${String(day).padStart(2, '0')}`;
}

// Steps from the old due date, never from the day it was finished. null = the series has ended.
export function nextDate(rec: Recurrence, from: YMD, today: YMD): YMD | null {
  let next = step(rec, from);
  for (let guard = 0; next < today && guard < MAX_STEPS; guard++) next = step(rec, next);
  return rec.end && next > rec.end ? null : next;
}

export function finishItem(item: Item, today: YMD): Item {
  const next = item.recurrence ? nextDate(item.recurrence, item.dueDate ?? today, today) : null;
  if (next) return { ...item, dueDate: next };
  return { ...item, status: 'done', doneAt: today };
}

export function recurrencePreset(rec: Recurrence): Preset | 'custom' {
  if (rec.every !== 1 || rec.end) return 'custom';
  if (rec.freq === 'day') return 'daily';
  if (rec.freq === 'month') return 'monthly';
  if (rec.freq === 'year') return 'yearly';
  const days = [...(rec.days ?? [])].sort().join();
  if (days === WORK_WEEK.join()) return 'workdays';
  return (rec.days ?? []).length <= 1 ? 'weekly' : 'custom';
}
