// Today and the current minute, kept fresh while the app is open (midnight, coming back to the app).
import { nowHM, todayOf } from '../logic/dates';
import type { HM, YMD } from '../model/types';

const TICK_MS = 5_000;

export interface Clock { today: YMD; now: HM }

export function startClock(onChange: (c: Clock) => void): () => void {
  let last = '';
  const check = () => {
    const d = new Date();
    const c = { today: todayOf(d), now: nowHM(d) };
    const key = `${c.today} ${c.now}`;
    if (key === last) return;
    last = key;
    onChange(c);
  };
  check();
  const timer = setInterval(check, TICK_MS);
  const onVisible = () => document.visibilityState === 'visible' && check();
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);
  return () => {
    clearInterval(timer);
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
  };
}
