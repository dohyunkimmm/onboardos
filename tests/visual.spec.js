const { test, expect } = require('@playwright/test');

async function stabilize(page){
  await page.clock.setFixedTime(new Date('2026-09-10T12:00:00+09:00'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(async () => { if(document.fonts?.ready) await document.fonts.ready; });
}
async function login(page){
  await page.getByRole('button', { name: 'Google SSO로 시작하기' }).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
  await page.locator('img').evaluateAll(images => { images.forEach(img => { img.loading = 'eager'; }); });
  await page.waitForFunction(() => [...document.images].every(img => img.complete));
}

const screenshotOptions = { animations:'disabled', caret:'hide', maxDiffPixelRatio:0.01 };

test('로그인 카드 visual baseline', async ({ page }) => {
  await stabilize(page);
  await expect(page.locator('.login-card')).toHaveScreenshot('login-card.png', screenshotOptions);
});

test('기본 대시보드 visual baseline', async ({ page }) => {
  await stabilize(page);
  await login(page);
  await expect(page).toHaveScreenshot('office-dashboard.png', { ...screenshotOptions, fullPage:true });
});

test('신청 모달 visual baseline', async ({ page }) => {
  await stabilize(page);
  await login(page);
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button', {name:'신청하기'}).click();
  await expect(page.locator('.request-modal')).toHaveScreenshot('request-modal.png', screenshotOptions);
});
