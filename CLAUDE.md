# CLAUDE.md — Yawmie / يومي

Personal life-management app, **open source (MIT)**, one person per copy, used on the iPhone: tasks, appointments, time blocks, bills, spending, budgets, and a friendly assistant. What it does: [PRD.md](PRD.md). How it's built: [ARCHITECTURE.md](ARCHITECTURE.md) (read before changing structure). Build plan: [docs/superpowers/plans/2026-11-09-yawmie-v1.md](docs/superpowers/plans/2026-11-09-yawmie-v1.md).

**Status (2026-11-09):** planning, no app code yet. The clickable demo with made-up data is the source of truth for the look and behavior: [design/demo.html](design/demo.html), published at https://claude.ai/artifact/52AjV6NhPtswFhb1tavmsA (version 62). The demo's "Try as a new user" button and its made-up data are demo-only.
**Next:** owner approves the build plan → spikes → repo setup → build v1 → after v1, write `HOW-IT-WORKS.md`, a plain-language user guide for both ways of using it.

## Two ways to use it (one codebase)

The person picks one. One **mode check** (`website` or `artifact`) tells screens which parts to show; logic and screens never know where data lives (the `StorageAdapter`).

| | **Website app** (Home Screen, https://yawmie.me) | **Claude artifact** (single-file HTML) |
|---|---|---|
| Data lives | Only on the phone (IndexedDB) | In the person's own Claude account, saved automatically with the artifact `db` capability, privately under `data/users/<their id>/` |
| Offline | Yes | No (needs Claude) |
| Mic (Siri & Dictation) | Yes | Hidden (artifacts can't use it); shows the keyboard-mic hint |
| Shortcut reminders | Yes | Hidden (Claude blocks the link) |
| Data-safety parts | Shown: "Add Yawmie to your Home Screen" card in Safari, Settings → "Keep your data safe" (Data protection, delete-icon warning, 3-steps sheet), monthly backup card, Export / Import | **All hidden.** Export stays in Settings only, to move to the website app. If `db` is missing (signed out, or a viewer who isn't allowed) the app says so clearly |

## The app in one screen

- **Tabs:** Today · Plan · Tasks · Money, plus Yawmie's tile at the left of the dock. **Settings** opens from the gear at the top of every screen.
- **Today:** greeting, Next up card, quick add, monthly backup card (when due), Your day arc, one Today list.
- **Plan:** week strip, task areas, area chips, timeline of **time blocks** and appointments, Anytime. A block opens its own page; Focus counts it down.
- **Tasks:** upcoming appointments, Urgent / Everything else, Done.
- **Money:** month card with "vs last month", then Overview · Spending · Bills; Safe to spend today; **paste bank messages**.
- **Yawmie:** daily brief, quick questions, **Add cards** (one tap to save), **voice** through the iPhone's speech-to-text (answers in text only).
- **Every item is confirmed before it is saved** (details page, review list, or an Add card's ✓).

## Hard constraints (do not break)

1. **Static app. No backend of ours, no accounts, no analytics, no third-party calls at runtime.** (The artifact mode talks only to Claude's own `db`, `user` and `downloads`.)
2. **Website app:** data lives **only on the phone** (IndexedDB). Export/Import of one JSON file is the backup; a monthly reminder keeps it current. **Artifact:** data lives in the person's Claude account, by their choice; no backup reminder.
3. **Arabic (RTL) + English**, switchable in the app. **Western digits 0-9 everywhere.**
4. Light + dark mode. Mobile-first (iPhone, iOS 26, Home Screen).
5. **Public MIT repo: no personal data ever.** No sample data ships to users: everyone gets the real, empty app. Made-up data lives only in tests and the demo. No real names, amounts, shops/brands, phone numbers, emails or keys. A pre-push check enforces it.
6. iPhone integration only through **Apple Shortcuts** (Reminders) and the browser's own APIs. No Apple Pay import, no bank login.
7. Website app works offline after the first load.
8. **Logic and screens never touch storage directly:** they use the `StorageAdapter`; screens ask the **mode** which parts to show.
9. **The brand is not MIT.** The name Yawmie / يومي, the character «يومي», the logo, the app icon and all artwork are "All rights reserved", kept in `brand/` with their own notice and `TRADEMARKS.md`. Code is free to use; forks use their own name, character and logo.

## Decisions

- **Open source, MIT** for the code; brand assets reserved (constraint 9). README in Arabic + English, CONTRIBUTING, a pre-push check for phone numbers, emails and real shop names.
- **No sample data for users.** First open of an empty app: the 7-step setup, then a card "Quick tour? 11 short tips" (Show me / Skip), the spotlight tips, and the empty-state cards.
- Website app at **https://yawmie.me** (GitHub Pages, custom domain). Native SwiftUI is the fallback if the web app disappoints.
- Claude artifact: a single-file HTML build of the same code; data through the artifact `db` capability; data-safety parts, backup card and mic hidden (see the table above).
- Text → items: built-in rule-based reader + confirm. No AI in v1 (maybe later: opt-in, the owner's own key).
- Voice: the browser speech API (needs Siri & Dictation on the iPhone; blocked inside the claude.ai preview). The keyboard mic is the fallback. No spoken replies.
- Bank messages: pasted, read offline, reviewed; card digits and message text are never stored.
- Notifications: Apple Reminders via the "Yawmie Reminder" shortcut; it sends `{title, when}`; the iPhone stays in Shortcuts afterwards (tap «◀ Yawmie» to go back), accepted.
- Budgets: paid bills count, warnings at **80% and 100%**, no carry-over. Safe to spend = (budget left − unpaid bills) ÷ days left incl. today, rounded down.
- Recurring items keep the original schedule when finished late.
- Dates: Gregorian only, week starts **Sunday**, no Hijri. Money: `SAR 1,250.00`.
- Data safety (website app only): ask for persistent storage, use from the Home Screen icon, monthly backup reminder, warn that deleting the icon deletes the data.

## Working rules

- Explain in plain language, short steps. The owner is not a full-time developer.
- A question ("where is X?", "how do I Y?") is not a change request: answer it and offer a fix. Never change an approved layout unasked.
- Bigger changes: show screens first (concept HTML rendered to PNG in `design/concepts/`), build after a yes. After each demo change: test Arabic + English, light + dark, republish the demo, update the .md files.
- Keep the .md files describing the app **as it is now**; no change logs in them.
- Smallest change that fully works. No dependency for a few lines. No feature beyond PRD.md without asking.
- Match surrounding code. Small files, early returns, named constants.
- `src/logic/` is pure: no browser APIs, no UI imports.
- Never mutate stored state in place: build a new state and save it.
- Storage goes through the `StorageAdapter` (`load()` / `save(state)`); never call IndexedDB or `window.claude` outside `src/storage/`. Mode-specific parts are chosen with `mode.ts` (`features.dataSafety`, `features.mic`, ...), never with ad-hoc checks in screens.
- Validate everything from outside: typed text, pasted messages, imported JSON. Never render user text as raw HTML.
- Money = integer halalas (1 SAR = 100). No floats for money.
- Dates = local strings `YYYY-MM-DD` (+ `HH:mm`). No UTC conversion.
- All UI text in the `ar` + `en` tables. No hardcoded strings in components.
- Logical CSS only (`inline-start`/`inline-end`), never left/right. Wrap money and mixed-direction text in `<bdi>`.
- Format numbers/dates with `Intl` + `-u-nu-latn` so digits stay 0-9.
- Never rely on the browser form `submit` alone: buttons and Return call the action directly (some frames block form sending).
- Tests (Vitest) for recurrence, overdue sort, block placement, budget math and safe to spend, the text reader, the bank-message reader, bill matching, import validation, i18n keys and digits. Starting cases: `design/tests/`. UI is checked in the browser and on the phone.
- Commits: `<type>: <description>` (feat, fix, refactor, docs, test, chore, perf, ci).
- Never commit `.env`, backups, or real exports.

## Design

Source of truth: [design/demo.html](design/demo.html). Brand = ferashayf.com: warm neutrals + burgundy; teal only inside app screens. Brand kit: [design/brandkit.html](design/brandkit.html). Concept images: [design/concepts/](design/concepts/).

**Colors**
- Light: page `#F4F4F2` → `#E8E8E4`, ink `#0E0E0E`, sub `#5A5A5A`, greys `#2A2A2A` `#3A3A3A` `#BDBDBD` `#D6D6D6`, frosted white glass (glass only in light mode).
- Dark: page `#0B0B0B` → `#111111`, **solid** charcoal cards `#1A1A1A` with a thin edge, no glass, ink `#F4F4F2`, sub `#BDBDBD`.
- **Burgundy** `#7A1F2B` (dark `#C04459`) = the brand: logo, wordmark, character art, Yawmie's tile, the "now" dot, the Add button, the mic, urgent.
- **Teal** `#0F8F7A` (dark `#2BB59D`) = in-app accent: progress, paid, selected, done. **Never next to the logo, the wordmark or the character art.**
- States only: warn amber `#B7791F`, over/late red `#C2412D`.
- **Text-only shades** (contrast): teal text `#0B6B5C` on light (fills keep `#0F8F7A`); text on teal fills in dark `#0B0B0B`; burgundy text in dark `#D07382`; warning text on light `#895B17`; small grey icons `#7A7A78`.
- Area colors: `#5B7FA6` `#B08143` `#8A6BB0` `#7A8B3D` `#C2416E` `#4E9583` `#D08A2E` `#6B6B69`. Warm greys only; no cool blue-greys anywhere.
- Background: the ferashayf.com contour-line texture. Light: glass over a teal glow (top) and burgundy haze (bottom). Dark: solid cards, a faint teal glow.

**Type and shape**
- Font: Apple's **rounded system font** (`ui-rounded`: SF Pro Rounded + SF Arabic Rounded), nothing bundled.
- Type ramp: 12 · 13 · 15 · 17 · 20 · 28 · 34, display numbers 54 / 64. Nothing under 12px.
- Corner scale: 10 icon squares · 14 small controls/inputs · 22 chat bubbles + buddy tile · 26 cards · 38 sheet top · fully round pills/circles. Nothing else.
- Tap areas ≥ 44px (an invisible hit area may be larger than the drawing). iPhone safe areas (`env(safe-area-inset-*)`).

**Patterns**
- iOS 26 look: large titles, inset grouped lists, floating dock (Yawmie's 74px burgundy tile with a thin white edge + tab capsule).
- Top of every screen: ☀︎/☾, ع/EN and the gear (✕ on Settings).
- Every sheet header: round ✕ (start) · title · teal ✓ (end) when there is something to save.
- Today: date pill, two-tone greeting, solid **Next up** card (black on day, white on night) with the buddy peeking, quick add with the burgundy Add, Your day arc (start/end hours only, now dot with its time, solid appointment dots), urgent tasks in a solid burgundy block.
- Money: a solid month card like Next up; the budget card has Safe to spend on top and the arc below.
- Done controls: round circle for tasks; calendar square with a small empty ring for appointments (✓ shows while pressed).
- Area chips: one sideways-scrolling row with ‹ › arrows; "Task areas" + / ✎ sit above it.
- Details rows have colored icon squares (Settings style). "Saved"/"Deleted" = small capsule at the top with Undo.
- The day arc is the one signature shape (the day, bills paid, the budget).
- Yawmie's image is scaled **smoothly** (`image-rendering: auto`), never `pixelated`. Red badge = overdue count.
- Mark / Home Screen icon: rounded day tile, arc = the day, burgundy dot = now, two dots below = the ي.
- Name: **Yawmie** (Latin `yawmie`, Arabic **يومي**) everywhere. Address: **yawmie.me**.

**Anti-slop rules**
- Icons are drawn SVG icons, one stroke style. Never typed characters (✎ ✕ ! +) or emoji in buttons or bars.
- Buttons are flat brand color; no gloss. Light-mode glass is the only "material".
- One label per action (always "Add spending" / «إضافة مصروف», "Export" / «تصدير»).
- Accents: teal + burgundy only.
- For design variations use `ui-ux-pro-max`, not `taste-skill` (it's for marketing sites).

## Stack

Vite + TypeScript + Preact, `vite-plugin-pwa` (service worker), `idb-keyval` (IndexedDB), Vitest. GitHub Pages via GitHub Actions. A second Vite build (`vite-plugin-singlefile`) makes the one-file artifact.

## Commands

- Privacy check: `node scripts/check-privacy.mjs` (runs before every push via `.githooks/pre-push`; its tests: `node --test 'scripts/*.test.mjs'`). Private words go in the git-ignored `.privacy-words`.
- `dev`, `build`, `build:artifact`, `test`: added with the scaffold (Task 5).

## Skills to prefer

`superpowers:brainstorming` → `writing-plans` for each feature; `test-driven-development` for `src/logic/`; `ui-ux-pro-max` for design; `verification-before-completion` before saying "done".
