import { describe, expect, it } from 'vitest';
import { ar } from './ar';
import { en } from './en';
import { fmtDate, fmtMoney, fmtMonth, fmtNum, fmtTime } from './format';
import { strings } from './index';

const ARABIC_DIGITS = /[٠-٩۰-۹]/;
const DEMO_ONLY = ['freshT', 'freshP', 'freshBtn', 'freshQ', 'freshYes', 'design', 'accent', 'corners', 'cards', 'soft', 'flat', 'sample', 'captionH', 'captionP'];

function keyPaths(o: object, prefix = ''): string[] {
  return Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? keyPaths(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

describe('text tables', () => {
  it('ar and en have the same keys', () => {
    expect(keyPaths(ar).sort()).toEqual(keyPaths(en).sort());
  });

  it('formulas have the same shape in both languages', () => {
    for (const k of keyPaths(ar)) {
      const get = (t: object) => k.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], t);
      expect(typeof get(ar), k).toBe(typeof get(en));
    }
  });

  it('no demo-only keys remain, and nothing says demo', () => {
    for (const k of DEMO_ONLY) expect(k in ar, k).toBe(false);
    expect(JSON.stringify(en)).not.toMatch(/\bdemo\b|sample data|fake/i);
  });

  it('strings() picks the table', () => {
    expect(strings('ar')).toBe(ar);
    expect(strings('en')).toBe(en);
  });
});

describe('format', () => {
  it('money is SAR 1,250.00 in both languages', () => {
    expect(fmtMoney(125000)).toBe('SAR 1,250.00');
    expect(fmtMoney(0)).toBe('SAR 0.00');
  });

  it('a refund shows +SAR', () => {
    expect(fmtMoney(-1500)).toBe('+SAR 15.00');
  });

  it('no Arabic-Indic digits in any Arabic output', () => {
    const out = [fmtNum(1234567, 'ar'), fmtDate('2026-11-09', 'ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), fmtTime('21:30', 'ar'), fmtMonth('2026-11', 'ar'), ar.late(3), ar.dueIn(5)];
    for (const s of out) expect(s, s).not.toMatch(ARABIC_DIGITS);
    expect(fmtDate('2026-11-09', 'ar', { day: 'numeric' })).toBe('9');
  });

  it('Gregorian dates in Arabic', () => {
    expect(fmtMonth('2026-11', 'ar')).toMatch(/نوفمبر/);
    expect(fmtMonth('2026-11', 'en')).toBe('November 2026');
  });
});
