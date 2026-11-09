<div dir="rtl">

<p align="center"><img src="../apps/app/public/icons/icon-512.png" alt="أيقونة يومي" width="96"></p>

<h1 align="center">يومي · Yawmie</h1>

<h3 align="center">يومك وفلوسك، في مكان واحد هادئ.</h3>

<p align="center">المهام والمواعيد وفترات اليوم والفواتير والمصاريف، ومساعد ودود، على جوالك.<br>بالعربي والإنجليزي. مجاني وخاص ومفتوح المصدر.</p>

<p align="center">
  <a href="https://yawmie.me"><b>الموقع</b></a> ·
  <a href="https://yawmie.me/app/"><b>افتح التطبيق</b></a> ·
  <a href="#استخدامه-داخل-claude-كـ-artifact"><b>استخدمه داخل Claude</b></a> ·
  <a href="#طريقتان-للاستخدام"><b>ابدأ</b></a>
</p>

<p align="center"><a href="../README.md">English</a> · <b>العربية</b></p>

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-0F8F7A">
  <img alt="For iPhone" src="https://img.shields.io/badge/for-iPhone-0E0E0E">
  <img alt="Arabic and English" src="https://img.shields.io/badge/%D8%B9%D8%B1%D8%A8%D9%8A%20%C2%B7%20English-7A1F2B">
  <img alt="No tracking" src="https://img.shields.io/badge/tracking-none-0F8F7A">
  <img alt="Works offline" src="https://img.shields.io/badge/works-offline-5A5A5A">
</p>

<p align="center"><img src="images/hero.png" alt="يومي على الآيفون" width="100%"></p>

> **الحالة:** قيد التطوير، ليس جاهزًا للاستخدام بعد.

## وش تقدر تسوي

<table>
<tr>
<td align="center" width="33%" valign="top"><img src="images/today.png" width="230" alt="يومك بنظرة"><br><b>يومك بنظرة</b><br><sub>التالي، الإضافة السريعة، ويومك كقوس واحد</sub></td>
<td align="center" width="33%" valign="top"><img src="images/plan.png" width="230" alt="خطط بفترات اليوم"><br><b>خطط بفترات اليوم</b><br><sub>فترات تتكرر للعمل والدراسة وغيرها، مع وضع التركيز</sub></td>
<td align="center" width="33%" valign="top"><img src="images/money.png" width="230" alt="تقدر تصرف اليوم"><br><b>تقدر تصرف اليوم</b><br><sub>الميزانية والفواتير وكم تقدر تصرف اليوم</sub></td>
</tr>
<tr>
<td align="center" width="33%" valign="top"><img src="images/bank-messages.png" width="230" alt="الصق رسائل البنك"><br><b>الصق رسائل البنك</b><br><sub>تنقرأ في جوالك، تراجعها، وتنربط بفواتيرك</sub></td>
<td align="center" width="33%" valign="top"><img src="images/yawmie-chat.png" width="230" alt="كلّم يومي"><br><b>كلّم يومي</b><br><sub>ملخص يومك، وأضف أي شي بجملة وحدة</sub></td>
<td align="center" width="33%" valign="top"><img src="images/today-ar-dark.png" width="230" alt="عربي وإنجليزي"><br><b>عربي وإنجليزي</b><br><sub>من اليمين لليسار، فاتح وداكن، وأرقام 0–9</sub></td>
</tr>
</table>

- **ما ينحفظ شي بدون موافقتك**: كل عنصر تأكده أول.
- **التذكيرات** عبر تذكيرات آبل، باختصار «Yawmie Reminder».
- **النسخة الاحتياطية** ملف واحد تحتفظ فيه؛ يومي يذكّرك مرة بالشهر.

## طريقتان للاستخدام

| | تطبيق الموقع | artifact في Claude |
|---|---|---|
| الطريقة | افتح **yawmie.me/app** في سفاري ← مشاركة ← إضافة إلى الشاشة الرئيسية | مرة وحدة من الكمبيوتر: تطبيق Claude ← Code، والصق رسالة واحدة (تحت) |
| أين تُحفظ بياناتك | في جوالك فقط | في حسابك على Claude، خاصة بك |
| يعمل بدون إنترنت | نعم | لا |
| الصوت والتذكيرات | نعم | لا (Claude يمنعها) |

الكل يبدأ بتطبيق فارغ. بدون حساب، بدون خادم، بدون تتبّع.

## استخدامه داخل Claude (كـ artifact)

نسخة Claude هي **artifact في Claude**: صفحة تطبيق صغيرة وخاصة داخل حسابك في Claude. بياناتك تنحفظ فيه تلقائيًا، وتفتحه من تطبيق Claude من أي جهاز، حتى جوالك.

كل شخص يسوي نسخته الخاصة عشان تنحفظ في حسابه هو. الإعداد **مرة وحدة من الكمبيوتر**:

1. افتح **تطبيق Claude على الكمبيوتر** واختر **Code**.
2. الصق هذه الرسالة كما هي:

   > Publish Yawmie for me from github.com/ferashayf/Yawmie (latest release, yawmie-artifact.html) as an artifact with saving (db, user, downloads) turned on.

3. Claude ينشر نسختك الخاصة. افتحها في Claude من أي جهاز.

المحادثة العادية في Claude ما تقدر تسوي الخطوة 3، لأن ملف التطبيق كبير على أن يكتبه Claude في رد.

## الخصوصية

- لا خادم، لا حسابات، لا إحصائيات، ولا أي اتصال بطرف ثالث.
- تطبيق الموقع: بياناتك لا تخرج من جوالك. احفظ نسخة احتياطية بزر «تصدير» (ملف واحد).
- رسائل البنك التي تلصقها تُقرأ في الجوال، ولا يُحفظ رقم البطاقة ولا نص الرسالة.

## للمطورين

طريقة البناء: [ARCHITECTURE.md](ARCHITECTURE.md). المتطلبات: [PRD.md](PRD.md). التطبيق في `apps/app/`، وصفحة الموقع في `apps/site/`.

## الترخيص

[MIT](../LICENSE).

</div>
