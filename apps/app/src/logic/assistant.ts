// Yawmie's offline replies (PRD Y1–Y4). Text parts are i18n keys, never finished sentences.
// This is the single seam for a future AI mode.
import type { AppState, Draft, HM, Item, YMD } from '../model/types';
import { dueDayIn } from './bills';
import { limitFor, spentMonth } from './budget';
import { daysBetween, monthOf } from './dates';
import { parseAll } from './parser';
import { isOverdue } from './today';

const BILL_SOON_DAYS = 3;
const WARN_PCT = 80;
const TODAY_MAX = 6;
const LATE_MAX = 5;

export type ChatPart =
  | { type: 'text'; key: string; vars?: Record<string, string | number> }
  | { type: 'items'; ids: string[] }
  | { type: 'bills'; ids: string[] }
  | { type: 'categories'; ids: string[] }
  | { type: 'addCard'; draft: Draft }
  | { type: 'review'; drafts: Draft[] }
  | { type: 'tourButton' };

type Intent = 'thanks' | 'help' | 'late' | 'bills' | 'spend' | 'today';
const INTENTS: [Intent, string[]][] = [
  ['thanks', ['شكرا', 'شكراً', 'مشكور', 'يعطيك العافية', 'thanks', 'thank you']],
  ['help', ['مساعدة', 'ساعدني', 'وش تقدر', 'وش تسوي', 'help', 'what can you']],
  ['late', ['متأخر', 'متاخر', 'المتأخرة', 'late', 'overdue']],
  ['bills', ['الفواتير', 'فواتير', 'فاتورة', 'bills', 'bill']],
  ['spend', ['صرفت', 'مصروف', 'المصروف', 'ميزانية', 'الميزانية', 'spent', 'spend', 'budget']],
  ['today', ['اليوم', 'وش عندي', 'عندي', 'today', 'my day', 'on today']],
];

const text = (key: string, vars?: Record<string, string | number>): ChatPart => (vars ? { type: 'text', key, vars } : { type: 'text', key });
const open = (s: AppState) => s.items.filter((it) => it.status === 'open');
const byTime = (a: Item, b: Item) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '') || (a.time ?? '99').localeCompare(b.time ?? '99');

function todayParts(s: AppState, today: YMD): ChatPart[] {
  const items = open(s);
  const appts = items.filter((x) => x.kind === 'appointment' && x.dueDate === today).sort(byTime);
  const tasks = items.filter((x) => x.kind === 'task' && (x.dueDate === today || x.planDays.includes(today))).sort(byTime);
  if (!appts.length && !tasks.length) return [text('bot.todayNone')];
  return [text('bot.todayHead', { tasks: tasks.length, appointments: appts.length }), { type: 'items', ids: [...appts, ...tasks].slice(0, TODAY_MAX).map((x) => x.id) }];
}

function lateParts(s: AppState, today: YMD): ChatPart[] {
  const late = open(s).filter((x) => isOverdue(x, today)).sort(byTime);
  if (!late.length) return [text('bot.lateNone')];
  return [text('bot.lateHead', { n: late.length }), { type: 'items', ids: late.slice(0, LATE_MAX).map((x) => x.id) }];
}

function soonBills(s: AppState, today: YMD): string[] {
  const ym = monthOf(today);
  return s.bills
    .filter((b) => !b.paid[ym] && !b.skipped[ym] && daysBetween(today, `${ym}-${String(dueDayIn(b, ym)).padStart(2, '0')}`) <= BILL_SOON_DAYS)
    .map((b) => b.id);
}

function billParts(s: AppState, today: YMD): ChatPart[] {
  const ids = soonBills(s, today);
  return ids.length ? [text('bot.billsHead'), { type: 'bills', ids }] : [text('bot.billsNone')];
}

function warnCategories(s: AppState, today: YMD): string[] {
  const ym = monthOf(today);
  return s.budgets
    .filter((b) => b.categoryId !== null)
    .filter((b) => {
      const limit = limitFor(s, ym, b.categoryId);
      return !!limit && spentMonth(s, ym, b.categoryId!) * 100 >= limit * WARN_PCT;
    })
    .map((b) => b.categoryId!);
}

function spendParts(s: AppState, today: YMD): ChatPart[] {
  const ym = monthOf(today);
  const spent = spentMonth(s, ym);
  const limit = limitFor(s, ym) ?? 0;
  const todaySpent = s.expenses.filter((e) => e.date === today).reduce((sum, e) => sum + e.amountHalalas, 0);
  const warn = warnCategories(s, today);
  const head = text('bot.spend', { spent, limit, pct: limit ? Math.round((spent / limit) * 100) : 0, todaySpent });
  return warn.length ? [head, text('bot.warnCats'), { type: 'categories', ids: warn }] : [head, text('bot.spendOk')];
}

export function brief(s: AppState, today: YMD, now: HM): ChatPart[] {
  const parts = [text('bot.hello', { hour: Number(now.slice(0, 2)) }), ...todayParts(s, today)];
  if (open(s).some((x) => isOverdue(x, today))) parts.push(...lateParts(s, today));
  if (soonBills(s, today).length) parts.push(...billParts(s, today));
  if (warnCategories(s, today).length) parts.push(...spendParts(s, today));
  return parts;
}

export function reply(input: string, s: AppState, today: YMD): ChatPart[] {
  const low = input.toLowerCase();
  // A number almost always means "add this" ("دفعت 45", "meeting 10:00"), not a question.
  const intent = /[\d٠-٩]/.test(input) ? undefined : INTENTS.find(([, words]) => words.some((w) => low.includes(w)))?.[0];
  if (intent === 'thanks') return [text('bot.thanks')];
  if (intent === 'help') return [text('bot.help'), { type: 'tourButton' }];
  if (intent === 'late') return lateParts(s, today);
  if (intent === 'bills') return billParts(s, today);
  if (intent === 'spend') return spendParts(s, today);
  if (intent === 'today') return todayParts(s, today);
  const drafts = parseAll(input, today);
  return drafts.length === 1 ? [{ type: 'addCard', draft: drafts[0] }] : [{ type: 'review', drafts }];
}

export function bubbleLine(s: AppState, today: YMD, now: HM): ChatPart {
  const items = open(s);
  const late = items.filter((x) => isOverdue(x, today)).length;
  if (late) return text('bot.bubbleLate', { n: late });
  const next = items.filter((x) => x.kind === 'appointment' && x.dueDate === today && !!x.time && x.time >= now).sort(byTime)[0];
  return next ? text('bot.bubbleAppt', { time: next.time! }) : text('bot.bubbleFree');
}
