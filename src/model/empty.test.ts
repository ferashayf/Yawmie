import { describe, expect, it } from 'vitest';
import { emptyState, newId, SCHEMA_VERSION } from './empty';

describe('emptyState', () => {
  it('has no user data', () => {
    const s = emptyState();
    expect([s.items, s.blocks, s.bills, s.expenses, s.budgets]).toEqual([[], [], [], [], []]);
    expect(s.settings.setupDone).toBe(false);
    expect(s.settings.tourDone).toBe(false);
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.lastBackupAt).toBeUndefined();
  });

  it('has default areas and categories with fixed ids and both languages', () => {
    const s = emptyState('en');
    expect(s.areas.map((a) => a.id)).toEqual(['work', 'project', 'personal', 'study']);
    expect(s.categories.map((c) => c.id)).toEqual(['food', 'car', 'health', 'home', 'fun']);
    for (const x of [...s.areas, ...s.categories]) {
      expect(x.name).toMatchObject({ ar: expect.any(String), en: expect.any(String) });
    }
    expect(s.settings.lang).toBe('en');
  });

  it('returns a fresh copy each time', () => {
    const a = emptyState();
    a.areas[0].color = '#000000';
    expect(emptyState().areas[0].color).toBe('#5B7FA6');
  });
});

describe('newId', () => {
  it('is unique', () => {
    expect(new Set(Array.from({ length: 1000 }, newId)).size).toBe(1000);
  });
});
