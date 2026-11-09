import { useState } from 'preact/hooks';
import type { Item } from '../../model/types';
import { useApp } from '../app-context';
import { Icon } from '../Icon';
import { ItemRow } from '../ItemRow';
import { Header } from '../TopBar';

const byDue = (a: Item, b: Item) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') || (a.time ?? '99').localeCompare(b.time ?? '99');

// Tasks: upcoming appointments, Urgent / Everything else, Done today with restore (PRD L1–L7).
export function Tasks() {
  const { state, today, t, open, update } = useApp();
  const [tab, setTab] = useState<'urgent' | 'normal'>('urgent');
  const [showDone, setShowDone] = useState(false);
  const openItems = state.items.filter((x) => x.status === 'open');
  const appts = openItems.filter((x) => x.kind === 'appointment').sort(byDue);
  const tasks = openItems.filter((x) => x.kind !== 'appointment').sort(byDue);
  const urgent = tasks.filter((x) => x.urgent);
  const normal = tasks.filter((x) => !x.urgent);
  const shown = tab === 'urgent' ? urgent : normal;
  const noTasks = !state.items.some((x) => x.kind !== 'appointment');
  const done = state.items.filter((x) => x.status === 'done' && x.doneAt === today);
  const restore = (id: string) => update((s) => ({ ...s, items: s.items.map((x) => (x.id === id ? { ...x, status: 'open', doneAt: undefined } : x)) }), { text: t.restored });

  return (
    <>
      <Header title={t.tasksH} sub={t.everything} start={<button class="addbtn tadd" onClick={() => open({ kind: 'add', text: '' })}><Icon name="plusSm" />{t.addBtn}</button>} />
      {appts.length > 0 && (
        <section class="section">
          <h3><span>{t.meetings}</span><span class="count num">{appts.length}</span></h3>
          <div class="glass group">{appts.map((x) => <ItemRow key={x.id} it={x} />)}</div>
        </section>
      )}
      <section class="section">
        <h3><span>{t.tasksH}</span></h3>
        {noTasks ? (
          <div class="glass empty-card"><span class="eico"><Icon name="today" /></span><b>{t.noTasksT}</b><p>{t.noTasksP}</p></div>
        ) : (
          <>
            <div class="glass filters tasktabs" role="tablist">
              <button role="tab" class={`urg${tab === 'urgent' ? ' on' : ''}`} aria-selected={tab === 'urgent'} onClick={() => setTab('urgent')}><Icon name="flag" />{t.urgentTasks}<sup class="num">{urgent.length}</sup></button>
              <button role="tab" class={tab === 'normal' ? 'on' : ''} aria-selected={tab === 'normal'} onClick={() => setTab('normal')}>{t.tasksTab}<sup class="num">{normal.length}</sup></button>
            </div>
            {shown.length ? (
              <div class={tab === 'urgent' ? 'ublock' : 'glass group'}>{shown.map((x) => <ItemRow key={x.id} it={x} hideUrgent={tab === 'urgent'} />)}</div>
            ) : <div class="glass empty">{t.nothing}</div>}
          </>
        )}
      </section>
      {done.length > 0 && (
        <section class="section">
          <h3><span>{t.doneToday} <span class="count num">{done.length}</span></span><button class="count" onClick={() => setShowDone(!showDone)}>{showDone ? t.hide : t.show}</button></h3>
          {showDone && (
            <div class="glass">{done.map((x) => <div class="done-row" key={x.id}><s>{x.title}</s><button class="btn sm" onClick={() => restore(x.id)}>{t.restore}</button></div>)}</div>
          )}
        </section>
      )}
    </>
  );
}
