// Everything from outside is checked here: typed drafts, links, imported backups.
import { SCHEMA_VERSION } from './empty';
import type { AppState, Draft } from './types';

const MIN_AMOUNT = 1; // SAR 0.01
const MAX_AMOUNT = 100_000_000; // SAR 1,000,000
const MAX_TITLE = 120;
const MAX_DUE_DAY = 31;
export const MAX_BACKUP_BYTES = 5_000_000;

const LISTS = ['areas', 'categories', 'blocks', 'items', 'bills', 'expenses', 'budgets'] as const;

export function isValidYMD(s: unknown): boolean {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

const isAmount = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= MAX_AMOUNT;
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

export function validateDraft(d: Draft): '' | 'emptyTitle' | 'amountRange' | 'badDate' {
  if (!d.title.trim() || d.title.length > MAX_TITLE) return 'emptyTitle';
  const money = d.kind === 'expense' || d.kind === 'bill';
  if (money && (d.amountHalalas === null || d.amountHalalas < MIN_AMOUNT || d.amountHalalas > MAX_AMOUNT)) return 'amountRange';
  if (d.date && !isValidYMD(d.date)) return 'badDate';
  return '';
}

// Untrusted text: only ever link to http(s), never javascript: or data:. Returns '' when not safe.
export function safeUrl(input: string): string {
  const s = input.trim();
  if (!s) return '';
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}

type BackupResult = { ok: true; state: AppState } | { ok: false; reason: 'notYawmie' | 'newerVersion' | 'tooBig' | 'badShape' | 'badAmount' | 'badDate' };

// The file wraps the state: { app: 'yawmie', schemaVersion, exportedAt, state }. Run migrate() on the result.
export function validateBackup(raw: unknown, sizeBytes: number): BackupResult {
  if (sizeBytes > MAX_BACKUP_BYTES) return { ok: false, reason: 'tooBig' };
  if (!isObject(raw) || raw.app !== 'yawmie' || !Number.isInteger(raw.schemaVersion)) return { ok: false, reason: 'notYawmie' };
  if ((raw.schemaVersion as number) > SCHEMA_VERSION) return { ok: false, reason: 'newerVersion' };
  const s = raw.state;
  if (!isObject(s) || !isObject(s.settings) || !LISTS.every((k) => Array.isArray(s[k]))) return { ok: false, reason: 'badShape' };
  const lists = s as unknown as Record<(typeof LISTS)[number], Record<string, unknown>[]>;
  if (!lists.areas.length || !lists.categories.length) return { ok: false, reason: 'badShape' };
  if (!LISTS.every((k) => lists[k].every((x) => isObject(x) && typeof x.id === 'string'))) return { ok: false, reason: 'badShape' };

  const expenseOk = (e: Record<string, unknown>) => (e.refund === true ? (e.amountHalalas as number) < 0 && isAmount(-(e.amountHalalas as number)) : isAmount(e.amountHalalas));
  const billOk = (b: Record<string, unknown>) => isAmount(b.amountHalalas) && Number.isInteger(b.dueDay) && (b.dueDay as number) >= 1 && (b.dueDay as number) <= MAX_DUE_DAY;
  if (!lists.expenses.every(expenseOk) || !lists.bills.every(billOk) || !lists.budgets.every((g) => isAmount(g.limitHalalas))) return { ok: false, reason: 'badAmount' };

  const dateOk = (d: unknown) => d === undefined || isValidYMD(d);
  if (!lists.expenses.every((e) => isValidYMD(e.date)) || !lists.items.every((it) => dateOk(it.dueDate))) return { ok: false, reason: 'badDate' };

  return { ok: true, state: s as unknown as AppState };
}
