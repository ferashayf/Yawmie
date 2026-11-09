import { useEffect, useState } from 'preact/hooks';
import { useApp, type Tab } from './app-context';

// One tip at a time on the real screens; a tip whose spot isn't there is skipped (PRD U2).
const TOUR: [Tab, string][] = [
  ['today', '.herowrap .hero'], ['today', '.quick'], ['today', '.dayband .band'], ['today', '#buddy .buddy'],
  ['plan', '.week'], ['plan', '.plan .blk, .plan .add-row'], ['tasks', '.ublock .it, .screen .group .it, .screen .empty-card'],
  ['money', '.gauge, .screen .empty-card'], ['money', '.mseg'], ['money', '.addpair'], ['today', '.top-btns button:last-child'],
];
const PAD = 6;
const GAP = 14;
const CARD_ROOM = 190;
const SETTLE_MS = 60;

export const TOUR_LENGTH = TOUR.length;

// "Quick tour? 11 short tips" with Show me / Skip.
export function TourAsk({ onGo, onSkip }: { onGo: () => void; onSkip: () => void }) {
  const { t } = useApp();
  return (
    <div id="tip">
      <div class="tipdim" />
      <div class="tipcard ask" role="dialog">
        <b>{t.tourAskT}</b><p class="num">{t.tourAskP(TOUR.length)}</p>
        <div class="tipf"><button onClick={onSkip}>{t.tipSkip}</button><button class="nx" onClick={onGo}>{t.tourGo}</button></div>
      </div>
    </div>
  );
}

export function Tour({ n, setN }: { n: number; setN: (n: number) => void }) {
  const { t, go } = useApp();
  const [spot, setSpot] = useState<{ top: number; left: number; width: number; height: number; phoneH: number } | null>(null);
  const [tab, selector] = TOUR[n - 1];

  useEffect(() => {
    setSpot(null);
    go(tab);
    // After the tab has switched (a timer, not a frame: frames pause in background tabs).
    const timer = setTimeout(() => {
      const target = document.querySelector(selector);
      const phone = document.querySelector('.phone');
      if (!target || !phone) return setN(n + 1 > TOUR.length ? 0 : n + 1);
      target.scrollIntoView({ block: 'center' });
      const p = phone.getBoundingClientRect();
      const r = target.getBoundingClientRect();
      setSpot({ top: r.top - p.top - PAD, left: r.left - p.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2, phoneH: p.height });
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [n]);

  if (!spot) return null;
  const below = spot.top + spot.height + GAP;
  const fitsBelow = below + CARD_ROOM < spot.phoneH;
  const [title, text] = (t.tips as [string, string][])[n - 1];
  return (
    <div id="tip">
      <div class="spot" style={{ top: `${spot.top}px`, left: `${spot.left}px`, width: `${spot.width}px`, height: `${spot.height}px` }} />
      <div class="tipcard" role="dialog" style={fitsBelow ? { top: `${below}px` } : { bottom: `${spot.phoneH - spot.top + GAP}px` }}>
        <b>{title}</b><p>{text}</p>
        <div class="tipf">
          <button onClick={() => setN(0)}>{t.stepOf(n, TOUR.length)} · {t.tipSkip}</button>
          <button class="nx" onClick={() => setN(n >= TOUR.length ? 0 : n + 1)}>{n >= TOUR.length ? t.doneTips : t.nextBtn}</button>
        </div>
      </div>
    </div>
  );
}
