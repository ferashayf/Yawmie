import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { Strings } from '../i18n';
import type { Features } from '../mode';
import type { AppState, HM, YMD } from '../model/types';

export type Tab = 'today' | 'plan' | 'tasks' | 'money' | 'settings';

export interface App {
  state: AppState;
  today: YMD;
  now: HM;
  features: Features;
  t: Strings;
  tab: Tab;
  go(tab: Tab): void;
  // Builds a new state and saves it. With a toast, shows "Saved"/"Deleted" and Undo puts the old state back.
  update(fn: (s: AppState) => AppState, toast?: { text: string; undo?: boolean }): void;
}

export const AppContext = createContext<App | null>(null);

export function useApp(): App {
  const app = useContext(AppContext);
  if (!app) throw new Error('useApp outside the app');
  return app;
}
