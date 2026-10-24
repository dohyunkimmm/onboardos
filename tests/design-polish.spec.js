const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const SHOT_DIR = path.join('verification','design-polish-screenshots');
async function stabilize(page){
  await page.clock.setFixedTime(new Date('2026-09-15T12:00:00+09:00'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?review=1');
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
    return {fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,borderRadius:s.borderRadius,borderColor:s.borderColor,borderStyle:s.borderStyle,background:s.background,backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage,boxShadow:s.boxShadow,padding:s.padding,gap:s.gap,gridTemplateColumns:s.gridTemplateColumns,maxWidth:s.maxWidth};
  });
}

test('[D1] dashboard hierarchy increases readable width and headline contrast after login', async ({page}) => {
  await page.setViewportSize({width:1920,height:1080});
  await stabilize(page); await login(page);
  const main = await css(page.locator('main'));
  expect(parseFloat(main.maxWidth)).toBeGreaterThanOrEqual(1180);
  const title = await css(page.locator('.section-head h2').first());
  expect(parseFloat(title.fontSize)).toBe(15);
  expect(Number(title.fontWeight)).toBeGreaterThanOrEqual(700);
  await shot(page,'D1-dashboard-hierarchy.png');
});

test('[D2] overview panel uses layered surface and tighter information hierarchy', async ({page}) => {
  await stabilize(page); await login(page);
  const overview = await css(page.locator('.task-overview'));
  expect(parseFloat(overview.borderRadius)).toBe(0);
  expect(overview.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  await expect(page.locator('.overview-panel')).not.toHaveAttribute('open');
  await page.getByRole('button',{name:'도움말',exact:true}).click();
  await page.locator('.overview-panel > summary').click();
  const name = await css(page.locator('.overview-panel .name-input'));
  expect(parseFloat(name.fontSize)).toBeGreaterThanOrEqual(28);
});

test('[D3] 1920 desktop presents both groups in three comparable columns', async ({page}) => {
  await page.setViewportSize({width:1920,height:1080});
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
  expect(parseFloat(state.borderRadius)).toBeGreaterThanOrEqual(10);
  expect(state.background).not.toBe('none');
  expect(state.borderStyle).toBe('solid');
  const cta = await css(card.locator('.cta'));
  expect(cta.backgroundColor).toBe('rgb(255, 255, 255)');
  expect(Number(cta.fontWeight)).toBeGreaterThanOrEqual(600);
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
  expect(state.backgroundColor).toBe('rgb(255, 255, 255)');
  const h3 = await css(modal.locator('h3'));
  expect(parseFloat(h3.fontSize)).toBeGreaterThanOrEqual(23);
  await expect(modal.getByRole('button',{name:'신청 제출'})).toBeVisible();
  await shot(modal,'D6-request-modal-polish.png');
});

test('[D7] mobile density keeps compact single-column common cards, single-column role cards and no overflow', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await stabilize(page); await login(page);
  const common = await css(page.locator('#commonGrid'));
  expect(common.gridTemplateColumns.split(' ').length).toBe(1);
  const role = await css(page.locator('#roleGrid'));
  expect(role.gridTemplateColumns.split(' ').length).toBe(1);
  const overflow = await page.evaluate(() => ({scrollWidth:document.documentElement.scrollWidth,innerWidth}));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
  await shot(page,'D7-mobile-dashboard.png');
});

test('[D8] v17 preserves one product identity across login and post-login without changing login behavior', async ({page}) => {
  await stabilize(page);
  await expect(page.locator('body')).toHaveClass(/login-open/);
  const loginSurface = await css(page.locator('.login-card'));
  expect(parseFloat(loginSurface.borderRadius)).toBeGreaterThanOrEqual(20);
  expect(loginSurface.backgroundColor).toBe('rgb(255, 255, 255)');
  await login(page);
  await expect(page.locator('body')).not.toHaveClass(/login-open/);
  const panel = await css(page.locator('.task-overview'));
  expect(parseFloat(panel.borderRadius)).toBe(0);
  expect(panel.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  await expect(page.locator('.overview-panel')).not.toHaveAttribute('open');
});
