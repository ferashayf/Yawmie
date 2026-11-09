import { describe, expect, it } from 'vitest';
import { emptyState, SCHEMA_VERSION } from './empty';
import type { Draft } from './types';
import { MAX_BACKUP_BYTES, safeUrl, validateBackup, validateDraft } from './validate';

const draft = (over: Partial<Draft>): Draft => ({ kind: 'expense', title: 'coffee', date: '2026-11-09', time: '', amountHalalas: 4500, areaId: 'work', categoryId: 'food', recurrence: null, urgent: false, ...over });
const backup = (state: unknown, over: object = {}) => ({ app: 'yawmie', schemaVersion: SCHEMA_VERSION, exportedAt: '2026-11-09', state, ...over });
const ok = (raw: unknown) => validateBackup(raw, 1000);

describe('validateDraft', () => {
  it('amount must be SAR 0.01 to 1,000,000', () => {
    expect(validateDraft(draft({ amountHalalas: 1 }))).toBe('');
    expect(validateDraft(draft({ amountHalalas: 100_000_000 }))).toBe('');
    expect(validateDraft(draft({ amountHalalas: 0 }))).toBe('amountRange');
    expect(validateDraft(draft({ amountHalalas: 100_000_001 }))).toBe('amountRange');
    expect(validateDraft(draft({ amountHalalas: null }))).toBe('amountRange');
  });

  it('tasks need no amount', () => {
    expect(validateDraft(draft({ kind: 'task', amountHalalas: null }))).toBe('');
  });

  it('empty title is refused', () => {
    expect(validateDraft(draft({ title: '   ' }))).toBe('emptyTitle');
  });

  it('a bad date is refused', () => {
    expect(validateDraft(draft({ date: '2026-02-30' }))).toBe('badDate');
  });
});

describe('safeUrl', () => {
  it('only http and https', () => {
    expect(safeUrl('example.com/a')).toBe('https://example.com/a');
    expect(safeUrl('http://example.com')).toBe('http://example.com/');
    expect(safeUrl('javascript:alert(1)')).toBe('');
    expect(safeUrl('data:text/html,x')).toBe('');
    expect(safeUrl('')).toBe('');
  });
});

describe('validateBackup', () => {
  it('accepts a good backup', () => {
    expect(ok(backup(emptyState()))).toMatchObject({ ok: true, state: { schemaVersion: SCHEMA_VERSION } });
  });

  it('rejects files that are not Yawmie backups', () => {
    expect(ok({ hello: 1 })).toEqual({ ok: false, reason: 'notYawmie' });
    expect(ok(null)).toEqual({ ok: false, reason: 'notYawmie' });
  });

  it('rejects newer schemaVersion', () => {
    expect(ok(backup(emptyState(), { schemaVersion: SCHEMA_VERSION + 1 }))).toEqual({ ok: false, reason: 'newerVersion' });
  });

  it('rejects over 5 MB', () => {
    expect(validateBackup(backup(emptyState()), MAX_BACKUP_BYTES + 1)).toEqual({ ok: false, reason: 'tooBig' });
  });

  it('rejects a missing list or a missing id', () => {
    expect(ok(backup({ ...emptyState(), items: 'x' }))).toEqual({ ok: false, reason: 'badShape' });
    expect(ok(backup({ ...emptyState(), areas: [] }))).toEqual({ ok: false, reason: 'badShape' });
    expect(ok(backup({ ...emptyState(), bills: [{ name: 'x' }] }))).toEqual({ ok: false, reason: 'badShape' });
  });

  it('rejects negative amount without refund flag, accepts it with one', () => {
    const e = { id: 'e', date: '2026-11-09', amountHalalas: -500, categoryId: 'food' };
    expect(ok(backup({ ...emptyState(), expenses: [e] }))).toEqual({ ok: false, reason: 'badAmount' });
    expect(ok(backup({ ...emptyState(), expenses: [{ ...e, refund: true }] })).ok).toBe(true);
  });

  it('rejects money that is not whole halalas', () => {
    expect(ok(backup({ ...emptyState(), expenses: [{ id: 'e', date: '2026-11-09', amountHalalas: 4.5, categoryId: 'food' }] }))).toEqual({ ok: false, reason: 'badAmount' });
  });

  it("rejects '2026-13-01'", () => {
    expect(ok(backup({ ...emptyState(), expenses: [{ id: 'e', date: '2026-13-01', amountHalalas: 500, categoryId: 'food' }] }))).toEqual({ ok: false, reason: 'badDate' });
  });
});
