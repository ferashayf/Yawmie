import type { Lang } from '../model/types';
import { ar } from './ar';
import { en } from './en';

export type Strings = typeof ar;

export const strings = (lang: Lang): Strings => (lang === 'ar' ? ar : (en as Strings));
