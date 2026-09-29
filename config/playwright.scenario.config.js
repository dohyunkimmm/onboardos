const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'http://127.0.0.1:4173';

function scenarioConfig({
  testMatch,
  reportFile,
  projectName,
  timeout = 30_000,
  expectTimeout = 5_000,
  viewport = null,
  deviceInProject = false
}) {
  const commonUse = {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    timezoneId: 'Asia/Seoul'
  };

  const use = deviceInProject
    ? commonUse
    : {
        ...devices['Desktop Chrome'],
        ...commonUse,
        ...(viewport ? { viewport } : {})
      };

  const projects = deviceInProject
    ? [{ name: projectName, use: { ...devices['Desktop Chrome'] } }]
    : [{ name: projectName }];

  return defineConfig({
    testDir: '../tests',
    testMatch: [`**/${testMatch}`],
    timeout,
    expect: { timeout: expectTimeout },
    fullyParallel: false,
    retries: process.env.CI ? 1 : 0,
    reporter: [
      ['list'],
      ['json', { outputFile: `../verification/${reportFile}` }]
    ],
    use,
    projects,
    webServer: {
      command: 'node scripts/serve.js',
      cwd: ROOT,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 15_000
    }
  });
}

module.exports = { scenarioConfig };
