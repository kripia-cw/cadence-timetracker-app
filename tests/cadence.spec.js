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
