// Temporary CI gate validation. NEVER MERGE THIS BRANCH.
// This intentionally fails to prove that required Chromium checks block main merges.
const { test, expect } = require('@playwright/test');

test('branch protection required check rejects failing PR', async () => {
  expect('CI_GATE_EXPECTED_FAILURE').toBe('PASS');
});
