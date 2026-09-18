'use strict';

const { test, expect } = require('@playwright/test');

async function stabilize(page){
  await page.clock.setFixedTime(new Date('2026-09-18T12:00:00+09:00'));
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.goto('/');
}

async function login(page){
  await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
}

async function openOfficeRequest(page){
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button',{name:'신청하기'}).click();
  await expect(page.locator('#requestBackdrop')).toHaveClass(/show/);
}

async function rect(locator){
  return locator.evaluate(el => {
    const r = el.getBoundingClientRect();
    return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};
  });
}

test('[X1] execution hierarchy layer loads after the canonical visual system', async ({page}) => {
  await stabilize(page);
  const order = await page.evaluate(() => Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => link.getAttribute('href')));
  expect(order).toContain('visual-system.css');
  expect(order).toContain('execution-hierarchy.css');
  expect(order.indexOf('execution-hierarchy.css')).toBeGreaterThan(order.indexOf('visual-system.css'));
});

test('[X2] request modal promotes SLA and expected delivery above secondary metadata', async ({page}) => {
  await stabilize(page); await login(page); await openOfficeRequest(page);
  const rows = page.locator('#requestDetails > .detail-row');
  await expect(rows).toHaveCount(7);

  const sla = page.locator('#requestDetails > .detail-row').filter({hasText:'SLA 기준'});
  const expected = page.locator('#requestDetails > .detail-row').filter({hasText:'예상 지급일'});
  const ordinary = page.locator('#requestDetails > .detail-row').filter({hasText:'지급 대상'});
  const slaStyle = await sla.evaluate(el => ({bg:getComputedStyle(el).backgroundImage,border:getComputedStyle(el).borderTopColor}));
  const expectedStyle = await expected.evaluate(el => ({bg:getComputedStyle(el).backgroundImage,font:getComputedStyle(el.querySelector('b')).fontSize}));
  const ordinaryStyle = await ordinary.evaluate(el => ({bg:getComputedStyle(el).backgroundImage,font:getComputedStyle(el.querySelector('b')).fontSize}));

  expect(slaStyle.bg).toContain('gradient');
  expect(slaStyle.border).not.toBe('rgba(0, 0, 0, 0)');
  expect(expectedStyle.bg).toContain('gradient');
  expect(parseFloat(expectedStyle.font)).toBeGreaterThan(parseFloat(ordinaryStyle.font));

  const expectedBox = await rect(expected);
  const ordinaryBox = await rect(ordinary);
  expect(expectedBox.width).toBeGreaterThan(ordinaryBox.width * 1.6);
});

test('[X3] request execution controls remain separated and business copy remains intact', async ({page}) => {
  await stabilize(page); await login(page); await openOfficeRequest(page);
  await expect(page.locator('#requestDetails')).toContainText('담당 부서');
  await expect(page.locator('#requestDetails')).toContainText('예상 지급일');
  await expect(page.locator('#requestDetails')).toContainText('Jira Service Management');
  await expect(page.locator('#submitRequestBtn')).toHaveText('신청 완료');
  const actions = await page.locator('.request-modal .modal-actions').evaluate(el => ({position:getComputedStyle(el).position,border:getComputedStyle(el).borderTopStyle}));
  expect(actions.position).toBe('sticky');
  expect(actions.border).toBe('solid');
});

test('[X4] user drawer prioritizes ticket, live SLA, action and latest history', async ({page}) => {
  await stabilize(page); await login(page); await openOfficeRequest(page);
  await page.getByRole('button',{name:'신청 완료'}).click();
  await page.locator('#statusBtn').click();

  const item = page.locator('.request-item').filter({hasText:'Microsoft Office'});
  await expect(item.locator('.ticket-key')).toBeVisible();
  const titleSize = await item.locator('.request-item-title').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  const metaSize = await item.locator('.request-item-meta').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
  expect(titleSize).toBeGreaterThan(metaSize);

  const sla = item.locator('.request-sla');
  const slaState = await sla.evaluate(el => ({display:getComputedStyle(el).display,bg:getComputedStyle(el).backgroundColor,border:getComputedStyle(el).borderTopStyle}));
  expect(slaState.display).toBe('flex');
  expect(slaState.bg).not.toBe('rgba(0, 0, 0, 0)');
  expect(slaState.border).toBe('solid');

  const history = item.locator('.history-row');
  await expect(history).toHaveCount(1);
  const cancel = item.getByRole('button',{name:'신청 취소'});
  expect((await rect(cancel)).height).toBeGreaterThanOrEqual(44);
});

test('[X5] admin queue keeps KPI filtering secondary to the execution action', async ({page}) => {
  await stabilize(page); await login(page); await openOfficeRequest(page);
  await page.getByRole('button',{name:'신청 완료'}).click();
  await page.locator('#adminBtn').click();

  const pendingKpi = page.locator('.admin-kpi.pending');
  await pendingKpi.click();
  await expect(pendingKpi).toHaveAttribute('aria-pressed','true');
  const kpiStyle = await pendingKpi.evaluate(el => ({bg:getComputedStyle(el).backgroundImage,border:getComputedStyle(el).borderTopColor}));
  expect(kpiStyle.bg).toContain('gradient');
  expect(kpiStyle.border).not.toBe('rgba(0, 0, 0, 0)');

  const primary = page.locator('.request-item').filter({hasText:'Microsoft Office'}).locator('.request-actions .btn-primary');
  await expect(primary).toBeVisible();
  expect((await rect(primary)).height).toBeGreaterThanOrEqual(44);
});

test('[X6] mobile keeps critical request facts and drawer actions within the viewport', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await stabilize(page); await login(page); await openOfficeRequest(page);

  const rows = page.locator('#requestDetails > .detail-row');
  const first = await rect(rows.nth(0));
  const second = await rect(rows.nth(1));
  expect(Math.abs(first.x-second.x)).toBeLessThanOrEqual(1);
  const modal = await rect(page.locator('.request-modal'));
  expect(modal.x).toBeGreaterThanOrEqual(0);
  expect(modal.right).toBeLessThanOrEqual(391);

  await page.getByRole('button',{name:'신청 완료'}).click();
  await page.locator('#adminBtn').click();
  const slaDirection = await page.locator('.request-item').filter({hasText:'Microsoft Office'}).locator('.request-sla').evaluate(el => getComputedStyle(el).flexDirection);
  expect(slaDirection).toBe('column');
  const action = page.locator('.request-item').filter({hasText:'Microsoft Office'}).locator('.request-actions .btn-primary');
  const actionBox = await rect(action);
  expect(actionBox.right).toBeLessThanOrEqual(391);
  expect(actionBox.height).toBeGreaterThanOrEqual(44);
});
