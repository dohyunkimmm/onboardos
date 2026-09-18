const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '../tests',
  testMatch: ['**/visual-system.spec.js'],
  timeout: 45_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['json', { outputFile: '../verification/visual-system-playwright.json' }]
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    timezoneId: 'Asia/Seoul'
  },
  projects: [
    { name: 'visual-system-chromium' }
  ],
  webServer: {
    command: 'node scripts/serve.js',
    cwd: require('path').resolve(__dirname, '..'),
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000
  }
});
