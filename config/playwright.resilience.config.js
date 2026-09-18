const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '../tests',
  testMatch: ['**/recovery.spec.js'],
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['json', { outputFile: '../verification/resilience-playwright.json' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    timezoneId: 'Asia/Seoul'
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: {
    command: 'node scripts/serve.js',
    cwd: require('path').resolve(__dirname, '..'),
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000
  }
});
