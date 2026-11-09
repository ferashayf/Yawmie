import { afterEach, describe, expect, it, vi } from 'vitest';
import { emptyState } from '../model/empty';
import type { AppState } from '../model/types';
import { artifactAdapter, openArtifactStorage, splitPieces, type DbLike } from './artifact';

const UID = 'u1';
const tick = () => new Promise((r) => setTimeout(r, 0));

// A small stand-in for Claude's db: documents by path, every call takes a turn.
function fakeDb(opts: { failAfterSets?: number; failWith?: object } = {}): DbLike & { docs: Map<string, object> } {
  const docs = new Map<string, object>();
  let sets = 0;
  return {
    docs,
    doc: (path: string) => ({
      get: async () => {
        await tick();
        const d = docs.get(path);
        return { exists: !!d, data: () => (d ? structuredClone(d) : undefined) };
      },
      set: async (data: object) => {
        await tick();
        if (opts.failAfterSets !== undefined && sets++ >= opts.failAfterSets) throw opts.failWith ?? new Error('stopped');
        docs.set(path, structuredClone(data));
      },
      delete: async () => {
        await tick();
        docs.delete(path);
      },
    }),
  };
}

const withNote = (note: string): AppState => ({ ...emptyState(), expenses: [{ id: 'e', date: '2026-11-09', amountHalalas: 100, categoryId: 'food', note }] });
const pieceKeys = (db: { docs: Map<string, object> }) => [...db.docs.keys()].filter((k) => !k.endsWith('/head'));

describe('splitPieces', () => {
  it('200,000 characters → 4 pieces that join back', () => {
    const text = 'ي'.repeat(200_000);
    const pieces = splitPieces(text, 60_000);
    expect(pieces).toHaveLength(4);
    expect(pieces.join('')).toBe(text);
  });

  it('never splits a surrogate pair', () => {
    const text = `${'a'.repeat(59_999)}😀b`;
    const pieces = splitPieces(text, 60_000);
    expect(pieces[0]).toHaveLength(59_999);
    expect(pieces.join('')).toBe(text);
    for (const p of pieces) expect(/[\uD800-\uDBFF]$/.test(p)).toBe(false);
  });
});

describe('artifactAdapter', () => {
  it('first open → null', async () => {
    expect(await artifactAdapter(fakeDb(), UID).load()).toBeNull();
  });

  it('round trip with Arabic text across several pieces', async () => {
    const db = fakeDb();
    const s = withNote('مقهى الحي '.repeat(20_000));
    await artifactAdapter(db, UID, 60_000).save(s);
    expect(pieceKeys(db).length).toBeGreaterThan(1);
    expect(await artifactAdapter(db, UID, 60_000).load()).toEqual(s);
  });

  it('everything lives under the person’s private space', async () => {
    const db = fakeDb();
    await artifactAdapter(db, UID).save(emptyState());
    for (const k of db.docs.keys()) expect(k.startsWith(`data/users/${UID}/`)).toBe(true);
  });

  it('a save that stops halfway leaves the previous copy loadable', async () => {
    const db = fakeDb();
    const first = withNote('first');
    await artifactAdapter(db, UID, 10).save(first);
    const broken = fakeDb({ failAfterSets: 2 });
    for (const [k, v] of db.docs) broken.docs.set(k, v);
    await expect(artifactAdapter(broken, UID, 10).save(withNote('second save, longer'))).rejects.toThrow('stopped');
    expect(await artifactAdapter(broken, UID, 10).load()).toEqual(first);
  });

  it('interleaved saves (phone and Mac) leave one complete copy', async () => {
    const db = fakeDb();
    const a = withNote('from the phone '.repeat(5));
    const b = withNote('from the mac '.repeat(7));
    await Promise.all([artifactAdapter(db, UID, 16).save(a), artifactAdapter(db, UID, 16).save(b)]);
    expect([a, b]).toContainEqual(await artifactAdapter(db, UID, 16).load());
  });

  it('old pieces are deleted after the head moves', async () => {
    const db = fakeDb();
    const adapter = artifactAdapter(db, UID, 10);
    await adapter.save(withNote('one'));
    await adapter.save(withNote('two'));
    const head = db.docs.get(`data/users/${UID}/head`) as { gen: string; parts: number };
    expect(pieceKeys(db)).toHaveLength(head.parts);
    expect(pieceKeys(db).every((k) => k.includes(`/${head.gen}-`))).toBe(true);
  });

  it('quota_exceeded comes back as an error with that code', async () => {
    const db = fakeDb({ failAfterSets: 0, failWith: { code: 'quota_exceeded', message: 'full' } });
    await expect(artifactAdapter(db, UID).save(emptyState())).rejects.toMatchObject({ code: 'quota_exceeded' });
  });
});

describe('openArtifactStorage', () => {
  afterEach(() => vi.unstubAllGlobals());
  const claude = (db: unknown, user: unknown) => ({ use: async (n: string) => (n === 'db' ? db : n === 'user' ? user : null) });
  const user = (id: string | null, canWrite: boolean | null) => ({ id: async () => id, can: async () => canWrite });

  it('not inside Claude, or signed out → signedOut', async () => {
    expect(await openArtifactStorage()).toEqual({ ok: false, reason: 'signedOut' });
    vi.stubGlobal('claude', claude(null, null));
    expect(await openArtifactStorage()).toEqual({ ok: false, reason: 'signedOut' });
    vi.stubGlobal('claude', claude(fakeDb(), user(null, null)));
    expect(await openArtifactStorage()).toEqual({ ok: false, reason: 'signedOut' });
  });

  it("someone else's copy → notAllowed", async () => {
    vi.stubGlobal('claude', claude(fakeDb(), user('u2', false)));
    expect(await openArtifactStorage()).toEqual({ ok: false, reason: 'notAllowed' });
  });

  it('owner → ok', async () => {
    vi.stubGlobal('claude', claude(fakeDb(), user('u1', true)));
    expect(await openArtifactStorage()).toMatchObject({ ok: true });
  });
});
