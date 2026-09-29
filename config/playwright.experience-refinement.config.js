const { scenarioConfig } = require('./playwright.scenario.config');

module.exports = scenarioConfig({
  testMatch: 'experience-refinement.spec.js',
  reportFile: 'experience-refinement-playwright.json',
  projectName: 'experience-refinement-chromium',
  timeout: 45_000,
  expectTimeout: 7_000,
  viewport: { width: 1440, height: 1000 }
});
