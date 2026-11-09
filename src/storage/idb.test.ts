import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyState } from '../model/empty';

const store = new Map<string, unknown>();
let failNextSet = false;
vi.mock('idb-keyval', () => ({
  get: async (k: string) => store.get(k),
  set: async (k: string, v: unknown) => {
    if (failNextSet) { failNextSet = false; throw new Error('QuotaExceededError'); }
    store.set(k, structuredClone(v));
  },
}));

const { idbAdapter } = await import('./idb');
const { memoryAdapter } = await import('./memory');

beforeEach(() => store.clear());

describe('idbAdapter', () => {
  it('load returns null on first open', async () => {
    expect(await idbAdapter().load()).toBeNull();
  });

  it('save then load returns an equal state', async () => {
    const a = idbAdapter();
    const s = { ...emptyState(), lastBackupAt: '2026-11-09' };
    await a.save(s);
    expect(await a.load()).toEqual(s);
  });

  it('load runs migrate on older data', async () => {
    store.set('yawmie', { ...emptyState(), settings: { lang: 'en' } });
    expect((await idbAdapter().load())?.settings).toEqual({ ...emptyState().settings, lang: 'en' });
  });

  it('a failed save rejects, never swallowed', async () => {
    failNextSet = true;
    await expect(idbAdapter().save(emptyState())).rejects.toThrow('QuotaExceededError');
  });
});

describe('memoryAdapter', () => {
  it('starts empty or with the given state, and keeps saves', async () => {
    expect(await memoryAdapter().load()).toBeNull();
    const m = memoryAdapter(emptyState('en'));
    expect((await m.load())?.settings.lang).toBe('en');
    await m.save(emptyState('ar'));
    expect((await m.load())?.settings.lang).toBe('ar');
  });
});
