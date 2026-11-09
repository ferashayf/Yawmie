# The "Yawmie Reminder" shortcut

Yawmie adds reminders to Apple Reminders through a small shortcut. You make it once, in about 2 minutes. It only works in the website app (Claude blocks it inside the artifact).

[English](#english) · [بالعربي](#بالعربي)

## English

**What it does:** Yawmie sends the shortcut a title and a time, like `{"title": "Dentist", "when": "2026-11-12 16:30"}`. The shortcut adds a reminder that rings at that time. Nothing else leaves your phone.

### Make it

1. Open the **Shortcuts** app and tap **+** (new shortcut).
2. Name it exactly **Yawmie Reminder** (capital Y and R, one space).
3. Add the action **Get Dictionary from Input**. Its input is **Shortcut Input**.
4. Add **Get Dictionary Value**: Get **Value** for key `title` in **Dictionary**.
5. Add **Get Dictionary Value** again: Get **Value** for key `when` in **Dictionary**. (Tap the Dictionary field and choose the one from step 3.)
6. Add **Add New Reminder**:
   - Reminder text: the **Dictionary Value** from step 4.
   - Tap the arrow, turn on **Alert**, and set the time to the **Dictionary Value** from step 5.
   - List: your normal Reminders list.
7. Tap **Done**.

### Try it

1. In Yawmie, open an appointment or task with a time and tap **Remind me**.
2. The first time, iPhone asks to allow the shortcut to add a reminder. Choose **Always Allow**.
3. The iPhone stays in Shortcuts afterwards. Tap **◀ Yawmie** at the top to go back.

If nothing happens, check the name: it must be exactly `Yawmie Reminder`.

## بالعربي

**وش يسوي:** يومي يرسل للاختصار عنوان ووقت، مثل `{"title": "موعد الأسنان", "when": "2026-11-12 16:30"}`. الاختصار يضيف تذكير يرن في ذاك الوقت. ولا شيء ثاني يطلع من جوالك.

### طريقة عمله

1. افتح تطبيق **الاختصارات** واضغط **+** (اختصار جديد).
2. سمّه بالضبط **Yawmie Reminder** (بالإنجليزي، Y و R كبيرة، ومسافة وحدة).
3. أضف إجراء **الحصول على قاموس من المدخل**. المدخل هو **مدخل الاختصار**.
4. أضف **الحصول على قيمة القاموس**: احصل على **القيمة** للمفتاح `title` في **القاموس**.
5. أضف **الحصول على قيمة القاموس** مرة ثانية: احصل على **القيمة** للمفتاح `when` في **القاموس**. (اضغط خانة القاموس واختر اللي من الخطوة 3.)
6. أضف **إضافة تذكير جديد**:
   - نص التذكير: **قيمة القاموس** من الخطوة 4.
   - اضغط السهم، فعّل **التنبيه**، وخل الوقت **قيمة القاموس** من الخطوة 5.
   - القائمة: قائمة التذكيرات العادية حقتك.
7. اضغط **تم**.

### جرّبه

1. في يومي، افتح موعد أو مهمة لها وقت واضغط **ذكّرني**.
2. أول مرة، الآيفون يسألك تسمح للاختصار يضيف تذكير. اختر **السماح دائمًا**.
3. الآيفون يبقى في الاختصارات بعدها. اضغط **◀ Yawmie** فوق عشان ترجع.

إذا ما صار شيء، تأكد من الاسم: لازم يكون بالضبط `Yawmie Reminder`.
