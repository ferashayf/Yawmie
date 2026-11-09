// Today screen: the Next up pick, the one Today list, the Your day counts (PRD T2, T5, T6).
import type { AppState, Block, HM, Item, YMD } from '../model/types';
import { blockStatus } from './blocks';
import { weekday } from './dates';

const NO_DATE = '9999-99-99';
const NO_TIME = '99:99';

const isOpen = (it: Item) => it.status === 'open';
export const isOverdue = (it: Item, today: YMD) => isOpen(it) && !!it.dueDate && it.dueDate < today;
const isOnDay = (it: Item, day: YMD) => it.dueDate === day || it.planDays.includes(day);
const isTaskForToday = (it: Item, today: YMD) => it.kind === 'task' && (isOnDay(it, today) || isOverdue(it, today));
const isAppointmentToday = (it: Item, today: YMD) => it.kind === 'appointment' && it.dueDate === today;

// Overdue first, then by date, then by time; undated and untimed go last.
function byDue(today: YMD) {
  return (a: Item, b: Item) =>
    Number(isOverdue(b, today)) - Number(isOverdue(a, today)) ||
    (a.dueDate ?? NO_DATE).localeCompare(b.dueDate ?? NO_DATE) ||
    (a.time ?? NO_TIME).localeCompare(b.time ?? NO_TIME);
}

export function todayList(s: AppState, today: YMD): Item[] {
  const due = byDue(today);
  return s.items
    .filter((it) => isOpen(it) && (isOverdue(it, today) || isAppointmentToday(it, today) || isTaskForToday(it, today)))
    .sort((a, b) => due(a, b) || Number(b.urgent) - Number(a.urgent));
}

export type NextUp =
  | { type: 'block'; block: Block }
  | { type: 'appointment'; item: Item }
  | { type: 'task'; item: Item }
  | { type: 'none' };

export function nextUp(s: AppState, today: YMD, now: HM): NextUp {
  const live = s.blocks.find((b) => b.days.includes(weekday(today)) && blockStatus(b, now) === 'live');
  if (live) return { type: 'block', block: live };
  const due = byDue(today);
  const appointment = s.items
    .filter((it) => isOpen(it) && isAppointmentToday(it, today) && !!it.time && it.time >= now)
    .sort(due)[0];
  if (appointment) return { type: 'appointment', item: appointment };
  const task = s.items
    .filter((it) => isOpen(it) && isTaskForToday(it, today))
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || due(a, b))[0];
  return task ? { type: 'task', item: task } : { type: 'none' };
}

export function dayCounts(s: AppState, today: YMD): { left: number; appointments: number; late: number } {
  const open = s.items.filter(isOpen);
  return {
    left: open.filter((it) => isTaskForToday(it, today)).length,
    appointments: open.filter((it) => isAppointmentToday(it, today)).length,
    late: open.filter((it) => isOverdue(it, today)).length,
  };
}
