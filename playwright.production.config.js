const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: 'production.spec.js',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-production' }]] : 'list',
  use: {
    baseURL: process.env.PRODUCTION_URL || 'https://onboardos-rho.vercel.app',
    trace: 'retain-on-failure',
    timezoneId: 'Asia/Seoul'
  },
  projects: [
    { name: 'production-chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
