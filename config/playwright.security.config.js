const { scenarioConfig } = require('./playwright.scenario.config');

module.exports = scenarioConfig({
  testMatch: 'security.spec.js',
  reportFile: 'security-playwright.json',
  projectName: 'desktop-chromium',
  timeout: 30_000,
  expectTimeout: 5_000,
  deviceInProject: true
});
