import type { ComponentChildren } from 'preact';
import { fmtTime } from '../i18n/format';
import { isOverdue } from '../logic/today';
import type { Item } from '../model/types';
import { useApp } from './app-context';
import { Icon } from './Icon';
import { dueText, findArea, nameOf, repeatLabel } from './labels';

const Sep = () => <span class="sep" aria-hidden="true">·</span>;

// One task or appointment row: done control, title, meta line, ⓘ. Same look on Today, Plan and Tasks.
export function ItemRow({ it, extra, hideUrgent }: { it: Item; extra?: ComponentChildren; hideUrgent?: boolean }) {
  const { state, today, t, open, finish } = useApp();
  const lang = state.settings.lang;
  const a = findArea(state.areas, it.areaId);
  const late = isOverdue(it, today);
  const appt = it.kind === 'appointment';
  const meta: ComponentChildren[] = [];
  if (extra) meta.push(extra);
  if (it.dueDate) {
    const today0 = it.dueDate === today && !late;
    meta.push(
      <span class={`pill num${late ? ' late' : today0 ? ' today' : ''}`}>
        {dueText(it.dueDate, today, t, lang)}
        {!late && it.time && !appt ? ` ${fmtTime(it.time, lang)}` : ''}
      </span>,
    );
  }
  if (it.urgent && !hideUrgent) meta.push(<span class="pill urg">{t.urgentPill}</span>);
  meta.push(nameOf(a.name, lang));
  if (it.place) meta.push(it.place);
  if (it.recurrence) meta.push(<><Icon name="repeat" /> {repeatLabel(it.recurrence, t, lang)}</>);
  const hasIcons = it.alert !== 'none' || it.url || it.notes;
  if (hasIcons) {
    meta.push(
      <span class="meta-icons" aria-hidden="true">
        {it.alert !== 'none' && <Icon name="bell" />}
        {it.url && <Icon name="link" />}
        {it.notes && <Icon name="note" />}
      </span>,
    );
  }
  if (it.planDays.includes(today) && it.dueDate !== today) meta.push(<span class="pill plan">{t.plannedToday}</span>);

  return (
    <div class={`it${late ? ' late' : ''}${appt ? ' appt' : ''}`} style={{ '--c': a.color }}>
      <div class="it-head">
        <button class={`tick${appt ? ' appt' : ''}`} aria-label={`${t.done}: ${it.title}`} onClick={() => finish(it.id)}>
          <Icon name={appt ? 'cal' : 'check'} />
        </button>
        <div class="it-main" onClick={() => open({ kind: 'details', id: it.id })}>
          <div class="it-title">
            {appt && it.time && <b class="atime num">{fmtTime(it.time, lang)}</b>}
            {it.title}
          </div>
          <div class="it-meta">{meta.map((m, i) => (<>{i > 0 && <Sep />}{m}</>))}</div>
        </div>
        <button class="xbtn" aria-label={`${t.details}: ${it.title}`} onClick={() => open({ kind: 'details', id: it.id })}><Icon name="info" /></button>
      </div>
    </div>
  );
}
