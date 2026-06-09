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
index.html          — structure only (what exists on the page)
src/style.css       — appearance only (what things look like)
src/app.js          — behaviour only (what things do)
src/db.js           — data layer (all database read/write operations)
main.js             — Electron window setup (stays mostly as-is)
tests/              — Playwright test suite
```

**Why:** When something looks wrong you go to `style.css`. When something behaves wrong you go to `app.js`. When data isn't saving you go to `db.js`. You always know where to look. Changes in one file can't accidentally break another.

**Note on app.js size:** Even after splitting, `app.js` will still be large. We will not try to break it up further in this rebuild — that's a future concern. The goal here is separation of concerns (HTML / CSS / JS / data), not perfect modularity.

**Note on file loading:** In Electron, `index.html` loads local files using relative paths — `<link rel="stylesheet" href="src/style.css">` and `<script src="src/app.js">`. This works correctly as long as `main.js` loads `index.html` with `loadFile()` (which it already does) rather than a URL.

### 2. Replace localStorage with SQLite

**Before:** Data stored in a hidden Windows system folder as a binary database you can't open or read.

**After:** Data stored in `Documents\Cadence\cadence.db` — a single file you can see, copy, back up to OneDrive, and restore from.

**Why:** localStorage is invisible and fragile. SQLite is a real database that lives where you can find it. It never silently corrupts. It's used by every browser, every iPhone, every Android phone ever made. It's the right tool for local desktop data.

**The package we'll use:** `better-sqlite3` — the standard SQLite library for Node.js/Electron. Synchronous (simple), fast, well-maintained.

**Clean start:** The current localStorage data was lost in the incident that prompted this rebuild. We will treat the SQLite migration as a clean start — no data to migrate. If a JSON backup exists in `Documents\Cadence Backups\`, we will provide an import path to restore from it.

### 3. Keep automatic backups

The hourly JSON backups to `Documents\Cadence Backups\` that we already built stay. They now export from SQLite instead of localStorage. You'll always have a human-readable backup alongside the database.

**The backup is also the recovery path.** If `cadence.db` is ever lost or corrupted, you import the most recent backup JSON to restore your entries.

### 4. Proper git workflow with automated testing

**Before:** Changes made directly, committed inconsistently, no clear rules.

**After:**
- All work happens on `dev`
- Each piece of work is its own commit with a clear message explaining why the change was made (not just what changed)
- `main` only receives code that has passed the Playwright test suite
- Before any significant change, the plan is written down first
- If a stage fails partway through: stop, revert to the last clean commit on `dev`, understand what went wrong before continuing

**Commit size rule:** One logical change per commit. Not one line, not one day's work — one coherent thing. "Add SQLite schema" is a commit. "Fix start time validation" is a commit. "Various changes" is not a commit.

---

## What we're NOT changing

- The app's appearance — themes, layout, feel, all stay
- All existing features — Log, Entries, Reports, Manage, grid edit, gap detection, auto-suggest, quotes, clock, everything
- The single-window Electron setup — still docked, still always-on-top
- The design philosophy (subject to a separate review session — see FOLLOW-UP.md)

**Features that need extra attention during Stage 3** (they touch the data layer deeply and won't automatically work after switching to SQLite):
- Grid edit — reads and writes entries directly
- Gap detection — reads entries to find time gaps
- Import/export JSON — reads and writes all data
- Auto-suggest (LEARN model) — has its own data that needs to survive
- Dismissed gaps — persisted state that needs to survive

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
| notes | text | (optional) |
| created_at | integer | 1749456123456 |

**entry_tags** table — links entries to tags (one row per tag per entry)
| column | type | example |
|--------|------|---------|
| entry_id | integer | 1 |
| tag | text | billable |

*Why a separate table for tags:* Storing tags as a comma-separated string (`"billable,internal"`) is fragile — searching, filtering, and editing tags becomes messy. A separate table means each tag is its own row, which is clean and queryable.

**categories** table
| column | type |
|--------|------|
| id | integer (auto) |
| name | text |

**projects** table — sub-categories
| column | type |
|--------|------|
| id | integer (auto) |
| name | text |
| category | text |

**tags** table — the list of available tags
| column | type |
|--------|------|
| id | integer (auto) |
| name | text |

**settings** table — app preferences and state that need to persist
| key | value example |
|-----|---------------|
| theme | space |
| anchor | right |
| dismissed_gaps | (JSON array of gap IDs) |
| learn_model | (JSON object — the autocomplete data) |

*Why a settings table:* The LEARN model (autocomplete) and dismissed gaps were missing from the original plan. They live in localStorage today and must survive the migration. A key/value settings table is the right place for this kind of miscellaneous persistent state.

---

## The order we'll build it

We do this in stages. Each stage is complete and working before we start the next. We never have a broken app. If a stage breaks something, we stop and revert — we do not push forward with a broken app.

### Stage 1 — Set up project structure + install Playwright (no functionality changes)

- Create `src/` folder
- Move CSS from `index.html` into `src/style.css`
- Move JavaScript from `index.html` into `src/app.js`
- Update `index.html` to load both files
- Install Playwright and write the full happy path test suite (see Testing section below)
- Run tests — they must all pass before Stage 1 is considered done

**How you'll know it's done:** App looks and works identically. All Playwright tests pass.

**Rollback plan:** `index.html` on `dev` before Stage 1 is the safe state. If anything goes wrong, `git revert` returns to it instantly.

### Stage 2 — Add SQLite alongside localStorage

- Install `better-sqlite3`
- Create `src/db.js` with the full schema
- On startup: create `Documents\Cadence\cadence.db` if it doesn't exist
- All writes go to SQLite AND localStorage (both updated simultaneously)
- All reads still come from localStorage
- Run Playwright tests — must pass

**How you'll know it's done:** `cadence.db` file exists in `Documents\Cadence\`. App still works exactly as before.

**Rollback plan:** Remove `better-sqlite3`, delete `src/db.js`, remove the dual-write calls.

### Stage 3 — Switch reads to SQLite, remove localStorage

- Change all data loading to read from SQLite
- Remove localStorage writes
- Update the backup system to export from SQLite
- Migrate the LEARN model and dismissed gaps from localStorage into the settings table
- Run Playwright tests — must pass
- Manually verify: historical entries visible, auto-suggest works, themes persist, dismissed gaps persist

**How you'll know it's done:** App works as before. localStorage is empty. All data in `cadence.db`.

**Rollback plan:** This is the riskiest stage. Before starting, tag the last working Stage 2 commit in git so we can return to it exactly.

### Stage 4 — Clean up and stabilise

- Remove any remaining localStorage references
- Verify all data-heavy features explicitly: grid edit, gap detection, import/export, auto-suggest
- Fix anything broken
- Run full Playwright suite
- Do a full manual walkthrough of every feature

### Stage 5 — Merge to main

- Open a pull request from `dev` to `main` on GitHub
- Playwright tests must pass
- Review the diff together before merging
- First time `main` has a properly built, tested version of the app

---

## Testing

### Approach
- Playwright for automated end-to-end testing against the real Electron app
- Tests use a **separate test database** (`cadence-test.db`) — never touches your real data
- Each test run **seeds its own data** — creates the entries it needs, tests against them, leaves nothing behind
- Tests are written before the code they test where possible

### How Playwright works with Electron
Playwright has specific Electron support — it launches the app directly and can interact with it like a real user (click buttons, type in fields, read what's on screen). It requires a small amount of extra setup compared to testing a website, which we'll handle in Stage 1.

### Happy path test suite (must pass before any merge to main)

**Core daily loop:**
1. **App launches** — window appears, clock shows, quote shows, Log tab is active
2. **Add an entry** — type description, auto-suggest appears after 2 characters, fill category/sub-category/start/end, save, entry appears in Entries tab
3. **Edit an entry** — change description, save, updated value shows
4. **Delete an entry** — confirmation modal appears (not browser confirm()), entry is removed
5. **Data persists** — close and reopen app, entry created in test is still there
6. **Entries not missing** — entries with past dates appear correctly under day, week, month, and all filters

**Regression — things that actually broke in this app:**

7. **No panel bleed** — only the active tab's content is visible, other panels are hidden
8. **No horizontal scroll** — Entries tab does not scroll sideways
9. **Grid edit opens and closes** — can enter grid edit, make no changes, exit cleanly
10. **End time disabled until start filled** — End field cannot be interacted with until a valid Start time is entered

### What tests do NOT cover (yet)
- Reports tab accuracy
- Grid edit saves and discards
- Gap detection
- Manage tab flows
- Import/export
- Backup verification

These are candidates for a future expanded test suite, not required for this rebuild.

---

## Questions answered before starting

1. ✅ File structure agreed
2. ✅ `Documents\Cadence\cadence.db` as database location
3. ✅ No feature changes during rebuild — features come after foundations are solid
4. ✅ Clean start on data — no localStorage migration needed
5. ✅ Playwright with isolated test database and seeded data
6. ✅ Rollback plan defined for each stage

---

*Last updated: 2026-06-09*
