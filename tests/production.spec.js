const { test, expect } = require('@playwright/test');

test('실제 Production에서 핵심 Flow·CSP·asset·console 상태가 정상이다', async ({ page }, testInfo) => {
  const pageErrors = [];
  const consoleErrors = [];
  const assetStatus = new Map();
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', msg => { if(msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('response', response => {
    const pathname = new URL(response.url()).pathname;
    if(['/styles.css','/data.js','/js/state.js','/js/analytics.js','/js/a11y.js','/app.js','/js/events.js'].includes(pathname)) assetStatus.set(pathname, response.status());
  });
  await page.route('**/vitals.vercel-analytics.com/**', route => route.fulfill({status:204, body:''}));
  await page.route('**/_vercel/insights/event**', route => route.fulfill({status:204, body:''}));
  await page.route('**/_vercel/speed-insights/vitals**', route => route.fulfill({status:204, body:''}));

  const response = await page.goto('/', {waitUntil:'domcontentloaded'});
  expect(response.status()).toBe(200);
  const csp = response.headers()['content-security-policy'] || '';
  expect(csp).toContain("script-src-attr 'none'");
  expect(csp).toContain("style-src-attr 'none'");

  if(testInfo.project.name === 'production-mobile-webkit'){
    const profile = await page.evaluate(() => ({
      width:window.innerWidth,
      height:window.innerHeight,
      touchPoints:navigator.maxTouchPoints,
      mobileUA:/Mobile|iPhone/i.test(navigator.userAgent),
      mobileMedia:window.matchMedia('(max-width: 430px)').matches,
      coarsePointer:window.matchMedia('(pointer: coarse)').matches,
      devicePixelRatio:window.devicePixelRatio
    }));
    expect(profile.width).toBeLessThanOrEqual(430);
    expect(profile.height).toBeGreaterThan(profile.width);
    expect(profile.touchPoints).toBeGreaterThan(0);
    expect(profile.mobileUA).toBe(true);
    expect(profile.mobileMedia).toBe(true);
    expect(profile.coarsePointer).toBe(true);
    expect(profile.devicePixelRatio).toBeGreaterThanOrEqual(2);
  }

  await expect(page.getByRole('button', {name:'Google SSO로 시작하기'})).toBeVisible();
  for(const asset of ['/styles.css','/data.js','/js/state.js','/js/analytics.js','/js/a11y.js','/app.js','/js/events.js']) expect(assetStatus.get(asset), asset).toBe(200);

  await page.getByRole('button', {name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button', {name:'신청하기'}).click();
  await page.locator('#requestNote').fill('Production smoke verification');
  await page.getByRole('button', {name:'신청 완료'}).click();
  await page.locator('#adminBtn').click();
  const request = page.locator('.request-item').filter({hasText:'Microsoft Office'});
  const ticket = (await request.locator('.ticket-key').textContent()).trim();
  expect(ticket).toMatch(/^ITSM-\d+$/);
  await request.getByRole('button', {name:'IT 검토 완료'}).click();
  await page.getByRole('button', {name:'지급 완료 처리'}).click();
  await expect(page.locator('.request-item').filter({hasText:'Microsoft Office'})).toContainText('지급 완료');
  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter(text => /Content Security Policy|Refused to|TypeError|ReferenceError/i.test(text))).toEqual([]);
});
