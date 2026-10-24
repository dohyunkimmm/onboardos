'use strict';

const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const SHOT_DIR = path.join('verification','visual-system-screenshots');

async function stabilize(page){
  await page.clock.setFixedTime(new Date('2026-09-10T12:00:00+09:00'));
  await page.goto('/?review=1');
}

async function login(page){
  if(await page.locator('#loginScreen').isVisible()){
    await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
    await expect(page.locator('#loginScreen')).toBeHidden();
  }
}

async function openOfficeRequest(page){
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button',{name:'신청하기'}).click();
  await expect(page.locator('#requestBackdrop')).toHaveClass(/show/);
  return card;
}

async function capture(target,name){
  fs.mkdirSync(SHOT_DIR,{recursive:true});
  await target.screenshot({path:path.join(SHOT_DIR,name),animations:'disabled'});
}

async function visualState(locator){
  return locator.evaluate(el => {
    const s = getComputedStyle(el);
    return {
      outlineStyle:s.outlineStyle,
      outlineWidth:s.outlineWidth,
      outlineOffset:s.outlineOffset,
      boxShadow:s.boxShadow,
      transform:s.transform,
      backgroundImage:s.backgroundImage,
      backgroundColor:s.backgroundColor,
      borderStyle:s.borderStyle,
      borderWidth:s.borderWidth,
      fontWeight:s.fontWeight
    };
  });
}

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-chromium','V8 owns the explicit narrow-mobile contract; avoid duplicating the desktop visual-system suite in the generic mobile project.');
});

test('[V1] keyboard focus ring is consistent on primary interactive controls', async ({page}) => {
  await stabilize(page);
  const button = page.getByRole('button',{name:'Google SSO로 시작하기'});
  await button.focus();
  const state = await visualState(button);
  expect(state.outlineStyle).toBe('solid');
  expect(parseFloat(state.outlineWidth)).toBeGreaterThanOrEqual(2);
  expect(parseFloat(state.outlineOffset)).toBeGreaterThanOrEqual(3);
  expect(state.boxShadow).not.toBe('none');
  await capture(page.locator('.login-card'),'V1-keyboard-focus.png');
});

test('[V2] pressed controls provide feedback without moving their layout box', async ({page}) => {
  await stabilize(page);
  const button = page.getByRole('button',{name:'Google SSO로 시작하기'});
  const before = await button.evaluate(el => ({width:el.offsetWidth,height:el.offsetHeight,left:el.offsetLeft,top:el.offsetTop}));
  const box = await button.boundingBox();
  await page.mouse.move(box.x + box.width / 2,box.y + box.height / 2);
  await page.mouse.down();
  const active = await visualState(button);
  const during = await button.evaluate(el => ({width:el.offsetWidth,height:el.offsetHeight,left:el.offsetLeft,top:el.offsetTop}));
  expect(active.backgroundColor).toBe('rgb(26, 115, 232)');
  expect(during).toEqual(before);
  await page.mouse.up();
});

test('[V3] card focus-within gives keyboard users the same depth cue as pointer users', async ({page}) => {
  await stabilize(page);
  await login(page);
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  const action = card.getByRole('button',{name:'신청하기'});
  const before = await visualState(card);
  await action.focus();
  const focused = await visualState(card);
  expect(focused.boxShadow).not.toBe(before.boxShadow);
  expect(focused.boxShadow).not.toBe('none');
  await capture(card,'V3-card-focus.png');
});

test('[V4] selected role and filter states keep visual state aligned with aria-pressed', async ({page}) => {
  await stabilize(page);
  await login(page);
  await revealRolePicker(page);
  const role = page.getByRole('combobox',{name:'직군 선택'});
  await role.selectOption('design');
  await revealRolePicker(page);
  await expect(role).toHaveValue('design');
  await expect(role.locator('option:checked')).toHaveText('디자인');

  const filter = page.getByRole('button',{name:'해야 할 일',exact:true});
  await filter.click();
  await expect(filter).toHaveAttribute('aria-pressed','true');
  await expect(filter).toHaveClass(/active/);
  const filterState = await visualState(filter);
  await expect(filter).toHaveCSS('background-color','rgb(232, 240, 254)');
});

test('[V5] request modal preserves clear primary-secondary action hierarchy', async ({page}) => {
  await stabilize(page);
  await login(page);
  await openOfficeRequest(page);
  const modal = page.locator('.request-modal');
  const primary = modal.getByRole('button',{name:/신청 제출|재신청하기/});
  const secondary = modal.getByRole('button',{name:'취소'});
  const primaryState = await visualState(primary);
  const secondaryState = await visualState(secondary);
  expect(primaryState.backgroundColor).toBe('rgb(26, 115, 232)');
  expect(primaryState.backgroundColor).not.toBe(secondaryState.backgroundColor);
  expect(Number(primaryState.fontWeight)).toBeGreaterThanOrEqual(Number(secondaryState.fontWeight));
  await primary.focus();
  const focused = await visualState(primary);
  expect(focused.outlineStyle).toBe('solid');
  await capture(modal,'V5-modal-hierarchy.png');
});

test('[V6] admin drawer keeps scan hierarchy and focused queue actions visible', async ({page}) => {
  await stabilize(page);
  await login(page);
  await openOfficeRequest(page);
  await page.getByRole('button',{name:'신청 제출'}).click();
  await page.locator('#adminBtn').click();
  await expect(page.locator('#drawerBackdrop')).toHaveClass(/show/);
  const drawer = page.locator('.drawer');
  await drawer.evaluate(async el => {
    await Promise.all(el.getAnimations().map(animation => animation.finished.catch(() => {})));
  });
  await expect(page.locator('.drawer-head')).toHaveCSS('position','sticky');
  await expect(page.locator('.admin-kpis')).toHaveCSS('position','sticky');
  const item = page.locator('.request-item').filter({hasText:'Microsoft Office'});
  const before = await item.evaluate(el => getComputedStyle(el,'::before').width);
  expect(parseFloat(before)).toBeGreaterThanOrEqual(3);
  const action = item.locator('.request-actions button').first();
  await action.focus();
  const state = await visualState(action);
  expect(state.outlineStyle).toBe('solid');
  await capture(drawer,'V6-drawer-hierarchy.png');
});

test('[V7] forced-colors mode preserves visible boundaries for status and selection states', async ({page}) => {
  await page.emulateMedia({forcedColors:'active'});
  await stabilize(page);
  await login(page);
  const status = page.locator('#roleGrid .status-pill').first();
  const statusState = await visualState(status);
  expect(statusState.borderStyle).not.toBe('none');
  expect(parseFloat(statusState.borderWidth)).toBeGreaterThanOrEqual(1);

  const selected = page.locator('.filter-chip.active');
  const selectedState = await visualState(selected);
  expect(selectedState.outlineStyle).toBe('solid');
});

test('[V8] narrow mobile controls retain an expanded touch halo without horizontal overflow', async ({page}) => {
  await page.setViewportSize({width:390,height:780});
  await stabilize(page);
  await login(page);
  await revealRolePicker(page);
  for(const locator of [page.locator('.filter-chip').first(),page.locator('.top-btn').first()]){
    const box = await locator.boundingBox();
    const pseudo = await locator.evaluate(el => {
      const s = getComputedStyle(el,'::after');
      return {top:s.top,right:s.right,bottom:s.bottom,left:s.left};
    });
    expect(pseudo.top).toBe('-6px');
    expect(pseudo.right).toBe('-6px');
    expect(pseudo.bottom).toBe('-6px');
    expect(pseudo.left).toBe('-6px');
    expect(box.height + 12).toBeGreaterThanOrEqual(44);
  }
  const roleBox = await page.getByRole('combobox',{name:'직군 선택'}).boundingBox();
  expect(roleBox.height).toBeGreaterThanOrEqual(44);
  const overflow = await page.evaluate(() => ({scrollWidth:document.documentElement.scrollWidth,innerWidth:innerWidth}));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 1);
});
async function revealRolePicker(page){
  await expect(page.getByRole('combobox',{name:'직군 선택'})).toBeVisible();
}
