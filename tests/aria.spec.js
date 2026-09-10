const { test, expect } = require('@playwright/test');

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
