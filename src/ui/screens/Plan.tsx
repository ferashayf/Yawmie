import type { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { fmtDate, fmtTime } from '../../i18n/format';
import { appointmentsInBlock, blocksOn, blockStatus, placeTasks } from '../../logic/blocks';
import { addDays, weekday, weekOf } from '../../logic/dates';
import { newId } from '../../model/empty';
import type { Block, Item, Weekday } from '../../model/types';
import { useApp } from '../app-context';
import { AreaEditor } from '../AreaEditor';
import { AreaIcon, Icon } from '../Icon';
import { ItemRow } from '../ItemRow';
import { dayName, findArea, nameOf } from '../labels';
import { Header } from '../TopBar';

const LATEST_START_H = 22;
const DEFAULT_START_H = 9;
const DAYS_IN_WEEK = 7;
const MAX_DOTS = 3;

export function Plan() {
  const { state, today, now, t, plan, setPlan, open, update } = useApp();
  const lang = state.settings.lang;
  const day = plan.day || today;
  const af = plan.area;
  const inArea = (it: Item) => af === 'all' || (af === 'urgent' ? it.urgent : it.areaId === af);
  const openItems = state.items.filter((it) => it.status === 'open' && inArea(it));
  const placed = placeTasks(state, day, today, now);
  const appts = openItems.filter((it) => it.kind === 'appointment' && it.dueDate === day);
  const blocks = blocksOn(state, day).filter((b) => af === 'all' || af === 'urgent' || b.areaId === af);
  const used = new Set<string>();
  const entries: { t: string; node?: ComponentChildren; now?: boolean }[] = [];

  for (const b of blocks) {
    const inside = (placed.inBlock[b.id] ?? []).filter(inArea);
    const bAppts = appointmentsInBlock(state, b, day).filter(inArea);
    if (af === 'urgent' && !inside.length) continue;
    [...inside, ...bAppts].forEach((x) => used.add(x.id));
    entries.push({ t: b.start, node: blockCard(b, [...bAppts, ...inside].sort((x, y) => (x.time ?? '99').localeCompare(y.time ?? '99'))) });
  }
  for (const a of appts.filter((x) => !used.has(x.id))) entries.push({ t: a.time ?? '00:00', node: <div class="glass group tl-appt"><ItemRow it={a} /></div> });
  if (day === today) entries.push({ t: now, now: true });
  entries.sort((a, b) => a.t.localeCompare(b.t) || (a.now ? -1 : 1));
  const anytime = placed.anytime.filter((x) => inArea(x.item) && !used.has(x.item.id));
  const hasContent = entries.some((e) => !e.now) || anytime.length > 0;

  const addBlock = () => {
    const h = day === today ? Math.min(Number(now.slice(0, 2)) + 1, LATEST_START_H) : DEFAULT_START_H;
    const pad = (n: number) => String(n).padStart(2, '0');
    const b: Block = { id: newId(), areaId: af !== 'all' && af !== 'urgent' ? af : state.areas[0].id, start: `${pad(h)}:00`, end: `${pad(h + 1)}:00`, days: [weekday(day)] };
    update((s) => ({ ...s, blocks: [...s.blocks, b] }));
    open({ kind: 'block', id: b.id, date: day });
  };

  return (
    <>
      <Header title={t.plan} sub={fmtDate(day, lang, { weekday: 'long', day: 'numeric', month: 'long' })}
        start={<button class="addbtn tadd" onClick={() => open({ kind: 'add', text: '', date: day })}><Icon name="plusSm" />{t.addBtn}</button>} />
      <section class="section plan">
        {day !== today && <div class="backrow"><button class="count" onClick={() => setPlan({ day: today, week: 0 })}>{t.backToday}</button></div>}
        {WeekStrip()}
        {AreaChips()}
        <div class="tl">
          {entries.map((e) =>
            e.now ? (hasContent && <div class="slot now"><span class="tm num">{fmtTime(e.t, lang)}</span><span class="nowline" aria-label={t.nowLbl} /></div>)
              : <div class="slot"><span class="tm num">{fmtTime(e.t, lang)}</span>{e.node}</div>,
          )}
          {anytime.length > 0 && (
            <div class="slot">
              <span class="tm">{t.anytime}</span>
              <div class="glass group anyt">
                {anytime.map(({ item, backFrom }) => (
                  <ItemRow key={item.id} it={item} extra={backFrom && <span class="pill back"><Icon name="ret" />{t.backFrom(nameOf(findArea(state.areas, backFrom).name, lang))}</span>} />
                ))}
              </div>
            </div>
          )}
          {!hasContent && <div class="glass empty">{t.dayEmpty}</div>}
          <div class="slot"><span /><button class="add-row" onClick={addBlock}><Icon name="plusSm" />{t.addBlock}</button></div>
        </div>
      </section>
    </>
  );

  function blockCard(b: Block, list: Item[]) {
    const a = findArea(state.areas, b.areaId);
    const status = day < today ? 'ended' : day > today ? 'upcoming' : blockStatus(b, now);
    const tasks = list.filter((x) => x.kind === 'task').length;
    return (
      <div class={`blk${status === 'ended' ? ' past' : ''}${status === 'live' ? ' live' : ''}`} style={{ '--a': a.color }}>
        <button class="bh" onClick={() => open({ kind: 'block', id: b.id, date: day })}>
          <span class="ico"><AreaIcon name={a.icon} size={17} /></span>
          <span class="bt"><b>{nameOf(a.name, lang)}</b><small class="num">{fmtTime(b.start, lang)} – {fmtTime(b.end, lang)}{b.days.length < DAYS_IN_WEEK ? ` · ${daysLabel(b.days)}` : ''}</small></span>
          <span class="bs">{status === 'live' ? t.nowLbl : status === 'ended' ? t.blockEnded : t.tasksN(tasks)}</span>
          <Icon name="chev" />
        </button>
        {list.length ? list.map((x) => <ItemRow key={x.id} it={x} />) : status !== 'ended' && <button class="bempty" onClick={() => open({ kind: 'block', id: b.id, date: day })}>{t.blockEmpty}</button>}
      </div>
    );
  }

  function daysLabel(days: Weekday[]): string {
    const d = [...days].sort();
    if (d.length === DAYS_IN_WEEK) return t.reps.daily;
    const run = d.every((x, i) => i === 0 || x === d[i - 1] + 1);
    return run && d.length > 2 ? `${dayName(d[0], lang)} – ${dayName(d[d.length - 1], lang)}` : d.map((x) => dayName(x, lang)).join(lang === 'ar' ? '، ' : ', ');
  }

  function WeekStrip() {
    const days = weekOf(addDays(today, plan.week * DAYS_IN_WEEK));
    const open0 = state.items.filter((it) => it.status === 'open' && inArea(it));
    return (
      <div class="glass week">
        <button class="nav" aria-label="Previous week" onClick={() => setPlan({ week: plan.week - 1 })}><Icon name="chevBack" /></button>
        {days.map((d) => (
          <button key={d} class={`wd${d === today ? ' today' : ''}${d === day ? ' on' : ''}`} aria-pressed={d === day} onClick={() => setPlan({ day: d })}>
            <small>{fmtDate(d, lang, { weekday: 'short' })}</small>
            <b class="num">{Number(d.slice(8))}</b>
            <span class="dots">
              {open0.filter((x) => x.dueDate === d || x.planDays.includes(d)).slice(0, MAX_DOTS).map((x) => <i style={{ '--c': findArea(state.areas, x.areaId).color }} />)}
            </span>
          </button>
        ))}
        <button class="nav" aria-label="Next week" onClick={() => setPlan({ week: plan.week + 1 })}><Icon name="chev" /></button>
      </div>
    );
  }

  function AreaChips() {
    const row = useRef<HTMLDivElement>(null);
    const open0 = state.items.filter((it) => it.status === 'open');
    const count = (id: string) => open0.filter((x) => id === 'all' || (id === 'urgent' ? x.urgent : x.areaId === id)).length;
    const scroll = (n: number) => {
      const el = row.current;
      if (!el) return;
      const rtl = getComputedStyle(el).direction === 'rtl';
      el.scrollBy({ left: n * (rtl ? -1 : 1) * el.clientWidth * 0.7, behavior: 'smooth' });
    };
    const chips = [{ id: 'all', label: t.all }, { id: 'urgent', label: t.urgentChip, flag: true }, ...state.areas.map((a) => ({ id: a.id, label: nameOf(a.name, lang), color: a.color }))];
    return (
      <>
        <div class="arearow">
          <span>{t.areas}</span>
          <span class="h-acts">
            <button class="fx" aria-label={t.addCat} title={t.addCat} onClick={() => open({ kind: 'area' })}><Icon name="plusSm" /></button>
            <button class={`fx${plan.editing ? ' on' : ''}`} aria-label={t.edit} title={t.edit} onClick={() => setPlan({ editing: !plan.editing })}><Icon name="pencil" /></button>
          </span>
        </div>
        <div class="fwrap">
          <button class="round glass farrow" aria-label={t.chipsBack} onClick={() => scroll(-1)}><Icon name="chevBack" /></button>
          <div class="glass filters" role="tablist" ref={row}>
            {chips.map((c) => (
              <button key={c.id} role="tab" class={af === c.id ? 'on' : ''} aria-selected={af === c.id} onClick={() => setPlan({ area: c.id })}>
                {'flag' in c ? <span class="uflag"><Icon name="flag" /></span> : 'color' in c ? <span class="dot" style={{ '--c': c.color }} /> : null}
                {c.label}<sup class="num">{count(c.id)}</sup>
              </button>
            ))}
          </div>
          <button class="round glass farrow" aria-label={t.chipsNext} onClick={() => scroll(1)}><Icon name="chev" /></button>
        </div>
        {plan.editing && <AreaEditor onDone={() => setPlan({ editing: false })} />}
      </>
    );
  }
}
