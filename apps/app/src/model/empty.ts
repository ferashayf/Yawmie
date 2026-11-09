import type { AppState, Area, Category, Lang } from './types';

export const SCHEMA_VERSION = 1;

// Fixed ids so the text reader can name them ("work", "food").
export const DEFAULT_AREAS: readonly Area[] = [
  { id: 'work', name: { ar: 'العمل', en: 'Work' }, color: '#5B7FA6', icon: 'brief' },
  { id: 'project', name: { ar: 'المشروع', en: 'Project' }, color: '#B08143', icon: 'rocket' },
  { id: 'personal', name: { ar: 'شخصي', en: 'Personal' }, color: '#8A6BB0', icon: 'home' },
  { id: 'study', name: { ar: 'دراسة', en: 'Study' }, color: '#7A8B3D', icon: 'book' },
];

export const DEFAULT_CATEGORIES: readonly Category[] = [
  { id: 'food', name: { ar: 'أكل', en: 'Food' }, color: '#C2416E' },
  { id: 'car', name: { ar: 'السيارة', en: 'Car' }, color: '#D08A2E' },
  { id: 'health', name: { ar: 'صحة', en: 'Health' }, color: '#5B7FA6' },
  { id: 'home', name: { ar: 'البيت', en: 'Home' }, color: '#4E9583' },
  { id: 'fun', name: { ar: 'ترفيه', en: 'Fun' }, color: '#8A6BB0' },
];

// First open: default areas and categories, nothing else. No sample data.
export function emptyState(lang: Lang = 'ar'): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: { lang, theme: 'system', textSize: 'normal', setupDone: false, tourDone: false },
    areas: DEFAULT_AREAS.map((a) => ({ ...a })),
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    blocks: [],
    items: [],
    bills: [],
    expenses: [],
    budgets: [],
  };
}

export function newId(): string {
  return crypto.randomUUID();
}
