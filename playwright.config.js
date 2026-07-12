const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.js/,
  timeout: 30000,
  retries: 0,
  reporter: 'list',
  use: {
    screenshot: 'only-on-failure',
  },
});
