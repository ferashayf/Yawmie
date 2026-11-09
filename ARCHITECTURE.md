# ARCHITECTURE.md — Yawmie / يومي

How the app is built, in plain language. Version 2.1, 2026-11-09. What it does: [PRD.md](PRD.md). How it looks: [design/demo.html](design/demo.html). Open source (MIT) except the brand ([TRADEMARKS.md](TRADEMARKS.md)).

## 1. The big picture

One codebase, two builds. The person picks one way to use it.

```
 Website app (yawmie.me, Home Screen)            Claude artifact (one HTML file)
 ┌─────────────────────────────────────────┐    ┌─────────────────────────────────────────┐
 │ screens → logic (pure) → StorageAdapter │    │ screens → logic (pure) → StorageAdapter │
 │                     IndexedDB adapter ──┼─┐  │                    Artifact adapter ────┼─┐
 │ speech-to-text (Siri & Dictation)       │ │  │ no mic (keyboard-mic hint)              │ │
 └────────┬────────────────────────────────┘ │  └─────────────────────────────────────────┘ │
  shortcuts:// link                          ▼                                               ▼
 ┌──────────────────────┐        IndexedDB on the phone            Claude `db`: the person's private
 │ "Yawmie Reminder"    │                                           space data/users/<their id>/
 │ shortcut → Reminders │
 └──────────────────────┘
```

- **Website app**: static files on **GitHub Pages** (HTTPS) at **yawmie.me** (`CNAME` in the build + DNS at the registrar). Works offline after the first open. **Data never leaves the phone.**
- **Claude artifact**: a single-file build of the same code, published as a Claude artifact with the `db`, `user` and `downloads` capabilities. Data is saved in the person's own Claude account. Needs Claude to run.
- Neither has a server, account or analytics of ours.

## 2. Parts (one job each)

| Folder | Job | Depends on |
|---|---|---|
| `src/model/` | Data types, the empty starting state, validation of drafts and imported backups | nothing |
| `src/logic/` | Pure functions, **no browser APIs**: dates and recurrence, overdue sort, block placement, budget math and safe to spend, month comparison, the text reader, the bank-message reader, bill matching, assistant replies | `model` |
| `src/storage/` | The `StorageAdapter` interface, the IndexedDB and Artifact adapters, migrations, backup file (export/import), persistent-storage request | `model` |
| `src/mode.ts` | Which way the app is running (`website` or `artifact`) and which parts to show (`features`) | nothing |
| `src/integrations/` | Reminder Shortcut link; speech-to-text wrapper (browser speech API) | `model` |
| `src/i18n/` | Arabic + English strings, number/date formatting (digits 0-9) | nothing |
| `src/ui/` | Screens, sheets, the dock and the assistant | everything above |

Rules: `logic/` never imports `ui/`, `storage/` or `integrations/`. Only `src/storage/` touches IndexedDB or `window.claude`. Screens ask `features` what to show; they never check the mode themselves.

## 3. Data model (one JSON document)

```
AppState {
  schemaVersion
  settings: { lang: 'ar'|'en', theme: 'system'|'light'|'dark', textSize: 'normal'|'large', name?, setupDone, tourDone }
  areas: Area[]            // starts as Work, Project, Personal, Study; the person adds more
  categories: Category[]   // starts as Food, Car, Health, Home, Fun; the person adds more
  blocks: Block[]          // repeating time blocks
  items: Item[]            // tasks, appointments, to-dos
  bills: Bill[]
  expenses: Expense[]
  budgets: Budget[]
  lastBackupAt?            // 'YYYY-MM-DD' of the last export
  backupLaterOn?           // 'YYYY-MM-DD' the backup card was put off
}
```

- **First open**: `emptyState()` has the default areas and categories and nothing else: no items, blocks, bills, expenses or budgets. There is no sample data in the app.
- **Area**: `id, name {ar, en} | string, color (one of 8), icon (one of 12)`. At least one must exist; deleting one moves its items to the first remaining.
- **Category**: `id, name {ar, en} | string, color`. Same rule.
- **Item**: `id, kind (task | appointment | todo), title, notes?, url? (http/https only), areaId, urgent, dueDate? 'YYYY-MM-DD', time? 'HH:mm', alert ('none'|'0'|'5'|'15'|'30'|'60'|'1440' minutes before), durationMin? and place? (appointments), planDays: 'YYYY-MM-DD'[] (good days to work on it), blockId?, recurrence?, status (open | done), doneAt?`.
- **Block**: `id, areaId, start 'HH:mm', end 'HH:mm' (end > start), days: 0–6[] (at least one; 0 = Sunday)`. A task with `blockId` shows inside that block on a day the block runs until the block ends; after that it shows in Anytime with "Back from «area»". This is **computed**, never stored. Deleting a block clears `blockId` on its tasks.
- **Recurrence**: `{ freq: day|week|month|year, every: 1–365, days?: 0–6[] (weeks), start, end? }`. Presets (daily, workdays Sun–Thu, weekly, monthly, yearly) are shapes of this. Finishing moves `dueDate` to the next date **on the original schedule** (step from the old due date, skip past days); past `end` the item is done. Months keep the start's day, clamped to short months; Feb 29 yearly → Feb 28.
- **Bill**: `id, name, amountHalalas, dueDay 1–31, categoryId, paid: { 'YYYY-MM': { amountHalalas, at? } }, skipped: { 'YYYY-MM': true }`. Always monthly. A skipped month is left out of that month's totals. Day 29–31 in a short month falls on its last day. The paid amount is stored per month.
- **Expense**: `id, date 'YYYY-MM-DD', time? 'HH:mm', amountHalalas, categoryId, note? (the shop for pasted messages), refund?: true`. A refund has a **negative** amount and `refund: true`; import accepts negative amounts only with that flag.
- **Budget**: `id, categoryId | null (null = overall), limitHalalas, topUps: { 'YYYY-MM': halalas }`. Monthly, no carry-over.
- Money = integer halalas (1 SAR = 100). Dates = local strings, never converted to UTC. IDs = `crypto.randomUUID()`.
- Month history is calculated from expenses, bills and budgets; nothing else is stored per month.

## 4. Logic (pure, tested)

| Module | What it does |
|---|---|
| `dates` | today, add days/months, days in month, weekday (Sunday first), "Tomorrow / In 3 days / 2 days late" |
| `recurrence` | next date on the original schedule, summaries ("Every 2 weeks: Sun, Wed · until 5 Dec") |
| `today` | the Next up pick (next appointment today, else urgent then oldest task), the Today list (overdue → appointments by time → tasks), counts for Your day |
| `blocks` | which tasks sit in which block on a day, live / ended blocks, "Back from", Focus countdown (h:mm) |
| `budget` | spent = expenses + bills paid that month; % and level (80% warn, 100% over); **safe to spend** = (budget left − unpaid bills this month) ÷ days left including today, rounded down, never below 0; **vs last month** = this month vs last month cut at the same day |
| `bills` | month totals (total, paid, left), next bill, due-day clamping, skip |
| `parser` | text → drafts: kind, title, date words, time (incl. «4 العصر», «بكرة 4»), amount, area/category, repeat, urgent; Arabic digits; whole words only; amounts are never times. Cases in `src/logic/parser.test.ts` (from `design/tests/parser.cases.js`) |
| `bankMessages` | `readBankMessages(text, today)` → `{ found[], skipped{code, income, other} }`: splits several messages, finds SAR amount (ignores balance lines), shop, date (d/m/y or y/m/d, never in the future), time, type; skips codes, incoming money, non-SAR. Never keeps card digits or the text. Cases in `src/logic/bankMessages.test.ts` (from `design/tests/bank-messages.cases.js`) |
| `matchBill` | a pasted purchase that matches an unpaid bill (same amount; name overlap, or the only bill with that amount) |
| `assistant` | `brief(state, today)` and `reply(text, state, today)` → message parts: keyword intents (today, overdue, bills, spending, help, thanks) or an **add card** for one clear draft. The single seam for a future AI mode |

Validation of drafts and backups lives in `src/model/validate.ts`.

## 5. Storage, mode and data safety

### 5.1 The StorageAdapter

```ts
interface StorageAdapter {
  load(): Promise<AppState | null>   // null = nothing saved yet (first open)
  save(state: AppState): Promise<void>
}
```

- The app holds the whole `AppState` in memory. Every change builds a new state and calls `save()`; nothing is edited in place. Saves run one at a time; a burst of changes becomes one save.
- `load()` runs `migrate()` on what it reads, so older data and older backups still work (`schemaVersion`).
- A failed save shows a message ("Couldn't save. Your change is still on screen.") and tries again on the next change. It never fails silently.

### 5.2 IndexedDB adapter (website app)

- The whole `AppState` under one key with `idb-keyval`.
- **Persistent storage**: on start the app calls `navigator.storage.persist()`; Settings shows `navigator.storage.persisted()` as "Protected ✓" or a hint to use the Home Screen icon.
- **Home Screen check**: `matchMedia('(display-mode: standalone)')` (or `navigator.standalone`). Opened in Safari → a card explains Add to Home Screen. Safari and the Home Screen app keep **separate** data.

### 5.3 Artifact adapter (Claude artifact)

- Uses `await claude.use('db')` and `await claude.use('user')`. Either one `null`, or `user.id()` `null` → the app shows the "can't save here" card (PRD C2) and does not start.
- Data lives under the person's private space `data/users/<id>/`, private from everyone else, the artifact's owner included.
- One stored document holds at most 256 KB, so the JSON is split into pieces of at most 60,000 characters:
  - `data/users/<id>/head` = `{ schemaVersion, gen: '<random id>', parts: n, savedAt }`
  - `data/users/<id>/<gen>-<i>` = `{ s: '<piece i of the JSON>' }`
  - **Save** writes every piece under a new random `gen`, one at a time, then `head`, then deletes the previous `gen`'s pieces. If a save stops halfway, `head` still points at the last complete copy; two open copies (phone and Mac) never write the same pieces. Pieces never split an emoji or other two-part character.
  - **Load** reads `head`, then its pieces, joins them and parses.
- Claude's error codes: `quota_exceeded` → "Yawmie is full here"; `revoked`, `not_granted` → the "can't save here" card; `unavailable` → retry once, then the save-failed message.
- Published with `capabilities: { db: { rules: [ { path: "data/users/{self}", read: "interact", write: "interact" } ] }, user: {}, downloads: true }` (confirmed in spike 3).
- Who can save, by Claude's rules: the artifact's owner, people invited by email as editors, and members of the same Claude team plan. Outside viewers through a public link can read shared data but never write. So each person publishes their own copy of the artifact file from the repo (HOW-IT-WORKS.md explains how); there is no shared Yawmie artifact.

### 5.4 Mode

`src/mode.ts` exports `mode` (`'website'` or `'artifact'`, fixed at build time: the artifact build is `vite build --mode artifact`) and `features`:

| `features.` | Website app | Artifact |
|---|---|---|
| `dataSafety` (Home Screen card, Keep your data safe, Data protection, delete-icon warning, 3-steps sheet, monthly backup card) | true | false |
| `importBackup` | true | false |
| `mic` | true | false (keyboard-mic hint instead) |
| `reminders` | true | false (Claude blocks the link) |

`src/storage/index.ts` picks the adapter by `mode`. Screens get `features` and never look at `mode`.

### 5.5 Backup file (export / import)

- **Export**: one file `yawmie-backup-YYYY-MM-DD.json` = `{ app: 'yawmie', schemaVersion, exportedAt, state }`. Website app: the iPhone Share sheet (Save to Files / iCloud Drive), falling back to a download link; sets `lastBackupAt`. Artifact: `claude.use('downloads')` → `save({ filename, data })`, labeled "Move to the website app".
- **Import** (website app): pick a file → `validateBackup()` → `migrate()` → summary → replace only after confirm.
- **Monthly reminder** (website app): `lastBackupAt` 30+ days ago → card on Today (Export / Later; Later sets `backupLaterOn` = today) and amber text in Settings.
- Warning in Settings (website app): deleting the Home Screen icon deletes its data.

## 6. Screens and navigation

- **Tabs** (each keeps its own scroll): Today · Plan · Tasks · Money. **Settings** is a full screen opened from the gear at the top (✕ goes back to the tab you came from).
- **Pushed page**: the block page (from Plan or Today's Next up card), with ‹ back.
- **Full-screen overlay**: Focus (always dark), Setup, the "Quick tour?" card, the 11 tips.
- **Sheets** (✕ · title · ✓): details page and its repeat page, new area, add spending, bill sheet, paste messages + review, review list, Yawmie's chat, export, import, the 3 steps.
- **First open**: `load()` returns `null` → `emptyState()` → Setup (7 steps) → "Quick tour? 11 short tips" (Show me / Skip) → tips → the empty-state cards. `settings.setupDone` and `settings.tourDone` keep them from coming back.
- Screens in detail: [PRD.md](PRD.md) §6; look: [design/demo.html](design/demo.html). The demo's "Try as a new user" button and its made-up data are demo-only.

### Main flows

1. **Type** (quick add, Add on Plan/Tasks, quick-type in details): the parser makes drafts → one task/appointment opens the details page filled in; money or several lines open the review list. Only confirmed drafts are saved.
2. **Yawmie's chat**: `reply()` → one clear draft becomes an Add card (✓ Add saves it; Edit opens the details page); several lines → review list.
3. **Voice** (website app): mic in the chat → `integrations/speech` (browser speech API, `ar-SA` / `en-US`, live words) → the words are sent as a chat message (flow 2). Cancel stops at once and ignores late words. Errors become a chat message: Siri & Dictation off, mic not allowed, or no voice → use the keyboard mic.
4. **Paste bank messages**: `readBankMessages` → each line gets `matchBill` and a duplicate check → review (switch, category, "Mark it paid") → save: matched bills are marked paid (no spending line), the rest become expenses (refunds negative).
5. **Bills**: the bill sheet adds and edits (due day from a 1–31 grid); the paid switch marks the month paid with today's amount.

## 7. Language, RTL, digits

- `<html lang dir>` flips with the in-app language switch. CSS uses logical properties only (`inline-start`/`inline-end`).
- Two string tables (`ar`, `en`) with the same keys; a test fails if a key is missing.
- Every number, amount and date goes through `Intl` with `-u-nu-latn`, so digits stay 0-9. Money and mixed text are wrapped (`<bdi>`) so "SAR 45.00" and Arabic never swap places.
- Text fields use `dir="auto"`. Gregorian only, week starts Sunday.

## 8. Design system

Tokens and rules live in [CLAUDE.md](CLAUDE.md) → Design (colors, text-only shades, type ramp, corner scale, 44px tap areas). CSS variables with light and dark values; light = glass, dark = solid cards. The Home Screen icon is the day-arc mark with the two dots of ي. The app uses the iPhone's rounded system font, so no font files are bundled. Artwork (logo, icon, the character) comes from `brand/`.

## 9. iPhone integration

- **Reminders**: one shortcut, **"Yawmie Reminder"**, installed once (steps in `docs/reminder-shortcut.md`, no personal data in it). "Remind me" opens `shortcuts://run-shortcut?name=Yawmie%20Reminder&input=text&text=<JSON>` with `{title, when: "YYYY-MM-DD HH:mm"}` (the shortcut's alert field takes one value); recurring items send the next date. The first run asks to allow the shortcut to add reminders (pick Always Allow); afterwards the iPhone stays in Shortcuts with a back link to Yawmie. Hidden in the artifact: Claude blocks the link there.
- **Speech-to-text** (website app): the browser speech API, which on iPhone goes through Siri & Dictation (Apple's rule). A page inside another page (the claude.ai artifact or preview) is blocked from the mic, so the artifact hides it. The keyboard mic always works.
- **Apple Pay**: not used. **Google Calendar**: later, likely through a Shortcut.

## 10. Privacy, open source and the public repo

- No server, account or analytics of ours. No third-party scripts or fonts at runtime. Website app: no data leaves the phone. Artifact: data goes only to Claude's `db`, in the person's private space.
- Website build: strict Content-Security-Policy (`default-src 'self'`). The artifact build runs inside Claude's sandbox. User text is shown with `textContent` (or escaped by the framework), never raw HTML.
- Typed text, pasted messages, imported backups and Shortcut text are validated; Shortcut text is URL-encoded.
- Bank messages: card digits and message text are never stored.
- **Licenses**: code under MIT (`LICENSE`). The name Yawmie / يومي, the character «يومي», the logo, the app icon and all artwork are "All rights reserved": kept in `brand/` with `brand/NOTICE.md`, explained in `TRADEMARKS.md`. Forks use their own name, character and logo.
- **No personal data in the repo.** No sample data folder; made-up data only in tests and the demo. Backups, exports and `.env` are git-ignored. `scripts/check-privacy.mjs` (run by the `pre-push` hook and in CI) blocks phone numbers, email addresses (except `@example.com` and GitHub/Anthropic `noreply` addresses), card-like numbers, IBANs, and the words in the git-ignored `.privacy-words` file (the owner's real shops and names). Commits use the GitHub `noreply` email.

### Repo layout

```
LICENSE  TRADEMARKS.md  README.md (English)  README.ar.md (Arabic)  CONTRIBUTING.md
CLAUDE.md  PRD.md  ARCHITECTURE.md
brand/       NOTICE.md, logo, app icon, the character (all rights reserved)
design/      demo.html, brandkit.html, concepts/, tests/ (made-up data only)
docs/        superpowers/plans/, spikes.md, reminder-shortcut.md
scripts/     check-privacy.mjs
.githooks/   pre-push
public/      CNAME, icons made from brand/
src/         model/ logic/ storage/ integrations/ i18n/ ui/ mode.ts main.tsx
```

## 11. Build, test, deploy

- **Stack**: Vite + TypeScript + Preact, `vite-plugin-pwa` (service worker, website build only), `idb-keyval` (IndexedDB), `vite-plugin-singlefile` (artifact build only), Vitest.
- `npm run build` → `dist/` (website app). A GitHub Action runs the tests and the privacy check, then publishes `dist/` to GitHub Pages.
- `npm run build:artifact` → `dist-artifact/index.html`, one file with everything inlined, published as the Claude artifact.
- The service worker caches the website app for offline use; an "Update available" button avoids half-updated screens.
- **Vitest** covers `logic/` (recurrence, overdue sort, block placement, budget math and safe to spend, vs last month, parser, bank messages, bill matching, assistant), `model/` (draft and backup validation, refunds), `storage/` (migrations, both adapters against fakes, chunked save), `integrations/` (Shortcut link), `i18n/` (missing keys, digits) and `scripts/` (privacy check).
- **Real-phone checklist** (iOS 26):
  - Website app: add to Home Screen; first open = setup + "Quick tour?" on an empty app; offline launch; "Protected" in Settings; the Safari card; Arabic + English; light + dark; the mic (Siri & Dictation on); a Reminder via the Shortcut; pasting real bank messages (numbers changed); export → delete → import.
  - Artifact: opens signed in; first open = setup + "Quick tour?"; a change survives closing and reopening Claude; no data-safety parts and no mic; Export saves a file the website app imports; the signed-out / not-allowed card; Arabic + English; light + dark; the Shortcut link only if shown.

## 12. Decisions

| Topic | Decision |
|---|---|
| License | Code MIT, public on GitHub. Brand (name, character, logo, icon, artwork) all rights reserved |
| Ways to use it | Website app (data on the phone) or Claude artifact (data in the person's Claude account); one codebase, `StorageAdapter` + `mode` |
| Starting data | Empty app for everyone; no sample data |
| Platform | Website app at yawmie.me (GitHub Pages). Native SwiftUI is the fallback |
| iOS | iOS 26 |
| Stack | Vite + Preact + TypeScript |
| Text → items | Built-in rule-based reader + review/confirm. AI maybe later, opt-in, own key |
| Voice | The iPhone's speech-to-text in Yawmie's chat, website app only; answers in text only |
| Bank messages | Paste + offline reader + review; no Apple Pay, no bank login |
| Reminders | The "Yawmie Reminder" shortcut with `{title, when}`; staying in Shortcuts afterwards (tap «◀ Yawmie») is accepted |
| Navigation | Tabs Today · Plan · Tasks · Money; Settings behind the gear |
| Budgets | Paid bills count, warnings at 80% and 100%, no carry-over |
| Recurring items | Keep the original schedule when finished late |
| Dates | Gregorian, week starts Sunday, no Hijri |
| Money text | `SAR 1,250.00`, integer halalas |
| Backup | Website app: manual export once a month, reminded on Today. Artifact: saved by Claude; Export only to move to the website app |
