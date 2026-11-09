// Website app: the whole state under one IndexedDB key, on the phone only.
import { get, set } from 'idb-keyval';
import type { StorageAdapter } from './adapter';
import { migrate } from './migrate';

export function idbAdapter(key = 'yawmie'): StorageAdapter {
  return {
    load: async () => {
      const raw = await get(key);
      return raw == null ? null : migrate(raw);
    },
    save: (s) => set(key, s),
  };
}
