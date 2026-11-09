// Time blocks: repeating time slots for one area (PRD K1–K3, P5, P6).
import type { AppState, Block, HM, Item, YMD } from '../model/types';
import { weekday } from './dates';

const MINUTES_IN_HOUR = 60;

const toMinutes = (t: HM) => {
  const [h, m] = t.split(':').map(Number);
  return h * MINUTES_IN_HOUR + m;
};

export function blockStatus(b: Block, now: HM): 'upcoming' | 'live' | 'ended' {
  if (now < b.start) return 'upcoming';
  return now < b.end ? 'live' : 'ended';
}

export const runsOn = (b: Block, day: YMD) => b.days.includes(weekday(day));

export function blocksOn(s: AppState, day: YMD): Block[] {
  return s.blocks.filter((b) => runsOn(b, day)).sort((a, b) => a.start.localeCompare(b.start));
}

function hasEnded(b: Block, day: YMD, today: YMD, now: HM): boolean {
  return day < today || (day === today && now >= b.end);
}

const isDayTask = (it: Item, day: YMD, today: YMD) =>
  it.kind === 'task' &&
  it.status === 'open' &&
  (it.dueDate === day || it.planDays.includes(day) || (day === today && !!it.dueDate && it.dueDate < today));

// Computed, never stored: a task sits in its block until the block ends, then shows in Anytime.
export function placeTasks(s: AppState, day: YMD, today: YMD, now: HM): { inBlock: Record<string, Item[]>; anytime: { item: Item; backFrom?: string }[] } {
  const inBlock: Record<string, Item[]> = {};
  const anytime: { item: Item; backFrom?: string }[] = [];
  for (const it of s.items.filter((x) => isDayTask(x, day, today))) {
    const b = it.blockId ? s.blocks.find((x) => x.id === it.blockId) : undefined;
    if (b && runsOn(b, day) && !hasEnded(b, day, today, now)) {
      (inBlock[b.id] ??= []).push(it);
    } else if (b && runsOn(b, day) && day === today) {
      anytime.push({ item: it, backFrom: b.areaId });
    } else {
      anytime.push({ item: it });
    }
  }
  return { inBlock, anytime };
}

export function appointmentsInBlock(s: AppState, b: Block, day: YMD): Item[] {
  return s.items.filter(
    (it) => it.kind === 'appointment' && it.status === 'open' && it.dueDate === day && it.areaId === b.areaId && !!it.time && it.time >= b.start && it.time < b.end,
  );
}

export function focusLeft(b: Block, now: HM): { mode: 'left' | 'until'; minutes: number } {
  if (now < b.start) return { mode: 'until', minutes: toMinutes(b.start) - toMinutes(now) };
  return { mode: 'left', minutes: Math.max(0, toMinutes(b.end) - toMinutes(now)) };
}
