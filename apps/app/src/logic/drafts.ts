// A confirmed draft (from the reader, the review list or an Add card) becomes saved data.
import type { AppState, Draft } from '../model/types';

export function saveDraft(s: AppState, d: Draft, newId: () => string): AppState {
  const title = d.title.trim();
  if (d.kind === 'expense') {
    return { ...s, expenses: [...s.expenses, { id: newId(), date: d.date, amountHalalas: d.amountHalalas ?? 0, categoryId: d.categoryId, note: title || undefined }] };
  }
  if (d.kind === 'bill') {
    return { ...s, bills: [...s.bills, { id: newId(), name: title, amountHalalas: d.amountHalalas ?? 0, dueDay: Number(d.date.slice(8)) || 1, categoryId: d.categoryId, paid: {}, skipped: {} }] };
  }
  const dated = d.kind !== 'todo' && !!d.date;
  return {
    ...s,
    items: [
      ...s.items,
      {
        id: newId(),
        kind: dated ? d.kind : 'todo',
        title,
        areaId: d.areaId,
        urgent: d.kind !== 'appointment' && d.urgent,
        dueDate: dated ? d.date : undefined,
        time: dated && d.time ? d.time : undefined,
        alert: 'none',
        planDays: [],
        recurrence: dated && d.recurrence ? { ...d.recurrence, start: d.date } : undefined,
        status: 'open',
      },
    ],
  };
}
