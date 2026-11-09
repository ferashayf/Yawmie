// Local calendar dates as 'YYYY-MM-DD' strings. Never converted to UTC.
import type { HM, Weekday, YM, YMD } from '../model/types';

const DAY_MS = 86_400_000;
const DAYS_IN_WEEK = 7;

const pad = (n: number) => String(n).padStart(2, '0');

function fromYMD(s: YMD): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toYMD(d: Date): YMD {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayOf = (now: Date): YMD => toYMD(now);
export const nowHM = (now: Date): HM => `${pad(now.getHours())}:${pad(now.getMinutes())}`;

export function addDays(s: YMD, n: number): YMD {
  const d = fromYMD(s);
  d.setDate(d.getDate() + n);
  return toYMD(d);
}

export function addMonths(ym: YM, n: number): YM {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function daysInMonth(ym: YM): number {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export const weekday = (s: YMD): Weekday => fromYMD(s).getDay() as Weekday;

// Rounded so a daylight-saving hour can never shift the count.
export const daysBetween = (a: YMD, b: YMD): number => Math.round((fromYMD(b).getTime() - fromYMD(a).getTime()) / DAY_MS);

export function relDay(due: YMD, today: YMD): { key: 'today' | 'tomorrow' | 'inDays' | 'late'; n: number } {
  const n = daysBetween(today, due);
  if (n < 0) return { key: 'late', n: -n };
  if (n === 0) return { key: 'today', n: 0 };
  if (n === 1) return { key: 'tomorrow', n: 1 };
  return { key: 'inDays', n };
}

export function weekOf(d: YMD): YMD[] {
  const sunday = addDays(d, -weekday(d));
  return Array.from({ length: DAYS_IN_WEEK }, (_, i) => addDays(sunday, i));
}

export const monthOf = (d: YMD): YM => d.slice(0, 7);
