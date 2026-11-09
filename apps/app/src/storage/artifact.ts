// Claude artifact: the state saved in the person's private space, data/users/<their id>/, in pieces.
// One stored document holds at most 256 KB, so the JSON is split (ARCHITECTURE §5.3).
import { SCHEMA_VERSION } from '../model/empty';
import type { AppState } from '../model/types';
import type { StorageAdapter } from './adapter';
import { migrate } from './migrate';

const PIECE_CHARS = 60_000; // 60,000 × 3 bytes (Arabic) stays under 256 KB
const LOAD_TRIES = 2; // a piece can vanish if another device saves meanwhile: read the head again once

interface DocSnapshot { exists: boolean; data(): unknown }
export interface DbLike {
  doc(path: string): { get(): Promise<DocSnapshot>; set(data: object): Promise<void>; delete(): Promise<void> };
}
interface Head { schemaVersion: number; gen: string; parts: number; savedAt: string }

// Pieces of at most `size` characters; never cuts an emoji or other two-part character in half.
export function splitPieces(text: string, size: number): string[] {
  const pieces: string[] = [];
  for (let at = 0; at < text.length; ) {
    let end = Math.min(at + size, text.length);
    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
    pieces.push(text.slice(at, end));
    at = end;
  }
  return pieces;
}

export function artifactAdapter(db: DbLike, uid: string, pieceSize = PIECE_CHARS): StorageAdapter {
  const path = (name: string) => `data/users/${uid}/${name}`;
  const readHead = async () => (await db.doc(path('head')).get()).data() as Head | undefined;

  async function readPieces(head: Head): Promise<string | null> {
    let text = '';
    for (let i = 0; i < head.parts; i++) {
      const snap = await db.doc(path(`${head.gen}-${i}`)).get();
      if (!snap.exists) return null;
      text += (snap.data() as { s: string }).s;
    }
    return text;
  }

  return {
    async load() {
      for (let attempt = 0; attempt < LOAD_TRIES; attempt++) {
        const head = await readHead();
        if (!head) return null;
        const text = await readPieces(head);
        if (text !== null) return migrate(JSON.parse(text));
      }
      throw new Error('Saved data is incomplete');
    },

    // New pieces under a fresh name first, then the head, then the old pieces go.
    // A save that stops halfway leaves the head on the last complete copy.
    async save(state: AppState) {
      const previous = await readHead();
      const gen = crypto.randomUUID();
      const pieces = splitPieces(JSON.stringify(state), pieceSize);
      for (let i = 0; i < pieces.length; i++) await db.doc(path(`${gen}-${i}`)).set({ s: pieces[i] });
      const head: Head = { schemaVersion: SCHEMA_VERSION, gen, parts: pieces.length, savedAt: new Date().toISOString() };
      await db.doc(path('head')).set({ ...head });
      if (!previous) return;
      for (let i = 0; i < previous.parts; i++) await db.doc(path(`${previous.gen}-${i}`)).delete();
    },
  };
}

interface UserLike { id(): Promise<string | null>; can(capability: string): Promise<boolean | null> }
interface ClaudeLike { use(name: string): Promise<unknown> }

export async function openArtifactStorage(): Promise<{ ok: true; adapter: StorageAdapter } | { ok: false; reason: 'signedOut' | 'notAllowed' }> {
  const claude = (globalThis as { claude?: ClaudeLike }).claude;
  if (!claude) return { ok: false, reason: 'signedOut' };
  const [db, user] = (await Promise.all([claude.use('db'), claude.use('user')])) as [DbLike | null, UserLike | null];
  const uid = user ? await user.id() : null;
  if (!db || !uid) return { ok: false, reason: 'signedOut' };
  if ((await user!.can('data.write')) === false) return { ok: false, reason: 'notAllowed' };
  return { ok: true, adapter: artifactAdapter(db, uid) };
}
