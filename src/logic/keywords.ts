// Word lists shared by the sentence reader and the bank-message reader (Arabic + English).
export const KW = {
  bill: ['bill', 'subscription', 'فاتورة', 'فاتوره', 'اشتراك'],
  expense: ['spent', 'paid', 'bought', 'صرفت', 'دفعت', 'اشتريت', 'شريت'],
  appointment: ['appointment', 'meeting', 'call', 'dentist', 'doctor', 'موعد', 'اجتماع', 'مكالمة', 'دكتور', 'عيادة'],
  repeat: {
    daily: ['every day', 'daily', 'كل يوم', 'يومياً', 'يوميا'],
    weekly: ['every week', 'weekly', 'كل أسبوع', 'كل اسبوع', 'أسبوعياً', 'اسبوعيا'],
    monthly: ['every month', 'monthly', 'كل شهر', 'شهرياً', 'شهريا'],
    yearly: ['every year', 'yearly', 'كل سنة', 'سنوياً', 'سنويا'],
  },
  area: {
    work: ['meeting', 'report', 'presentation', 'client', 'team', 'اجتماع', 'تقرير', 'عرض', 'عميل', 'فريق', 'الدوام', 'العمل'],
    study: ['study', 'course', 'exam', 'lecture', 'chapter', 'مذاكرة', 'دراسة', 'كورس', 'اختبار', 'محاضرة', 'الفصل', 'تمارين'],
    project: ['project', 'launch', 'website', 'app', 'مشروع', 'المشروع', 'إطلاق', 'الموقع', 'التطبيق'],
  },
  category: {
    food: ['coffee', 'lunch', 'dinner', 'restaurant', 'groceries', 'cafe', 'café', 'bakery', 'market', 'supermarket', 'grocery', 'burger', 'pizza', 'shawarma', 'grill', 'قهوة', 'غداء', 'عشاء', 'مطعم', 'بقالة', 'مقاضي', 'مقهى', 'كافيه', 'مخبز', 'سوبرماركت', 'سوق', 'شاورما', 'مشويات', 'برجر'],
    car: ['car', 'petrol', 'fuel', 'station', 'garage', 'سيارة', 'السيارة', 'بنزين', 'استمارة', 'محطة', 'وقود', 'ورشة'],
    health: ['doctor', 'gym', 'pharmacy', 'clinic', 'hospital', 'دكتور', 'نادي', 'صيدلية', 'عيادة', 'مستشفى'],
    home: ['rent', 'electricity', 'internet', 'water', 'furniture', 'كهرباء', 'الكهرباء', 'إنترنت', 'انترنت', 'إيجار', 'ايجار', 'مياه', 'أثاث'],
    fun: ['cinema', 'game', 'games', 'سينما', 'لعبة', 'ألعاب', 'ترفيه'],
  },
} as const;

// Index = weekday (0 = Sunday).
export const WEEKDAY_WORDS = [['sunday', 'الأحد', 'الاحد'], ['monday', 'الإثنين', 'الاثنين'], ['tuesday', 'الثلاثاء'], ['wednesday', 'الأربعاء', 'الاربعاء'], ['thursday', 'الخميس'], ['friday', 'الجمعة', 'الجمعه'], ['saturday', 'السبت']];

const LETTER = /\p{L}/u;
export const isLetter = (c: string) => c !== '' && LETTER.test(c);

// Arabic-Indic (٠-٩) and Persian (۰-۹) digits become 0-9; the Arabic decimal mark becomes '.'.
export function westernDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, '.');
}

// Whole words only, so «غدا» never matches inside «غداء».
export function hasWholeWord(low: string, words: readonly string[]): boolean {
  return words.some((w) => {
    for (let at = low.indexOf(w); at >= 0; at = low.indexOf(w, at + 1)) {
      if (!isLetter(low.charAt(at - 1)) && !isLetter(low.charAt(at + w.length))) return true;
    }
    return false;
  });
}

export function firstKey<K extends string, F extends string>(map: Record<K, readonly string[]>, has: (words: readonly string[]) => boolean, fallback: F): K | F {
  return (Object.keys(map) as K[]).find((k) => has(map[k])) ?? fallback;
}
