# Yawmie

**[العربية](README.ar.md)**

A personal life-management app for the iPhone, in Arabic and English: tasks, appointments, time blocks, bills, spending, budgets, and a friendly assistant, «يومي».

> **Status:** in development. Not ready to use yet.

## Two ways to use it

| | Website app | Claude artifact |
|---|---|---|
| How | Open **yawmie.me** in Safari → Share → Add to Home Screen | Publish your own copy of the app file as a Claude artifact |
| Your data lives | Only on your phone | In your own Claude account, private to you |
| Works offline | Yes | No |

Everyone starts with an empty app. There's no account, no server and no tracking.

## Use it in Claude

Each person makes their own copy, so it saves in their own Claude account. Signed in to Claude, paste this message:

> Publish Yawmie for me from github.com/ferashayf/Yawmie (latest release, yawmie-artifact.html) as an artifact with saving (db, user, downloads) turned on.

Claude fetches the file and publishes your private copy. If Claude can't open links where you use it, download `yawmie-artifact.html` from the latest release, attach it, and paste the same message.

## Privacy

- No backend, no accounts, no analytics, no third-party calls.
- Website app: your data never leaves your phone. Back it up with Export (one file).
- Bank messages you paste are read on the phone; card numbers and message text are never stored.

## For developers

How it's built: [ARCHITECTURE.md](ARCHITECTURE.md). What it does: [PRD.md](PRD.md). How to help: [CONTRIBUTING.md](CONTRIBUTING.md).

Run locally (Node 24):

```bash
npm install
npm run dev          # website app at http://localhost:5173
npm test             # all tests
npm run build        # website app → dist/
npm run build:artifact   # Claude artifact → dist-artifact/index.html
```

## License

Code: [MIT](LICENSE). The name Yawmie / يومي, the character, the logo, the icon and all artwork are **all rights reserved**: see [TRADEMARKS.md](TRADEMARKS.md). Forks use their own name and art.
