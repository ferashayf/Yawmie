# Contributing to Yawmie

Thanks for helping. Read [CLAUDE.md](CLAUDE.md) (rules), [PRD.md](PRD.md) (what the app does) and [ARCHITECTURE.md](ARCHITECTURE.md) (how it's built) first.

## Setup

```bash
git config core.hooksPath .githooks   # turns on the privacy check before every push
```

Install and run commands come with the first code.

## The one hard rule: no personal data

This repo is public. Never commit real names, phone numbers, emails, shop names, amounts, bank messages, backups or keys.

- Use made-up data only, and only in tests and the demo.
- `node scripts/check-privacy.mjs` runs before every push and in CI. It blocks phone numbers, emails (except `@example.com` and noreply addresses), card numbers and IBANs.
- Put your own private words (your real shops, your name) in a file named `.privacy-words`, one per line. It is git-ignored and the check blocks those words too.

## Code

- Match the surrounding code. Small files, early returns, named constants.
- `src/logic/` is pure: no browser APIs, no UI imports. Write its tests first.
- All UI text goes in the Arabic and English string tables.
- Money is whole halalas; dates are local `YYYY-MM-DD`.

## Commits

`<type>: <description>`, where type is one of `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

## Brand

The code is MIT, but the name, character, logo and artwork are not ([TRADEMARKS.md](TRADEMARKS.md)). Don't add new brand art without asking.
