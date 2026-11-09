import { useState } from 'preact/hooks';
import { saveDraft } from '../../logic/drafts';
import { parseAll } from '../../logic/parser';
import { PRESETS, recurrencePreset } from '../../logic/recurrence';
import { newId } from '../../model/empty';
import type { Draft } from '../../model/types';
import { validateDraft } from '../../model/validate';
import { useApp } from '../app-context';
import { nameOf } from '../labels';
import { SheetShell } from './DetailsSheet';

const HALALAS = 100;
const KINDS = ['task', 'appointment', 'todo', 'expense', 'bill'] as const;
const REPS = ['none', 'daily', 'weekdays', 'weekly', 'monthly', 'yearly'] as const;

// Several lines, spending or bills: one editable card each, then Save / Discard / Save all (PRD A4).
export function ReviewSheet({ text, date }: { text?: string; date?: string }) {
  const { state, today, t, update, close } = useApp();
  const lang = state.settings.lang;
  const defaultDate = date && date !== today ? date : undefined;
  const [input, setInput] = useState(text ?? '');
  const [drafts, setDrafts] = useState<Draft[]>(text ? parseAll(text, today, defaultDate) : []);
  const [read, setRead] = useState(!!text);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const patch = (i: number, change: Partial<Draft>) => setDrafts((ds) => ds.map((d, j) => (j === i ? { ...d, ...change } : d)));
  const message = (d: Draft) => ({ '': '', emptyTitle: t.needTitle, amountRange: t.needAmount, badDate: t.needDate })[validateDraft(d)];

  // Saves the given cards; any with a problem stay, with their message.
  const save = (which: number[]) => {
    const problems: Record<number, string> = {};
    which.forEach((i) => { const m = message(drafts[i]); if (m) problems[i] = m; });
    const ok = which.filter((i) => !problems[i]);
    if (ok.length) update((s) => ok.reduce((acc, i) => saveDraft(acc, drafts[i], newId), s), { text: t.saved(ok.length) });
    const left = drafts.filter((_, i) => !ok.includes(i));
    setErrors(Object.fromEntries(Object.entries(problems).map(([i]) => [left.indexOf(drafts[Number(i)]), problems[Number(i)]])));
    setDrafts(left);
    if (!left.length && ok.length) close();
  };

  return (
    <SheetShell title={t.capture}>
      <textarea dir="auto" placeholder={t.captureHint} aria-label={t.captureHint} value={input} onInput={(e) => setInput(e.currentTarget.value)} />
      <div class="examples">{(t.examples as string[]).map((e) => <button onClick={() => setInput(e)}>{e}</button>)}</div>
      <button class="btn primary" onClick={() => { setDrafts(parseAll(input, today, defaultDate)); setErrors({}); setRead(true); }}>{t.read}</button>
      {read && !drafts.length && <div class="draft empty">{t.noDrafts}</div>}
      {drafts.length > 0 && (
        <div class="sheet-head"><h2>{t.review}</h2><button class="btn sm accent" onClick={() => save(drafts.map((_, i) => i))}>{t.saveAll}</button></div>
      )}
      {drafts.map((d, i) => {
        const money = d.kind === 'expense' || d.kind === 'bill';
        const preset = d.recurrence ? recurrencePreset(d.recurrence) : 'none';
        return (
          <div class="draft" key={i}>
            <div class="grid">
              <label class="full">{t.title}<input dir="auto" value={d.title} onInput={(e) => patch(i, { title: e.currentTarget.value })} /></label>
              <label>{t.type}<select value={d.kind} onChange={(e) => patch(i, { kind: e.currentTarget.value as Draft['kind'] })}>{KINDS.map((k) => <option value={k}>{t.kind[k]}</option>)}</select></label>
              {money ? (
                <label>{t.category}<select value={d.categoryId} onChange={(e) => patch(i, { categoryId: e.currentTarget.value })}>{state.categories.map((c) => <option value={c.id}>{nameOf(c.name, lang)}</option>)}</select></label>
              ) : (
                <label>{t.area}<select value={d.areaId} onChange={(e) => patch(i, { areaId: e.currentTarget.value })}>{state.areas.map((a) => <option value={a.id}>{nameOf(a.name, lang)}</option>)}</select></label>
              )}
              {d.kind !== 'todo' && <label>{t.date}<input type="date" value={d.date} onChange={(e) => patch(i, { date: e.currentTarget.value })} /></label>}
              {money ? (
                <label>{t.amount}<input type="number" inputMode="decimal" min="0" step="0.01" value={d.amountHalalas === null ? '' : d.amountHalalas / HALALAS}
                  onInput={(e) => patch(i, { amountHalalas: e.currentTarget.value ? Math.round(Number(e.currentTarget.value) * HALALAS) : null })} /></label>
              ) : (
                <label>{t.time}<input type="time" value={d.time} onChange={(e) => patch(i, { time: e.currentTarget.value })} /></label>
              )}
              {!money && (
                <>
                  <label>{t.repeat}<select value={preset === 'workdays' ? 'weekdays' : preset} onChange={(e) => {
                    const v = e.currentTarget.value;
                    patch(i, { recurrence: v === 'none' ? null : PRESETS[v === 'weekdays' ? 'workdays' : (v as 'daily')](d.date || today) });
                  }}>{REPS.map((r) => <option value={r}>{t.reps[r]}</option>)}</select></label>
                  <label class="full check-row"><input type="checkbox" checked={d.urgent} onChange={(e) => patch(i, { urgent: e.currentTarget.checked })} /> {t.urgentTasks}</label>
                </>
              )}
            </div>
            {errors[i] && <div class="err">{errors[i]}</div>}
            <div class="acts">
              <button class="btn sm ghost" onClick={() => setDrafts((ds) => ds.filter((_, j) => j !== i))}>{t.discard}</button>
              <button class="btn sm primary" onClick={() => save([i])}>{t.save}</button>
            </div>
          </div>
        );
      })}
    </SheetShell>
  );
}
