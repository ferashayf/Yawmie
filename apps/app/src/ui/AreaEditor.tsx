import { removeArea } from '../logic/edits';
import type { Area } from '../model/types';
import { useApp } from './app-context';
import { Icon } from './Icon';
import { nameOf } from './labels';

const NAME_MAX = 30;

// Edit areas in place: color, name, delete (its items move to the first area left; Undo).
export function AreaEditor({ onDone }: { onDone?: () => void }) {
  const { state, t, update, open } = useApp();
  const lang = state.settings.lang;
  const patch = (id: string, change: (a: Area) => Area) => update((s) => ({ ...s, areas: s.areas.map((a) => (a.id === id ? change(a) : a)) }));
  const rename = (a: Area, v: string): Area => ({ ...a, name: typeof a.name === 'string' ? v : { ...a.name, [lang]: v } });
  return (
    <div class="glass">
      {state.areas.map((a) => (
        <div class="setting catrow" key={a.id}>
          <input type="color" class="colorin" value={a.color} aria-label={t.color} onChange={(e) => patch(a.id, (x) => ({ ...x, color: e.currentTarget.value }))} />
          <input dir="auto" maxLength={NAME_MAX} value={nameOf(a.name, lang)} aria-label={t.name}
            onChange={(e) => e.currentTarget.value.trim() && patch(a.id, (x) => rename(x, e.currentTarget.value.trim()))} />
          <button class="abtn del" aria-label={t.del} disabled={state.areas.length === 1} onClick={() => update((s) => removeArea(s, a.id), { text: t.deleted, undo: true })}>
            <Icon name="xs" />
          </button>
        </div>
      ))}
      <div class="setting">
        <button class="btn sm" onClick={() => open({ kind: 'area' })}><Icon name="plusSm" />{t.addCat}</button>
        {onDone && <button class="btn sm primary" onClick={onDone}>{t.doneEdit}</button>}
      </div>
    </div>
  );
}
