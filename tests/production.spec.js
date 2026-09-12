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
  expect(csp).toContain("media-src 'self' https://github.com https://release-assets.githubusercontent.com https://objects.githubusercontent.com");

  if(testInfo.project.name === 'production-mobile-webkit'){
    expect(page.context().browser().browserType().name()).toBe('webkit');
    expect(testInfo.project.use.isMobile).toBe(true);
    expect(testInfo.project.use.hasTouch).toBe(true);
    const profile = await page.evaluate(() => ({
      width:window.innerWidth,
      height:window.innerHeight,
      mobileUA:/Mobile|iPhone/i.test(navigator.userAgent),
      mobileMedia:window.matchMedia('(max-width: 430px)').matches,
      devicePixelRatio:window.devicePixelRatio
    }));
    expect(profile.width).toBeLessThanOrEqual(430);
    expect(profile.height).toBeGreaterThan(profile.width);
    expect(profile.mobileUA).toBe(true);
    expect(profile.mobileMedia).toBe(true);
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

  const demoResponse = await page.goto('/production-demo', {waitUntil:'domcontentloaded'});
  expect(demoResponse.status()).toBe(200);
  await expect(page.getByRole('heading', {name:'ONBOARD·OS Production Demo'})).toBeVisible();
  const video = page.locator('video');
  await expect(video).toBeVisible();
  await expect(video).toHaveAttribute('aria-label', /36초/);
  await expect(video.locator('source')).toHaveAttribute('src', 'https://github.com/dohyunkimmm/onboardos/releases/download/v1.7.0/ONBOARD_OS_v1.7.0_P6_production_demo.mp4');
  const duration = await video.evaluate(el => new Promise((resolve, reject) => {
    if(Number.isFinite(el.duration) && el.duration > 0) return resolve(el.duration);
    const timer = setTimeout(() => reject(new Error('Timed out waiting for demo video metadata')), 15000);
    el.addEventListener('loadedmetadata', () => { clearTimeout(timer); resolve(el.duration); }, {once:true});
    el.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Production demo video failed to load')); }, {once:true});
  }));
  expect(duration).toBeGreaterThanOrEqual(35.9);
  expect(duration).toBeLessThanOrEqual(36.1);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter(text => /Content Security Policy|Refused to|TypeError|ReferenceError/i.test(text))).toEqual([]);
});
