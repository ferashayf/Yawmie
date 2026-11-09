// Pasted bank SMS → spending lines to review (PRD N1–N4). Card numbers and the message text are never kept.
import type { HM, YMD } from '../model/types';
import { daysBetween, daysInMonth } from './dates';
import { firstKey, hasWholeWord, KW, westernDigits } from './keywords';

const MAX_AMOUNT_HALALAS = 100_000_000; // SAR 1,000,000
const HALALAS = 100;
const MERCHANT_MAX = 40;
const HOURS_IN_DAY = 24;
const CENTURY = 2000;

export interface BankLine {
  kind: 'expense' | 'refund' | 'cash' | 'transfer';
  amountHalalas: number;
  merchant: string;
  date: YMD;
  time: HM | '';
  categoryId: string;
}

export interface BankRead {
  found: BankLine[];
  skipped: { code: number; income: number; other: number };
}

const SAR = '(?:SAR|SR|ر\\.?\\s?س\\.?|ريال)';
const NUM = '([\\d,]+(?:\\.\\d{1,2})?)';
const SMS = {
  code: /(رمز|OTP|verification|التحقق|كلمة المرور|password|passcode)/i,
  income: /(وارد|واردة|إيداع|ايداع|received|credited|deposit|راتب|salary)/i,
  refund: /(استرداد|مسترد|إرجاع|ارجاع|refund|reversal|reversed)/i,
  cash: /(سحب|صراف|\bATM\b|withdraw)/i,
  transfer: /(حوالة|تحويل|transfer)/i,
  start: /^\s*(شراء|purchase|pos\b|online|استرداد|refund|سحب|atm\b|withdraw|حوالة|تحويل|transfer|سداد|payment|دفع)/i,
  balance: /(رصيد|الرصيد|متاح|المتاح|balance|available|limit)/i,
  amountLabel: new RegExp(`(?:المبلغ|مبلغ|amount|amt)\\s*[:：]?\\s*(?:([A-Za-z]{3}|ر\\.?\\s?س\\.?|ريال)\\s*)?${NUM}\\s*([A-Za-z]{3}|ر\\.?\\s?س\\.?|ريال)?`, 'i'),
  amountCurrency: new RegExp(`${SAR}\\s*${NUM}|${NUM}\\s*${SAR}`, 'i'),
  sar: new RegExp(`^${SAR}$`, 'i'),
  merchant: /^\s*(?:لدى|لدي|عند|من|التاجر|at|from|merchant|to)\s*[:：]?\s*(.+)$/i,
  notMerchant: /^(حساب|بطاقة|البطاقة|account|card|\*|x{2,}|\d)/i,
  date: /(\d{1,4})[-/.](\d{1,2})[-/.](\d{2,4})/,
  time: /(?:^|\D)(\d{1,2}):(\d{2})(?!\d)/,
};

const pad = (n: number) => String(n).padStart(2, '0');
const hasAmount = (line: string) => SMS.amountLabel.test(line) || SMS.amountCurrency.test(line);

// Several messages in one paste: split on blank lines, or where a new message starts after an amount.
function splitMessages(text: string): string[][] {
  const out: string[][] = [];
  let cur: string[] = [];
  for (const line of westernDigits(text).replace(/٬/g, ',').replace(/\r/g, '').split('\n')) {
    const blank = !line.trim();
    if (blank || (SMS.start.test(line) && cur.some(hasAmount))) {
      if (cur.length) out.push(cur);
      cur = [];
    }
    if (!blank) cur.push(line.trim());
  }
  if (cur.length) out.push(cur);
  return out;
}

function readAmount(lines: string[]): { n: string; foreign: boolean } | null {
  const plain = lines.filter((x) => !SMS.balance.test(x));
  for (const line of plain) {
    const m = line.match(SMS.amountLabel);
    if (m) {
      const currency = m[1] || m[3];
      return { n: m[2], foreign: !!currency && !SMS.sar.test(currency.trim()) };
    }
  }
  for (const line of plain) {
    const m = line.match(SMS.amountCurrency);
    if (m) return { n: m[1] || m[2], foreign: false };
  }
  return null;
}

// d/m/y or y/m/d; the closest valid reading to today wins; never in the future.
function readDate(text: string, today: YMD): YMD {
  const m = text.match(SMS.date);
  if (!m) return today;
  const [a, b, c] = [+m[1], +m[2], +m[3]];
  const candidates: [number, number, number][] = [];
  if (m[1].length === 4) candidates.push([a, b, c]);
  else {
    candidates.push([c < HALALAS ? CENTURY + c : c, b, a]);
    if (c <= 31 && a < HALALAS) candidates.push([CENTURY + a, b, c]);
  }
  const best = candidates
    .filter(([y, mo, d]) => mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(`${y}-${pad(mo)}`))
    .map(([y, mo, d]) => `${y}-${pad(mo)}-${pad(d)}`)
    .sort((p, q) => Math.abs(daysBetween(p, today)) - Math.abs(daysBetween(q, today)))[0];
  return best && best <= today ? best : today;
}

function readMerchant(lines: string[]): string {
  for (const line of lines) {
    const m = line.match(SMS.merchant);
    if (!m) continue;
    let v = m[1].replace(SMS.date, '').replace(/\s+(في|on)\s*[:：]?.*$/i, '').replace(/[.:،,]+$/, '').trim();
    if (!v || SMS.notMerchant.test(v)) continue;
    if (v === v.toUpperCase() && /[A-Z]/.test(v)) v = v.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase()); // CORNER CAFE → Corner Cafe
    return v.slice(0, MERCHANT_MAX);
  }
  return '';
}

export function readBankMessages(text: string, today: YMD): BankRead {
  const found: BankLine[] = [];
  const skipped = { code: 0, income: 0, other: 0 };
  for (const lines of splitMessages(text)) {
    const all = lines.join('\n');
    const amount = readAmount(lines);
    if (SMS.code.test(all) && (!amount || !SMS.start.test(all))) { skipped.code++; continue; }
    if (SMS.income.test(all) && !SMS.refund.test(all)) { skipped.income++; continue; }
    const n = amount && !amount.foreign ? Math.round(parseFloat(amount.n.replace(/,/g, '')) * HALALAS) : 0;
    if (!(n > 0 && n < MAX_AMOUNT_HALALAS)) { skipped.other++; continue; }
    const kind = SMS.refund.test(all) ? 'refund' : SMS.cash.test(all) ? 'cash' : SMS.transfer.test(all) ? 'transfer' : 'expense';
    const t = all.match(SMS.time);
    const merchant = readMerchant(lines);
    const low = `${merchant} ${all}`.toLowerCase();
    found.push({
      kind,
      amountHalalas: n,
      merchant,
      date: readDate(all, today),
      time: t && +t[1] < HOURS_IN_DAY ? `${pad(+t[1])}:${t[2]}` : '',
      categoryId: firstKey(KW.category, (words) => hasWholeWord(low, words), 'food'),
    });
  }
  return { found, skipped };
}
