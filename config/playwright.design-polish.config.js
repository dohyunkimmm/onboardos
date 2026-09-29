const { scenarioConfig } = require('./playwright.scenario.config');

module.exports = scenarioConfig({
  testMatch: 'design-polish.spec.js',
  reportFile: 'design-polish-playwright.json',
  projectName: 'design-polish-chromium',
  timeout: 45_000,
  expectTimeout: 7_000,
  viewport: { width: 1440, height: 1000 }
});
