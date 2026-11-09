# How Yawmie works

A short guide for people who use Yawmie. For how it's built, see [ARCHITECTURE.md](ARCHITECTURE.md).

[English](#english) · [بالعربي](#بالعربي)

## English

### 1. Pick one way

| | Website app | Claude artifact |
|---|---|---|
| Open it | **yawmie.me/app** in Safari, then add it to the Home Screen | From the Claude app, after a one-time setup |
| Your data | Only on your phone | In your own Claude account |
| Offline | Yes | No |
| Voice and reminders | Yes | No (use the keyboard mic) |

Pick one and stay with it. The two don't share data. You can move from Claude to the website app with Export and Import (part 4).

### 2. Website app

1. In Safari, open **yawmie.me/app**.
2. Tap **Share**, then **Add to Home Screen**, then **Add**.
3. From now on, **always open Yawmie from that icon**. Safari and the icon keep separate data, and the icon's data is the protected one. In Settings, under **Keep your data safe**, it says **Protected** when this is working.
4. The first time, a 7-step setup and an optional quick tour help you start. The app starts empty: nothing is filled in for you.

**Keep your data safe:**
- Once a month, Yawmie shows a backup card. Tap **Export**, then **Save to Files**, then **iCloud Drive**. It takes 10 seconds.
- **Don't delete the Yawmie icon without exporting first.** Deleting it deletes your data.
- New phone, or deleted the icon? Add Yawmie to the Home Screen again, then **Settings → Import** your latest backup file.

### 3. Claude artifact

1. Once, from a computer: open the **Claude desktop app**, choose **Code**, and paste the message from the [README](../README.md#use-it-in-claude-as-an-artifact).
2. Claude publishes your own private copy. Open it in Claude from any device, phone included.
3. Your data saves in your Claude account automatically. There's no backup card, because nothing lives on the phone.
4. If Yawmie says it can't save, you're signed out or you opened someone else's copy. Sign in, or publish your own copy.

### 4. Move from Claude to the website app

1. In the artifact: **Settings → Export**. Save the file.
2. In the website app: **Settings → Import**, and choose that file.

### 5. Every day

- **Today:** what's next, a quick-add box, your day as an arc, and today's list.
- **Plan:** your week, time blocks and appointments. Open a block and tap **Start focus** to count it down.
- **Tasks:** upcoming appointments, then Urgent and Everything else.
- **Money:** this month, spending, bills and **Safe to spend today**.
- Nothing is saved until you confirm it with ✓.

### 6. Reminders (website app)

Make the free **"Yawmie Reminder"** shortcut once: [how to make it](reminder-shortcut.md). Then open an appointment or task with a time and tap **Remind me**. It adds an Apple Reminder that rings on time. Afterwards, tap **◀ Yawmie** at the top to go back.

### 7. Bank messages

1. Copy one or more messages from your bank (in Messages).
2. In **Money**, tap **Paste messages**.
3. Yawmie reads them on your phone, drops card numbers and doesn't keep the message text. Check the list, then save.

### 8. Talking to Yawmie

Tap Yawmie's tile at the start of the dock. Ask a quick question, or type something like "meeting tomorrow 11:00". Yawmie shows an **Add card**; tap ✓ to save it.

To talk instead of type, tap the mic (website app only). It needs **Siri & Dictation** turned on in iPhone Settings. Yawmie answers in text. The keyboard mic works everywhere, Claude included.

## بالعربي

### 1. اختر طريقة وحدة

| | تطبيق الموقع | Claude artifact |
|---|---|---|
| تفتحه | **yawmie.me/app** في Safari، وبعدها تضيفه للشاشة الرئيسية | من تطبيق Claude، بعد إعداد مرة وحدة |
| بياناتك | على جوالك بس | في حسابك في Claude |
| بدون إنترنت | نعم | لا |
| الصوت والتذكيرات | نعم | لا (استخدم مايك الكيبورد) |

اختر وحدة وكمّل عليها. الطريقتين ما يتشاركون البيانات. تقدر تنتقل من Claude لتطبيق الموقع بالتصدير والاستيراد (الجزء 4).

### 2. تطبيق الموقع

1. في Safari، افتح **yawmie.me/app**.
2. اضغط **مشاركة**، بعدها **إضافة إلى الشاشة الرئيسية**، بعدها **إضافة**.
3. من الحين، **افتح يومي دايم من أيقونته**. Safari والأيقونة كل واحد له بياناته، وبيانات الأيقونة هي المحمية. في الإعدادات، تحت **احفظ بياناتك**، تشوف **محمية** لما يكون كل شي تمام.
4. أول مرة، فيه إعداد من 7 خطوات وجولة سريعة اختيارية تساعدك تبدأ. التطبيق يبدأ فاضي: ما فيه شي معبّى لك.

**احفظ بياناتك:**
- مرة كل شهر، يومي يطلع لك بطاقة النسخة الاحتياطية. اضغط **تصدير**، بعدها **حفظ في الملفات**، بعدها **iCloud Drive**. تاخذ 10 ثواني.
- **لا تحذف أيقونة يومي قبل ما تصدّر نسخة.** حذفها يمسح بياناتك.
- جوال جديد أو حذفت الأيقونة؟ أضف يومي للشاشة الرئيسية مرة ثانية، وبعدها **الإعدادات ← استيراد** آخر نسخة.

### 3. Claude artifact

1. مرة وحدة، من كمبيوتر: افتح **تطبيق Claude للكمبيوتر**، اختر **Code**، والصق الرسالة الموجودة في [الملف التعريفي](README.ar.md#استخدامه-داخل-claude-كـ-artifact).
2. Claude ينشر نسختك الخاصة. افتحها في Claude من أي جهاز، حتى الجوال.
3. بياناتك تنحفظ في حسابك في Claude تلقائيًا. ما فيه بطاقة نسخة احتياطية، لأن ما فيه شي محفوظ على الجوال.
4. إذا يومي قال إنه ما يقدر يحفظ، فأنت مو مسجّل دخول أو فاتح نسخة شخص ثاني. سجّل دخول، أو انشر نسختك.

### 4. الانتقال من Claude لتطبيق الموقع

1. في الـ artifact: **الإعدادات ← تصدير**. احفظ الملف.
2. في تطبيق الموقع: **الإعدادات ← استيراد**، واختر نفس الملف.

### 5. كل يوم

- **اليوم:** وش اللي بعده، خانة إضافة سريعة، يومك كقوس، وقائمة اليوم.
- **الخطة:** أسبوعك، فترات اليوم والمواعيد. افتح فترة واضغط **ابدأ التركيز** عشان يعدّها لك.
- **المهام:** المواعيد الجاية، وبعدها العاجل وكل الباقي.
- **فلوسي:** هالشهر، المصروف، الفواتير، و**تقدر تصرف اليوم**.
- ما ينحفظ شي إلا لما تأكده بـ ✓.

### 6. التذكيرات (تطبيق الموقع)

سوّ اختصار **«Yawmie Reminder»** المجاني مرة وحدة: [طريقة عمله](reminder-shortcut.md#بالعربي). بعدها افتح موعد أو مهمة لها وقت واضغط **ذكّرني**. يضيف تذكير في تذكيرات آبل يرن في وقته. بعدها اضغط **◀ Yawmie** فوق عشان ترجع.

### 7. رسائل البنك

1. انسخ رسالة أو أكثر من بنكك (من الرسائل).
2. في **فلوسي**، اضغط **لصق رسائل البنك**.
3. يومي يقراها على جوالك، يشيل أرقام البطاقات وما يحتفظ بنص الرسالة. راجع القائمة، وبعدها احفظ.

### 8. الكلام مع يومي

اضغط مربع يومي في بداية الشريط تحت. اسأل سؤال سريع، أو اكتب مثلًا «اجتماع بكرة 11:00». يومي يطلع لك **بطاقة إضافة**؛ اضغط ✓ عشان تحفظها.

عشان تتكلم بدل ما تكتب، اضغط المايك (تطبيق الموقع بس). يحتاج **Siri والإملاء** مفعّل في إعدادات الآيفون. يومي يرد بالكتابة. مايك الكيبورد يشتغل في كل مكان، حتى في Claude.
