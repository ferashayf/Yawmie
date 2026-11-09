// Time blocks: repeating time slots for one area (PRD K1–K3).
import type { Block, HM } from '../model/types';

export function blockStatus(b: Block, now: HM): 'upcoming' | 'live' | 'ended' {
  if (now < b.start) return 'upcoming';
  return now < b.end ? 'live' : 'ended';
}
