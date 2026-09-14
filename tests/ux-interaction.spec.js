'use strict';

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const SHOT_DIR = path.join('verification','ux-screenshots');

async function rect(locator){
  return locator.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom };
  });
}

async function stabilize(page){
  await page.clock.setFixedTime(new Date('2026-09-10T12:00:00+09:00'));
  await page.goto('/');
}

async function login(page){
  if(await page.locator('#loginScreen').isVisible()){
    await page.getByRole('button', { name:'Google SSO로 시작하기' }).click();
    await expect(page.locator('#loginScreen')).toBeHidden();
  }
}

async function openOfficeRequest(page){
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button', {name:'신청하기'}).click();
  await expect(page.locator('#requestBackdrop')).toHaveClass(/show/);
  return card;
}

async function capture(target,name){
  fs.mkdirSync(SHOT_DIR,{recursive:true});
  await target.screenshot({path:path.join(SHOT_DIR,name),animations:'disabled'});
}

test('[U1] SSO loading keeps approved geometry and captures the interaction state', async ({ page }) => {
  await stabilize(page);
  const card = page.locator('.login-card');
  const before = await rect(card);
  await page.getByRole('button', {name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginLoader')).toBeVisible();
  await expect(page.locator('.google-btn')).toHaveAttribute('aria-busy','true');
  await page.evaluate(() => document.fonts?.ready);
  await expect(page.locator('#loginLoader')).toBeVisible();
  const during = await rect(card);
  for(const key of ['x','y','width','height']){
    expect(Math.abs(during[key]-before[key]), `${key} changed during SSO loading`).toBeLessThanOrEqual(0.5);
  }
  await capture(card,'U1-sso-loading.png');
});

test('[U2] reduced-motion removes nonessential motion without breaking loading feedback', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await stabilize(page);
  await page.getByRole('button', {name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginLoader')).toBeVisible();
  const motion = await page.locator('#loginLoader .loader-bar span').evaluate(el => {
    const s = getComputedStyle(el);
    return {animationDuration:s.animationDuration,transitionDuration:s.transitionDuration,width:s.width};
  });
  expect(motion.animationDuration).toBe('0s');
  expect(motion.transitionDuration).toBe('0s');
  expect(parseFloat(motion.width)).toBeGreaterThan(0);
});

test('[U3] request modal keeps focus and viewport containment with visual evidence', async ({ page }) => {
  await stabilize(page);
  await login(page);
  await openOfficeRequest(page);
  await expect(page.locator('#requestNote')).toBeFocused();
  const modal = page.locator('.request-modal');
  const box = await rect(modal);
  const viewport = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.right).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.bottom).toBeLessThanOrEqual(viewport.height + 1);
  await capture(modal,'U3-request-modal.png');
});

test('[U4] admin drawer keeps actionable focus, touch target and visual evidence', async ({ page }) => {
  await stabilize(page);
  await login(page);
  await openOfficeRequest(page);
  await page.getByRole('button',{name:'신청 완료'}).click();
  await page.locator('#adminBtn').click();
  await expect(page.locator('#drawerBackdrop')).toHaveClass(/show/);
  await expect(page.locator('.drawer-close')).toBeFocused();
  const action = page.locator('.request-actions button').first();
  const actionBox = await rect(action);
  expect(actionBox.height).toBeGreaterThanOrEqual(44);
  const drawerBox = await rect(page.locator('.drawer'));
  expect(drawerBox.right).toBeLessThanOrEqual(page.viewportSize().width + 1);
  await capture(page.locator('.drawer'),'U4-admin-drawer.png');
});

test('[U5] dynamic completion and request messages are exposed through the live status region', async ({ page }) => {
  await stabilize(page);
  const toast = page.locator('#toast');
  await expect(toast).toHaveAttribute('role','status');
  await expect(toast).toHaveAttribute('aria-live','polite');
  await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
  await expect(toast).toContainText('가상 SSO 로그인 완료');
  await openOfficeRequest(page);
  await page.getByRole('button',{name:'신청 완료'}).click();
  await expect(toast).toContainText('신청이 접수되었습니다');
});

test('[U6] modal and drawer close actions return focus to their initiating control', async ({ page }) => {
  await stabilize(page);
  await login(page);
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  const trigger = card.getByRole('button',{name:'신청하기'});
  await trigger.click();
  await expect(page.locator('#requestNote')).toBeFocused();
  await page.locator('#requestBackdrop').getByRole('button',{name:'취소'}).click();
  await expect(trigger).toBeFocused();

  const status = page.locator('#statusBtn');
  await status.click();
  await expect(page.locator('.drawer-close')).toBeFocused();
  await page.locator('.drawer-close').click();
  await expect(status).toBeFocused();
});

test('[U7] responsive boundaries 320-768px avoid horizontal overflow and preserve the narrow-grid contract', async ({ page }) => {
  const widths = [320,340,359,360,390,768];
  for(const width of widths){
    await page.setViewportSize({width,height:760});
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    const layout = await page.evaluate(() => ({scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth}));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
    const reviewer = await rect(page.locator('.reviewer-entry'));
    expect(reviewer.x).toBeGreaterThanOrEqual(-0.5);
    expect(reviewer.right).toBeLessThanOrEqual(width + 0.5);
    const loginCard = await rect(page.locator('.login-card'));
    expect(loginCard.x).toBeGreaterThanOrEqual(-0.5);
    expect(loginCard.right).toBeLessThanOrEqual(width + 0.5);
  }

  await page.setViewportSize({width:359,height:760});
  await page.goto('/');
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await login(page);
  const narrow = page.locator('#commonGrid .card');
  const first = await rect(narrow.nth(0));
  const second = await rect(narrow.nth(1));
  expect(Math.abs(first.x-second.x)).toBeLessThanOrEqual(0.5);

  await page.setViewportSize({width:360,height:760});
  await page.goto('/');
  const wide = page.locator('#commonGrid .card');
  const wideFirst = await rect(wide.nth(0));
  const wideSecond = await rect(wide.nth(1));
  expect(wideSecond.x).toBeGreaterThan(wideFirst.x + 1);
});

test('[U8] rejection to remediation resubmission preserves ticket continuity and captures the transition state', async ({ page }) => {
  await stabilize(page);
  await login(page);
  await openOfficeRequest(page);
  await page.getByRole('button',{name:'신청 완료'}).click();
  await page.locator('#adminBtn').click();
  const originalTicket = (await page.locator('.request-item').filter({hasText:'Microsoft Office'}).locator('.ticket-key').textContent()).trim();
  await page.locator('.request-item').filter({hasText:'Microsoft Office'}).getByRole('button',{name:'반려'}).click();
  await expect(page.locator('#actionModalBackdrop')).toHaveClass(/show/);
  await page.getByRole('button',{name:'반려 처리'}).click();
  await page.locator('.drawer-close').click();
  await page.locator('#statusBtn').click();
  await page.locator('.request-item').filter({hasText:'Microsoft Office'}).getByRole('button',{name:'수정 후 재신청'}).click();
  await expect(page.locator('#requestTitle')).toContainText('수정 후 재신청');
  await expect(page.locator('.reject-recap')).toBeVisible();
  await expect(page.locator('#requestNote')).toBeFocused();
  await page.locator('#requestNote').fill('반려 사유에 맞춰 사용 목적과 필요 기간을 보완했습니다.');
  await capture(page.locator('.request-modal'),'U8-resubmit-modal.png');
  await page.getByRole('button',{name:'재신청하기'}).click();
  await page.locator('#statusBtn').click();
  const resubmittedTicket = (await page.locator('.request-item').filter({hasText:'Microsoft Office'}).locator('.ticket-key').textContent()).trim();
  expect(resubmittedTicket).toBe(originalTicket);
});
