# Yawmie

**[العربية](README.ar.md)**

A personal life-management app for the iPhone, in Arabic and English: tasks, appointments, time blocks, bills, spending, budgets, and a friendly assistant, «يومي».

> **Status:** in development. Not ready to use yet.

## Two ways to use it

| | Website app | Claude artifact |
|---|---|---|
| How | Open **yawmie.me/app** in Safari → Share → Add to Home Screen | Once, from a computer: Claude desktop app → Code, paste one message (below) |
| Your data lives | Only on your phone | In your own Claude account, private to you |
| Works offline | Yes | No |

Everyone starts with an empty app. There's no account, no server and no tracking.

## Use it in Claude (as an artifact)

The Claude version is a **Claude artifact**: a small, private app page inside your own Claude account. Your data saves there automatically, and you open it from the Claude app on any device, phone included.

Each person makes their own copy, so it saves in their own account. Set it up **once, from a computer**:

1. Open the **Claude desktop app** and choose **Code**.
2. Paste this message:

   > Publish Yawmie for me from github.com/ferashayf/Yawmie (latest release, yawmie-artifact.html) as an artifact with saving (db, user, downloads) turned on.

3. Claude publishes your own private copy. Open it in Claude from any device.

A normal Claude chat can't do step 3: the app file is too big for Claude to write out in a chat reply.

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

Code: [MIT](LICENSE). The name Yawmie / يومي, the character, the logo, the icon and all artwork are **all rights reserved**: see [TRADEMARKS.md](TRADEMARKS.md). Forks use their own name and art. Third-party files in `site/vendor/` (GSAP) keep their own license, noted at the top of each file.
