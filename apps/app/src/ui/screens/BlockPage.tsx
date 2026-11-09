import { useState } from 'preact/hooks';
import { fmtDate, fmtTime } from '../../i18n/format';
import { placeTasks } from '../../logic/blocks';
import { removeBlock, moveIntoBlock, takeOutOfBlock } from '../../logic/edits';
import type { Block, Weekday } from '../../model/types';
import { useApp } from '../app-context';
import { AreaIcon, Icon } from '../Icon';
import { dayName, findArea, nameOf } from '../labels';
import { Header } from '../TopBar';

const MINUTES = 60;
const MOVE_MAX = 6;
const DAYS_IN_WEEK = 7;
const TITLE_MAX = 120;
const toMin = (t: string) => Number(t.slice(0, 2)) * MINUTES + Number(t.slice(3));

// The block page: time, days, progress, Start focus, its tasks, Move in, edit, Delete (PRD K2).
export function BlockPage({ id, day }: { id: string; day: string }) {
  const { state, today, now, t, update, open, close, finish } = useApp();
  const [add, setAdd] = useState('');
  const lang = state.settings.lang;
  const b = state.blocks.find((x) => x.id === id);
  if (!b) return null;
  const a = findArea(state.areas, b.areaId);
  const st = toMin(b.start);
  const en = toMin(b.end);
  const frac = day < today ? 1 : day > today ? 0 : Math.max(0, Math.min(1, (toMin(now) - st) / (en - st)));
  const placed = placeTasks(state, day, today, now);
  const inside = state.items.filter((x) => x.status === 'open' && x.kind === 'task' && x.blockId === b.id && ((placed.inBlock[b.id] ?? []).includes(x) || x.dueDate === day || x.planDays.includes(day)));
  const candidates = state.items
    .filter((x) => x.status === 'open' && x.kind !== 'appointment' && x.blockId !== b.id && (x.dueDate === day || x.planDays.includes(day) || (!!x.dueDate && x.dueDate < today) || x.kind === 'todo' || x.areaId === b.areaId))
    .sort((p, q) => Number(q.areaId === b.areaId) - Number(p.areaId === b.areaId) || (p.dueDate ?? '9').localeCompare(q.dueDate ?? '9'))
    .slice(0, MOVE_MAX);

  const patch = (change: Partial<Block>) => update((s) => ({ ...s, blocks: s.blocks.map((x) => (x.id === b.id ? { ...x, ...change } : x)) }));
  const setTime = (key: 'start' | 'end', v: string) => {
    const next = { ...b, [key]: v };
    if (!v || next.end <= next.start) return update((s) => s, { text: t.badEnd });
    patch({ [key]: v });
  };
  const toggleDay = (n: Weekday) => {
    const on = b.days.includes(n);
    if (on && b.days.length === 1) return update((s) => s, { text: t.oneDay });
    patch({ days: on ? b.days.filter((d) => d !== n) : [...b.days, n].sort() as Weekday[] });
  };
  const addTask = () => {
    open({ kind: 'add', text: add.trim(), date: day, blockId: b.id });
    setAdd('');
  };
  const daysText = () => {
    const d = [...b.days].sort();
    const run = d.length >= 3 && d[d.length - 1] - d[0] === d.length - 1;
    return t.everyDays(run ? `${dayName(d[0], lang)} – ${dayName(d[d.length - 1], lang)}` : d.map((n) => dayName(n, lang)).join(lang === 'ar' ? '، ' : ', '));
  };

  return (
    <>
      <Header title={t.blockTitle(nameOf(a.name, lang))} sub={`${t.plan} · ${fmtDate(day, lang, { weekday: 'long', day: 'numeric', month: 'short' })}`}
        start={<span class="mnav"><button class="round glass" aria-label={t.back} onClick={close}><Icon name="chevBack" /></button></span>} />
      <section class="bhero" style={{ '--a': a.color }}>
        <div class="bh-top">
          <span class="ico big"><AreaIcon name={a.icon} size={30} /></span>
          <div><b class="num">{fmtTime(b.start, lang)} – {fmtTime(b.end, lang)}</b><small>{daysText()}</small></div>
        </div>
        <div class="bh-bar" role="progressbar" aria-valuenow={Math.round(frac * 100)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${Math.round(frac * 100)}%` }} /></div>
        <button class="go" onClick={() => open({ kind: 'focus', id: b.id })}><Icon name="focus" />{t.startFocus}</button>
      </section>

      <div class="dgroup blist" style={{ '--c': a.color }}>
        {inside.map((x) => (
          <div class="drow" key={x.id}>
            <button class="tick" style={{ '--c': a.color }} aria-label={t.done} onClick={() => finish(x.id)}><Icon name="check" /></button>
            <span class="dlabel">{x.title}</span>
            <button class="xbtn" aria-label={t.removeFromBlock} title={t.removeFromBlock} onClick={() => update((s) => takeOutOfBlock(s, x.id))}><Icon name="xs" /></button>
          </div>
        ))}
        <div class="drow">
          <button class="dicon" style={{ '--tile': a.color }} aria-label={t.addToBlock} onClick={addTask}><Icon name="plusSm" /></button>
          <input dir="auto" maxLength={TITLE_MAX} placeholder={t.addToBlock} aria-label={t.addToBlock} value={add}
            onInput={(e) => setAdd(e.currentTarget.value)} onKeyDown={(e) => e.key === 'Enter' && !e.isComposing && addTask()} />
        </div>
      </div>

      <div class="lbl">{t.moveIn}</div>
      <div class="dgroup mvlist">
        {candidates.length ? candidates.map((x) => {
          const xa = findArea(state.areas, x.areaId);
          return (
            <div class="drow" key={x.id}>
              <span class="dot" style={{ '--c': xa.color }} />
              <span class="dlabel">{x.title}<small>{nameOf(xa.name, lang)}</small></span>
              <button class="btn sm mvin" onClick={() => update((s) => moveIntoBlock(s, x.id, b.id, day, today))}>{t.moveInBtn}</button>
            </div>
          );
        }) : <div class="dhint" style={{ paddingTop: '12px' }}>{t.noMove}</div>}
      </div>

      <div class="lbl">{t.timeArea}</div>
      <div class="dgroup">
        <div class="drow">
          <span class="dicon" style={{ '--tile': a.color }}><AreaIcon name={a.icon} size={17} /></span>
          <span class="dlabel">{t.area}</span>
          <select class="dselect" aria-label={t.area} value={b.areaId} onChange={(e) => patch({ areaId: e.currentTarget.value })}>
            {state.areas.map((x) => <option value={x.id}>{nameOf(x.name, lang)}</option>)}
          </select>
        </div>
        <div class="drow">
          <span class="dicon" style={{ '--tile': '#5B7FA6' }}><Icon name="clock" /></span>
          <span class="dlabel">{t.startLbl}</span>
          <input type="time" class="tin num" value={b.start} aria-label={t.startLbl} onChange={(e) => setTime('start', e.currentTarget.value)} />
        </div>
        <div class="drow">
          <span class="dicon" style={{ '--tile': '#5B7FA6' }}><Icon name="clock" /></span>
          <span class="dlabel">{t.endLbl}</span>
          <input type="time" class="tin num" value={b.end} aria-label={t.endLbl} onChange={(e) => setTime('end', e.currentTarget.value)} />
        </div>
        <div class="lbl" style={{ margin: '10px 0 6px' }}>{t.daysLbl}</div>
        <div class="wdays">
          {Array.from({ length: DAYS_IN_WEEK }, (_, n) => n as Weekday).map((n) => (
            <button class={b.days.includes(n) ? 'on' : ''} aria-pressed={b.days.includes(n)} onClick={() => toggleDay(n)}>{dayName(n, lang)}</button>
          ))}
        </div>
      </div>
      <div class="dgroup">
        <button class="drow dbtn danger" onClick={() => { update((s) => removeBlock(s, b.id), { text: t.deleted, undo: true }); close(); }}>{t.delBlock}</button>
      </div>
    </>
  );
}
