// Which way the app runs, fixed at build time (`vite build --mode artifact`).
// Screens read `features`, never `mode`.
export type Mode = 'website' | 'artifact';

export interface Features {
  dataSafety: boolean;
  importBackup: boolean;
  mic: boolean;
  reminders: boolean;
}

// Spike 3: Claude blocks the shortcuts:// link inside an artifact.
export const ARTIFACT_REMINDERS = false;

export function featuresFor(m: Mode): Features {
  if (m === 'website') return { dataSafety: true, importBackup: true, mic: true, reminders: true };
  return { dataSafety: false, importBackup: false, mic: false, reminders: ARTIFACT_REMINDERS };
}

export const mode: Mode = import.meta.env.MODE === 'artifact' ? 'artifact' : 'website';
export const features = featuresFor(mode);
