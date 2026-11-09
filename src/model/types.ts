// Data shapes. See ARCHITECTURE.md §3. Money is whole halalas; dates are local strings.
export type YMD = string; // 'YYYY-MM-DD'
export type HM = string; // 'HH:mm'
export type YM = string; // 'YYYY-MM'
export type Lang = 'ar' | 'en';
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export type Name = { ar: string; en: string } | string;

export const AREA_COLORS = ['#5B7FA6', '#B08143', '#8A6BB0', '#7A8B3D', '#C2416E', '#4E9583', '#D08A2E', '#6B6B69'] as const;
export const AREA_ICONS = ['brief', 'rocket', 'home', 'book', 'heart', 'gym', 'cart', 'star', 'code', 'pen', 'music', 'leaf'] as const;
export type AreaIcon = (typeof AREA_ICONS)[number];

export interface Settings {
  lang: Lang;
  theme: 'system' | 'light' | 'dark';
  textSize: 'normal' | 'large';
  name?: string;
  setupDone: boolean;
  tourDone: boolean;
}

export interface Area { id: string; name: Name; color: string; icon: AreaIcon }
export interface Category { id: string; name: Name; color: string }

export interface Block { id: string; areaId: string; start: HM; end: HM; days: Weekday[] }

export interface Recurrence {
  freq: 'day' | 'week' | 'month' | 'year';
  every: number; // 1–365
  days?: Weekday[]; // weeks only
  start: YMD;
  end?: YMD;
}

export type Alert = 'none' | '0' | '5' | '15' | '30' | '60' | '1440';

export interface Item {
  id: string;
  kind: 'task' | 'appointment' | 'todo';
  title: string;
  notes?: string;
  url?: string;
  areaId: string;
  urgent: boolean;
  dueDate?: YMD;
  time?: HM;
  alert: Alert;
  durationMin?: number;
  place?: string;
  planDays: YMD[];
  blockId?: string;
  recurrence?: Recurrence;
  status: 'open' | 'done';
  doneAt?: YMD;
}

export interface Bill {
  id: string;
  name: string;
  amountHalalas: number;
  dueDay: number; // 1–31
  categoryId: string;
  paid: Record<YM, { amountHalalas: number; at?: YMD }>;
  skipped: Record<YM, true>;
}

export interface Expense {
  id: string;
  date: YMD;
  time?: HM;
  amountHalalas: number; // negative only with refund: true
  categoryId: string;
  note?: string;
  refund?: true;
}

export interface Budget {
  id: string;
  categoryId: string | null; // null = overall
  limitHalalas: number;
  topUps: Record<YM, number>;
}

export interface AppState {
  schemaVersion: number;
  settings: Settings;
  areas: Area[];
  categories: Category[];
  blocks: Block[];
  items: Item[];
  bills: Bill[];
  expenses: Expense[];
  budgets: Budget[];
  lastBackupAt?: YMD;
  backupLaterOn?: YMD;
}

// What the text reader makes before the person confirms it.
export interface Draft {
  kind: 'task' | 'appointment' | 'todo' | 'expense' | 'bill';
  title: string;
  date: YMD | '';
  time: HM | '';
  amountHalalas: number | null;
  areaId: string;
  categoryId: string;
  recurrence: Recurrence | null;
  urgent: boolean;
}
