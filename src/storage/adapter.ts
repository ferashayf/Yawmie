import type { AppState } from '../model/types';

// The one way logic and screens reach saved data. They never know where it lives.
export interface StorageAdapter {
  load(): Promise<AppState | null>; // null = nothing saved yet (first open)
  save(state: AppState): Promise<void>; // rejects on failure; never fails silently
}
