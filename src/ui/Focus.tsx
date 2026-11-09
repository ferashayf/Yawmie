import { fmtTime } from '../i18n/format';
import { focusLeft, placeTasks } from '../logic/blocks';
import { useApp } from './app-context';
import { AreaIcon, Icon } from './Icon';
import { ItemRow } from './ItemRow';
import { findArea, nameOf } from './labels';

const MINUTES = 60;
const hm = (m: number) => `${Math.floor(m / MINUTES)}:${String(m % MINUTES).padStart(2, '0')}`;
const toMin = (t: string) => Number(t.slice(0, 2)) * MINUTES + Number(t.slice(3));
const ARC = 'M20 150 A130 130 0 0 1 280 150';

// Focus: always dark; the arc counts down; only this block's tasks (PRD K3).
export function Focus({ id }: { id: string }) {
  const { state, today, now, t, close } = useApp();
  const lang = state.settings.lang;
  const b = state.blocks.find((x) => x.id === id);
  if (!b) return null;
  const a = findArea(state.areas, b.areaId);
  const left = focusLeft(b, now);
  const total = toMin(b.end) - toMin(b.start);
  const frac = left.mode === 'until' ? 1 : total ? left.minutes / total : 0;
  const over = left.mode === 'left' && left.minutes === 0;
  const list = placeTasks(state, today, today, now).inBlock[b.id] ?? [];
  return (
    <div class="focus">
      <div class="fbar">
        <button class="pillbtn" onClick={close}><Icon name="xs" />{t.endFocus}</button>
        <span class="num">{t.untilT(fmtTime(b.end, lang))}</span>
      </div>
      <span class="fchip"><span class="ico" style={{ '--a': a.color }}><AreaIcon name={a.icon} size={14} /></span>{nameOf(a.name, lang)}</span>
      <div class="fgauge">
        <svg viewBox="0 0 300 160" aria-hidden="true">
          <path d={ARC} fill="none" stroke="#2A2A2A" stroke-width="16" stroke-linecap="round" />
          {frac > 0 && <path d={ARC} fill="none" stroke="#2BB59D" stroke-width="16" stroke-linecap="round" pathLength={100} stroke-dasharray={`${(frac * 100).toFixed(1)} 200`} />}
        </svg>
        <div class="fin num">
          <b>{over ? '0:00' : hm(left.minutes)}</b>
          <span>{left.mode === 'until' ? t.startsAt(fmtTime(b.start, lang)) : over ? t.blockOver : t.minLeft}</span>
        </div>
      </div>
      <div class="glass group">{list.length ? list.map((x) => <ItemRow key={x.id} it={x} />) : <div class="empty">{t.blockEmpty}</div>}</div>
      <p class="rest">{t.restWait}</p>
    </div>
  );
}
