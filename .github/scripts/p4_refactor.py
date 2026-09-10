from pathlib import Path
import json

root = Path('.')

def write(path, text):
    p = root / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')

# package.json
pkg = json.loads((root/'package.json').read_text(encoding='utf-8'))
pkg['version'] = '1.7.0'
pkg['scripts'].update({
    'test:domain': 'playwright test tests/domain.spec.js --project=desktop-chromium',
    'test:keyboard': 'playwright test tests/keyboard.spec.js --project=desktop-chromium',
    'test:cross-browser': 'playwright test -c playwright.cross-browser.config.js',
    'test:production': 'playwright test -c playwright.production.config.js',
    'test:lighthouse': 'lhci collect --config=./lighthouserc.cjs && lhci assert --config=./lighthouserc.cjs'
})
pkg['devDependencies']['@lhci/cli'] = '^0.15.1'
write('package.json', json.dumps(pkg, ensure_ascii=False, indent=2) + '\n')

# Keep production/cross-browser suites out of the local Chromium matrix.
pw = (root/'playwright.config.js').read_text(encoding='utf-8')
pw = pw.replace("  testDir: './tests',\n", "  testDir: './tests',\n  testIgnore: ['**/production.spec.js', '**/cross-browser.spec.js'],\n")
write('playwright.config.js', pw)

# WCAG A/AA contract, not impact-severity filtering.
a11y = (root/'tests/accessibility.spec.js').read_text(encoding='utf-8')
old = "async function assertA11y(page, label){\n  const result = await new AxeBuilder({ page }).analyze();\n  const blocking = result.violations.filter(v => ['critical','serious'].includes(v.impact));\n  expect(blocking, `${label}: ${blocking.map(v => `${v.id}(${v.nodes.length})`).join(', ')}`).toEqual([]);\n}"
new = "async function assertA11y(page, label){\n  const result = await new AxeBuilder({ page })\n    .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa'])\n    .analyze();\n  expect(result.violations, `${label}: ${result.violations.map(v => `${v.id}(${v.nodes.length})`).join(', ')}`).toEqual([]);\n}"
if old not in a11y:
    raise SystemExit('accessibility assertion anchor not found')
a11y = a11y.replace(old, new).replace('critical/serious axe', 'WCAG A/AA axe')
write('tests/accessibility.spec.js', a11y)

# Local QA server: emulate Vercel analytics scripts as no-ops to avoid local-only 404 noise.
serve = (root/'scripts/serve.js').read_text(encoding='utf-8')
anchor = "  if(pathname === '/') pathname = '/index.html';\n"
insert = "  if(pathname === '/') pathname = '/index.html';\n  if(pathname === '/_vercel/insights/script.js' || pathname === '/_vercel/speed-insights/script.js'){\n    res.writeHead(200, {...securityHeaders, 'Content-Type':'application/javascript; charset=utf-8', 'Cache-Control':'no-store'}); res.end('/* local QA analytics noop */'); return;\n  }\n  if(pathname.startsWith('/_vercel/insights/') || pathname.startsWith('/_vercel/speed-insights/')){\n    res.writeHead(204, {...securityHeaders, 'Cache-Control':'no-store'}); res.end(); return;\n  }\n"
if anchor not in serve:
    raise SystemExit('serve anchor not found')
serve = serve.replace(anchor, insert)
write('scripts/serve.js', serve)

write('playwright.cross-browser.config.js', """const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: 'cross-browser.spec.js',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-cross-browser' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    timezoneId: 'Asia/Seoul'
  },
  projects: [
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'] } }
  ],
  webServer: {
    command: 'node scripts/serve.js',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000
  }
});
""")

write('playwright.production.config.js', """const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: 'production.spec.js',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-production' }]] : 'list',
  use: {
    baseURL: process.env.PRODUCTION_URL || 'https://onboardos-rho.vercel.app',
    trace: 'retain-on-failure',
    timezoneId: 'Asia/Seoul'
  },
  projects: [
    { name: 'production-chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
""")

write('tests/domain.spec.js', """const { test, expect } = require('@playwright/test');

async function login(page){
  await page.goto('/');
  await page.getByRole('button', { name: 'Google SSO로 시작하기' }).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
}

const ymd = value => new Date(value).toISOString().slice(0, 10);

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-11T12:00:00+09:00'));
});

test('영업일 계산이 주말·월말·연말 경계에서 일관된다', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => ({
    fridayPlus1: businessDate(1, new Date('2026-09-11T12:00:00+09:00')).toISOString(),
    fridayPlus2: businessDate(2, new Date('2026-09-11T12:00:00+09:00')).toISOString(),
    monthEnd: businessDate(1, new Date('2026-01-30T12:00:00+09:00')).toISOString(),
    yearEnd: businessDate(2, new Date('2026-12-31T12:00:00+09:00')).toISOString(),
    forwardDistance: businessDayDistance(new Date('2026-09-11T12:00:00+09:00'), new Date('2026-09-14T12:00:00+09:00')),
    reverseDistance: businessDayDistance(new Date('2026-09-14T12:00:00+09:00'), new Date('2026-09-11T12:00:00+09:00')),
    slaToday: getSlaHealth({status:'pending', dueDate:new Date('2026-09-11T12:00:00+09:00').toISOString()}).label,
    slaSoon: getSlaHealth({status:'pending', dueDate:new Date('2026-09-14T12:00:00+09:00').toISOString()}).label,
    slaOver: getSlaHealth({status:'pending', dueDate:new Date('2026-09-10T12:00:00+09:00').toISOString()}).label
  }));
  expect(ymd(result.fridayPlus1)).toBe('2026-09-14');
  expect(ymd(result.fridayPlus2)).toBe('2026-09-15');
  expect(ymd(result.monthEnd)).toBe('2026-02-02');
  expect(ymd(result.yearEnd)).toBe('2027-01-04');
  expect(result.forwardDistance).toBe(1);
  expect(result.reverseDistance).toBe(-1);
  expect(result.slaToday).toBe('오늘 마감');
  expect(result.slaSoon).toBe('마감 임박 · D-1');
  expect(result.slaOver).toBe('SLA 초과 · D+1');
});

test('요청 상태는 request → pending → approved → completed이며 티켓은 유지된다', async ({ page }) => {
  await login(page);
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  expect(await page.evaluate(() => findLicenseByName('Microsoft Office').status)).toBe('request');
  await card.getByRole('button', {name:'신청하기'}).click();
  await page.getByRole('button', {name:'신청 완료'}).click();
  const pending = await page.evaluate(() => ({status:requestState['Microsoft Office'].status, ticket:requestState['Microsoft Office'].ticket}));
  expect(pending.status).toBe('pending');
  await page.locator('#adminBtn').click();
  await page.locator('.request-item').filter({hasText:'Microsoft Office'}).getByRole('button', {name:'IT 검토 완료'}).click();
  const approved = await page.evaluate(() => ({status:requestState['Microsoft Office'].status, ticket:requestState['Microsoft Office'].ticket}));
  expect(approved).toEqual({status:'approved', ticket:pending.ticket});
  await page.getByRole('button', {name:'지급 완료 처리'}).click();
  const completed = await page.evaluate(() => ({status:requestState['Microsoft Office'].status, ticket:requestState['Microsoft Office'].ticket}));
  expect(completed).toEqual({status:'completed', ticket:pending.ticket});
});

test('반려 후 보완 재신청은 동일 ITSM 티켓의 이력을 이어간다', async ({ page }) => {
  await login(page);
  await page.locator('.role-tab[data-role="design"]').click();
  const card = page.locator('#roleGrid .card').filter({hasText:'Adobe Creative Cloud'});
  await card.getByRole('button', {name:'승인 요청하기'}).click();
  await page.locator('#requestNote').fill('디자인 제작 업무용');
  await page.getByRole('button', {name:'신청 완료'}).click();
  const original = await page.evaluate(() => requestState['Adobe Creative Cloud'].ticket);
  await page.locator('#adminBtn').click();
  await page.locator('.request-item').filter({hasText:'Adobe Creative Cloud'}).getByRole('button', {name:'반려'}).click();
  await page.getByRole('button', {name:'반려 처리'}).click();
  await page.locator('.drawer-close').click();
  await page.locator('#statusBtn').click();
  await page.locator('.request-item').filter({hasText:'Adobe Creative Cloud'}).getByRole('button', {name:'수정 후 재신청'}).click();
  await page.locator('#requestNote').fill('필요 기간과 사용 목적을 보완했습니다.');
  await page.getByRole('button', {name:'재신청하기'}).click();
  const after = await page.evaluate(() => ({ticket:requestState['Adobe Creative Cloud'].ticket, status:requestState['Adobe Creative Cloud'].status, history:requestState['Adobe Creative Cloud'].history.map(x => x.label)}));
  expect(after.ticket).toBe(original);
  expect(after.status).toBe('pending');
  expect(after.history.some(label => label.includes('재신청 접수'))).toBeTruthy();
});
""")

write('tests/keyboard.spec.js', """const { test, expect } = require('@playwright/test');

async function login(page){
  await page.goto('/');
  await expect(page.locator('.login-card')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', {name:'Google SSO로 시작하기'})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#loginScreen')).toBeHidden();
  await expect(page.locator('#mainContent')).toBeFocused();
}

test('신청 모달은 focus trap, ESC 닫기, trigger focus 복귀를 보장한다', async ({ page }) => {
  await login(page);
  const trigger = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'}).getByRole('button', {name:'신청하기'});
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#requestNote')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#submitRequestBtn')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#requestNote')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#requestBackdrop')).not.toHaveClass(/show/);
  await expect(trigger).toBeFocused();
});

test('Drawer는 ESC로 닫히고 원래 trigger로 focus가 복귀한다', async ({ page }) => {
  await login(page);
  await page.locator('#statusBtn').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.drawer-close')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#drawerBackdrop')).not.toHaveClass(/show/);
  await expect(page.locator('#statusBtn')).toBeFocused();
});
""")

write('tests/aria.spec.js', """const { test, expect } = require('@playwright/test');

async function fixed(page){
  await page.clock.setFixedTime(new Date('2026-09-11T12:00:00+09:00'));
  await page.goto('/');
}
async function login(page){
  await page.getByRole('button', {name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
}

test('로그인 카드 ARIA snapshot', async ({ page }) => {
  await fixed(page);
  await expect(page.locator('.login-card')).toMatchAriaSnapshot({name:'login-card.aria.yml'});
});

test('신청 모달 ARIA snapshot', async ({ page }) => {
  await fixed(page);
  await login(page);
  await page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'}).getByRole('button', {name:'신청하기'}).click();
  await expect(page.locator('.request-modal')).toMatchAriaSnapshot({name:'request-modal.aria.yml'});
});

test('관리자 Drawer ARIA snapshot', async ({ page }) => {
  await fixed(page);
  await login(page);
  await page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'}).getByRole('button', {name:'신청하기'}).click();
  await page.getByRole('button', {name:'신청 완료'}).click();
  await page.locator('#adminBtn').click();
  await expect(page.locator('#drawerPanel')).toMatchAriaSnapshot({name:'admin-drawer.aria.yml'});
});
""")

write('tests/cross-browser.spec.js', """const { test, expect } = require('@playwright/test');

test('Firefox/WebKit에서 신청 → 사용자/관리자 동일 티켓 핵심 Flow가 동작한다', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', {name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button', {name:'신청하기'}).click();
  await page.locator('#requestNote').fill('브라우저 호환성 검증');
  await page.getByRole('button', {name:'신청 완료'}).click();
  await page.locator('#statusBtn').click();
  const userReq = page.locator('.request-item').filter({hasText:'Microsoft Office'});
  const ticket = (await userReq.locator('.ticket-key').textContent()).trim();
  expect(ticket).toMatch(/^ITSM-\\d+$/);
  await page.locator('.drawer-close').click();
  await page.locator('#adminBtn').click();
  const adminReq = page.locator('.request-item').filter({hasText:'Microsoft Office'});
  await expect(adminReq.locator('.ticket-key')).toHaveText(ticket);
  await adminReq.getByRole('button', {name:'IT 검토 완료'}).click();
  await expect(page.locator('.request-item').filter({hasText:'Microsoft Office'})).toContainText('지급 대기');
  expect(pageErrors).toEqual([]);
});
""")

write('tests/production.spec.js', """const { test, expect } = require('@playwright/test');

test('실제 Production에서 핵심 Flow·CSP·asset·console 상태가 정상이다', async ({ page }) => {
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
  expect(ticket).toMatch(/^ITSM-\\d+$/);
  await request.getByRole('button', {name:'IT 검토 완료'}).click();
  await page.getByRole('button', {name:'지급 완료 처리'}).click();
  await expect(page.locator('.request-item').filter({hasText:'Microsoft Office'})).toContainText('지급 완료');
  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter(text => /Content Security Policy|Refused to|TypeError|ReferenceError/i.test(text))).toEqual([]);
});
""")

write('lighthouserc.cjs', """module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:4173/'],
      numberOfRuns: 3,
      startServerCommand: 'node scripts/serve.js',
      startServerReadyPattern: 'QA server listening',
      startServerReadyTimeout: 15000,
      settings: {
        chromeFlags: '--headless --no-sandbox'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.85, aggregationMethod: 'optimistic'}],
        'categories:accessibility': ['error', {minScore: 0.95, aggregationMethod: 'optimistic'}],
        'categories:best-practices': ['error', {minScore: 0.90, aggregationMethod: 'optimistic'}],
        'categories:seo': ['error', {minScore: 0.90, aggregationMethod: 'optimistic'}],
        'first-contentful-paint': ['error', {maxNumericValue: 2500, aggregationMethod: 'optimistic'}],
        'largest-contentful-paint': ['error', {maxNumericValue: 3500, aggregationMethod: 'optimistic'}],
        'cumulative-layout-shift': ['error', {maxNumericValue: 0.10, aggregationMethod: 'optimistic'}],
        'total-blocking-time': ['error', {maxNumericValue: 300, aggregationMethod: 'optimistic'}],
        'total-byte-weight': ['error', {maxNumericValue: 3000000, aggregationMethod: 'optimistic'}]
      }
    }
  }
};
""")

workflow = """name: E2E

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read
  statuses: read

jobs:
  playwright:
    name: Chromium quality / functional / a11y / visual / domain
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Fast quality gate
        run: |
          npm run quality
          node --check app.js
          node --check js/a11y.js
          node --check js/analytics.js
          node --check js/events.js
          node --check scripts/quality-check.js
          node --check scripts/serve.js
          node --check playwright.config.js
          node --check playwright.cross-browser.config.js
          node --check playwright.production.config.js
          node --check lighthouserc.cjs
          python3 -m json.tool vercel.json >/dev/null
      - name: Install Chromium
        run: npx playwright install --with-deps chromium
      - name: Functional, WCAG/keyboard/ARIA, domain and visual regression tests
        run: npm run test:e2e
      - name: Upload Playwright report on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-chromium
          path: playwright-report/
          retention-days: 7

  cross-browser:
    name: Firefox / WebKit functional smoke
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps firefox webkit
      - run: npm run test:cross-browser
      - name: Upload cross-browser report on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-cross-browser
          path: playwright-report-cross-browser/
          retention-days: 7

  lighthouse:
    name: Lighthouse performance budget
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Lighthouse CI · 3 runs + budgets
        run: npm run test:lighthouse
      - name: Upload Lighthouse reports on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: lighthouseci
          path: .lighthouseci/
          retention-days: 7

  production-smoke:
    name: Production smoke after Vercel deployment
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: [playwright, cross-browser, lighthouse]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Wait for this commit's Vercel status
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          for attempt in {1..36}; do
            state="$(gh api "repos/${GITHUB_REPOSITORY}/commits/${GITHUB_SHA}/status" --jq '[.statuses[] | select(.context == "Vercel")][0].state // ""')"
            echo "Vercel status: ${state:-pending}"
            if [ "$state" = "success" ]; then exit 0; fi
            if [ "$state" = "failure" ] || [ "$state" = "error" ]; then exit 1; fi
            sleep 5
          done
          echo 'Timed out waiting for Vercel deployment status' >&2
          exit 1
      - run: npx playwright install --with-deps chromium
      - name: Production browser smoke
        env:
          PRODUCTION_URL: https://onboardos-rho.vercel.app
        run: npm run test:production
      - name: Upload Production smoke report on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-production
          path: playwright-report-production/
          retention-days: 7
"""
write('.github/workflows/e2e.yml', workflow)

ignore = (root/'.gitignore').read_text(encoding='utf-8')
for line in ['.lighthouseci/','playwright-report-cross-browser/','playwright-report-production/']:
    if line not in ignore:
        ignore += line + '\n'
write('.gitignore', ignore)

readme = (root/'README.md').read_text(encoding='utf-8')
readme = readme.replace('- Playwright E2E / axe accessibility / Visual Regression\n- GitHub Actions Quality Gate', '- Playwright E2E / axe WCAG A·AA / ARIA Snapshot / Visual Regression\n- Firefox·WebKit Cross-browser Smoke / Production Smoke\n- Lighthouse CI Performance Budget\n- GitHub Actions Quality Gate')
oldqa = 'PR 및 `main` push에서 GitHub Actions가 데이터·CSP·소스 Quality Gate를 먼저 실행하고, 이후 기능 E2E·axe 접근성 검사·Desktop/Mobile Visual Regression을 검증합니다.\n'
newqa = '''PR 및 `main` push에서 GitHub Actions가 데이터·CSP·소스 Quality Gate를 먼저 실행하고, 이후 기능 E2E·WCAG A/AA axe 검사·Keyboard/Focus Contract·ARIA Snapshot·Desktop/Mobile Visual Regression을 검증합니다. Firefox와 WebKit에서는 핵심 신청/관리자 Flow를 별도 Smoke로 확인하고, Lighthouse CI는 동일 화면을 3회 측정해 성능 Budget을 검사합니다.\n\n`main` push에서는 위 로컬/정적 검증이 모두 통과한 뒤 **해당 commit의 Vercel status가 success인지 확인하고 실제 Production URL을 Chromium으로 열어** 핵심 Flow, CSP, 주요 asset 200, page/console error를 다시 검증합니다. Production Smoke 중 Analytics 전송 endpoint는 intercept하여 검증 트래픽이 지표를 오염시키지 않도록 합니다.\n\n## Verification Matrix\n\n| 검증 영역 | 자동 Gate | 범위 |\n| --- | --- | --- |\n| Business Flow | Playwright | 신청·검토/승인·반려·재신청·Fallback·지급 완료 |\n| Domain Invariant | Playwright | 상태 전이·동일 ITSM 티켓·주말/월말/연말 SLA 경계 |\n| Accessibility | axe + Playwright | WCAG 2.x A/AA 자동 규칙·Keyboard/Focus·ARIA Snapshot |\n| Visual Regression | Playwright Screenshot | Desktop/Mobile 로그인·Dashboard·신청 Modal |\n| Cross-browser | Playwright | Firefox/WebKit 핵심 신청·관리자 Flow |\n| Performance | Lighthouse CI | 3회 측정·Performance/A11y/Best Practices/SEO·Web Vitals/byte budget |\n| Production | Playwright + Vercel status | 실제 Production Flow·CSP·asset 200·page/console error |\n'''
if oldqa not in readme:
    raise SystemExit('README QA anchor not found')
readme = readme.replace(oldqa, newqa)
write('README.md', readme)
