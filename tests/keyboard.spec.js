const { test, expect } = require('@playwright/test');

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
