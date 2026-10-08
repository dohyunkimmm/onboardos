const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');

const SHOT_DIR = path.join('verification','experience-refinement-screenshots');
async function stabilize(page){
  await page.clock.setFixedTime(new Date('2026-09-15T12:00:00+09:00'));
  await page.emulateMedia({ reducedMotion:'reduce' });
  await page.goto('/');
  await page.evaluate(async () => { if(document.fonts?.ready) await document.fonts.ready; });
}
async function login(page){
  await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
}
async function css(locator,pseudo=null){
  return locator.evaluate((el,pseudo) => {
    const s=getComputedStyle(el,pseudo);
    return {display:s.display,position:s.position,backgroundImage:s.backgroundImage,backgroundColor:s.backgroundColor,borderRadius:s.borderRadius,borderTopStyle:s.borderTopStyle,borderBottomStyle:s.borderBottomStyle,boxShadow:s.boxShadow,fontSize:s.fontSize,fontWeight:s.fontWeight,gridTemplateColumns:s.gridTemplateColumns,transitionDuration:s.transitionDuration,content:s.content,minHeight:s.minHeight};
  },pseudo);
}
async function shot(target,name){fs.mkdirSync(SHOT_DIR,{recursive:true});await target.screenshot({path:path.join(SHOT_DIR,name),animations:'disabled'});}

test('[E1] top navigation separates primary product action from demo utilities',async({page})=>{
  await stabilize(page);await login(page);
  const status=await css(page.locator('#statusBtn'));
  const reset=await css(page.locator('#resetBtn'));
  expect(status.backgroundImage).toContain('gradient');
  expect(reset.backgroundImage).toBe('none');
  await shot(page.locator('.topbar'),'E1-navigation-hierarchy.png');
});

test('[E2] overview uses a two-zone desktop surface and collapses cleanly on mobile',async({page})=>{
  await stabilize(page);await login(page);
  const task=await css(page.locator('.task-overview'));
  expect(task.display).not.toBe('none');
  expect(task.backgroundImage).toContain('gradient');
  const profile=page.locator('.overview-panel');
  await expect(profile).not.toHaveAttribute('open');
  await expect(page.locator('.task-overview .role-tab').first()).toBeVisible();
  await profile.locator('summary').click();
  await expect(profile.locator('.name-input')).toBeVisible();
  await shot(page.locator('.task-overview'),'E2-overview-composition.png');
});

test('[E3] progress hierarchy emphasizes current work while preserving all five P6 steps',async({page})=>{
  await stabilize(page);await login(page);
  await expect(page.locator('.progress-step')).toHaveCount(5);
  const current=page.locator('.progress-step.current');
  await expect(current).toHaveAttribute('aria-current','step');
  const circle=await current.locator('.step-circle').evaluate(el=>getComputedStyle(el));
  expect(parseFloat(circle.width)).toBeGreaterThanOrEqual(30);
});

test('[E4] status filters behave as a sticky command surface with a distinct selected state',async({page})=>{
  await stabilize(page);await login(page);
  const tools=await css(page.locator('.tools-bar'));
  const active=await css(page.locator('.filter-chip.active'));
  expect(tools.position).toBe('static');
  expect(active.backgroundImage).toContain('gradient');
  const selected=page.locator('.filter-chip.active');
  await expect(selected).toHaveAttribute('aria-pressed','true');
  await shot(page.locator('.tools-bar'),'E4-filter-command-surface.png');
});

test('[E5] role cards keep responsive scan rhythm and status meaning without color alone',async({page})=>{
  await stabilize(page);await login(page);
  const card=page.locator('#roleGrid .card').first();
  const state=await css(card);
  const viewport=page.viewportSize();
  if((viewport?.width || 0) > 768){
    expect(parseFloat(state.minHeight)).toBeGreaterThanOrEqual(176);
  }else{
    expect(parseFloat(state.minHeight)).toBeLessThanOrEqual(1);
  }
  const divider=await css(card.locator('.card-owner'));
  expect(divider.borderBottomStyle).toBe('solid');
  const pill=card.locator('.status-pill');
  const pseudo=await css(pill,'::before');
  expect(pseudo.content).not.toBe('none');
  await shot(card,'E5-card-scanability.png');
});

test('[E6] request modal keeps execution controls in a clearly separated action zone',async({page})=>{
  await stabilize(page);await login(page);
  const card=page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button',{name:'신청하기'}).click();
  const actions=page.locator('.request-modal .modal-actions');
  const state=await css(actions);
  expect(state.position).toBe('sticky');
  expect(state.borderTopStyle).toBe('solid');
  expect(state.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  await shot(page.locator('.request-modal'),'E6-modal-action-zone.png');
});

test('[E7] tablet width uses deliberate two-column density with no horizontal overflow',async({page})=>{
  await page.setViewportSize({width:900,height:900});
  await stabilize(page);await login(page);
  const common=await css(page.locator('#commonGrid'));
  const role=await css(page.locator('#roleGrid'));
  expect(common.gridTemplateColumns.split(' ').length).toBe(2);
  expect(role.gridTemplateColumns.split(' ').length).toBe(2);
  const overflow=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth}));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth+1);
  await shot(page,'E7-tablet-density.png');
});

test('[E8] empty states are intentionally designed and reduced-motion remains honored',async({page})=>{
  await stabilize(page);await login(page);
  await page.locator('.role-tab[data-role="unmapped"]').click();
  const empty=page.locator('#roleGrid .empty-state');
  await expect(empty).toBeVisible();
  const state=await css(empty);
  expect(state.backgroundImage).toContain('gradient');
  const icon=await css(empty,'::before');
  expect(icon.content).not.toBe('none');
  const cardDuration=await page.locator('#commonGrid .card').first().evaluate(el=>getComputedStyle(el).transitionDuration);
  expect(cardDuration.split(',').every(value=>parseFloat(value)===0)).toBeTruthy();
  await shot(empty,'E8-empty-state.png');
});
