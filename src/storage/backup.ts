// The backup file: Export (both ways of using the app) and Import (website app).
import { SCHEMA_VERSION } from '../model/empty';
import type { AppState, YMD } from '../model/types';
import { validateBackup } from '../model/validate';
import { mode } from '../mode';
import { migrate } from './migrate';

const JSON_TYPE = 'application/json';

export function toBackupFile(s: AppState, today: YMD): { filename: string; text: string } {
  const state: AppState = { ...s, lastBackupAt: today };
  return { filename: `yawmie-backup-${today}.json`, text: JSON.stringify({ app: 'yawmie', schemaVersion: SCHEMA_VERSION, exportedAt: today, state }) };
}

export function readBackupFile(text: string): ReturnType<typeof validateBackup> {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'badShape' };
  }
  const result = validateBackup(raw, new TextEncoder().encode(text).length);
  return result.ok ? { ok: true, state: migrate(result.state) } : result;
}

interface Downloads { save(r: { filename: string; data: string }): Promise<unknown> }

// Website app: the iPhone Share sheet (Save to Files / iCloud Drive), else a download link.
// Artifact: Claude's own save prompt. 'cancelled' when the person says no.
export async function exportBackup(s: AppState, today: YMD): Promise<'saved' | 'cancelled'> {
  const { filename, text } = toBackupFile(s, today);
  if (mode === 'artifact') {
    const claude = (globalThis as { claude?: { use(n: string): Promise<unknown> } }).claude;
    const downloads = (await claude?.use('downloads')) as Downloads | null | undefined;
    if (!downloads) throw new Error('Saving a file is not available here');
    try {
      await downloads.save({ filename, data: text });
      return 'saved';
    } catch (e) {
      if ((e as { code?: string }).code === 'declined') return 'cancelled';
      throw e;
    }
  }
  const file = new File([text], filename, { type: JSON_TYPE });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'saved';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
  return 'saved';
}
