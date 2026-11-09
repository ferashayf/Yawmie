// Test cases for the text reader parseAll (design/demo.html): Arabic and English times. Made-up text only.
// Run in the demo's console: PARSER_CASES.forEach(c => { const p = window.__yawmie.parseAll(c.text)[0] || {}; Object.keys(c.want).forEach(k => console.assert(p[k] === c.want[k], c.text, k, p[k])); });
// Port to Vitest when the real app is scaffolded (src/logic/parser.test.ts).
var PARSER_CASES = [
  { text: 'اجتماع مع المصمم بكرة 4', want: { kind: 'appointment', time: '16:00', title: 'اجتماع مع المصمم' } },
  { text: 'موعد الأسنان 5 العصر', want: { time: '17:00' } },
  { text: 'اجتماع 9 الصبح', want: { time: '09:00' } },
  { text: 'مكالمة 12 الظهر', want: { time: '12:00' } },
  { text: 'مكالمة 2 الظهر', want: { time: '14:00' } },
  { text: 'قهوة مع صديق 8 الليل', want: { time: '20:00' } },
  { text: 'موعد 12 الليل', want: { time: '00:00' } },
  { text: 'اجتماع الخميس 10', want: { time: '10:00' } },
  { text: 'meeting tomorrow 4', want: { time: '16:00' } },
  // amounts must stay amounts
  { text: 'صرفت 45 ريال قهوة', want: { kind: 'expense', time: '', amount: '45' } },
  { text: 'بكرة صرفت 30 ريال', want: { kind: 'expense', time: '' } },
  { text: 'فاتورة الكهرباء 300 يوم 27', want: { kind: 'bill', time: '' } },
  // older formats
  { text: 'meeting tomorrow 4pm', want: { time: '16:00' } },
  { text: 'اجتماع الساعة 4', want: { time: '16:00' } },
  { text: 'call 10:30', want: { time: '10:30' } }
];
