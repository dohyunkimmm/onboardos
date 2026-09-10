const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function login(page){
  await page.goto('/');
  await page.getByRole('button', { name: 'Google SSO로 시작하기' }).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
}
async function assertA11y(page, label){
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22a','wcag22aa'])
    .analyze();
  expect(result.violations, `${label}: ${result.violations.map(v => `${v.id}(${v.nodes.length})`).join(', ')}`).toEqual([]);
}

test('로그인 화면에 WCAG A/AA axe 위반이 없다', async ({ page }) => {
  await page.goto('/');
  await assertA11y(page, 'login');
});

test('메인 대시보드에 WCAG A/AA axe 위반이 없다', async ({ page }) => {
  await login(page);
  await assertA11y(page, 'dashboard');
});

test('라이선스 신청 모달에 WCAG A/AA axe 위반이 없다', async ({ page }) => {
  await login(page);
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button', {name:'신청하기'}).click();
  await assertA11y(page, 'request-modal');
});

test('사용자 신청현황 Drawer에 WCAG A/AA axe 위반이 없다', async ({ page }) => {
  await login(page);
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button', {name:'신청하기'}).click();
  await page.getByRole('button', {name:'신청 완료'}).click();
  await page.locator('#statusBtn').click();
  await assertA11y(page, 'user-drawer');
});

test('관리자 체험 Drawer에 WCAG A/AA axe 위반이 없다', async ({ page }) => {
  await login(page);
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button', {name:'신청하기'}).click();
  await page.getByRole('button', {name:'신청 완료'}).click();
  await page.locator('#adminBtn').click();
  await assertA11y(page, 'admin-drawer');
});
