const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const SHOT_DIR = path.join('verification','experience-evolution-screenshots');

async function stabilize(page){
  await page.clock.setFixedTime(new Date('2026-09-16T12:00:00+09:00'));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('#v12ExperienceStylesheet')).toHaveCount(1);
  await page.waitForFunction(() => !!document.getElementById('v12ExperienceStylesheet')?.sheet);
  await page.evaluate(async () => { if(document.fonts?.ready) await document.fonts.ready; });
}

async function login(page){
  await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
  await expect(page.locator('#v12FocusPanel')).toBeVisible();
}

async function shot(target,name){
  fs.mkdirSync(SHOT_DIR,{recursive:true});
  await target.screenshot({path:path.join(SHOT_DIR,name),animations:'disabled'});
}

async function css(locator,pseudo=null){
  return locator.evaluate((el,pseudo) => {
    const s=getComputedStyle(el,pseudo);
    return {
      display:s.display,
      width:s.width,
      minHeight:s.minHeight,
      borderStyle:s.borderStyle,
      borderColor:s.borderColor,
      borderLeftWidth:s.borderLeftWidth,
      borderRadius:s.borderRadius,
      backgroundImage:s.backgroundImage,
      boxShadow:s.boxShadow,
      gridTemplateColumns:s.gridTemplateColumns,
      overflowX:s.overflowX,
      transitionDuration:s.transitionDuration,
      position:s.position,
      opacity:s.opacity,
      transform:s.transform
    };
  },pseudo);
}

test('[X1] next-action brief makes the current task explicit without altering the five-step flow',async({page})=>{
  await stabilize(page);await login(page);
  await expect(page.locator('.progress-step')).toHaveCount(5);
  await expect(page.locator('#v12FocusStep')).toContainText('체험 1/3');
  await expect(page.locator('#v12FocusTitle')).toContainText('신청');
  await expect(page.locator('#v12FocusRequests')).toHaveText('열린 요청 0건');
  const panel=await css(page.locator('#v12FocusPanel'));
  expect(panel.display).toBe('grid');
  expect(panel.backgroundImage).toContain('gradient');
  await shot(page.locator('.overview-panel'),'X1-next-action-brief.png');
});

test('[X2] next-action CTA moves keyboard focus to the first actionable role license',async({page})=>{
  await stabilize(page);await login(page);
  const action=page.locator('#v12FocusAction');
  await expect(action).toHaveText('다음 라이선스 보기');
  await action.click();
  await expect(page.locator('#roleGrid .cta').first()).toBeFocused();
});

test('[X3] task brief follows request state and opens the correct admin workbench',async({page})=>{
  await stabilize(page);await login(page);
  const office=page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await office.getByRole('button',{name:'신청하기'}).click();
  await page.locator('#requestNote').fill('업무 문서 작성 목적');
  await page.getByRole('button',{name:'신청 완료'}).click();
  await expect(page.locator('#v12FocusRequests')).toHaveText('열린 요청 1건');
  await expect(page.locator('#v12FocusAction')).toHaveText('관리자 검토 계속');
  await page.locator('#v12FocusAction').click();
  await expect(page.locator('#drawerBackdrop')).toHaveClass(/show/);
  await expect(page.locator('#drawerTitle')).toHaveText('관리자 체험');
  await shot(page.locator('.drawer'),'X3-admin-workbench.png');
});

test('[X4] actionable role cards expose a persistent semantic state rail and 40px primary action',async({page})=>{
  await stabilize(page);await login(page);
  const card=page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  const rail=await css(card,'::before');
  expect(parseFloat(rail.width)).toBeGreaterThanOrEqual(3);
  const action=await css(card.locator('.cta'));
  expect(parseFloat(action.minHeight)).toBeGreaterThanOrEqual(40);
  expect(action.backgroundImage).toContain('gradient');
  await shot(card,'X4-semantic-card.png');
});

test('[X5] role preview behaves as a segmented control on desktop and a scrollable chooser on mobile',async({page})=>{
  await stabilize(page);await login(page);
  const active=await css(page.locator('.role-tab.active'));
  expect(active.backgroundImage).toContain('gradient');
  await page.setViewportSize({width:390,height:844});
  const tabs=await css(page.locator('.role-tabs'));
  expect(tabs.overflowX).toBe('auto');
  const overflow=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth}));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth+1);
  await shot(page.locator('.role-picker'),'X5-mobile-role-chooser.png');
});

test('[X6] request drawer reads as a workbench with persistent header and separated request evidence',async({page})=>{
  await stabilize(page);await login(page);
  const office=page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await office.getByRole('button',{name:'신청하기'}).click();
  await page.getByRole('button',{name:'신청 완료'}).click();
  await page.getByRole('button',{name:/신청현황/}).click();
  const drawer=await css(page.locator('.drawer'));
  expect(parseFloat(drawer.width)).toBeGreaterThanOrEqual(420);
  const head=await css(page.locator('.drawer-head'));
  expect(head.position).toBe('sticky');
  const item=await css(page.locator('.request-item').first());
  expect(item.borderStyle).toBe('solid');
  expect(item.borderColor).not.toBe('rgba(0, 0, 0, 0)');
});

test('[X7] mobile keeps one dominant next action, two-column common licenses and no horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await stabilize(page);await login(page);
  const action=await css(page.locator('#v12FocusAction'));
  expect(parseFloat(action.minHeight)).toBeGreaterThanOrEqual(44);
  const common=await css(page.locator('#commonGrid'));
  expect(common.gridTemplateColumns.split(' ').length).toBe(2);
  const role=await css(page.locator('#roleGrid'));
  expect(role.gridTemplateColumns.split(' ').length).toBe(1);
  const overflow=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth}));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth+1);
  await shot(page,'X7-mobile-action-economy.png');
});

test('[X8] v12 styling remains post-login scoped and reduced-motion disables motion without hiding content',async({page})=>{
  await stabilize(page);
  await expect(page.locator('body')).toHaveClass(/login-open/);
  const loginCard=await css(page.locator('.login-card'));
  expect(loginCard.borderRadius).not.toBe('24px');
  await login(page);
  const duration=await page.locator('#v12FocusAction').evaluate(el=>getComputedStyle(el).transitionDuration);
  expect(duration.split(',').every(value=>parseFloat(value)===0)).toBeTruthy();
  const overview=await css(page.locator('.overview-panel'));
  const roleCard=await css(page.locator('#roleGrid .card').first());
  expect(parseFloat(overview.opacity)).toBe(1);
  expect(parseFloat(roleCard.opacity)).toBe(1);
  expect(overview.transform).toBe('none');
  expect(roleCard.transform).toBe('none');
  await page.locator('#v12FocusAction').focus();
  await expect(page.locator('#v12FocusAction')).toBeFocused();
  await shot(page.locator('#v12FocusPanel'),'X8-reduced-motion-focus.png');
});