// Does a pasted purchase pay an unpaid bill, or was it already added? (PRD N4)
import type { Bill, Expense } from '../model/types';
import type { BankLine } from './bankMessages';
import { monthOf } from './dates';

const MIN_NAME_WORD = 3;

// Same amount, and a bill-name word appears in the shop name, or it's the only unpaid bill with that amount.
export function matchBill(line: BankLine, bills: Bill[]): Bill | null {
  if (line.kind !== 'expense') return null;
  const ym = monthOf(line.date);
  const shop = line.merchant.toLowerCase();
  const open = bills.filter((b) => !b.paid[ym] && !b.skipped[ym] && b.amountHalalas === line.amountHalalas);
  const named = open.find((b) => b.name.toLowerCase().split(/\s+/).some((w) => w.length >= MIN_NAME_WORD && shop.includes(w)));
  return named ?? (open.length === 1 ? open[0] : null);
}

export function isDuplicate(line: BankLine, expenses: Expense[]): boolean {
  const shop = line.merchant.trim().toLowerCase();
  return expenses.some((e) => e.date === line.date && Math.abs(e.amountHalalas) === line.amountHalalas && (e.note ?? '').trim().toLowerCase() === shop);
}
