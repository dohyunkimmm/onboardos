const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '../tests',
  testMatch: ['production.spec.js', 'login-font-stability.spec.js'],
  timeout: 45_000,
  expect: { timeout: 8_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: '../playwright-report-production' }]] : 'list',
  use: {
    baseURL: process.env.PRODUCTION_URL || 'https://onboardos-rho.vercel.app',
    trace: 'retain-on-failure',
    timezoneId: 'Asia/Seoul'
  },
  projects: [
    { name: 'production-chromium', use: { ...devices['Desktop Chrome'], browserName: 'chromium' } },
    // WebKit 27.2 native <select> styling triggers an upstream style-src-attr CSP violation.
    // Isolate this engine-only regression from functional Production smoke, matching cross-browser config.
    // Security/CSP policy assertions and the strict-CSP upstream reproduction remain separately enforced.
    // Remove when https://github.com/microsoft/playwright/issues/43416 is fixed.
    { name: 'production-mobile-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit', bypassCSP: true } }
  ]
});
