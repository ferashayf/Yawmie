// Keeps data in memory only: for tests and local checks of the artifact build.
import type { AppState } from '../model/types';
import type { StorageAdapter } from './adapter';

export function memoryAdapter(initial?: AppState): StorageAdapter {
  let saved = initial ? structuredClone(initial) : null;
  return {
    load: async () => (saved ? structuredClone(saved) : null),
    save: async (s) => {
      saved = structuredClone(s);
    },
  };
}
