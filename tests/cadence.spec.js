const { test, expect } = require('@playwright/test');
const { launchApp, closeApp } = require('./helpers');

// Helper: click a tab by name
async function switchTab(win, name) {
  await win.click(`button[onclick*="showTab('${name}'"]`);
  await win.waitForTimeout(300);
}

// Helper: add a time entry via the Log tab form
// cat and proj must be values that already exist in the app's lists.
// Using setComboVal() directly because the custom combo field requires
// both .value and .dataset.confirmed to be set — typing + Tab alone doesn't commit.
async function addEntry(win, { desc, cat = 'Operations', proj = 'Recurring ops tasks', start, end }) {
  await switchTab(win, 'log');

  await win.fill('#desc', desc);
  await win.waitForTimeout(200);

  await win.evaluate(([c, p]) => { setComboVal('cat-sel', c); setComboVal('project', p); }, [cat, proj]);
  await win.waitForTimeout(100);

  await win.fill('#start', start);
  await win.press('#start', 'Tab');
  await win.waitForTimeout(200);

  await win.fill('#end', end);
  await win.press('#end', 'Tab');
  await win.waitForTimeout(200);

  await win.evaluate(() => window.addEntry());
  await win.waitForTimeout(400);
}

// ─── Test 1: App launches correctly ────────────────────────────────────────
test('app launches with Log tab active', async () => {
  const { app, win } = await launchApp();
  try {
    // Clock should be visible
    await expect(win.locator('#clock-time')).toBeVisible();

    // Log tab panel should be active and visible
    await expect(win.locator('#tab-log')).toBeVisible();

    // Other panels should be hidden
    await expect(win.locator('#tab-entries')).toBeHidden();
    await expect(win.locator('#tab-reports')).toBeHidden();
    await expect(win.locator('#tab-manage')).toBeHidden();

    // Screenshot of the default state — review this after every test run.
    // If the app looks wrong visually, you'll see it here before anything else.
    await win.screenshot({ path: 'test-results/screenshots/01-launch-default.png' });
  } finally {
    await closeApp(app);
  }
});

// ─── Test 2: Add an entry and see it in Entries tab ────────────────────────
test('add entry — appears in Entries tab', async () => {
  const { app, win } = await launchApp();
  try {
    await addEntry(win, { desc: 'Writing test entry', start: '09:00', end: '10:00' });

    await switchTab(win, 'entries');

    const entry = win.locator('#entries-list').getByText('Writing test entry');
    await expect(entry).toBeVisible();
  } finally {
    await closeApp(app);
  }
});

// ─── Test 3: Auto-suggest appears after typing ─────────────────────────────
test('auto-suggest appears after 2 characters', async () => {
  const { app, win } = await launchApp();
  try {
    // Save an entry first so LEARN has something to suggest
    await addEntry(win, { desc: 'Onboarding review', start: '09:00', end: '09:30' });

    // Clear the description field and type the start of the same description
    await switchTab(win, 'log');
    await win.fill('#desc', '');
    await win.type('#desc', 'On');
    await win.waitForTimeout(500);

    // Suggestion box should appear
    await expect(win.locator('#suggest-box')).toBeVisible();
  } finally {
    await closeApp(app);
  }
});

// ─── Test 4: Edit an entry ─────────────────────────────────────────────────
test('edit entry — changes save correctly', async () => {
  const { app, win } = await launchApp();
  try {
    await addEntry(win, { desc: 'Original description', start: '09:00', end: '10:00' });

    await switchTab(win, 'entries');

    // Click the first edit button
    const editBtn = win.locator('[onclick*="editEntry"]').first();
    await editBtn.click();
    await win.waitForTimeout(300);

    // Should now be on Log tab with entry loaded — change the description
    await win.fill('#desc', 'Updated description');
    await win.click('#add-btn');
    await win.waitForTimeout(300);

    await switchTab(win, 'entries');
    await expect(win.locator('#entries-list').getByText('Updated description')).toBeVisible();
  } finally {
    await closeApp(app);
  }
});

// ─── Test 5: Delete an entry ───────────────────────────────────────────────
test('delete entry — shows modal not browser confirm, entry removed', async () => {
  const { app, win } = await launchApp();
  try {
    await addEntry(win, { desc: 'Entry to delete', start: '09:00', end: '10:00' });

    await switchTab(win, 'entries');

    // Click the first delete button
    const deleteBtn = win.locator('[onclick*="del("]').first();
    await deleteBtn.click();
    await win.waitForTimeout(300);

    // Custom modal should appear — NOT browser confirm()
    await expect(win.locator('#tt-modal')).toBeVisible();
    const confirmBtn = win.locator('#tt-modal').getByText('Yes, delete entry');
    await expect(confirmBtn).toBeVisible();

    await confirmBtn.click();
    await win.waitForTimeout(300);

    await expect(win.locator('#entries-list').getByText('Entry to delete')).toBeHidden();
  } finally {
    await closeApp(app);
  }
});

// ─── Test 6: Data persists across restart ──────────────────────────────────
test('data persists — entry still there after restart', async () => {
  const { _electron: electron } = require('playwright');
  const path = require('path');
  const os = require('os');
  const TEST_DATA_DIR = path.join(os.tmpdir(), 'cadence-test-persist');
  const fs = require('fs');

  // Clean start
  if (fs.existsSync(TEST_DATA_DIR)) fs.rmSync(TEST_DATA_DIR, { recursive: true });

  const APP_PATH = path.join(__dirname, '..');

  // First launch — add entry
  const app1 = await electron.launch({ args: [APP_PATH, `--user-data-dir=${TEST_DATA_DIR}`] });
  const win1 = await app1.firstWindow();
  await win1.waitForLoadState('domcontentloaded');
  await win1.waitForTimeout(500);
  await addEntry(win1, { desc: 'Persistence check', start: '14:00', end: '15:00' });
  await app1.close();

  // Second launch — same data dir, entry should still be there
  const app2 = await electron.launch({ args: [APP_PATH, `--user-data-dir=${TEST_DATA_DIR}`] });
  const win2 = await app2.firstWindow();
  await win2.waitForLoadState('domcontentloaded');
  await win2.waitForTimeout(500);

  try {
    await switchTab(win2, 'entries');
    await expect(win2.locator('#entries-list').getByText('Persistence check')).toBeVisible();
  } finally {
    await app2.close();
  }
});

// ─── Test 7: No panel bleed ────────────────────────────────────────────────
test('no panel bleed — only active tab content visible', async () => {
  const { app, win } = await launchApp();
  try {
    // Log is active on launch — others hidden
    await expect(win.locator('#tab-entries')).toBeHidden();
    await expect(win.locator('#tab-reports')).toBeHidden();
    await expect(win.locator('#tab-manage')).toBeHidden();

    // Switch to Entries — log, reports, manage hidden
    await switchTab(win, 'entries');
    await expect(win.locator('#tab-log')).toBeHidden();
    await expect(win.locator('#tab-reports')).toBeHidden();
    await expect(win.locator('#tab-manage')).toBeHidden();

    // Switch to Reports
    await switchTab(win, 'reports');
    await expect(win.locator('#tab-log')).toBeHidden();
    await expect(win.locator('#tab-entries')).toBeHidden();
    await expect(win.locator('#tab-manage')).toBeHidden();
  } finally {
    await closeApp(app);
  }
});

// ─── Test 8: No horizontal scroll ─────────────────────────────────────────
test('no horizontal scroll in Entries tab', async () => {
  const { app, win } = await launchApp();
  try {
    await switchTab(win, 'entries');

    const overflows = await win.evaluate(() => {
      const el = document.getElementById('tab-entries');
      return el.scrollWidth > el.clientWidth;
    });
    expect(overflows).toBe(false);
  } finally {
    await closeApp(app);
  }
});

// ─── Test 9: Grid edit opens and closes ───────────────────────────────────
test('grid edit opens and closes cleanly', async () => {
  const { app, win } = await launchApp();
  try {
    await switchTab(win, 'entries');

    // Open grid edit
    await win.click('#grid-edit-btn');
    await win.waitForTimeout(500);

    // Grid edit button should be hidden while in grid edit mode
    await expect(win.locator('#grid-edit-btn')).toBeHidden();

    // Exit via Discard button (no changes made so it exits silently)
    await win.click('.btn-discard');
    await win.waitForTimeout(500);

    // Grid edit button should be visible again
    await expect(win.locator('#grid-edit-btn')).toBeVisible();
  } finally {
    await closeApp(app);
  }
});

// ─── Test 11: No encoding corruption anywhere in the UI ───────────────────
// This test exists because a PowerShell file-split bug silently garbled every
// non-ASCII character in app.js, style.css, and index.html.
// All behaviour tests passed — but the app was visibly broken throughout:
// placeholder text, button labels, quotes, tooltips, hidden panels.
// We check all text and attributes, not just what's currently visible.
test('no encoding corruption anywhere in the UI', async () => {
  const { app, win } = await launchApp();
  try {
    const result = await win.evaluate(() => {
      const garbled = ['â€', 'Ã', 'ÃƒÂ', 'Å½'];
      const found = [];

      // Check all text nodes including hidden panels
      const allText = document.body.innerHTML;
      garbled.forEach(g => { if (allText.includes(g)) found.push(`innerHTML contains "${g}"`); });

      // Check placeholder attributes specifically (innerText misses these)
      document.querySelectorAll('[placeholder]').forEach(el => {
        garbled.forEach(g => {
          if (el.placeholder.includes(g)) found.push(`placeholder on #${el.id} contains "${g}": ${el.placeholder}`);
        });
      });

      // Check title/tooltip attributes
      document.querySelectorAll('[title]').forEach(el => {
        garbled.forEach(g => {
          if (el.title.includes(g)) found.push(`title on #${el.id} contains "${g}": ${el.title}`);
        });
      });

      // Verify known non-ASCII strings are correct (not just absent-but-wrong)
      const catPlaceholder = document.getElementById('cat-sel')?.placeholder || '';
      if (catPlaceholder && !catPlaceholder.includes('—')) found.push(`category placeholder missing em dash: "${catPlaceholder}"`);

      return found;
    });

    if (result.length > 0) {
      console.log('Encoding issues found:', result);
    }
    expect(result).toHaveLength(0);
  } finally {
    await closeApp(app);
  }
});

// ─── Tests 12-14: Theme system ────────────────────────────────────────────

// Test 12: Switching themes changes the body class and active button
test('theme switching — body class and active button update correctly', async () => {
  const { app, win } = await launchApp();
  try {
    // App launches with Space theme by default
    const initialClass = await win.evaluate(() => document.body.className);
    expect(initialClass).toBe('space');
    await expect(win.locator('button.theme-btn.space')).toHaveClass(/active/);

    // Switch to each theme, verify behaviour, and screenshot for visual review
    const fs = require('fs');
    fs.mkdirSync('test-results/screenshots', { recursive: true });

    for (const theme of ['sakura', 'woodland', 'aurora', 'castle', 'space']) {
      await win.evaluate(t => window.setTheme(t), theme);
      await win.waitForTimeout(500);

      const bodyClass = await win.evaluate(() => document.body.className);
      expect(bodyClass).toBe(theme);

      const activeBtn = await win.evaluate(t => {
        const btn = document.querySelector(`.theme-btn.${t}`);
        return btn ? btn.classList.contains('active') : false;
      }, theme);
      expect(activeBtn).toBe(true);

      // No other theme button should be active
      const otherActive = await win.evaluate(t => {
        return [...document.querySelectorAll('.theme-btn')]
          .filter(b => !b.classList.contains(t) && b.classList.contains('active'))
          .map(b => b.title);
      }, theme);
      expect(otherActive).toHaveLength(0);

      // Background image should be a data URL (jpeg) for all themes
      const bgImage = await win.evaluate(() => document.body.style.backgroundImage);
      expect(bgImage).toMatch(/^url\("data:image\/jpeg;base64,/);

      // Screenshot every theme — open test-results/screenshots/ after a run to visually verify
      await win.screenshot({ path: `test-results/screenshots/theme-${theme}.png` });
    }
  } finally {
    await closeApp(app);
  }
});

// Test 13: Theme persists after app restart
test('theme persists across restart', async () => {
  const { _electron: electron } = require('playwright');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');
  const TEST_DATA_DIR = path.join(os.tmpdir(), 'cadence-test-theme-persist');
  if (fs.existsSync(TEST_DATA_DIR)) fs.rmSync(TEST_DATA_DIR, { recursive: true });
  const APP_PATH = path.join(__dirname, '..');

  // First launch — switch to Woodland
  const app1 = await electron.launch({ args: [APP_PATH, `--user-data-dir=${TEST_DATA_DIR}`] });
  const win1 = await app1.firstWindow();
  await win1.waitForLoadState('domcontentloaded');
  await win1.waitForTimeout(500);
  await win1.evaluate(() => window.setTheme('woodland'));
  await win1.waitForTimeout(200);
  await app1.close();

  // Second launch — should open with Woodland
  const app2 = await electron.launch({ args: [APP_PATH, `--user-data-dir=${TEST_DATA_DIR}`] });
  const win2 = await app2.firstWindow();
  await win2.waitForLoadState('domcontentloaded');
  await win2.waitForTimeout(500);
  try {
    const bodyClass = await win2.evaluate(() => document.body.className);
    expect(bodyClass).toBe('woodland');
    await expect(win2.locator('button.theme-btn.woodland')).toHaveClass(/active/);
  } finally {
    await app2.close();
  }
});

// Test 14: All 5 themes load without JS errors
// Note: Sakura has known visual contrast issues (documented in DESIGN-PHILOSOPHY.md
// and FOLLOW-UP.md) — this test only checks it doesn't crash, not that it looks right.
test('all themes load without errors', async () => {
  const { app, win } = await launchApp();
  const errors = [];
  win.on('pageerror', err => errors.push(err.message));
  try {
    for (const theme of ['space', 'sakura', 'woodland', 'aurora', 'castle']) {
      await win.evaluate(t => window.setTheme(t), theme);
      await win.waitForTimeout(200);
    }
    expect(errors).toHaveLength(0);
  } finally {
    await closeApp(app);
  }
});

// ─── Test 10: End time disabled until start filled ────────────────────────
test('end time disabled until start time is entered', async () => {
  const { app, win } = await launchApp();
  try {
    // End field should be disabled on load
    await expect(win.locator('#end')).toBeDisabled();

    // Fill start time
    await win.fill('#start', '09:00');
    await win.press('#start', 'Tab');
    await win.waitForTimeout(300);

    // End field should now be enabled
    await expect(win.locator('#end')).toBeEnabled();
  } finally {
    await closeApp(app);
  }
});

// The panel's width limits. MIN_W must match MIN_W in main.js — 200px is the
// narrowest the titlebar fits in, so nothing may take the window below it.
const MIN_W = 200;
const MAX_W = 600;

// Helper: current window width, read from the main process
async function winWidth(app) {
  return app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getSize()[0]);
}

// Helper: try to force the window to a width, return what we actually got
async function tryResize(app, width) {
  return app.evaluate(({ BrowserWindow }, w) => {
    const win = BrowserWindow.getAllWindows()[0];
    win.setSize(w, win.getSize()[1]);
    return win.getSize()[0];
  }, width);
}

// ─── Test 15: 200px is a hard floor for dragging ──────────────────────────
// The bug this guards: the window could be dragged narrower than 200px, which
// pushes the close button off the right edge and leaves no way to shut the app.
test('manual resize cannot go below 200px', async () => {
  const { app, win } = await launchApp();
  try {
    // The declared floor is 200
    const floor = await app.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows()[0].getMinimumSize()[0]);
    expect(floor).toBe(MIN_W);

    // Every attempt to go narrower is refused, not honoured
    for (const attempt of [199, 180, 165, 150, 100, 50]) {
      expect(await tryResize(app, attempt)).toBe(MIN_W);
    }

    // And nothing can push it past the ceiling either
    expect(await tryResize(app, 900)).toBeLessThanOrEqual(MAX_W);

    // Put it back narrow for the checks below
    await tryResize(app, MIN_W);
    expect(await winWidth(app)).toBe(MIN_W);
  } finally {
    await closeApp(app);
  }
});

// ─── Test 16: Collapse chevron lands on the same 200px floor ──────────────
test('collapse chevron goes to exactly 200px, matching the drag floor', async () => {
  const { app, win } = await launchApp();
  try {
    // Launches at the narrow width
    expect(await winWidth(app)).toBe(MIN_W);

    // Expand wide, then collapse — must land exactly on the floor, not near it.
    // (Expanding stops a little short of MAX_W on a scaled display; that quirk
    // predates this change, so assert the range rather than the exact number.)
    await win.evaluate(() => window.resizeApp('max'));
    await win.waitForTimeout(400);
    const wide = await winWidth(app);
    expect(wide).toBeGreaterThan(MIN_W);
    expect(wide).toBeLessThanOrEqual(MAX_W);

    await win.evaluate(() => window.resizeApp('min'));
    await win.waitForTimeout(400);
    expect(await winWidth(app)).toBe(MIN_W);

    // Collapsing again from an already-collapsed state changes nothing
    await win.evaluate(() => window.resizeApp('min'));
    await win.waitForTimeout(400);
    expect(await winWidth(app)).toBe(MIN_W);
  } finally {
    await closeApp(app);
  }
});

// ─── Test 17: The close button fits at the narrow width ───────────────────
// This is why 200 is the floor — if a titlebar control grows, 200 stops being
// wide enough and this test fails before the app ships with a clipped X.
test('close button sits fully inside the panel at 200px', async () => {
  const { app, win } = await launchApp();
  try {
    await win.evaluate(() => window.resizeApp('min'));
    await win.waitForTimeout(400);

    const r = await win.evaluate(() => {
      const tb = document.querySelector('.titlebar');
      const clipped = [...tb.children]
        .filter(k => {
          const b = k.getBoundingClientRect();
          return b.width > 0 && b.right > window.innerWidth + 0.5;
        })
        .map(k => k.className || k.tagName);
      const close = document.querySelector('.close-btn').getBoundingClientRect();
      return {
        clipped,
        closeRight: close.right,
        closeWidth: close.width,
        inner: window.innerWidth,
        hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    // No titlebar control may run past the right edge
    expect(r.clipped).toEqual([]);

    // The close button in particular must be whole and inside the edge
    expect(r.closeWidth).toBeGreaterThan(0);
    expect(r.closeRight).toBeLessThanOrEqual(r.inner);

    // And no horizontal scrollbar at the narrow width
    expect(r.hScroll).toBe(false);

    await win.screenshot({
      path: 'test-results/screenshots/15-narrow-titlebar.png',
      clip: { x: 0, y: 0, width: r.inner, height: 40 },
    });
  } finally {
    await closeApp(app);
  }
});

// ─── Test 18: Grid edit description auto-suggest ──────────────────────────
// The Description column in Grid edit offers the same suggestions as the Log
// tab, and picking one fills the row's Category and Sub category.
test('grid edit — description auto-suggest fills category and sub category', async () => {
  const { app, win } = await launchApp();
  try {
    await addEntry(win, { desc: 'Grid suggest source', start: '09:00', end: '10:00' });

    await switchTab(win, 'entries');
    await win.click('#grid-edit-btn');
    await win.waitForTimeout(500);

    // New blank row, so the suggestion has a category and sub category to fill
    await win.click('.btn-add-row');
    await win.waitForTimeout(300);

    const row = win.locator('.grid-table tbody tr').last();
    const desc = row.locator('.gd-f[data-f="desc"]');
    await desc.click();
    await desc.pressSequentially('Grid sugg');
    await win.waitForTimeout(400);

    await expect(win.locator('#suggest-box')).toBeVisible();

    await win.locator('#suggest-box .suggest-item').first().click();
    await win.waitForTimeout(300);

    await expect(win.locator('#suggest-box')).toHaveCount(0);
    await expect(desc).toHaveValue('Grid suggest source');
    await expect(row.locator('.gd-cat')).toHaveValue('Operations');
    await expect(row.locator('.gd-proj')).toHaveValue('Recurring ops tasks');

    // Leave grid mode so the unsaved-edits beforeunload guard does not block teardown
    await win.click('.btn-discard');
    await win.waitForTimeout(500);
    await expect(win.locator('#grid-edit-btn')).toBeVisible();
  } finally {
    await closeApp(app);
  }
});

// ─── Tests 19-22: Start field tracks the day's latest end time ────────────
// The Log tab's Start field is meant to show the latest end time of any entry
// on the selected day, so the next entry carries straight on from the last one.
// It used to read only the most recently added entry, which meant grid edit
// changes and out-of-order entries left it stale.

// Fill one grid row's description, start and end. `rowIndex` is the row's
// position in the rendered table (rows sort earliest-first; blank rows sit last).
async function fillGridRow(win, rowIndex, { desc, start, end }) {
  const row = win.locator('.grid-table tbody tr').nth(rowIndex);
  await row.locator('.gd-f[data-f="desc"]').fill(desc);
  await row.locator('.gd-f[data-f="start"]').fill(start);
  await row.locator('.gd-f[data-f="end"]').fill(end);
  await win.waitForTimeout(200);
}

test('start field updates after grid edit adds a later entry', async () => {
  const { app, win } = await launchApp();
  try {
    await addEntry(win, { desc: 'Morning block', start: '09:00', end: '10:00' });

    // Straight after adding, Start carries on from that entry
    await expect(win.locator('#start')).toHaveValue('10:00');

    await switchTab(win, 'entries');
    await win.click('#grid-edit-btn');
    await win.waitForTimeout(500);

    // New row after the existing one — blank rows render last
    await win.click('.btn-add-row');
    await win.waitForTimeout(300);
    await fillGridRow(win, 1, { desc: 'Afternoon block', start: '11:00', end: '12:30' });

    await win.click('.btn-save');
    await win.waitForTimeout(500);

    // This is the bug: Start used to stay on 10:00 after a grid edit
    await switchTab(win, 'log');
    await expect(win.locator('#start')).toHaveValue('12:30');
  } finally {
    await closeApp(app);
  }
});

test('start field shows the day latest end, not the most recent entry', async () => {
  const { app, win } = await launchApp();
  try {
    await addEntry(win, { desc: 'Late block', start: '15:00', end: '16:00' });
    await expect(win.locator('#start')).toHaveValue('16:00');

    // Backfill something earlier in the day — the latest end is still 16:00
    await addEntry(win, { desc: 'Early block', start: '08:00', end: '08:30' });
    await expect(win.locator('#start')).toHaveValue('16:00');
  } finally {
    await closeApp(app);
  }
});

test('start field updates when grid edit moves the last entry end time', async () => {
  const { app, win } = await launchApp();
  try {
    await addEntry(win, { desc: 'Only block', start: '09:00', end: '10:00' });
    await expect(win.locator('#start')).toHaveValue('10:00');

    await switchTab(win, 'entries');
    await win.click('#grid-edit-btn');
    await win.waitForTimeout(500);

    // Stretch the existing entry's end time rather than adding a row
    await win.locator('.grid-table tbody tr').first().locator('.gd-f[data-f="end"]').fill('11:45');
    await win.waitForTimeout(200);

    await win.click('.btn-save');
    await win.waitForTimeout(500);

    await switchTab(win, 'log');
    await expect(win.locator('#start')).toHaveValue('11:45');
  } finally {
    await closeApp(app);
  }
});

test('a hand-typed start time is never overwritten', async () => {
  const { app, win } = await launchApp();
  try {
    await addEntry(win, { desc: 'Morning block', start: '09:00', end: '10:00' });
    await expect(win.locator('#start')).toHaveValue('10:00');

    // Kim types her own start time — nothing after this may touch it
    await win.fill('#start', '13:15');
    await win.press('#start', 'Tab');
    await win.waitForTimeout(200);

    await switchTab(win, 'entries');
    await win.click('#grid-edit-btn');
    await win.waitForTimeout(500);
    await win.click('.btn-add-row');
    await win.waitForTimeout(300);
    await fillGridRow(win, 1, { desc: 'Afternoon block', start: '11:00', end: '12:30' });
    await win.click('.btn-save');
    await win.waitForTimeout(500);

    await switchTab(win, 'log');
    await expect(win.locator('#start')).toHaveValue('13:15');
  } finally {
    await closeApp(app);
  }
});

test('start field is empty on a day with no entries', async () => {
  const { app, win } = await launchApp();
  try {
    await addEntry(win, { desc: 'Today block', start: '09:00', end: '10:00' });
    await expect(win.locator('#start')).toHaveValue('10:00');

    // Move the Log tab to a day that has nothing logged — no time to carry on from
    await win.evaluate(() => window.calPick('2020-01-15'));
    await win.waitForTimeout(300);
    await expect(win.locator('#start')).toHaveValue('');

    // …and back to today restores the carry-on time
    await win.evaluate(() => window.calPickToday());
    await win.waitForTimeout(300);
    await expect(win.locator('#start')).toHaveValue('10:00');
  } finally {
    await closeApp(app);
  }
});
