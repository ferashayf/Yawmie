// Deleting areas, categories and blocks without leaving anything pointing at nothing.
import type { AppState } from '../model/types';

export function removeBlock(s: AppState, id: string): AppState {
  return {
    ...s,
    blocks: s.blocks.filter((b) => b.id !== id),
    items: s.items.map((it) => (it.blockId === id ? { ...it, blockId: undefined } : it)),
  };
}

// At least one area must exist; its items and blocks move to the first one left.
export function removeArea(s: AppState, id: string): AppState {
  const rest = s.areas.filter((a) => a.id !== id);
  if (rest.length === 0 || rest.length === s.areas.length) return s;
  const to = rest[0].id;
  return {
    ...s,
    areas: rest,
    items: s.items.map((it) => (it.areaId === id ? { ...it, areaId: to } : it)),
    blocks: s.blocks.map((b) => (b.areaId === id ? { ...b, areaId: to } : b)),
  };
}

// Same rule for categories; the category's own budget goes with it.
export function removeCategory(s: AppState, id: string): AppState {
  const rest = s.categories.filter((c) => c.id !== id);
  if (rest.length === 0 || rest.length === s.categories.length) return s;
  const to = rest[0].id;
  return {
    ...s,
    categories: rest,
    expenses: s.expenses.map((e) => (e.categoryId === id ? { ...e, categoryId: to } : e)),
    bills: s.bills.map((b) => (b.categoryId === id ? { ...b, categoryId: to } : b)),
    budgets: s.budgets.filter((g) => g.categoryId !== id),
  };
}
