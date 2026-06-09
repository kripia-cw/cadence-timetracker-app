const { _electron: electron } = require('playwright');
const path = require('path');
const os = require('os');
const fs = require('fs');

const APP_PATH = path.join(__dirname, '..');

// Each launch gets its own unique dir so there's no deletion/locking between tests
let _testDirCounter = 0;

async function launchApp() {
  const testDataDir = path.join(os.tmpdir(), `cadence-test-${process.pid}-${++_testDirCounter}`);

  const app = await electron.launch({
    args: [APP_PATH, `--user-data-dir=${testDataDir}`],
  });

  const win = await app.firstWindow();
  await win.waitForLoadState('domcontentloaded');
  await win.waitForTimeout(500);

  return { app, win };
}

async function closeApp(app) {
  await app.close();
}

module.exports = { launchApp, closeApp };
