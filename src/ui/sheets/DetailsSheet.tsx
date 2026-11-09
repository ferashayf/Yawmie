import { useState } from 'preact/hooks';
import { fmtDate, fmtTime } from '../../i18n/format';
import { addDays, weekday } from '../../logic/dates';
import { parseOne } from '../../logic/parser';
import { PRESETS, recurrencePreset } from '../../logic/recurrence';
import { newId } from '../../model/empty';
import type { Alert, Draft, Item, Recurrence, Weekday, YMD } from '../../model/types';
import { safeUrl } from '../../model/validate';
import type { ComponentChildren } from 'preact';
import { useApp } from '../app-context';
import type { IconName } from '../icons';
import { Icon } from '../Icon';
import { nameOf, repeatLabel } from '../labels';

const PLAN_DAYS = 10;
const MAX_EVERY = 365;
const TITLE_MAX = 120;
const NOTES_MAX = 1000;
const URL_MAX = 300;
const PLACE_MAX = 80;
const DEFAULT_DUR = 30;
const MIN_DUR = 5;
const MAX_DUR = 1440;
const DEFAULT_TIME = '09:00';
const END_AFTER_DAYS = 30;

interface Form {
  kind: 'task' | 'appointment';
  title: string; notes: string; url: string;
  hasDate: boolean; date: YMD; hasTime: boolean; time: string;
  alert: Alert; rep: Recurrence | null;
  areaId: string; urgent: boolean; dur: number; place: string;
  planDays: YMD[]; blockId?: string;
}

const fromItem = (it: Item, fallbackDate: YMD): Form => ({
  kind: it.kind === 'appointment' ? 'appointment' : 'task', title: it.title, notes: it.notes ?? '', url: it.url ?? '',
  hasDate: !!it.dueDate, date: it.dueDate ?? fallbackDate, hasTime: !!it.time, time: it.time ?? DEFAULT_TIME,
  alert: it.alert, rep: it.recurrence ?? null, areaId: it.areaId, urgent: it.urgent, dur: it.durationMin ?? DEFAULT_DUR,
  place: it.place ?? '', planDays: [...it.planDays], blockId: it.blockId,
});

const fillFrom = (f: Form, p: Draft): Form => ({
  ...f, kind: p.kind === 'appointment' ? 'appointment' : 'task', title: p.title, hasDate: !!p.date, date: p.date || f.date,
  hasTime: !!p.time, time: p.time || f.time, rep: p.recurrence, areaId: p.areaId, urgent: p.urgent,
});

// Details page for a new or existing task/appointment, with its repeat page (PRD D1–D7).
export function DetailsSheet({ id, draft, date, blockId }: { id?: string; draft?: Draft; date?: YMD; blockId?: string }) {
  const { state, today, t, update, close } = useApp();
  const lang = state.settings.lang;
  const existing = id ? state.items.find((x) => x.id === id) : undefined;
  const blank: Form = {
    kind: 'task', title: '', notes: '', url: '', hasDate: true, date: date ?? today, hasTime: false, time: DEFAULT_TIME, alert: 'none', rep: null,
    areaId: state.areas[0].id, urgent: false, dur: DEFAULT_DUR, place: '', planDays: [], blockId,
  };
  const [f, setF] = useState<Form>(existing ? fromItem(existing, today) : draft ? fillFrom(blank, draft) : blank);
  const [err, setErr] = useState('');
  const [quick, setQuick] = useState('');
  const [sub, setSub] = useState<'repeat' | null>(null);
  const [custom, setCustom] = useState(f.rep ? recurrencePreset(f.rep) === 'custom' : false);
  const [confirm, setConfirm] = useState(false);
  const set = (patch: Partial<Form>) => setF((x) => ({ ...x, ...patch }));
  const appt = f.kind === 'appointment';
  const link = safeUrl(f.url);

  const repError = (r: Recurrence | null): string => {
    if (!r) return '';
    if (!(r.every >= 1 && r.every <= MAX_EVERY)) return t.badEvery;
    if (r.freq === 'week' && !r.days?.length) return t.needDays;
    if (r.end && r.end < f.date) return t.badEnd;
    return '';
  };

  const save = () => {
    const title = f.title.trim();
    const url = f.url.trim() ? safeUrl(f.url) : '';
    const problem = !title ? t.needTitle : appt && !f.hasDate ? t.needDate : f.url.trim() && !url ? t.badUrl : f.hasDate ? repError(f.rep) : '';
    if (problem) return setErr(problem);
    const dur = Math.round(f.dur);
    const data: Omit<Item, 'id' | 'status'> = {
      kind: f.hasDate ? f.kind : 'todo', title: title.slice(0, TITLE_MAX), notes: f.notes.trim().slice(0, NOTES_MAX) || undefined, url: url || undefined,
      dueDate: f.hasDate ? f.date : undefined, time: f.hasDate && f.hasTime ? f.time : undefined, alert: f.hasDate ? f.alert : 'none',
      recurrence: f.hasDate && f.rep ? { ...f.rep, start: f.date } : undefined, areaId: f.areaId, urgent: !appt && f.urgent,
      durationMin: appt ? (dur >= MIN_DUR && dur <= MAX_DUR ? dur : DEFAULT_DUR) : undefined, place: appt && f.place.trim() ? f.place.trim().slice(0, PLACE_MAX) : undefined,
      planDays: appt ? [] : f.planDays, blockId: !appt ? f.blockId : undefined,
    };
    const toast = { text: data.alert !== 'none' ? t.alertSaved : t.saved(1) };
    if (existing) update((s) => ({ ...s, items: s.items.map((x) => (x.id === existing.id ? { ...x, ...data } : x)) }), toast);
    else update((s) => ({ ...s, items: [...s.items, { ...data, id: newId(), status: 'open' }] }), toast);
    close();
  };

  const remove = () => {
    if (!existing) return;
    update((s) => ({ ...s, items: s.items.filter((x) => x.id !== existing.id) }), { text: t.deleted, undo: true });
    close();
  };

  if (sub === 'repeat') return repeatPage();

  return (
    <SheetShell title={existing ? t.details : t.newItem} onSave={save}>
      {err && <div class="err" role="alert">{err}</div>}
      {!existing && (
        <div class="dgroup quickfill">
          <input dir="auto" placeholder={t.quickFill} aria-label={t.quickFill} value={quick} onInput={(e) => setQuick(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.isComposing && quick.trim() && (setF(fillFrom(f, parseOne(quick, today, date))), setQuick(''))} />
          <button class="btn sm primary" onClick={() => quick.trim() && (setF(fillFrom(f, parseOne(quick, today, date))), setQuick(''))}>{t.fill}</button>
        </div>
      )}
      <div class="seg wide" role="group">
        {(['task', 'appointment'] as const).map((k) => (
          <button class={f.kind === k ? 'on' : ''} aria-pressed={f.kind === k} onClick={() => set(k === 'appointment' ? { kind: k, hasDate: true, hasTime: true } : { kind: k })}>{t.kind[k]}</button>
        ))}
      </div>
      <div class="dgroup">
        <input class="dtitle" dir="auto" maxLength={TITLE_MAX} value={f.title} placeholder={t.title} aria-label={t.title} onInput={(e) => set({ title: e.currentTarget.value })} />
        <textarea dir="auto" maxLength={NOTES_MAX} placeholder={t.notesPh} aria-label={t.notesPh} value={f.notes} onInput={(e) => set({ notes: e.currentTarget.value })} />
        <input type="url" dir="ltr" maxLength={URL_MAX} value={f.url} placeholder={t.urlPh} aria-label={t.urlPh} onInput={(e) => set({ url: e.currentTarget.value })} />
        {link && <a class="dlink" href={link} target="_blank" rel="noopener noreferrer"><Icon name="link" /> {t.openLink}</a>}
      </div>
      <div class="dgroup">
        <Row icon="cal" label={t.date} value={f.hasDate ? fmtDate(f.date, lang, { weekday: 'long', day: 'numeric', month: 'long' }) : ''} tile="#C2416E">
          <Switch on={f.hasDate} label={t.date} onToggle={() => (f.hasDate ? (appt ? setErr(t.needDate) : set({ hasDate: false, hasTime: false, alert: 'none', rep: null })) : set({ hasDate: true }))} />
        </Row>
        {f.hasDate && (
          <>
            <div class="dsub"><input type="date" value={f.date} aria-label={t.date} onChange={(e) => e.currentTarget.value && set({ date: e.currentTarget.value })} /></div>
            <Row icon="clock" label={t.time} value={f.hasTime ? fmtTime(f.time, lang) : ''} tile="#5B7FA6">
              <Switch on={f.hasTime} label={t.time} onToggle={() => set({ hasTime: !f.hasTime })} />
            </Row>
            {f.hasTime && <div class="dsub"><input type="time" value={f.time} aria-label={t.time} onChange={(e) => e.currentTarget.value && set({ time: e.currentTarget.value })} /></div>}
            <Row icon="bell" label={t.alertLbl} tile="#D08A2E">
              <select class="dselect" aria-label={t.alertLbl} value={f.alert} onChange={(e) => set({ alert: e.currentTarget.value as Alert })}>
                {Object.entries(t.alerts as Record<string, string>).map(([k, v]) => <option value={k}>{v}</option>)}
              </select>
            </Row>
            {f.alert !== 'none' && !f.hasTime && <div class="dhint">{t.alertNoTime}</div>}
            <button class="drow dbtn" onClick={() => { setErr(''); setSub('repeat'); }}>
              <span class="dicon" style={{ '--tile': '#7A8B3D' }}><Icon name="repeat" /></span>
              <span class="dlabel">{t.repeatLbl}</span>
              <span class="dval">{f.rep ? repeatLabel(f.rep, t, lang) : t.reps.none}</span>
              <Icon name="chev" />
            </button>
          </>
        )}
      </div>
      {appt && (
        <div class="dgroup"><div class="fields">
          <label>{t.dur}<input type="number" min={MIN_DUR} max={MAX_DUR} step={5} value={f.dur} onInput={(e) => set({ dur: Number(e.currentTarget.value) })} /></label>
          <label>{t.place}<input dir="auto" maxLength={PLACE_MAX} value={f.place} onInput={(e) => set({ place: e.currentTarget.value })} /></label>
        </div></div>
      )}
      <div class="dgroup">
        <div class="lbl">{t.area}</div>
        <div class="areas">
          {state.areas.map((a) => (
            <button class={`achip${f.areaId === a.id ? ' on' : ''}`} aria-pressed={f.areaId === a.id} onClick={() => set({ areaId: a.id })}><span class="dot" style={{ '--c': a.color }} />{nameOf(a.name, lang)}</button>
          ))}
        </div>
        {!appt && <Row icon="flag" label={t.urgentLbl} tile="var(--accent2)"><Switch on={f.urgent} label={t.urgentLbl} onToggle={() => set({ urgent: !f.urgent })} /></Row>}
      </div>
      {!appt && f.hasDate && (
        <div class="dgroup">
          <div class="lbl">{t.planDays}</div>
          <div class="days">
            {Array.from({ length: PLAN_DAYS }, (_, i) => addDays(today, i)).map((d, i) => {
              const on = f.planDays.includes(d);
              return (
                <button class={`${i === 0 ? 'today' : ''}${on ? ' on' : ''}`} aria-pressed={on} onClick={() => set({ planDays: on ? f.planDays.filter((x) => x !== d) : [...f.planDays, d] })}>
                  <small>{i === 0 ? t.today : fmtDate(d, lang, { weekday: 'short' })}</small><b class="num">{Number(d.slice(8))}</b>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {existing && (
        <div class="dgroup">
          <button class="drow dbtn danger" onClick={() => setConfirm(!confirm)}>{t.del}</button>
          {confirm && (
            <div class="confirm" role="alert"><span>{t.delQ}</span>
              <div class="b"><button class="yes" onClick={remove}>{t.yesDel}</button><button class="no" onClick={() => setConfirm(false)}>{t.back}</button></div>
            </div>
          )}
        </div>
      )}
    </SheetShell>
  );

  function repeatPage() {
    const r = f.rep;
    const preset = custom ? 'custom' : r ? recurrencePreset(r) : 'none';
    const key = (p: string) => (p === 'workdays' ? 'weekdays' : p);
    const setRep = (rep: Recurrence | null) => set({ rep });
    const choose = (v: string) => {
      setErr('');
      const end = r?.end;
      if (v === 'custom') {
        setCustom(true);
        return setRep(r ? { ...r } : { freq: 'week', every: 1, days: [weekday(f.date)], start: f.date });
      }
      setCustom(false);
      if (v === 'none') return setRep(null);
      const next = PRESETS[v === 'weekdays' ? 'workdays' : (v as 'daily')](f.date);
      setRep(end ? { ...next, end } : next);
    };
    const back = () => {
      const problem = repError(r);
      if (problem) return setErr(problem);
      setSub(null);
    };
    return (
      <SheetShell title={t.repeatLbl} back={back}>
        {err && <div class="err" role="alert">{err}</div>}
        <div class="dgroup">
          {['none', 'daily', 'weekdays', 'weekly', 'monthly', 'yearly', 'custom'].map((k) => (
            <button class="drow dbtn" aria-pressed={key(preset) === k} onClick={() => choose(k)}>
              <span class="dlabel">{t.reps[k as 'none']}</span>{key(preset) === k && <span class="dcheck"><Icon name="check" /></span>}
            </button>
          ))}
        </div>
        {preset === 'custom' && r && (
          <div class="dgroup">
            <div class="drow"><span class="dlabel">{t.every}</span>
              <input type="number" class="every num" min={1} max={MAX_EVERY} value={r.every} aria-label={t.every} onInput={(e) => setRep({ ...r, every: Number(e.currentTarget.value) })} />
            </div>
            <div class="seg wide" role="group">
              {(['day', 'week', 'month', 'year'] as const).map((u) => (
                <button class={r.freq === u ? 'on' : ''} aria-pressed={r.freq === u}
                  onClick={() => setRep(u === 'week' ? { ...r, freq: u, days: r.days?.length ? r.days : [weekday(f.date)] } : { ...r, freq: u, days: undefined })}>
                  {t.units[u][r.every === 1 ? 0 : 1]}
                </button>
              ))}
            </div>
            {r.freq === 'week' && (
              <>
                <div class="lbl">{t.onDays}</div>
                <div class="wdays">
                  {Array.from({ length: 7 }, (_, n) => n as Weekday).map((n) => {
                    const on = r.days?.includes(n) ?? false;
                    return <button class={on ? 'on' : ''} aria-pressed={on} onClick={() => setRep({ ...r, days: on ? r.days!.filter((d) => d !== n) : [...(r.days ?? []), n] })}>{dayShort(n)}</button>;
                  })}
                </div>
              </>
            )}
            <div class="dhint">{repeatLabel(r, t, lang)}</div>
          </div>
        )}
        {r && (
          <div class="dgroup">
            <Row icon="cal" label={t.endRepeat} tile="#C2416E">
              <div class="seg" role="group">
                <button class={r.end ? '' : 'on'} onClick={() => setRep({ ...r, end: undefined })}>{t.never}</button>
                <button class={r.end ? 'on' : ''} onClick={() => setRep({ ...r, end: r.end ?? addDays(f.date, END_AFTER_DAYS) })}>{t.onDate}</button>
              </div>
            </Row>
            {r.end && <div class="dsub"><input type="date" value={r.end} min={f.date} aria-label={t.endRepeat} onChange={(e) => e.currentTarget.value && setRep({ ...r, end: e.currentTarget.value })} /></div>}
          </div>
        )}
      </SheetShell>
    );
  }

  function dayShort(n: number) {
    return fmtDate(addDays('2026-11-01', n), lang, { weekday: 'short' });
  }
}

function Switch({ on, label, onToggle }: { on: boolean; label: string; onToggle: () => void }) {
  return <button class={`switch${on ? ' on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={onToggle} />;
}

function Row({ icon, label, value, tile, children }: { icon: IconName; label: string; value?: string; tile: string; children?: ComponentChildren }) {
  return (
    <div class="drow"><span class="dicon" style={{ '--tile': tile }}><Icon name={icon} /></span><span class="dlabel">{label}{value && <small>{value}</small>}</span>{children}</div>
  );
}

// Sheet frame: ✕ (or ‹ on a sub-page) · title · ✓.
export function SheetShell({ title, onSave, back, children }: { title: string; onSave?: () => void; back?: () => void; children: ComponentChildren }) {
  const { t, close } = useApp();
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && close()}>
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="dhead">
          {back ? <button class="round glass" aria-label={t.back} onClick={back}><Icon name="chevBack" /></button>
            : <button class="round glass" aria-label={t.cancel} onClick={close}><Icon name="close" /></button>}
          <h2>{title}</h2>
          {onSave ? <button class="round okbtn" aria-label={t.doneBtn} onClick={onSave}><Icon name="checkBig" /></button> : <span class="dhead-pad" />}
        </div>
        {children}
      </div>
    </div>
  );
}
