// "Remind me" through the "Yawmie Reminder" Apple Shortcut, which makes an Apple Reminder (PRD R1–R2, spike 2).
import { addDays, addMonths, monthOf } from '../logic/dates';
import { dueDayIn } from '../logic/bills';
import { nextDate } from '../logic/recurrence';
import type { Bill, HM, Item, YMD } from '../model/types';

const SHORTCUT = 'Yawmie Reminder';
const DEFAULT_TIME = '09:00';
const TITLE_MAX = 200;
const MINUTES_IN_DAY = 1440;
const MINUTES = 60;

export interface Reminder { title: string; date: YMD; time: HM | '' }

const pad = (n: number) => String(n).padStart(2, '0');

// The shortcut's alert field takes one value, so date and time travel together as `when`.
export function reminderLink(r: Reminder): string {
  const payload = JSON.stringify({ title: r.title.slice(0, TITLE_MAX), when: `${r.date} ${r.time || DEFAULT_TIME}` });
  return `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT)}&input=text&text=${encodeURIComponent(payload)}`;
}

// The item's alert ("15 minutes before", "1 day before", …) moves the reminder earlier. Recurring: only the next date.
export function itemReminder(it: Item, today: YMD): Reminder | null {
  if (it.alert === 'none' || !it.dueDate) return null;
  const due = it.recurrence && it.dueDate < today ? nextDate(it.recurrence, it.dueDate, today) : it.dueDate;
  if (!due) return null;
  const [h, m] = (it.time ?? DEFAULT_TIME).split(':').map(Number);
  let minutes = h * MINUTES + m - Number(it.alert);
  let date = due;
  while (minutes < 0) {
    minutes += MINUTES_IN_DAY;
    date = addDays(date, -1);
  }
  return { title: it.title, date, time: `${pad(Math.floor(minutes / MINUTES))}:${pad(minutes % MINUTES)}` };
}

// A bill: its due day this month, or next month when that has passed.
export function billReminder(b: Bill, today: YMD): Reminder {
  const thisMonth = monthOf(today);
  const at = (ym: string) => `${ym}-${pad(dueDayIn(b, ym))}`;
  const date = at(thisMonth) >= today ? at(thisMonth) : at(addMonths(thisMonth, 1));
  return { title: b.name, date, time: '' };
}
