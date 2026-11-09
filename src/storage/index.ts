// Picks where data lives for this build. Only src/storage/ touches IndexedDB or window.claude.
import { mode } from '../mode';
import type { StorageAdapter } from './adapter';
import { openArtifactStorage } from './artifact';
import { idbAdapter } from './idb';
import { memoryAdapter } from './memory';

export type { StorageAdapter } from './adapter';
export type OpenResult = { ok: true; adapter: StorageAdapter } | { ok: false; reason: 'signedOut' | 'notAllowed' };

export async function openStorage(): Promise<OpenResult> {
  if (mode === 'website') return { ok: true, adapter: idbAdapter() };
  // Local checks of the artifact build (npx vite --mode artifact) run outside Claude.
  if (import.meta.env.DEV && !(globalThis as { claude?: unknown }).claude) return { ok: true, adapter: memoryAdapter() };
  return openArtifactStorage();
}
