import { removeCategory } from '../logic/edits';
import { setBudget } from '../logic/money-edits';
import { newId } from '../model/empty';
import { AREA_COLORS, type Category } from '../model/types';
import { useApp } from './app-context';
import { Icon } from './Icon';
import { nameOf } from './labels';

const HALALAS = 100;
const NAME_MAX = 30;
const toHalalas = (v: string) => Math.max(0, Math.round(Number(v) * HALALAS) || 0);

// Spending categories with their monthly budgets, plus the overall budget on top (PRD M6, S4).
export function CategoryEditor({ onDone }: { onDone?: () => void }) {
  const { state, t, update } = useApp();
  const lang = state.settings.lang;
  const limit = (cat: string | null) => state.budgets.find((b) => b.categoryId === cat)?.limitHalalas ?? 0;
  const patch = (id: string, change: (c: Category) => Category) => update((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? change(c) : c)) }));
  const rename = (c: Category, v: string): Category => ({ ...c, name: typeof c.name === 'string' ? v : { ...c.name, [lang]: v } });
  const add = () => update((s) => ({ ...s, categories: [...s.categories, { id: newId(), name: t.newCat, color: AREA_COLORS[s.categories.length % AREA_COLORS.length] }] }));
  return (
    <div class="glass">
      <div class="setting catrow">
        <span class="colorin" style={{ background: 'var(--ink)' }} />
        <span style={{ flex: 1, fontWeight: 700 }}>{t.overall}</span>
        <input type="number" min="0" step="10" inputMode="decimal" class="limit num" value={limit(null) / HALALAS} aria-label={t.budget} title={t.budget}
          onChange={(e) => update((s) => setBudget(s, null, toHalalas(e.currentTarget.value), newId))} />
        <span style={{ width: '32px' }} />
      </div>
      {state.categories.map((c) => (
        <div class="setting catrow" key={c.id}>
          <input type="color" class="colorin" value={c.color} aria-label={t.color} onChange={(e) => patch(c.id, (x) => ({ ...x, color: e.currentTarget.value }))} />
          <input dir="auto" maxLength={NAME_MAX} value={nameOf(c.name, lang)} aria-label={t.name} onChange={(e) => e.currentTarget.value.trim() && patch(c.id, (x) => rename(x, e.currentTarget.value.trim()))} />
          <input type="number" min="0" step="10" inputMode="decimal" class="limit num" value={limit(c.id) / HALALAS} aria-label={t.budget} title={t.budget}
            onChange={(e) => update((s) => setBudget(s, c.id, toHalalas(e.currentTarget.value), newId))} />
          <button class="abtn del" aria-label={t.del} disabled={state.categories.length === 1} onClick={() => update((s) => removeCategory(s, c.id), { text: t.deleted, undo: true })}><Icon name="xs" /></button>
        </div>
      ))}
      <div class="setting">
        <button class="btn sm" onClick={add}><Icon name="plusSm" />{t.addCat}</button>
        {onDone && <button class="btn sm primary" onClick={onDone}>{t.doneEdit}</button>}
      </div>
    </div>
  );
}
