const { test, expect } = require('@playwright/test');

async function stabilize(page){
  await page.clock.setFixedTime(new Date('2026-09-18T12:00:00+09:00'));
  await page.goto('/?review=1');
  await page.evaluate(async () => { if(document.fonts?.ready) await document.fonts.ready; });
}

async function login(page){
  await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
}

async function box(locator){
  const value = await locator.boundingBox();
  expect(value).not.toBeNull();
  return value;
}

async function style(locator){
  return locator.evaluate(el => {
    const s = getComputedStyle(el);
    return {
      boxShadow:s.boxShadow,
      backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage,
      borderColor:s.borderColor,
      minHeight:s.minHeight,
      height:s.height,
      transitionDuration:s.transitionDuration,
      gridTemplateColumns:s.gridTemplateColumns
    };
  });
}

test('[T1] current task instruction is visually presented before the five-step tracker', async ({page}) => {
  await stabilize(page); await login(page);
  await expect(page.locator('.walkthrough')).not.toHaveAttribute('open');
  await page.getByRole('button',{name:'도움말',exact:true}).click();
  await page.locator('.walkthrough > summary').click();
  await expect(page.locator('#progressHint')).toContainText('필요한 라이선스의 신청 흐름을 체험하세요');
  await expect(page.locator('#progressHint .hint-cta')).toBeVisible();
});

test('[T2] common entitlements use the same card format as actionable role cards', async ({page}) => {
  await stabilize(page); await login(page);
  await expect(page.locator('details.common-first')).toHaveAttribute('open');
  const common = page.locator('#commonGrid .card').first();
  const role = page.locator('#roleGrid .card').first();
  const commonBox = await box(common);
  const roleBox = await box(role);
  const commonStyle = await style(common);
  const roleStyle = await style(role);
  expect(Math.abs(commonBox.width - roleBox.width)).toBeLessThanOrEqual(1);
  expect(commonBox.height).toBeLessThanOrEqual(210);
  expect(roleBox.height).toBeLessThanOrEqual(210);
  expect(commonStyle.boxShadow === 'none' || commonStyle.boxShadow.includes('inset')).toBeTruthy();
  expect(roleStyle.boxShadow).toBe('none');
  await expect(role.locator('.cta')).toBeVisible();
});

test('[T3] role decision cards keep status and CTA together in a stable action zone', async ({page}) => {
  await stabilize(page); await login(page);
  const card = page.locator('#roleGrid .card').filter({has:page.locator('.cta')}).first();
  await expect(card.locator('.status-pill')).toBeVisible();
  await expect(card.locator('.cta')).toBeVisible();
  const bottom = await box(card.locator('.card-bottom'));
  const action = await box(card.locator('.cta'));
  expect(action.y).toBeGreaterThanOrEqual(bottom.y - 1);
});

test('[T4] filter selection remains visually quieter than the primary card action', async ({page}) => {
  await stabilize(page); await login(page);
  const filter = await style(page.locator('.filter-chip.active'));
  const cta = await style(page.locator('#roleGrid .cta').first());
  expect(filter.boxShadow).toBe('none');
  expect(filter.backgroundColor).toBe('rgb(232, 240, 254)');
  expect(cta.backgroundColor).toBe('rgb(255, 255, 255)');
  expect(cta.backgroundColor).not.toBe(filter.backgroundColor);
});

test('[T5] request modal keeps the frozen request flow and a separated execution zone', async ({page}) => {
  await stabilize(page); await login(page);
  const card = page.locator('#roleGrid .card').filter({has:page.getByRole('button',{name:'신청하기'})}).first();
  await card.getByRole('button',{name:'신청하기'}).click();
  const modal = page.locator('.request-modal');
  await expect(modal).toBeVisible();
  await expect(modal.getByText('처리 기준')).toBeVisible();
  await expect(modal.getByText('예상 지급일')).toBeVisible();
  await expect(modal.getByRole('button',{name:'신청 제출'})).toBeVisible();
  const actions = await style(modal.locator('.modal-actions'));
  expect(actions.borderColor).not.toBe('rgba(0, 0, 0, 0)');
});

test('[T6] mobile preserves compact entitlements, single-column decisions, touch target and no overflow', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await stabilize(page); await login(page);
  const common = await style(page.locator('#commonGrid'));
  const role = await style(page.locator('#roleGrid'));
  expect(common.gridTemplateColumns.split(' ').length).toBe(1);
  expect(role.gridTemplateColumns.split(' ').length).toBe(1);
  const cta = await box(page.locator('#roleGrid .cta').first());
  expect(cta.height).toBeGreaterThanOrEqual(44);
  const overflow = await page.evaluate(() => ({scrollWidth:document.documentElement.scrollWidth,innerWidth}));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
});

test('[T7] reduced motion contract remains intact in v18', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await stabilize(page); await login(page);
  const card = await style(page.locator('#roleGrid .card').first());
  const cta = await style(page.locator('#roleGrid .cta').first());
  expect(card.transitionDuration).toMatch(/^0s/);
  expect(cta.transitionDuration).toMatch(/^0s/);
});

test('[T8] P6 progress semantics remain frozen at five steps with one current step', async ({page}) => {
  await stabilize(page); await login(page);
  await expect(page.locator('#progressBar .progress-step')).toHaveCount(5);
  await expect(page.locator('#progressBar [aria-current="step"]')).toHaveCount(1);
  await expect(page.locator('#progressBar [aria-current="step"]')).toContainText('라이선스 신청');
});
