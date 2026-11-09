# PRD — Yawmie / يومي

Product requirements for Yawmie, a personal life-management app for the iPhone. Version 2.1, 2026-11-09.

Related: [ARCHITECTURE.md](ARCHITECTURE.md) (how it's built), [CLAUDE.md](CLAUDE.md) (rules for working on it), [design/demo.html](design/demo.html) (clickable demo with made-up data, the source of truth for the look; its "Try as a new user" button and data are demo-only).

---

## 1. Summary

Yawmie (يومي, "my day") is a private, open-source (MIT) life-management app for the iPhone. It keeps the day in one place: tasks, appointments, time blocks, bills, spending and budgets. A friendly assistant, Yawmie, gives a daily brief and adds things from a sentence, typed or spoken. It works in Arabic and English.

Each person picks one of **two ways to use it**, built from one codebase:
- **Website app** on the Home Screen (https://yawmie.me): works offline, and the data lives **only on the phone**.
- **Claude artifact**: the same app inside Claude; the data is saved automatically, privately, in the person's own Claude account.

Everyone starts with the real, empty app: no sample data.

## 2. Problem

Tasks, bills and spending live in different apps, notes and memory. As a result:
- overdue tasks get missed, because nothing puts them first;
- the day has no shape, so focus time gets eaten by small things;
- bills get paid late, or it's unclear what's left to pay this month;
- spending goes over budget without warning;
- adding things is slow, so they don't get added at all.

## 3. Goals

| # | Goal | How we know |
|---|---|---|
| G1 | See what matters today at a glance | Next up, overdue and today's list fit in about two screens |
| G2 | Give the day a shape | Repeating time blocks per area, with a focus mode |
| G3 | Add things in seconds | One sentence (typed, spoken or a pasted bank message) becomes a ready item to confirm |
| G4 | Never miss a bill | Month total, paid and left to pay are always visible; reminders arrive on time |
| G5 | Stay inside budget | "Safe to spend today", and warnings at 80% and 100% |
| G6 | Full privacy | No account of ours, no server of ours, no analytics. Website app: nothing leaves the phone. Artifact: data goes only to the person's own Claude account |

## 4. User

One person per copy. The first user is the owner: bilingual (Arabic first, English too), uses an iPhone (iOS 26), and plans work, a side project, study and personal life together. Anyone else can use it the same way, with their own data.

## 5. Platform and constraints

### 5.1 Two ways to use it

The person picks one. Same screens and logic; one **mode** setting decides which parts show.

| | **Website app** | **Claude artifact** |
|---|---|---|
| How | https://yawmie.me/app in Safari → Share → **Add to Home Screen**. Opens full screen with its own icon. No Apple ID or App Store | A **Claude artifact**: once, from a computer, the person opens the Claude desktop app → Code and pastes one message; Claude publishes **their own copy**. Then they open it in Claude on any device, phone included |
| Data lives | **Only on the phone** | In the person's own Claude account, saved automatically, private to them |
| Offline | Yes, after the first open | No, needs Claude |
| Mic (6.8 Y5) | Yes (needs Siri & Dictation) | Hidden; a hint points to the keyboard mic |
| Reminders shortcut (6.13) | Yes | Hidden (Claude blocks the link) |
| Data-safety parts (U3, S5, T4, 6.14) and Import | Shown | Hidden. Export stays in Settings, only to move to the website app |
| Can't reach its data | n/a | Says so clearly ("Sign in to Claude to use Yawmie" / "This copy can't save your data") and saves nothing |

### 5.2 For both

- **Arabic (right-to-left) and English**, switchable in the app. **Digits are always 0-9.** Gregorian calendar only; the week starts on Sunday.
- **Light and dark mode.**
- Money is in **SAR**, shown as `SAR 1,250.00`, stored as whole halalas.
- **No sample data.** Everyone gets the real, empty app. Made-up data exists only in tests and the demo.

### 5.3 Open source and brand

- The code is **open source under the MIT license**, public on GitHub.
- The **brand is not MIT**: the name Yawmie / يومي, the character «يومي», the logo, the app icon and all artwork are "All rights reserved", kept in `brand/` with their own notice and `TRADEMARKS.md`. Use the code freely; forks use their own name, character and logo.
- README in Arabic and English, and a CONTRIBUTING guide.
- **No personal data in the repo, ever.** A pre-push check blocks phone numbers, emails and real shop names.

## 6. Features

Priority: **P0** = must have for v1, **P1** = should have, **P2** = later. Everything below is P0 unless marked.

### 6.1 Everywhere

| ID | Requirement |
|---|---|
| E1 | **Bottom dock**: Yawmie's burgundy tile (left, red badge = overdue count) and a tab capsule: **Today · Plan · Tasks · Money** |
| E2 | **Top of every screen**: day/night button (☀︎/☾), language button (ع / EN) and a **gear** that opens Settings. On Settings the gear becomes a ✕ that goes back |
| E3 | Every sheet has the same header: round ✕ (start) · title · teal ✓ (end) when there is something to save |
| E4 | Short messages ("Saved", "Deleted" with **Undo**) appear as a small capsule at the top |
| E5 | **Empty states**: a new user never sees zeros or "all done". Each empty screen shows one card: the tab's icon, one bold line, how to fill it, and the usual button |
| E6 | Every item can be finished in one tap: the round circle on a task; the calendar square on an appointment (it carries a small empty ring; a ✓ appears in it while pressed). Done shows Undo |

### 6.2 Today

| ID | Requirement |
|---|---|
| T1 | Date pill, then a two-tone greeting by time of day ("Good morning" + "5 tasks left today · 1 overdue") |
| T2 | **Next up** card (black on day, white on night) with the buddy peeking over its corner (tap him = chat): the next appointment today, else the most pressing task (urgent first, then oldest), with **Mark done**. While a time block is live it shows the block and **Start focus** instead |
| T3 | **Quick add** bar ("What's on your plate?") with the burgundy **Add** button. Text goes to the reader (6.7); an empty box opens a blank details page |
| T4 | (Website app only) **Monthly backup card** when the last export is 30+ days old: "Time for your monthly backup · Last one 31 days ago · takes 10 seconds", with **Export** and **Later** (hides it until tomorrow) |
| T5 | **Your day** band: a huge title over a soft teal/burgundy/amber glow, and the **day arc** (6:00 to midnight). A burgundy "now" dot with the time beside it (before 6:00 it waits at the start); today's appointments as solid dots in their area color; only the start and end hours labeled. Big numbers under it: **Left · Appointments · Late** |
| T6 | One **Today** list: overdue first, then today's appointments by time, then today's tasks. Nothing on Today repeats elsewhere on the page |

### 6.3 Plan

| ID | Requirement |
|---|---|
| P1 | Large title "Plan" with the picked date, and the burgundy **Add** (blank details page for the picked day) |
| P2 | **Week strip**: Sunday to Saturday, arrows for other weeks, colored dots for each day's items. Tapping a day shows its plan; "Back to today" appears when another day is picked |
| P3 | **Task areas** row: + (new area) and ✎ (edit areas), above the chips |
| P4 | **Area chips**: All, Urgent (burgundy flag), then the areas, each with its color and count. One sideways-scrolling row with round ‹ › arrows at both ends. Picking one filters the Plan only |
| P5 | **Timeline**: the day's time blocks and appointments in time order, with a burgundy **now** line. An appointment inside a block's time and area sits in that block. The live block is outlined; ended blocks are dimmed. "Add a block" at the end |
| P6 | **Anytime**: the day's tasks that aren't in a block. When a block ends, its unfinished tasks show here with a small "Back from «Work»" tag (computed, nothing moves in storage) |
| P7 | **New area** sheet: name, 8 colors, 12 icons, live preview; ✓ stays locked until there is a name |

### 6.4 Time blocks and Focus

| ID | Requirement |
|---|---|
| K1 | A **time block** is a repeating time slot for one area (for example Work, 9:00 AM – 1:00 PM, Sunday to Thursday) |
| K2 | Tapping a block opens the **block page** (slides in, ‹ back to where you came from): title "Work block", a card in the area color with the time, the days ("Every Sun – Thu"), a bar for how much has passed and **Start focus**; then the block's tasks (✓ or take out), "Add a task to this block" (+ or Return opens the details page filled in), "Move a task in", the area, start and end time, the days (at least one; end after start), and Delete (with Undo) |
| K3 | **Focus** screen: always dark. The arc counts down as h:mm ("2:15 left", or "6:25 · until it starts at 9:00 AM"), shows only that block's tasks, "Only this block's tasks. The rest can wait." **End focus** closes it |

### 6.5 Tasks

| ID | Requirement |
|---|---|
| L1 | Large title "Tasks" and the burgundy **Add** |
| L2 | **Upcoming appointments** (all days), by date and time |
| L3 | **Urgent / Everything else** switch. Urgent tasks sit in a solid burgundy block; undated to-dos are in Everything else |
| L4 | **Done** at the bottom: finished items, each can be restored |
| L5 | Appointments look different from tasks: calendar square in the area color, the time in bold before the title, an area-colored bar on the leading edge. Tasks keep the round circle |
| L6 | Overdue items are marked in red ("2 days late" / «متأخرة يومين») |
| L7 | Rows show small icons when an item has an alert, a link or notes |

### 6.6 Details page and repeat

| ID | Requirement |
|---|---|
| D1 | Opens from tapping an item (or its ⓘ), Add with an empty box, or Edit on a card. Header ✕ / ✓. A quick-type line on top fills the fields from a sentence (new items) |
| D2 | Task / Appointment switch; title, notes, link (http/https only, "Open link" when valid) |
| D3 | Date (on/off), time (on/off), **alert** (none, at time, 5/15/30 min, 1 hour, 1 day before; 9:00 AM when there is no time) |
| D4 | Appointment: duration and place. Task: urgent switch and "good days for it" |
| D5 | Area chips; Delete (asks first, with Undo). Rows have colored icon squares like iPhone Settings |
| D6 | **Repeat page**: Never, Daily, Workdays (Sun–Thu), Weekly, Monthly, Yearly, **Custom** (every N days / weeks / months / years, 1–365; for weeks, pick weekdays). **End repeat**: never or on a date. The row shows a plain summary |
| D7 | Finishing a recurring item moves it to its next date **on the original schedule**, even when finished late; after its end date it is simply done. The 31st lands on the last day of short months; Feb 29 yearly lands on Feb 28 |

### 6.7 Adding things: the reader

| ID | Requirement |
|---|---|
| A1 | One sentence (or several lines) is read **offline** by a built-in rule-based reader: type (task, appointment, someday, spending, bill), title, day words (اليوم، بكرة، الجمعة، today, tomorrow…), time, amount, area or category, repeat, urgent |
| A2 | Times: "4pm", "10:30", «الساعة 4», «4 العصر», «9 الصبح», «12 الليل» (midnight), and a small number right after a day word («بكرة 4», "tomorrow 4"). 1–7 without am/pm means afternoon. Amounts are never read as times |
| A3 | Arabic digits (٣٠٠) count as 300. Whole words only, so «غدا» never matches inside «غداء» |
| A4 | **Nothing is saved without review.** One task or appointment opens the details page filled in; spending, bills or several lines go to the review list (one editable card each, Save / Discard / Save all) |
| A5 | Invalid input is refused with a clear message: an empty title, or an amount outside 0.01–1,000,000 |

### 6.8 Yawmie, the assistant

The character «يومي» ([design/buddy.png](design/buddy.png); brand artwork, all rights reserved) on a burgundy tile. Offline, a friendly Saudi buddy (casual dialect, warm, short).

| ID | Requirement |
|---|---|
| Y1 | The tile shows a red badge with the overdue count, and on open a speech bubble with one useful line (overdue count, else the first appointment today, else "quiet day"). The bubble closes by itself after 6 seconds or on scroll |
| Y2 | Tapping him opens his chat. The first open shows a **daily brief**: today's tasks and appointments (tap to open), overdue, unpaid bills due within 3 days, categories at 80%+ |
| Y3 | Quick questions: وش عندي اليوم؟ / وش متأخر؟ / كم صرفت؟ / الفواتير الجاية, and typed questions matched by keywords |
| Y4 | Anything with a number, or that isn't a question, means "add this". One clear item → an **Add card** in the chat (icon, title, date/time or amount, area/category) with **✓ Add** (saves now, the card turns into "Added: …") and **Edit** (details page). Missing information → a short note and Edit. Several lines → the review list |
| Y5 | (Website app only; the artifact shows a hint to use the keyboard mic instead) **Talk to him**: with the box empty, the send button is a burgundy **mic**. Tap → "Listening…" with the words as you speak; tap the circle when done, or **Cancel** (closes at once). He answers in text only |
| Y6 | Voice uses the iPhone's speech-to-text, which needs **Siri & Dictation** turned on. If it's off, the mic isn't allowed, or voice isn't available, he explains it in the chat and points to the keyboard mic |
| Y7 | (P2) Optional AI brain with the person's own key, behind the same chat, off by default; it must ask before sending any data off the phone |

### 6.9 Money

Bills and spending on one page.

| ID | Requirement |
|---|---|
| M1 | Top: month arrows ‹ › with ☀︎/ع/gear, "Money · 2026", the month name, then a solid card (black on day, white on night): "Spent", the month total in big numbers, and a pill "13% less than October" (the current month is compared with last month up to the same day) |
| M2 | A switcher: **Overview · Spending · Bills** |
| M3 | **Overview**: the budget card, **Add spending** + **Paste messages**, and one Bills row ("Bills · SAR 650.00 left", then the next bill and when it's due, or "All of this month's bills are paid"; tap → Bills) |
| M4 | **Budget card**: **Safe to spend today** on top = (budget left this month − bills not yet paid this month) ÷ days left including today, in halalas, rounded down, with the sum shown under it ("SAR 2,323.00 left − SAR 650.00 bills to pay ÷ 22 days"). SAR 0.00 in red when over budget or when unpaid bills use up the rest. Below it, the arc: spent, % of the budget, spending vs bills paid. ✎ edits budgets. No budget yet → a "Set your monthly budget" card |
| M5 | **Paid bills count toward the budget.** Warnings: **amber at 80%, red at 100%**, for the overall budget and each category. No carry-over between months |
| M6 | **Spending view**: Add spending + Paste messages; **By category**: a bar per category (spent / budget, %), + Add spending pre-picks that category; tap a category to see its purchases and change an amount (partial refund) or remove one (with Undo); + adds a category, ✎ edits names, colors and budgets. **Log**: a fold-out list of the month's purchases by day, with day totals |
| M7 | **Add spending** sheet: a big **Amount** field first (number keypad), then date, category and note |
| M8 | **Bills view**: a gauge (left to pay, month total, paid), **Add bill**, and the list: unpaid first by due day, each row with the day, name (wraps to two lines), "Tomorrow / In 3 days / 2 days late / Paid", amount, a **paid switch** and **ⓘ** |
| M9 | **Bill sheet** (Add bill, or tap a bill's name or ⓘ): name, amount, category, **due day picked from a 1–31 grid** (29–31 fall on the last day of shorter months), then Remind me, **Skip this month** (or bring it back) and **Delete bill** (asks first, Undo). The paid amount is kept per month, so old months stay right if the price changes |
| M10 | Month arrows show earlier months (history); the future is locked |

### 6.10 Paste bank messages

| ID | Requirement |
|---|---|
| N1 | **Paste messages** opens a sheet: paste one or more bank SMS messages, or tap "Paste from clipboard" |
| N2 | Read on the phone, offline, in Arabic and English and several formats: amount in SAR, shop, date, time, and the type (purchase, refund, cash withdrawal, transfer). Verification codes, money coming in and non-SAR amounts are skipped and counted ("Skipped a verification code") |
| N3 | **Card numbers and the raw text are never stored** |
| N4 | **Review before saving**: each line can be switched off and its category changed. A line that matches an unpaid bill (same amount; the name matches or it's the only bill with that amount) offers "Mark it paid for November?", and then no spending line is added. Already-added lines (same date, amount and shop) start switched off. Refunds save as negative spending (+SAR). Cash and transfers start switched off |

### 6.11 Settings

| ID | Requirement |
|---|---|
| S1 | Website app: **Backup**: "Last backup N days ago" (amber after a month), **Export** (one file, saved to Files / iCloud Drive) and **Import** (checked first, a summary shown, replaces only after confirmation). Artifact: only **Export**, explained as "Move to the website app" |
| S2 | Language (العربية / English), Theme (Auto / Light / Dark), Text size (Normal / Large) |
| S3 | Setup → Run it again |
| S4 | Task areas and spending categories with their budgets (the same editors as on Plan and Money) |
| S5 | (Website app only) **Keep your data safe** section with the **Data protection** row ("See the steps" opens the 3-steps sheet): shows whether the iPhone agreed to keep the data ("Protected ✓", or "Open Yawmie from the Home Screen icon"), and the warning "Deleting the Yawmie icon deletes its data. Export a backup first." |

### 6.12 First open: setup and tips

The app always starts empty. First open = setup, then the tour offer, then the empty-state cards (E5).

| ID | Requirement |
|---|---|
| U1 | **Setup, 7 steps**, each skippable, with back and step dots: 1 hello + language, 2 your name (for the greeting), 3 light / dark / auto, 4 your areas (+ new area), 5 your usual week of blocks, 6 monthly budget + main bills, 7 the Reminders shortcut (when shown in this mode) + in the website app, backup and "use the Home Screen icon" |
| U2 | **First-time tour, 11 tips**: when setup ends, a card asks "Quick tour? 11 short tips" with **Show me** / **Skip**; then each pointing at the real screen with a dimmed spotlight: Next up, Add, Your day, Yawmie, the week, time blocks, finishing things (Tasks), Safe to spend, Overview/Spending/Bills, Add spending / paste messages, the gear. Each tip is a short title and one line. A tip whose spot is missing is skipped. Skip on every tip. Yawmie's help answer can replay it ("Show me around") |
| U3 | (Website app only) Opened in Safari instead of from the Home Screen → a card at the top: "Add Yawmie to your Home Screen to keep your data safe: Share ↑ → Add to Home Screen" |

### 6.13 Reminders (P1)

| ID | Requirement |
|---|---|
| R1 | (Website app only; Claude blocks the link in the artifact) "Remind me" on an item or bill runs an Apple Shortcut ("Yawmie Reminder") that creates an Apple Reminder with the date and time, so it notifies at any hour. The first run asks to allow it (pick Always Allow). Afterwards the iPhone stays in Shortcuts and the person taps «◀ Yawmie» to go back; this is accepted |
| R2 | For recurring items, only the next date is sent |
| R3 | The repo explains how to set up the Shortcut (no personal data in it) |

### 6.14 Data safety, install and updates (website app)

| ID | Requirement |
|---|---|
| I1 | Installable with Safari → Share → Add to Home Screen, with the Yawmie icon. The app is meant to be used from that icon |
| I2 | Works with no internet after the first open |
| I3 | On start the app asks the iPhone to keep its data (persistent storage) and shows the result in Settings (S5) |
| I4 | Monthly backup reminder on Today (T4) and in Settings (S1). Export + Import restore everything exactly |
| I5 | An "Update available" button when a new version is published, so a screen is never half old and half new |

### 6.15 Claude artifact

| ID | Requirement |
|---|---|
| C1 | Every change is saved automatically to the person's own private space in their Claude account. Nobody else, the artifact's owner included, can read it |
| C2 | When saving isn't possible (signed out, or a viewer who isn't allowed to save), the app shows one clear card instead of the screens and saves nothing |
| C3 | A save that fails shows a message and keeps the change on screen, so nothing is lost silently |
| C4 | All data-safety parts are hidden (5.1). Export in Settings moves the data to the website app |

### 6.16 What a user does

**Website app**
1. **Once:** open yawmie.me in Safari → Share → **Add to Home Screen**, and from then on open Yawmie from the icon.
2. **Once a month (10 seconds):** when Yawmie reminds you, Export → Save to Files → iCloud Drive.
3. **Only if something goes wrong** (new phone, deleted icon): add it to the Home Screen again, then Settings → Import the latest backup.

Don't delete the Yawmie icon without exporting first.

**Claude artifact**
1. **Once, from a computer:** open the Claude desktop app → Code and paste the message from the README ("Publish Yawmie for me from github.com/ferashayf/Yawmie …"). Claude publishes your own copy. A normal chat can't: the file is too big to write out in a reply.
2. Open your Yawmie artifact in Claude on any device, phone included.
3. Nothing else: changes save by themselves.

## 7. Look and feel

An iPhone app on **iOS 26**: large titles, rounded grouped lists, round ✕/✓ on sheets, a floating dock. **Light mode** = see-through frosted glass over a teal glow and a burgundy haze with fine contour lines; **dark mode** = solid charcoal cards on near-black. **Burgundy** is the brand (logo, Yawmie's tile, the "now" dot, Add, urgent); **teal** is the in-app accent (progress, paid, selected, done) and never sits next to the logo or the character; amber and red only for warnings. The **day arc** from the logo is the one signature shape (the day, bills paid, the budget). Apple's rounded system font. Full rules: [CLAUDE.md](CLAUDE.md) → Design.

## 8. Privacy and security

- No account of ours, no server of ours, no analytics, no third-party scripts or fonts at runtime.
- Website app: data stays on the phone. Artifact: data goes only to the person's own Claude account (Claude's service), by their choice, in a private space.
- Typed text, pasted messages, imported files and Shortcut text are checked before use. User text is never shown as raw HTML.
- Bank messages: only amount, shop, date, time and type are kept; card digits and the message text are not.
- Public repo: no personal data; made-up data only in tests and the demo; backups and secrets are git-ignored; a pre-push check enforces it.

## 9. Not in v1

- Apple Pay import (dropped; spending is typed, spoken or pasted from bank messages)
- AI reading (the built-in reader is used; AI with the person's own key may come later, P2)
- Spoken replies from Yawmie (text answers only)
- Spending by shop ("Places"; tried and removed)
- Hijri dates
- A native iPhone app (kept as a fallback if the web app disappoints)
- Google Calendar sync (later, likely through the iPhone Calendar)
- Sample data for users (the real app always starts empty)
- Sharing one copy's data between people, sync between devices in the website app, automatic cloud backup (would need a server)
- Import inside the artifact, and moving data from the website app to the artifact

## 10. Success criteria for v1

1. Installed on the owner's iPhone and used daily for 2 weeks.
2. Adding a task by voice or text takes under 10 seconds, including the confirm tap.
3. No bill is missed in the first month.
4. An export followed by an import restores everything exactly.
5. Pasting a month of real bank messages (numbers changed) reads at least 9 in 10 correctly.
6. Arabic and English, light and dark, all pass a visual check on the phone, in both ways of using it.
7. In the artifact, a change made on the phone is still there after closing and reopening Claude.
8. The public repo passes the privacy check, and a fresh install opens empty with setup.

## 11. Risks

| Risk | What we do |
|---|---|
| iOS deletes the app's data (unused website, deleted icon, full phone) | Persistent storage request, use from the Home Screen icon, monthly backup reminder, a clear warning |
| Safari and the Home Screen app keep separate data | Always use the Home Screen icon; a card says so when opened in Safari |
| Voice needs Siri & Dictation, and may behave differently from the Home Screen | Clear message in the chat; the keyboard mic always works |
| The reader misreads a sentence or a bank's message format | Everything goes through review; the readers are tested with Arabic and English examples (`design/tests/`) |
| Shortcut behavior changes in a future iOS | The reminder link is one small piece, easy to change; test it first |
| People can't save in someone else's shared artifact (Claude's rules let only the owner, invited editors and team members save) | Each person publishes their own copy of the artifact file from the repo; HOW-IT-WORKS.md says how |
| Claude limits how much one artifact can store | Data is split into small pieces; tested with a year of made-up data |
| Personal data slips into the public repo | Pre-push check for phone numbers, emails and real shop names; no sample data folder |

## 12. Next steps

1. Build plan: [docs/superpowers/plans/2026-11-09-yawmie-v1.md](docs/superpowers/plans/2026-11-09-yawmie-v1.md) (risky parts first).
2. Build v1, install on the iPhone and test (section 10), in both ways.
3. After v1: write `HOW-IT-WORKS.md`, a plain-language guide covering both ways of using the app.
