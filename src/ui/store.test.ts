import { describe, expect, it, vi } from 'vitest';
import { emptyState } from '../model/empty';
import type { AppState } from '../model/types';
import { memoryAdapter } from '../storage/memory';
import { createStore } from './store';

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('store', () => {
  it('a burst of changes becomes few saves, and the last state is what is saved', async () => {
    const adapter = memoryAdapter();
    const save = vi.spyOn(adapter, 'save');
    const store = createStore(emptyState(), adapter, () => {});
    for (const name of ['a', 'b', 'c', 'd']) store.update((s) => ({ ...s, settings: { ...s.settings, name } }));
    await store.idle();
    expect(save.mock.calls.length).toBeLessThanOrEqual(2);
    expect((await adapter.load())?.settings.name).toBe('d');
  });

  it('never mutates the old state', () => {
    const start = Object.freeze(emptyState());
    const store = createStore(start, memoryAdapter(), () => {});
    store.update((s) => ({ ...s, lastBackupAt: '2026-11-09' }));
    expect(start.lastBackupAt).toBeUndefined();
    expect(store.get().lastBackupAt).toBe('2026-11-09');
  });

  it('a failed save is reported and the change stays on screen', async () => {
    const errors: unknown[] = [];
    const adapter = { load: async () => null, save: async (_: AppState) => { throw Object.assign(new Error('full'), { code: 'quota_exceeded' }); } };
    const store = createStore(emptyState(), adapter, (e) => errors.push(e));
    store.update((s) => ({ ...s, lastBackupAt: '2026-11-09' }));
    await store.idle();
    await tick();
    expect(errors).toHaveLength(1);
    expect(store.get().lastBackupAt).toBe('2026-11-09');
  });

  it('tells listeners about changes', () => {
    const store = createStore(emptyState(), memoryAdapter(), () => {});
    const seen: string[] = [];
    store.subscribe((s) => seen.push(s.settings.lang));
    store.update((s) => ({ ...s, settings: { ...s.settings, lang: 'en' } }));
    expect(seen).toEqual(['en']);
  });
});
