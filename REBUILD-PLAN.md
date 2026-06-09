# Cadence — Rebuild Plan

This document is the agreed plan for rebuilding Cadence properly. Nothing in this plan gets built until it's been read, understood, and agreed on. If something here is wrong or unclear, change the document first.

---

## Why we're rebuilding

The current app works but is built on weak foundations:

- Everything (HTML, CSS, JavaScript) is in one 3,500-line file. Any change risks breaking something unrelated and finding it is hard.
- Data lives in `localStorage` — a hidden system folder you can't see, open, or back up manually. One bad moment and it's gone.
- No structure means no safe way to test changes before they break things.

The rebuild keeps everything you love about the app — themes, quotes, feel, all features — and puts it on foundations that don't collapse.

---

## What we're changing and why

### 1. Split the single file into proper files

**Before:** One file — `index.html` — containing everything.

**After:**
```
index.html        — structure only (what exists on the page)
src/style.css     — appearance only (what things look like)
src/app.js        — behaviour only (what things do)
src/db.js         — data layer (all database read/write operations)
main.js           — Electron window setup (stays mostly as-is)
```

**Why:** When something looks wrong you go to `style.css`. When something behaves wrong you go to `app.js`. When data isn't saving you go to `db.js`. You always know where to look. Changes in one file can't accidentally break another.

### 2. Replace localStorage with SQLite

**Before:** Data stored in a hidden Windows system folder as a binary database you can't open or read.

**After:** Data stored in `Documents\Cadence\cadence.db` — a single file you can see, copy, back up to OneDrive, and restore from.

**Why:** localStorage is invisible and fragile. SQLite is a real database that lives where you can find it. It never silently corrupts. It's used by every browser, every iPhone, every Android phone ever made. It's the right tool for local desktop data.

**The package we'll use:** `better-sqlite3` — the standard SQLite library for Node.js/Electron. Synchronous (simple), fast, well-maintained.

### 3. Keep automatic backups

The hourly JSON backups to `Documents\Cadence Backups\` that we already built stay. They now export from SQLite instead of localStorage. You'll always have a human-readable backup alongside the database.

### 4. Proper git workflow with automated testing

**Before:** Changes made directly, committed inconsistently, no clear rules.

**After:**
- All work happens on `dev`
- Each piece of work is its own commit with a clear message explaining why
- `main` only receives code that has passed the Playwright test suite
- Before any significant change, the plan is written down first

**The testing gate:**
We use Playwright for automated end-to-end testing. Before anything merges to `main`, the test suite must pass. The tests cover the happy path — the core flows a real user takes every day:

1. App opens and displays correctly
2. Add a time entry — fills all fields, saves, appears in Entries tab
3. Edit an existing entry — changes save correctly
4. Delete an entry — confirmation appears, entry is removed
5. Switch between all four tabs — no blank screens, no bleed
6. Switch themes — app updates correctly, persists on relaunch
7. Data persists — close and reopen the app, entries still there
8. Historical entries visible — entries from previous days/weeks/months appear correctly in the Entries tab under the right date filters (day, week, month, all)

If any test fails, it does not merge. Fix it first.

Playwright will be introduced at the start of Stage 1 so testing is part of the workflow from day one, not bolted on at the end.

---

## What we're NOT changing

- The app's appearance — themes, layout, feel, all stay
- All existing features — Log, Entries, Reports, Manage, grid edit, gap detection, auto-suggest, quotes, clock, everything
- The single-window Electron setup — still docked, still always-on-top
- The design philosophy (subject to a separate review session — see FOLLOW-UP.md)

---

## The order we'll build it

We do this in stages. Each stage is complete and working before we start the next. We never have a broken app.

### Stage 1 — Set up the project structure (no functionality changes)
Create the new file structure. Move CSS out of `index.html` into `src/style.css`. Move JavaScript out into `src/app.js`. The app looks and works exactly the same — we've just reorganised where things live.

**How you'll know it's done:** App opens, looks identical, all features work.

### Stage 2 — Add SQLite alongside localStorage
Install `better-sqlite3`. Create `src/db.js`. Write the database schema (the structure of the tables). On startup, if a SQLite database doesn't exist yet, create it and migrate any existing localStorage data into it. Both systems run in parallel at this stage — SQLite writes, localStorage still reads.

**How you'll know it's done:** A `cadence.db` file appears in `Documents\Cadence\` when you open the app.

### Stage 3 — Switch reads to SQLite, remove localStorage
Change all data loading to read from SQLite instead of localStorage. Remove the localStorage fallback. The app now runs entirely on SQLite.

**How you'll know it's done:** App works as before. localStorage keys (`tt_e` etc.) are empty. All data is in `cadence.db`.

### Stage 4 — Clean up and stabilise
Remove any remaining references to localStorage. Update the backup system to export from SQLite. Test every feature. Fix anything that broke.

### Stage 5 — Merge to main
When Stage 4 is clean: merge `dev` into `main` via a pull request. First time `main` has ever had a proper, tested, well-built version of the app.

---

## The database structure (what SQLite will look like)

SQLite stores data in tables — like spreadsheet tabs. Here's what Cadence needs:

**entries** table — one row per time entry
| column | type | example |
|--------|------|---------|
| id | integer (auto) | 1 |
| date | text | 2026-06-09 |
| description | text | Email and comms catch-up |
| category | text | Operations |
| project | text | Recurring ops tasks |
| start_time | text | 08:46 |
| end_time | text | 09:24 |
| duration_mins | integer | 38 |
| tags | text | billable,internal |
| notes | text | (optional) |
| created_at | integer | 1749456123456 |

**categories** table — one row per category
| column | type |
|--------|------|
| id | integer (auto) |
| name | text |

**projects** table — one row per sub-category
| column | type |
|--------|------|
| id | integer (auto) |
| name | text |
| category | text |

**tags** table — one row per tag
| column | type |
|--------|------|
| id | integer (auto) |
| name | text |

---

## Questions to answer before we start Stage 1

1. Is there anything in this plan you disagree with or don't understand?
2. Are you happy with `Documents\Cadence\cadence.db` as the database location?
3. Anything about the current app behaviour you want changed during the rebuild (features, flows, anything that annoys you)?

---

*Last updated: 2026-06-09*
