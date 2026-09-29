const { scenarioConfig } = require('./playwright.scenario.config');

module.exports = scenarioConfig({
  testMatch: 'visual-system.spec.js',
  reportFile: 'visual-system-playwright.json',
  projectName: 'visual-system-chromium',
  timeout: 45_000,
  expectTimeout: 7_000,
  viewport: { width: 1440, height: 900 }
});
