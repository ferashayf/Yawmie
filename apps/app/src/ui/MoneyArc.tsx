import { useId } from 'preact/hooks';
import type { Lang } from '../model/types';

// The half-circle arc used for the budget and bills (same shape as Your day).
const W = 340;
const CX = 170;
const CY = 172;
const R = 150;
const MIN_VISIBLE = 0.002;

export function MoneyArc({ t, color, sun, label, lang }: { t: number; color: string; sun?: boolean; label: string; lang: Lang }) {
  const id = `g${useId()}`;
  const rtl = lang === 'ar';
  const pt = (f: number): [number, number] => {
    const a = rtl ? Math.PI * f : Math.PI * (1 - f);
    return [CX + R * Math.cos(a), CY - R * Math.sin(a)];
  };
  const f = Math.max(0, Math.min(1, t));
  const [s, e, p] = [pt(0), pt(1), pt(f)];
  const sweep = rtl ? 0 : 1;
  return (
    <svg viewBox={`0 -14 ${W} ${CY + 24}`} role="img" aria-label={label}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={s[0]} y1="0" x2={e[0]} y2="0">
          <stop offset="0" stop-color="var(--silver)" /><stop offset="1" stop-color={color} />
        </linearGradient>
      </defs>
      <path d={`M${s[0]} ${s[1]} A${R} ${R} 0 0 ${sweep} ${e[0]} ${e[1]}`} fill="none" stroke="var(--track)" stroke-width="12" stroke-linecap="round" />
      {f > MIN_VISIBLE && (
        <path class="arc-prog" style={{ '--len': (Math.PI * R * f).toFixed(1) }} d={`M${s[0]} ${s[1]} A${R} ${R} 0 0 ${sweep} ${p[0]} ${p[1]}`} fill="none" stroke={`url(#${id})`} stroke-width="12" stroke-linecap="round" />
      )}
      {sun && <circle class="arc-sun" cx={p[0]} cy={p[1]} r="10" fill={color} stroke="var(--bg1)" stroke-width="3" />}
    </svg>
  );
}
