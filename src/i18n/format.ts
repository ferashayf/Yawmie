// Numbers, money, dates and times. Digits stay 0-9 in Arabic too (-u-nu-latn); Gregorian only.
import type { HM, Lang, YM, YMD } from '../model/types';

const HALALAS = 100;
const locale = (lang: Lang) => (lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-US');
const MONEY = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fromYMD = (s: YMD) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Always `SAR 1,250.00`. A refund (negative) shows as money back: `+SAR 15.00`. Wrap it in <bdi> on screen.
export function fmtMoney(halalas: number): string {
  const text = `SAR ${MONEY.format(Math.abs(halalas) / HALALAS)}`;
  return halalas < 0 ? `+${text}` : text;
}

export const fmtNum = (n: number, lang: Lang) => new Intl.NumberFormat(locale(lang)).format(n);

export const fmtDate = (d: YMD, lang: Lang, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale(lang), opts).format(fromYMD(d));

export function fmtTime(t: HM, lang: Lang): string {
  const [h, m] = t.split(':').map(Number);
  return new Intl.DateTimeFormat(locale(lang), { hour: 'numeric', minute: '2-digit' }).format(new Date(2000, 0, 1, h, m));
}

export const fmtMonth = (ym: YM, lang: Lang) => new Intl.DateTimeFormat(locale(lang), { month: 'long', year: 'numeric' }).format(fromYMD(`${ym}-01`));
