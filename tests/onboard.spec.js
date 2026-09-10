const { test, expect } = require('@playwright/test');

async function login(page) {
  await page.getByRole('button', { name: 'Google SSO로 시작하기' }).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
  await expect(page.locator('#mainContent')).toBeFocused();
}

async function card(page, name) {
  return page.locator('#roleGrid .card').filter({ hasText: name });
}

test('신청 → IT 검토 → 지급 완료가 동일 티켓으로 연결되고 세션이 유지된다', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await login(page);

  const officeCard = await card(page, 'Microsoft Office');
  await officeCard.getByRole('button', { name: '신청하기' }).click();
  await page.locator('#requestNote').fill('신규 입사 업무용 문서 편집');
  await page.getByRole('button', { name: '신청 완료' }).click();
  await expect(page.locator('#statusBtn')).toBeFocused();

  await page.locator('#statusBtn').click();
  const userRequest = page.locator('.request-item').filter({ hasText: 'Microsoft Office' });
  const ticket = (await userRequest.locator('.ticket-key').textContent()).trim();
  expect(ticket).toMatch(/^ITSM-\d+$/);
  await page.locator('.drawer-close').click();

  await page.locator('#adminBtn').click();
  await expect(page.locator('.admin-demo-note')).toContainText('IT 관리자 역할 미리보기');
  const adminRequest = page.locator('.request-item').filter({ hasText: 'Microsoft Office' });
  await expect(adminRequest.locator('.ticket-key')).toHaveText(ticket);
  await adminRequest.getByRole('button', { name: 'IT 검토 완료' }).click();
  await expect(page.locator('.request-item').filter({ hasText: 'Microsoft Office' })).toContainText('지급 대기');
  await page.getByRole('button', { name: '지급 완료 처리' }).click();
  await expect(page.locator('.request-item').filter({ hasText: 'Microsoft Office' })).toContainText('지급 완료');
  await page.locator('.drawer-close').click();

  await page.reload();
  await expect(page.locator('#loginScreen')).toBeHidden();
  await page.locator('#statusBtn').click();
  await expect(page.locator('.request-item').filter({ hasText: ticket })).toContainText('지급 완료');
  expect(pageErrors).toEqual([]);
});

test('승인 필요 항목은 반려 사유 → 보완 → 재신청 → 관리자 승인으로 이어진다', async ({ page }) => {
  await page.goto('/');
  await login(page);
  await page.locator('.role-tab[data-role="design"]').click();

  const designCard = await card(page, 'Adobe Creative Cloud');
  await designCard.getByRole('button', { name: '승인 요청하기' }).click();
  await page.locator('#requestNote').fill('디자인 제작 업무용');
  await page.getByRole('button', { name: '신청 완료' }).click();

  await page.locator('#adminBtn').click();
  const request = page.locator('.request-item').filter({ hasText: 'Adobe Creative Cloud' });
  await request.getByRole('button', { name: '반려' }).click();
  await page.getByRole('button', { name: '반려 처리' }).click();
  await page.locator('.drawer-close').click();

  await page.locator('#statusBtn').click();
  const rejected = page.locator('.request-item').filter({ hasText: 'Adobe Creative Cloud' });
  await expect(rejected).toContainText('반려 사유');
  await rejected.getByRole('button', { name: '수정 후 재신청' }).click();
  await page.locator('#requestNote').fill('사용 목적과 필요 기간을 보완했습니다.');
  await page.getByRole('button', { name: '재신청하기' }).click();

  await page.locator('#adminBtn').click();
  const resubmitted = page.locator('.request-item').filter({ hasText: 'Adobe Creative Cloud' });
  await resubmitted.getByRole('button', { name: '관리자 승인하기' }).click();
  await expect(page.locator('.request-item').filter({ hasText: 'Adobe Creative Cloud' })).toContainText('지급 대기');
});

test('직무 미매핑 Fallback이 실제 데모 ITSM 요청으로 생성된다', async ({ page }) => {
  await page.goto('/');
  await login(page);
  await page.locator('.role-tab[data-role="unmapped"]').click();
  await page.getByRole('button', { name: '직무 정보 확인 요청' }).click();
  await page.getByRole('button', { name: '요청 접수' }).click();
  await expect(page.locator('#statusBtn')).toBeFocused();

  await page.locator('#statusBtn').click();
  const request = page.locator('.request-item').filter({ hasText: '직무 정보 확인 요청' });
  await expect(request.locator('.ticket-key')).toHaveText(/ITSM-\d+/);
  await page.locator('.drawer-close').click();

  await page.locator('#adminBtn').click();
  const adminRequest = page.locator('.request-item').filter({ hasText: '직무 정보 확인 요청' });
  await adminRequest.getByRole('button', { name: '요청 처리 완료' }).click();
  await expect(page.locator('.request-item').filter({ hasText: '직무 정보 확인 요청' })).toContainText('처리 완료');
});

test('목록에 없는 라이선스도 IT 헬프데스크 요청으로 추적된다', async ({ page }) => {
  await page.goto('/');
  await login(page);
  await page.getByRole('button', { name: 'IT 헬프데스크 문의하기' }).click();
  await page.locator('#supportRequestNote').fill('Tableau Creator · 대시보드 제작 목적');
  await page.getByRole('button', { name: '요청 접수' }).click();
  await page.locator('#statusBtn').click();
  const request = page.locator('.request-item').filter({ hasText: '기타 라이선스 요청' });
  await expect(request).toContainText('Tableau Creator');
  await expect(request.locator('.ticket-key')).toHaveText(/ITSM-\d+/);
});
