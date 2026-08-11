# Cadence

A minimal, always-on-top time tracker for Windows, built with Electron. Cadence lives pinned to the edge of your screen so logging what you're doing takes seconds, then lets you review where your time actually went in Reports and export it for deeper analysis.

It's built around a simple idea: humans are systematically wrong about where their time goes, and the fastest way to see reality clearly is to make logging effortless and always within reach. See [TIME-TRACKING-PHILOSOPHY.md](TIME-TRACKING-PHILOSOPHY.md) for the thinking behind the framework.

## Getting started

You'll need [Node.js](https://nodejs.org/) installed.

```bash
npm install
npm start
```

`npm install` also rebuilds the native `better-sqlite3` module against Electron automatically.

Once running, the app pins itself to the right edge of your screen and stays on top of other windows so it's always one click away.

## Features

- **Log** — capture what you're doing in seconds, with category, sub-category, tags, description and notes
- **Auto-suggest** — start typing and Cadence offers matching past entries
- **Entries** — browse and edit everything you've logged, day by day
- **Reports** — see where your time went, filtered by category or by project tag
- **Grid edit** — bulk-edit entries in a spreadsheet-style view
- **Export** — download the current report as CSV, or your whole dataset as JSON, with a "Show in folder" shortcut to find the file
- **Themes** — five looks (Aurora, Castle, Sakura, Woodland and default)
- **Automatic backups** — hourly JSON snapshots kept in `Documents\Cadence Backups` (last 30 retained)

## Data & storage

Your data lives locally on your machine — nothing is sent anywhere.

- Entries are stored in a local SQLite database and mirrored in the app's data folder
- Hourly backups are written to `Documents\Cadence Backups` (the 30 most recent are kept)
- Exports (CSV/JSON) are written to your `Downloads` folder

## Running the tests

Cadence uses [Playwright](https://playwright.dev/) for end-to-end tests that launch the real Electron app.

```bash
npm test          # headless
npm run test:headed   # watch the tests run in a visible window
```

## Project layout

| Path | What it is |
|---|---|
| `main.js` | Electron main process — window setup, IPC handlers, file I/O |
| `index.html` | App shell and markup |
| `src/app.js` | All the app logic (logging, reports, export, themes) |
| `src/style.css` | Styles |
| `tests/` | Playwright end-to-end tests |

## Further reading

- [TIME-TRACKING-PHILOSOPHY.md](TIME-TRACKING-PHILOSOPHY.md) — why the framework is shaped the way it is, and what the categories mean
- [DESIGN-PHILOSOPHY.md](DESIGN-PHILOSOPHY.md) — design principles behind the app
- [REBUILD-PLAN.md](REBUILD-PLAN.md) — rebuild notes
- [FOLLOW-UP.md](FOLLOW-UP.md) — outstanding follow-ups
