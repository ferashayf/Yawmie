// The sentence reader: one sentence → a draft to confirm (PRD A1–A3). Offline, rule-based.
import type { Draft, YMD } from '../model/types';
import { addDays, daysInMonth, monthOf, weekday } from './dates';
import { firstKey, isLetter, KW, WEEKDAY_WORDS, westernDigits } from './keywords';
import { PRESETS, type Preset } from './recurrence';

const NOON = 12;
const AFTERNOON_BELOW = 8; // 1–7 without am/pm almost always means afternoon
const DAYS_IN_WEEK = 7;
const HALALAS = 100;

const AR_MORNING = /^(الصبح|الصباح|صباحاً|صباحا|الفجر)$/;
const AR_NOON = /^(الظهر|الضهر)$/;
const MONEY_WORDS = /(ريال|ر\.?\s?س|sar|\bsr\b|صرفت|دفعت|اشتريت|شريت|spent|paid|bought|فاتورة|فاتوره|bill)/i;
const DAY_THEN_HOUR = /(بعد بكرة|بعد بكره|بكرة|بكره|اليوم|الأحد|الاحد|الإثنين|الاثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|السبت|tomorrow|today)\s+(\d{1,2})(?![\d:.,٫])/i;
const AR_DAY_PART = /(\d{1,2})\s*(الصبح|الصباح|صباحاً|صباحا|الفجر|الظهر|الضهر|العصر|المغرب|العشاء|العشا|الليل|بالليل|المساء|مساءً|مساء)/;

const pad = (n: number) => String(n).padStart(2, '0');
const afternoon = (h: number) => (h < AFTERNOON_BELOW ? h + NOON : h);

// Morning keeps the hour; noon/afternoon/evening/night move it to PM; «12 الليل» is midnight.
function arabicHour(h: number, word: string): number {
  if (AR_MORNING.test(word)) return h % NOON;
  if (AR_NOON.test(word)) return h === NOON || h > 4 ? h : h + NOON;
  if (h === NOON) return /الليل/.test(word) ? 0 : NOON;
  return (h % NOON) + NOON;
}

// The sentence being read; matched parts are cut out so what's left is the title.
class Reader {
  rest: string;
  constructor(text: string) {
    this.rest = text;
  }
  get low() {
    return this.rest.toLowerCase();
  }
  take(re: RegExp): RegExpMatchArray | null {
    const m = this.rest.match(re);
    if (m) this.rest = this.rest.replace(m[0], ' ');
    return m;
  }
  takeWord(words: readonly string[]): boolean {
    for (const w of words) {
      const low = this.low;
      for (let at = low.indexOf(w); at >= 0; at = low.indexOf(w, at + 1)) {
        if (!isLetter(low.charAt(at - 1)) && !isLetter(low.charAt(at + w.length))) {
          this.rest = `${this.rest.slice(0, at)} ${this.rest.slice(at + w.length)}`;
          return true;
        }
      }
    }
    return false;
  }
}

function readTime(r: Reader, original: string): string {
  let m = r.take(/\b(\d{1,2})[:.](\d{2})\b/);
  if (m) return `${pad(afternoon(+m[1]))}:${m[2]}`;
  if ((m = r.take(/\b(\d{1,2})\s*(am|pm)\b/i))) return `${pad((+m[1] % NOON) + (m[2].toLowerCase() === 'pm' ? NOON : 0))}:00`;
  if ((m = r.take(/(?:at|الساعة|الساعه)\s*(\d{1,2})\b/i))) return `${pad(afternoon(+m[1]))}:00`;
  if ((m = r.take(AR_DAY_PART))) return `${pad(arabicHour(+m[1], m[2]))}:00`;
  // «بكرة 4», "tomorrow 4": a small number right after a day word is an hour, never in money sentences.
  if (!MONEY_WORDS.test(original) && (m = r.rest.match(DAY_THEN_HOUR)) && +m[2] >= 1 && +m[2] <= NOON) {
    r.rest = r.rest.replace(m[0], `${m[1]} `);
    return `${pad(afternoon(+m[2]))}:00`;
  }
  return '';
}

function readDate(r: Reader, today: YMD): YMD | '' {
  if (r.takeWord(['after tomorrow', 'بعد بكرة', 'بعد بكره'])) return addDays(today, 2);
  if (r.takeWord(['tomorrow', 'بكرة', 'بكره', 'غداً', 'غدا'])) return addDays(today, 1);
  if (r.takeWord(['today', 'اليوم'])) return today;
  if (r.takeWord(['next week', 'الأسبوع الجاي', 'الاسبوع الجاي', 'الأسبوع القادم'])) return addDays(today, DAYS_IN_WEEK);
  return '';
}

function readRepeat(r: Reader): Preset | '' {
  if (r.takeWord(['weekdays', 'every weekday', 'أيام الدوام', 'ايام الدوام'])) return 'workdays';
  for (const p of ['daily', 'weekly', 'monthly', 'yearly'] as const) if (r.takeWord(KW.repeat[p])) return p;
  return '';
}

function readWeekday(r: Reader, today: YMD): YMD | '' {
  const todayDow = weekday(today);
  for (let w = 0; w < DAYS_IN_WEEK; w++) {
    if (r.takeWord(WEEKDAY_WORDS[w])) return addDays(today, (w - todayDow + DAYS_IN_WEEK) % DAYS_IN_WEEK || DAYS_IN_WEEK);
  }
  return '';
}

function dayOfMonth(today: YMD, day: number): YMD {
  const ym = monthOf(today);
  return `${ym}-${pad(Math.min(day, daysInMonth(ym)))}`;
}

export function parseOne(text: string, today: YMD, defaultDate?: YMD): Draft {
  const original = westernDigits(text);
  const r = new Reader(original);
  const low0 = original.toLowerCase();
  const has = (words: readonly string[]) => words.some((w) => low0.includes(w));

  const time = readTime(r, low0);
  const dom = r.take(/(?:on the|day|يوم)\s*(\d{1,2})(?:st|nd|rd|th)?\b/i);
  let date = readDate(r, today);
  const repeat = readRepeat(r); // before weekdays, so «كل أحد» isn't read as a one-off date
  if (!date) date = readWeekday(r, today);
  const urgent = r.takeWord(['urgent', 'asap', 'مستعجلة', 'مستعجل', 'ضروري', 'عاجل']);

  const isBill = has(KW.bill);
  const isExpense = has(KW.expense);
  let money = r.take(/(\d+(?:[.,]\d{1,2})?)\s*(?:sar|riyals?|ريال|ر\.س|﷼)/i) ?? r.take(/sar\s*(\d+(?:[.,]\d{1,2})?)/i);
  if (!money && (isBill || isExpense)) money = r.take(/(\d+(?:[.,]\d{1,2})?)(?!.*\d)/);
  const amountHalalas = money ? Math.round(parseFloat(money[1].replace(',', '.')) * HALALAS) : null;

  let kind: Draft['kind'] = 'task';
  if (isBill) {
    kind = 'bill';
    date = dom ? dayOfMonth(today, +dom[1]) : date || today;
  } else if (isExpense || money) {
    kind = 'expense';
    date = date || today;
    r.takeWord(KW.expense);
  } else if (has(KW.appointment)) {
    kind = 'appointment';
  } else if (dom && !date) {
    date = dayOfMonth(today, +dom[1]);
  }
  if (!date && defaultDate && kind !== 'expense') date = defaultDate;
  if (kind === 'task' && !date) {
    if (!repeat && !urgent) kind = 'todo';
    else date = today;
  }
  if (kind === 'appointment' && !date) date = today;

  const recurrence = repeat && kind !== 'expense' && kind !== 'bill' ? PRESETS[repeat](date || today) : null;
  const title = r.rest.replace(/\s{2,}/g, ' ').replace(/^[\s,،.\-–]+|[\s,،.\-–]+$/g, '').replace(/^(?:على|في|for|on|at)\s+/i, '') || text.trim();

  return {
    kind,
    title,
    date,
    time,
    amountHalalas,
    areaId: firstKey(KW.area, has, 'personal'),
    categoryId: firstKey(KW.category, has, kind === 'bill' ? 'home' : 'food'),
    recurrence,
    urgent,
  };
}

export function parseAll(text: string, today: YMD, defaultDate?: YMD): Draft[] {
  return text
    .split(/\n|;|؛|\s+then\s+|\s+ثم\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseOne(s, today, defaultDate));
}

