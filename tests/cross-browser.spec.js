const { test, expect } = require('@playwright/test');

test('WebKit native select CSP regression is isolated from application code', async ({browser,browserName})=>{
  test.skip(browserName !== 'webkit','WebKit upstream regression only');
  // This fresh context deliberately enforces CSP, unlike the functional smoke.
  const context = await browser.newContext({bypassCSP:false});
  try{
    const page = await context.newPage();
    await page.addInitScript(()=>{
      window.__nativeSelectViolations=[];
      document.addEventListener('securitypolicyviolation',event=>window.__nativeSelectViolations.push({directive:event.effectiveDirective,blocked:event.blockedURI}));
    });
    await page.route('**/webkit-native-select-repro',route=>route.fulfill({
      contentType:'text/html',
      headers:{'Content-Security-Policy':"default-src 'none'; style-src 'self'; style-src-attr 'none'"},
      body:'<!doctype html><html><head><title>Native select CSP regression</title></head><body><select aria-label="Native control"><option>Example</option></select></body></html>'
    }));
    await page.goto('http://127.0.0.1:4173/webkit-native-select-repro');
    await expect(page.locator('style,[style],script,link')).toHaveCount(0);
    // Fails when upstream is fixed, prompting removal of the temporary workaround.
    await expect.poll(()=>page.evaluate(()=>window.__nativeSelectViolations)).toEqual([{directive:'style-src-attr',blocked:'inline'}]);
  }finally{ await context.close(); }
});

test('Firefox/WebKit에서 신청 → 사용자/관리자 동일 티켓 핵심 Flow가 동작한다', async ({ page,browserName }) => {
  if(browserName === 'webkit') test.info().annotations.push({type:'upstream-workaround',description:'Functional smoke uses bypassCSP only for WebKit 27.2 native select regression (#43416); this is not a WebKit CSP validation.'});
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', msg => { if(msg.type() === 'error') consoleErrors.push(msg.text()); });
  await page.goto('/?review=1');
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
