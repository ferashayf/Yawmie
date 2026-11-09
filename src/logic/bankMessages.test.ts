import { describe, expect, it } from 'vitest';
import type { Bill, Expense } from '../model/types';
import { readBankMessages, type BankRead } from './bankMessages';
import { isDuplicate, matchBill } from './matchBill';

const TODAY = '2026-11-09';

// Made-up messages only: no real card numbers, shops or amounts. Moved from design/tests/bank-messages.cases.js.
// Each item: kind|halalas|merchant|date|time|category.
const CASES: { name: string; text: string; want: Partial<Record<'items' | 'n' | 'code' | 'income' | 'other', unknown>> }[] = [
  { name: 'ar pos', text: 'شراء عبر نقاط البيع\nبطاقة: ***0000 مدى\nمبلغ: 23.00 SAR\nلدى: CORNER CAFE\nفي: 09/11/26 08:14', want: { items: ['expense|2300|Corner Cafe|2026-11-09|08:14|food'] } },
  { name: 'en online', text: 'Online Purchase\nAmount: SAR 1,150.50\nAt: CITY FUEL STATION\nCard: *0000\nDate: 2026-11-08 21:05', want: { items: ['expense|115050|City Fuel Station|2026-11-08|21:05|car'] } },
  { name: 'ar riyal word', text: 'شراء إنترنت\nالمبلغ: 89 ريال\nمن: صيدلية العناية\n2026/11/07', want: { items: ['expense|8900|صيدلية العناية|2026-11-07||health'] } },
  { name: 'refund', text: 'استرداد\nمبلغ: 89.00 ر.س\nمن: SHOP APP\nفي: 08-11-2026', want: { items: ['refund|8900|Shop App|2026-11-08||food'] } },
  { name: 'cash, balance ignored', text: 'سحب صراف آلي\nمبلغ: SAR 500\nفي: 2026-11-05 13:10\nالرصيد: 4,200.00 SAR', want: { items: ['cash|50000||2026-11-05|13:10|food'] } },
  { name: 'code ar', text: 'رمز التحقق: 0000 لا تشاركه مع أحد', want: { n: 0, code: 1 } },
  { name: 'code en', text: 'Your OTP is 000000. Do not share it.', want: { n: 0, code: 1 } },
  { name: 'income skipped', text: 'حوالة واردة\nمبلغ: 3,000.00 SAR\nمن: حساب ***0000', want: { n: 0, income: 1 } },
  { name: 'foreign currency skipped', text: 'Purchase\nAmount: USD 20.00\nAt: WEB STORE', want: { n: 0, other: 1 } },
  { name: 'balance only', text: 'رصيدك المتاح: 1,000 SAR', want: { n: 0 } },
  { name: 'arabic digits', text: 'شراء\nمبلغ: ٤٥٫٥٠ ر.س\nلدى: مقهى الحي', want: { items: ['expense|4550|مقهى الحي|2026-11-09||food'] } },
  { name: 'yy-mm-dd', text: 'شراء\nمبلغ: 10 SAR\nلدى: X MARKET\nفي: 26-11-08 14:22', want: { items: ['expense|1000|X Market|2026-11-08|14:22|food'] } },
  { name: 'three in one paste', text: 'POS Purchase\nAmount: SAR 23.00\nAt: CORNER CAFE\n\nOnline Purchase\nAmount: 150.00 SAR\nAt: CITY TELECOM\n\nVerification code: 0000.', want: { n: 2, code: 1 } },
  { name: 'no blank lines', text: 'شراء\nمبلغ: 10 SAR\nلدى: A CAFE\nشراء\nمبلغ: 20 SAR\nلدى: B CAFE', want: { n: 2 } },
  { name: 'card line is not the merchant', text: 'شراء\nمن: بطاقة ***0000\nمبلغ: 30 SAR\nلدى: GRILL HOUSE', want: { items: ['expense|3000|Grill House|2026-11-09||food'] } },
  { name: 'future date → today', text: 'Purchase\nAmount: 5 SAR\nAt: Z\nDate: 2026-12-25', want: { items: ['expense|500|Z|2026-11-09||food'] } },
  { name: 'empty', text: '   ', want: { n: 0 } },
];

function pick(r: BankRead, want: object) {
  const got: Record<string, unknown> = {
    n: r.found.length,
    ...r.skipped,
    items: r.found.map((f) => [f.kind, f.amountHalalas, f.merchant, f.date, f.time, f.categoryId].join('|')),
  };
  return Object.fromEntries(Object.keys(want).map((k) => [k, got[k]]));
}

describe('readBankMessages', () => {
  it.each(CASES)('$name', ({ text, want }) => {
    expect(pick(readBankMessages(text, TODAY), want)).toEqual(want);
  });

  it('never keeps card digits or the message text', () => {
    const r = readBankMessages('شراء\nبطاقة: ***4821\nمبلغ: 23.00 SAR\nلدى: CORNER CAFE', TODAY);
    expect(JSON.stringify(r)).not.toContain('4821');
    expect(JSON.stringify(r)).not.toContain('بطاقة');
  });
});

const bill = (over: Partial<Bill>): Bill => ({ id: 'b', name: 'Electricity', amountHalalas: 30000, dueDay: 27, categoryId: 'home', paid: {}, skipped: {}, ...over });
const line = { kind: 'expense' as const, amountHalalas: 30000, merchant: 'City Electricity Co', date: TODAY, time: '', categoryId: 'home' };

describe('matchBill', () => {
  it('matches by amount and a shared name word', () => {
    expect(matchBill(line, [bill({ id: 'water', name: 'Water' }), bill({ id: 'el' })])?.id).toBe('el');
  });

  it('matches when it is the only unpaid bill with that amount', () => {
    expect(matchBill({ ...line, merchant: 'Unknown' }, [bill({ id: 'only', name: 'Rent' })])?.id).toBe('only');
  });

  it('no match when two bills share the amount and no name overlaps', () => {
    expect(matchBill({ ...line, merchant: 'Unknown' }, [bill({ id: 'a', name: 'Rent' }), bill({ id: 'b', name: 'Gym' })])).toBeNull();
  });

  it('ignores paid, skipped and refund lines', () => {
    expect(matchBill(line, [bill({ paid: { '2026-11': { amountHalalas: 30000 } } })])).toBeNull();
    expect(matchBill(line, [bill({ skipped: { '2026-11': true } })])).toBeNull();
    expect(matchBill({ ...line, kind: 'refund' }, [bill({})])).toBeNull();
  });
});

describe('isDuplicate', () => {
  const e: Expense = { id: 'e', date: TODAY, amountHalalas: 2300, categoryId: 'food', note: 'Corner Cafe' };
  it('same date, amount and shop', () => {
    expect(isDuplicate({ ...line, amountHalalas: 2300, merchant: 'corner cafe' }, [e])).toBe(true);
    expect(isDuplicate({ ...line, amountHalalas: 2300, merchant: 'Other' }, [e])).toBe(false);
  });
});
