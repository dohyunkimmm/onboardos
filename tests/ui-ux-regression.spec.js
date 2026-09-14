const { test, expect } = require('@playwright/test');

async function login(page){
  await page.getByRole('button', { name: 'Google SSO로 시작하기' }).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
}

async function rect(locator){
  return locator.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { x:r.x, y:r.y, width:r.width, height:r.height };
  });
}

test('SSO 인증 중에도 로그인 카드 geometry가 변하지 않는다', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.login-card');
  const note = page.locator('.login-note');
  const before = await rect(card);

  await page.getByRole('button', { name: 'Google SSO로 시작하기' }).click();
  await expect(page.locator('#loginLoader')).toBeVisible();
  await expect(note).toBeHidden();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#loginLoader')).toBeVisible();

  const during = await rect(card);
  for(const key of ['x','y','width','height']){
    expect(Math.abs(during[key] - before[key]), `${key} changed during SSO loading`).toBeLessThanOrEqual(0.5);
  }
});

test('모바일 로그인 화면은 reviewer bar를 위한 하단 안전 여백을 확보한다', async ({ page }) => {
  await page.setViewportSize({ width:390, height:700 });
  await page.goto('/');

  const metrics = await page.locator('#loginScreen').evaluate(screen => {
    const nav = screen.querySelector('.reviewer-entry');
    const style = getComputedStyle(screen);
    return {
      paddingBottom: parseFloat(style.paddingBottom),
      reviewerHeight: nav.getBoundingClientRect().height
    };
  });
  expect(metrics.paddingBottom).toBeGreaterThanOrEqual(metrics.reviewerHeight + 20);
});

test('모바일 상단은 초기화 액션을 중복 노출하지 않는다', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await page.goto('/');
  await login(page);

  await expect(page.locator('#resetBtn')).toBeHidden();
  await expect(page.locator('#moreBtn')).toBeVisible();
});

test('진행 안내는 5단계 tracker를 단일 진행 기준으로 유지한다', async ({ page }) => {
  await page.goto('/');
  await login(page);

  await expect(page.locator('.demo-step-kicker')).toBeHidden();
  await expect(page.locator('.progress-hint .hint-arrow')).toBeHidden();
  await expect(page.locator('.progress-bar .progress-step')).toHaveCount(5);
  await expect(page.locator('#progressHint')).toContainText('전사 공통 항목');
});

test('초소형 모바일에서는 전사 공통 라이선스를 1열로 표시한다', async ({ page }) => {
  await page.setViewportSize({ width:340, height:740 });
  await page.goto('/');
  await login(page);

  const cards = page.locator('#commonGrid .card');
  await expect(cards).toHaveCount(6);
  const first = await rect(cards.nth(0));
  const second = await rect(cards.nth(1));
  expect(Math.abs(first.x - second.x)).toBeLessThanOrEqual(0.5);
  expect(second.y).toBeGreaterThan(first.y + first.height - 1);
});

test('모바일 drawer의 닫기와 처리 액션은 터치 목표 크기를 유지한다', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await page.goto('/');
  await login(page);

  const card = page.locator('#roleGrid .card').filter({ hasText:'Microsoft Office' });
  await card.getByRole('button', { name:'신청하기' }).click();
  await page.getByRole('button', { name:'신청 완료' }).click();
  await page.locator('#adminBtn').click();

  const closeBox = await rect(page.locator('.drawer-close'));
  expect(closeBox.width).toBeGreaterThanOrEqual(44);
  expect(closeBox.height).toBeGreaterThanOrEqual(44);

  const action = page.locator('.request-actions button').first();
  const actionBox = await rect(action);
  expect(actionBox.height).toBeGreaterThanOrEqual(44);
});
