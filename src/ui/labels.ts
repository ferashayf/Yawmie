// Turning data into the words and numbers on screen. Text comes from the ar/en tables.
import type { Strings } from '../i18n';
import { fmtDate } from '../i18n/format';
import { addDays, daysBetween } from '../logic/dates';
import { recurrencePreset } from '../logic/recurrence';
import type { Area, Category, Lang, Name, Recurrence, YMD } from '../model/types';

const A_SUNDAY = '2026-11-01';

export const nameOf = (n: Name, lang: Lang) => (typeof n === 'string' ? n : n[lang]);
export const findArea = (areas: Area[], id: string) => areas.find((a) => a.id === id) ?? areas[0];
export const findCategory = (cats: Category[], id: string) => cats.find((c) => c.id === id) ?? cats[0];

export const dayName = (weekday: number, lang: Lang, style: 'short' | 'long' = 'short') => fmtDate(addDays(A_SUNDAY, weekday), lang, { weekday: style });

export function repeatLabel(rec: Recurrence, t: Strings, lang: Lang): string {
  const preset = recurrencePreset(rec);
  if (preset !== 'custom') return t.reps[preset === 'workdays' ? 'weekdays' : preset];
  const unit = t.units[rec.freq];
  let text = rec.every === 1 ? t.everyOne(unit[0]) : t.everyN(rec.every, unit[1]);
  if (rec.freq === 'week' && rec.days?.length) text += `: ${[...rec.days].sort().map((d) => dayName(d, lang)).join(lang === 'ar' ? '، ' : ', ')}`;
  if (rec.end) text += ` · ${t.until} ${fmtDate(rec.end, lang, { day: 'numeric', month: 'short' })}`;
  return text;
}

// "2 days late", "Today", "Tomorrow", or a short date.
export function dueText(due: YMD, today: YMD, t: Strings, lang: Lang): string {
  const n = daysBetween(today, due);
  if (n < 0) return t.late(-n);
  return t.rel(n) || fmtDate(due, lang, { weekday: 'short', day: 'numeric' });
}
