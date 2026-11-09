// Brings saved data and older backups up to the current shape (schemaVersion).
import { emptyState, SCHEMA_VERSION } from '../model/empty';
import type { AppState } from '../model/types';

// Add a step here when the shape changes: [fromVersion, (old) => new].
const STEPS: [number, (s: AppState) => AppState][] = [];

export function migrate(raw: unknown): AppState {
  const base = emptyState();
  const s = raw as Partial<AppState>;
  let state: AppState = { ...base, ...s, settings: { ...base.settings, ...s.settings }, schemaVersion: s.schemaVersion ?? SCHEMA_VERSION };
  for (const [from, step] of STEPS) if (state.schemaVersion === from) state = step(state);
  return { ...state, schemaVersion: SCHEMA_VERSION };
}
