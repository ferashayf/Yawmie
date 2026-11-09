import { describe, expect, it } from 'vitest';
import { emptyState } from '../model/empty';
import type { AppState, Block, Item } from '../model/types';
import { appointmentsInBlock, blocksOn, blockStatus, focusLeft, placeTasks } from './blocks';
import { removeArea, removeBlock, removeCategory } from './edits';

const TODAY = '2026-11-09'; // Monday = 1
const work: Block = { id: 'b1', areaId: 'work', start: '09:00', end: '13:00', days: [0, 1, 2, 3, 4] };
const study: Block = { id: 'b2', areaId: 'study', start: '21:00', end: '22:00', days: [5] };

let n = 0;
const item = (over: Partial<Item>): Item => ({ id: `i${++n}`, kind: 'task', title: 't', areaId: 'work', urgent: false, alert: 'none', planDays: [], status: 'open', dueDate: TODAY, ...over });
const stateWith = (items: Item[]): AppState => ({ ...emptyState(), blocks: [study, work], items });

describe('blocks', () => {
  it('blocksOn lists the day blocks by start time', () => {
    expect(blocksOn(stateWith([]), TODAY).map((b) => b.id)).toEqual(['b1']);
  });

  it('blockStatus', () => {
    expect(blockStatus(work, '08:59')).toBe('upcoming');
    expect(blockStatus(work, '09:00')).toBe('live');
    expect(blockStatus(work, '13:00')).toBe('ended');
  });

  it('a task with blockId sits in the block until it ends', () => {
    const t = item({ blockId: 'b1' });
    const p = placeTasks(stateWith([t]), TODAY, TODAY, '10:00');
    expect(p.inBlock.b1.map((x) => x.id)).toEqual([t.id]);
    expect(p.anytime).toEqual([]);
  });

  it('after the block ends it is in Anytime with backFrom = the area', () => {
    const t = item({ blockId: 'b1' });
    expect(placeTasks(stateWith([t]), TODAY, TODAY, '13:30').anytime).toEqual([{ item: t, backFrom: 'work' }]);
  });

  it('block not running that weekday → Anytime, no tag', () => {
    const t = item({ blockId: 'b2' });
    expect(placeTasks(stateWith([t]), TODAY, TODAY, '21:30').anytime).toEqual([{ item: t }]);
  });

  it('appointment inside block time and area sits in the block', () => {
    const inside = item({ kind: 'appointment', time: '10:30' });
    const outside = item({ kind: 'appointment', time: '14:00' });
    const other = item({ kind: 'appointment', time: '10:30', areaId: 'personal' });
    expect(appointmentsInBlock(stateWith([inside, outside, other]), work, TODAY).map((x) => x.id)).toEqual([inside.id]);
  });

  it('focusLeft counts down, or waits for the start', () => {
    expect(focusLeft(work, '10:45')).toEqual({ mode: 'left', minutes: 135 });
    expect(focusLeft(work, '08:00')).toEqual({ mode: 'until', minutes: 60 });
  });
});

describe('delete rules', () => {
  it('removeBlock clears blockId on its tasks', () => {
    const t = item({ blockId: 'b1' });
    const s = removeBlock(stateWith([t]), 'b1');
    expect(s.blocks.map((b) => b.id)).toEqual(['b2']);
    expect(s.items[0].blockId).toBeUndefined();
  });

  it('removeArea moves its items and blocks to the first remaining area', () => {
    const t = item({ areaId: 'work' });
    const s = removeArea(stateWith([t]), 'work');
    expect(s.areas.map((a) => a.id)).not.toContain('work');
    expect(s.items[0].areaId).toBe('project');
    expect(s.blocks.find((b) => b.id === 'b1')?.areaId).toBe('project');
  });

  it('the last area or category cannot be removed', () => {
    const one = { ...stateWith([]), areas: [emptyState().areas[0]], categories: [emptyState().categories[0]] };
    expect(removeArea(one, 'work')).toBe(one);
    expect(removeCategory(one, 'food')).toBe(one);
  });

  it('removeCategory moves expenses and bills, and drops its budget', () => {
    const s0: AppState = {
      ...emptyState(),
      expenses: [{ id: 'e1', date: TODAY, amountHalalas: 500, categoryId: 'car' }],
      bills: [{ id: 'bl1', name: 'b', amountHalalas: 100, dueDay: 1, categoryId: 'car', paid: {}, skipped: {} }],
      budgets: [{ id: 'g1', categoryId: 'car', limitHalalas: 1000, topUps: {} }, { id: 'g0', categoryId: null, limitHalalas: 9000, topUps: {} }],
    };
    const s = removeCategory(s0, 'car');
    expect(s.expenses[0].categoryId).toBe('food');
    expect(s.bills[0].categoryId).toBe('food');
    expect(s.budgets.map((b) => b.id)).toEqual(['g0']);
  });
});
