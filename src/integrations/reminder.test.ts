import { describe, expect, it } from 'vitest';
import type { Bill, Item } from '../model/types';
import { billReminder, itemReminder, reminderLink } from './reminder';

const TODAY = '2026-11-09';
const item = (over: Partial<Item>): Item => ({ id: 'i', kind: 'task', title: 'Call', areaId: 'work', urgent: false, alert: '0', planDays: [], status: 'open', dueDate: '2026-11-10', time: '16:00', ...over });
const decode = (link: string) => JSON.parse(decodeURIComponent(link.split('&text=')[1]));

describe('reminderLink', () => {
  it('opens the Yawmie Reminder shortcut with {title, when}', () => {
    const link = reminderLink({ title: 'Call', date: '2026-11-10', time: '16:00' });
    expect(link.startsWith('shortcuts://run-shortcut?name=Yawmie%20Reminder&input=text&text=')).toBe(true);
    expect(decode(link)).toEqual({ title: 'Call', when: '2026-11-10 16:00' });
  });

  it('encodes an Arabic title', () => {
    const link = reminderLink({ title: 'موعد الأسنان', date: '2026-11-10', time: '17:00' });
    expect(link).not.toContain('موعد');
    expect(decode(link).title).toBe('موعد الأسنان');
  });

  it('no time → 09:00', () => {
    expect(decode(reminderLink({ title: 'x', date: '2026-11-10', time: '' })).when).toBe('2026-11-10 09:00');
  });

  it('a title over 200 characters is cut', () => {
    expect(decode(reminderLink({ title: 'a'.repeat(300), date: '2026-11-10', time: '' })).title).toHaveLength(200);
  });
});

describe('itemReminder', () => {
  it('moves the time earlier by the alert', () => {
    expect(itemReminder(item({ alert: '30' }), TODAY)).toEqual({ title: 'Call', date: '2026-11-10', time: '15:30' });
  });

  it('a day before crosses to the previous date', () => {
    expect(itemReminder(item({ alert: '1440' }), TODAY)).toEqual({ title: 'Call', date: '2026-11-09', time: '16:00' });
  });

  it('crossing midnight goes to the previous day', () => {
    expect(itemReminder(item({ time: '00:10', alert: '15' }), TODAY)).toEqual({ title: 'Call', date: '2026-11-09', time: '23:55' });
  });

  it('a recurring item that is overdue sends its next date', () => {
    expect(itemReminder(item({ dueDate: '2026-11-02', recurrence: { freq: 'week', every: 1, days: [1], start: '2026-11-02' } }), TODAY)?.date).toBe('2026-11-09');
  });

  it('no alert or no date → nothing', () => {
    expect(itemReminder(item({ alert: 'none' }), TODAY)).toBeNull();
    expect(itemReminder(item({ dueDate: undefined }), TODAY)).toBeNull();
  });
});

describe('billReminder', () => {
  const bill: Bill = { id: 'b', name: 'Internet', amountHalalas: 30000, dueDay: 31, categoryId: 'home', paid: {}, skipped: {} };
  it('this month when still ahead (31st → 30th in November)', () => {
    expect(billReminder(bill, TODAY)).toEqual({ title: 'Internet', date: '2026-11-30', time: '' });
  });
  it('next month when this month’s due day has passed', () => {
    expect(billReminder({ ...bill, dueDay: 3 }, TODAY).date).toBe('2026-12-03');
  });
});
