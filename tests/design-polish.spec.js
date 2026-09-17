const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const SHOT_DIR = path.join('verification','design-polish-screenshots');
async function stabilize(page){
  await page.clock.setFixedTime(new Date('2026-09-15T12:00:00+09:00'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.evaluate(async () => { if(document.fonts?.ready) await document.fonts.ready; });
}
async function login(page){
  await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
}
async function shot(target,name){
  fs.mkdirSync(SHOT_DIR,{recursive:true});
  await target.screenshot({path:path.join(SHOT_DIR,name),animations:'disabled'});
}
async function css(locator){
  return locator.evaluate(el => {
    const s=getComputedStyle(el);
    return {fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,borderRadius:s.borderRadius,borderColor:s.borderColor,borderStyle:s.borderStyle,background:s.background,backgroundImage:s.backgroundImage,boxShadow:s.boxShadow,padding:s.padding,gap:s.gap,gridTemplateColumns:s.gridTemplateColumns,maxWidth:s.maxWidth};
  });
}

test('[D1] dashboard hierarchy increases readable width and headline contrast after login', async ({page}) => {
  await stabilize(page); await login(page);
  const main = await css(page.locator('main'));
  expect(parseFloat(main.maxWidth)).toBeGreaterThanOrEqual(1180);
  const title = await css(page.locator('.section-head h2').first());
  expect(parseFloat(title.fontSize)).toBeGreaterThanOrEqual(20);
  expect(Number(title.fontWeight)).toBeGreaterThanOrEqual(700);
  await shot(page,'D1-dashboard-hierarchy.png');
});

test('[D2] overview panel uses layered surface and tighter information hierarchy', async ({page}) => {
  await stabilize(page); await login(page);
  const panel = await css(page.locator('.overview-panel'));
  expect(parseFloat(panel.borderRadius)).toBeGreaterThanOrEqual(24);
  expect(panel.backgroundImage).toContain('gradient');
  expect(panel.boxShadow).not.toBe('none');
  const name = await css(page.locator('.overview-panel .name-input'));
  expect(parseFloat(name.fontSize)).toBeGreaterThanOrEqual(28);
});

test('[D3] desktop content density uses three-column license grids where space allows', async ({page}) => {
  await stabilize(page); await login(page);
  const common = await css(page.locator('#commonGrid'));
  expect(common.gridTemplateColumns.split(' ').length).toBe(3);
  const role = await css(page.locator('#roleGrid'));
  expect(role.gridTemplateColumns.split(' ').length).toBe(3);
});

test('[D4] role cards use consistent elevated surfaces and stronger primary CTA', async ({page}) => {
  await stabilize(page); await login(page);
  const card = page.locator('#roleGrid .card').first();
  const state = await css(card);
  expect(parseFloat(state.borderRadius)).toBeGreaterThanOrEqual(18);
  expect(state.backgroundImage).toContain('gradient');
  expect(state.boxShadow).not.toBe('none');
  const cta = await css(card.locator('.cta'));
  expect(cta.backgroundImage).toContain('gradient');
  expect(Number(cta.fontWeight)).toBeGreaterThanOrEqual(700);
  await shot(card,'D4-role-card-system.png');
});

test('[D5] status pills retain semantic color while gaining a visible boundary', async ({page}) => {
  await stabilize(page); await login(page);
  for(const pill of await page.locator('.status-pill').all()){
    const state = await css(pill);
    expect(state.borderStyle).toBe('solid');
    expect(state.borderColor).not.toBe('rgba(0, 0, 0, 0)');
  }
});

test('[D6] request modal has stronger hierarchy without changing the request flow', async ({page}) => {
  await stabilize(page); await login(page);
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button',{name:'신청하기'}).click();
  const modal = page.locator('.request-modal');
  const state = await css(modal);
  expect(parseFloat(state.borderRadius)).toBeGreaterThanOrEqual(24);
  expect(state.backgroundImage).toContain('gradient');
  const h3 = await css(modal.locator('h3'));
  expect(parseFloat(h3.fontSize)).toBeGreaterThanOrEqual(23);
  await expect(modal.getByRole('button',{name:'신청 완료'})).toBeVisible();
  await shot(modal,'D6-request-modal-polish.png');
});

test('[D7] mobile density keeps two-column common cards, single-column role cards and no overflow', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await stabilize(page); await login(page);
  const common = await css(page.locator('#commonGrid'));
  expect(common.gridTemplateColumns.split(' ').length).toBe(2);
  const role = await css(page.locator('#roleGrid'));
  expect(role.gridTemplateColumns.split(' ').length).toBe(1);
  const overflow = await page.evaluate(() => ({scrollWidth:document.documentElement.scrollWidth,innerWidth}));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
  await shot(page,'D7-mobile-dashboard.png');
});

test('[D8] v16 unifies login and post-login visual language without changing login behavior', async ({page}) => {
  await stabilize(page);
  await expect(page.locator('body')).toHaveClass(/login-open/);
  const loginSurface = await css(page.locator('.login-card'));
  expect(loginSurface.borderRadius).toBe('24px');
  expect(loginSurface.backgroundImage).toContain('gradient');
  await login(page);
  await expect(page.locator('body')).not.toHaveClass(/login-open/);
  const panel = await css(page.locator('.overview-panel'));
  expect(panel.borderRadius).toBe('24px');
  expect(panel.backgroundImage).toContain('gradient');
});
