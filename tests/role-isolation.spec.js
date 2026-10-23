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
  await page.getByRole('button', {name:'신청 제출'}).click();
  await expect(page.locator('#requestCount')).toHaveText('1');

  await page.locator('#statusBtn').click();
  const officeRequest = page.locator('.request-item').filter({hasText:'Microsoft Office'});
  const ticket = (await officeRequest.locator('.ticket-key').textContent()).trim();
  expect(ticket).toMatch(/^ITSM-\d+$/);
  await page.locator('.drawer-close').click();

  await revealRolePicker(page);
  await page.getByRole('combobox',{name:'직군 선택'}).selectOption('design');
  await expect(page.locator('#requestCount')).toHaveText('0');
  await page.locator('#statusBtn').click();
  await expect(page.locator('#drawerBody')).not.toContainText('Microsoft Office');
  await page.locator('.drawer-close').click();

  await page.reload();
  await expect(page.locator('#loginScreen')).toBeHidden();
  await expect(page.getByRole('combobox',{name:'직군 선택'})).toHaveValue('design');
  await expect(page.locator('#requestCount')).toHaveText('0');

  await revealRolePicker(page);
  await page.getByRole('combobox',{name:'직군 선택'}).selectOption('office');
  await expect(page.locator('#requestCount')).toHaveText('1');
  await page.locator('#statusBtn').click();
  const restored = page.locator('.request-item').filter({hasText:'Microsoft Office'});
  await expect(restored.locator('.ticket-key')).toHaveText(ticket);
});

async function revealRolePicker(page){
  await expect(page.getByRole('combobox',{name:'직군 선택'})).toBeVisible();
}
