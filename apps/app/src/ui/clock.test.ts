import { afterEach, describe, expect, it, vi } from 'vitest';
import { startClock } from './clock';

afterEach(() => vi.useRealTimers());

describe('clock', () => {
  it('today rolls over at midnight without a reload', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 9, 23, 59, 30));
    const seen: string[] = [];
    const stop = startClock((c) => seen.push(`${c.today} ${c.now}`));
    vi.advanceTimersByTime(60_000);
    stop();
    expect(seen[0]).toBe('2026-11-09 23:59');
    expect(seen.at(-1)).toBe('2026-11-10 00:00');
  });

  it('only reports when the minute changes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 9, 10, 0, 0));
    const seen: string[] = [];
    const stop = startClock((c) => seen.push(c.now));
    vi.advanceTimersByTime(45_000);
    stop();
    expect(seen).toEqual(['10:00']);
  });
});
