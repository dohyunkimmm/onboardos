const { test, expect } = require('@playwright/test');

async function login(page){
  await page.goto('/');
  if(await page.getByRole('button', {name:'Google SSO로 시작하기'}).isVisible()){
    await page.getByRole('button', {name:'Google SSO로 시작하기'}).click();
    await expect(page.locator('#loginScreen')).toBeHidden();
  }
}

test('직무 Preview의 신청 상태는 역할별로 격리되고 reload 후에도 복원된다', async ({ page }) => {
  await login(page);

  const officeCard = page.locator('#roleGrid .card[data-name="Microsoft Office"]');
  await officeCard.getByRole('button', {name:'신청하기'}).click();
  await page.getByRole('button', {name:'신청 완료'}).click();
  await expect(page.locator('#requestCount')).toHaveText('1');

  await page.locator('#statusBtn').click();
  const officeRequest = page.locator('.request-item').filter({hasText:'Microsoft Office'});
  const ticket = (await officeRequest.locator('.ticket-key').textContent()).trim();
  expect(ticket).toMatch(/^ITSM-\d+$/);
  await page.locator('.drawer-close').click();

  await page.locator('.role-tab[data-role="design"]').click();
  await expect(page.locator('#requestCount')).toHaveText('0');
  await page.locator('#statusBtn').click();
  await expect(page.locator('#drawerBody')).not.toContainText('Microsoft Office');
  await page.locator('.drawer-close').click();

  await page.reload();
  await expect(page.locator('#loginScreen')).toBeHidden();
  await expect(page.locator('.role-tab[data-role="design"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#requestCount')).toHaveText('0');

  await page.locator('.role-tab[data-role="office"]').click();
  await expect(page.locator('#requestCount')).toHaveText('1');
  await page.locator('#statusBtn').click();
  const restored = page.locator('.request-item').filter({hasText:'Microsoft Office'});
  await expect(restored.locator('.ticket-key')).toHaveText(ticket);
});
