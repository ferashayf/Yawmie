import { describe, expect, it } from 'vitest';
import type { Draft } from '../model/types';
import { parseAll, parseOne } from './parser';

const TODAY = '2026-11-09'; // Monday

// Made-up text only. Moved from design/tests/parser.cases.js.
const CASES: { text: string; want: Partial<Draft> }[] = [
  { text: 'اجتماع مع المصمم بكرة 4', want: { kind: 'appointment', time: '16:00', title: 'اجتماع مع المصمم', date: '2026-11-10' } },
  { text: 'موعد الأسنان 5 العصر', want: { time: '17:00' } },
  { text: 'اجتماع 9 الصبح', want: { time: '09:00' } },
  { text: 'مكالمة 12 الظهر', want: { time: '12:00' } },
  { text: 'مكالمة 2 الظهر', want: { time: '14:00' } },
  { text: 'قهوة مع صديق 8 الليل', want: { time: '20:00' } },
  { text: 'موعد 12 الليل', want: { time: '00:00' } },
  { text: 'اجتماع الخميس 10', want: { time: '10:00', date: '2026-11-12' } },
  { text: 'meeting tomorrow 4', want: { time: '16:00' } },
  // amounts must stay amounts
  { text: 'صرفت 45 ريال قهوة', want: { kind: 'expense', time: '', amountHalalas: 4500, categoryId: 'food' } },
  { text: 'بكرة صرفت 30 ريال', want: { kind: 'expense', time: '' } },
  { text: 'فاتورة الكهرباء 300 يوم 27', want: { kind: 'bill', time: '', amountHalalas: 30000, date: '2026-11-27', categoryId: 'home' } },
  // older formats
  { text: 'meeting tomorrow 4pm', want: { time: '16:00' } },
  { text: 'اجتماع الساعة 4', want: { time: '16:00' } },
  { text: 'call 10:30', want: { time: '10:30' } },
];

describe('parser', () => {
  it.each(CASES)('$text', ({ text, want }) => {
    expect(parseOne(text, TODAY)).toMatchObject(want);
  });

  it('«غدا» does not match inside «غداء»', () => {
    expect(parseOne('غداء مع صديق', TODAY).date).toBe('');
  });

  it('Arabic digits: ٣٠٠ ريال is 300 SAR', () => {
    expect(parseOne('صرفت ٣٠٠ ريال بنزين', TODAY)).toMatchObject({ kind: 'expense', amountHalalas: 30000, categoryId: 'car' });
  });

  it('several lines become several drafts', () => {
    expect(parseAll('meeting tomorrow 11:00\nspent 45 SAR coffee', TODAY).map((d) => d.kind)).toEqual(['appointment', 'expense']);
  });

  it('an undated, non-urgent task becomes a to-do', () => {
    expect(parseOne('update the project page', TODAY)).toMatchObject({ kind: 'todo', date: '', areaId: 'project' });
  });

  it('urgent undated task is due today', () => {
    expect(parseOne('update the project page urgent', TODAY)).toMatchObject({ kind: 'task', date: TODAY, urgent: true });
  });

  it('bill on the 31st in November lands on the 30th', () => {
    expect(parseOne('فاتورة الإنترنت 300 يوم 31', TODAY).date).toBe('2026-11-30');
  });

  it('repeat words make a recurrence', () => {
    expect(parseOne('study chapter three every day', TODAY)).toMatchObject({ kind: 'task', areaId: 'study', recurrence: { freq: 'day', every: 1, start: TODAY } });
  });

  it('defaultDate fills undated items (Plan → a picked day)', () => {
    expect(parseOne('call the bank', TODAY, '2026-11-14')).toMatchObject({ kind: 'appointment', date: '2026-11-14' });
  });
});
