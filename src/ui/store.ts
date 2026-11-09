// The app's state in memory. Every change builds a new state, tells the screens, and is saved.
// Saves run one at a time; a burst of changes becomes one save of the latest state.
import type { AppState } from '../model/types';
import type { StorageAdapter } from '../storage/adapter';

export interface Store {
  get(): AppState;
  update(fn: (s: AppState) => AppState): void;
  subscribe(fn: (s: AppState) => void): () => void;
  idle(): Promise<void>;
}

export function createStore(initial: AppState, adapter: StorageAdapter, onSaveError: (e: unknown) => void): Store {
  let state = initial;
  let saving: Promise<void> | null = null;
  let dirty = false;
  const listeners = new Set<(s: AppState) => void>();

  async function flush() {
    while (dirty) {
      dirty = false;
      try {
        await adapter.save(state);
      } catch (e) {
        onSaveError(e); // the change stays on screen; the next change tries again
      }
    }
    saving = null;
  }

  function scheduleSave() {
    dirty = true;
    if (!saving) saving = Promise.resolve().then(flush);
  }

  return {
    get: () => state,
    update(fn) {
      state = fn(state);
      for (const l of listeners) l(state);
      scheduleSave();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    idle: async () => {
      while (saving) await saving;
    },
  };
}
