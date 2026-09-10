const { test, expect } = require('@playwright/test');

test('Firefox/WebKit에서 신청 → 사용자/관리자 동일 티켓 핵심 Flow가 동작한다', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', msg => { if(msg.type() === 'error') consoleErrors.push(msg.text()); });
  await page.goto('/');
  const loginButton = page.getByRole('button', {name:'Google SSO로 시작하기'});
  await loginButton.click();
  try {
    await expect(page.locator('#loginScreen')).toBeHidden({timeout: 8_000});
  } catch (error) {
    const state = await page.evaluate(() => ({
      fakeLogin: typeof fakeLogin,
      busy: document.querySelector('.google-btn')?.getAttribute('aria-busy'),
      disabled: document.querySelector('.google-btn')?.disabled,
      loaderVisible: document.getElementById('loginLoader')?.classList.contains('is-visible'),
      loginHidden: document.getElementById('loginScreen')?.hidden,
      loggedIn: typeof loggedIn === 'boolean' ? loggedIn : null
    }));
    throw new Error(`Cross-browser login failed: ${JSON.stringify({state,pageErrors,consoleErrors})}
${error.message}`);
  }
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button', {name:'신청하기'}).click();
  await page.locator('#requestNote').fill('브라우저 호환성 검증');
  await page.getByRole('button', {name:'신청 완료'}).click();
  await page.locator('#statusBtn').click();
  const userReq = page.locator('.request-item').filter({hasText:'Microsoft Office'});
  const ticket = (await userReq.locator('.ticket-key').textContent()).trim();
  expect(ticket).toMatch(/^ITSM-\d+$/);
  await page.locator('.drawer-close').click();
  await page.locator('#adminBtn').click();
  const adminReq = page.locator('.request-item').filter({hasText:'Microsoft Office'});
  await expect(adminReq.locator('.ticket-key')).toHaveText(ticket);
  await adminReq.getByRole('button', {name:'IT 검토 완료'}).click();
  await expect(page.locator('.request-item').filter({hasText:'Microsoft Office'})).toContainText('지급 대기');
  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter(text => /TypeError|ReferenceError|Content Security Policy|Refused to/i.test(text))).toEqual([]);
});
