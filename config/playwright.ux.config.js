const { scenarioConfig } = require('./playwright.scenario.config');

module.exports = scenarioConfig({
  testMatch: 'ux-interaction.spec.js',
  reportFile: 'ux-playwright.json',
  projectName: 'interaction-chromium',
  timeout: 45_000,
  expectTimeout: 7_000,
  viewport: { width: 1440, height: 900 }
});
