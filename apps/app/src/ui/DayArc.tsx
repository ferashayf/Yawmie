import { fmtTime } from '../i18n/format';
import type { HM, Lang } from '../model/types';

// The signature shape: the day from 6:00 to midnight, the burgundy "now" dot, appointment dots (PRD T5).
const W = 330;
const Y0 = 78;
const SAG = 62;
const HALF = 150;
const NOW_EDGE = 0.08;
const DAY_START_H = 6;
const DAY_END_H = 24;
const MINUTES = 60;
const R = (HALF * HALF + SAG * SAG) / (2 * SAG);
const CX = W / 2;
const CY = Y0 - SAG + R;
const A0 = Math.atan2(Y0 - CY, -HALF);
const A1 = Math.atan2(Y0 - CY, HALF);

export function dayFraction(t: HM): number {
  const [h, m] = t.split(':').map(Number);
  return (h + m / MINUTES - DAY_START_H) / (DAY_END_H - DAY_START_H);
}

const clamp = (f: number) => Math.max(0, Math.min(1, f));

export function DayArc({ now, ticks, lang, label }: { now: HM; ticks: { at: HM; color: string }[]; lang: Lang; label: string }) {
  const rtl = lang === 'ar';
  const at = (f: number): [number, number] => {
    const a = A0 + (A1 - A0) * clamp(f);
    const x = CX + R * Math.cos(a);
    return [rtl ? W - x : x, CY + R * Math.sin(a)];
  };
  const out = (f: number, d: number): [number, number] => {
    const [x, y] = at(f);
    const k = Math.hypot(x - CX, y - CY);
    return [x + ((x - CX) / k) * d, y + ((y - CY) / k) * d];
  };
  const hour = (h: number) => new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', { hour: 'numeric' }).format(new Date(2000, 0, 1, h % 24));
  const path = `M${rtl ? W - 15 : 15} ${Y0} A${R.toFixed(1)} ${R.toFixed(1)} 0 0 ${rtl ? 0 : 1} ${rtl ? 15 : W - 15} ${Y0}`;
  const f = dayFraction(now);
  const nc = clamp(f);
  const [nx, ny] = at(nc);
  const atEdge = nc < NOW_EDGE || nc > 1 - NOW_EDGE;
  const [lx, ly] = atEdge ? [nx, ny - 20] : out(nc, 22);
  return (
    <svg class="dayarc" viewBox={`0 -18 ${W} 122`} role="img" aria-label={label}>
      <path d={path} fill="none" stroke="var(--track)" stroke-width="7" stroke-linecap="round" />
      {f > 0 && <path d={path} fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round" pathLength={100} stroke-dasharray={`${(nc * 100).toFixed(1)} 200`} />}
      {ticks.map((k) => {
        const [x, y] = at(dayFraction(k.at));
        return <circle cx={x} cy={y} r="6" fill={k.color} stroke="var(--bg1)" stroke-width="2.5" />;
      })}
      <circle cx={nx} cy={ny} r="13" fill="var(--accent2)" opacity=".2" />
      <circle cx={nx} cy={ny} r="7.5" fill="var(--accent2)" stroke="var(--bg1)" stroke-width="2.5" />
      <text class="arc-now num" x={lx} y={ly + 4} text-anchor="middle">{fmtTime(now, lang)}</text>
      {([[0, DAY_START_H], [1, DAY_END_H]] as const).map(([pos, h]) => (
        <text class="arc-lbl num" x={at(pos)[0]} y={Y0 + 20} text-anchor="middle">{hour(h)}</text>
      ))}
    </svg>
  );
}
