import { describe, expect, it } from 'vitest';
import { emptyState, SCHEMA_VERSION } from '../model/empty';
import { readBackupFile, toBackupFile } from './backup';

describe('backup file', () => {
  const state = { ...emptyState(), lastBackupAt: '2026-10-01' };

  it('filename is yawmie-backup-YYYY-MM-DD.json', () => {
    expect(toBackupFile(state, '2026-11-09').filename).toBe('yawmie-backup-2026-11-09.json');
  });

  it('wraps { app, schemaVersion, exportedAt, state } and records the backup date', () => {
    const file = JSON.parse(toBackupFile(state, '2026-11-09').text);
    expect(file).toMatchObject({ app: 'yawmie', schemaVersion: SCHEMA_VERSION, exportedAt: '2026-11-09' });
    expect(file.state.lastBackupAt).toBe('2026-11-09');
  });

  it('export then import returns the same state', () => {
    const { text } = toBackupFile(state, '2026-11-09');
    expect(readBackupFile(text)).toEqual({ ok: true, state: { ...state, lastBackupAt: '2026-11-09' } });
  });

  it('not JSON → badShape', () => {
    expect(readBackupFile('not json')).toEqual({ ok: false, reason: 'badShape' });
  });
});
