'use strict';

const fs = require('fs');
const path = require('path');

const read = file => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content.endsWith('\n') ? content : `${content}\n`);

const css = `/* ONBOARD·OS v11 candidate — experience refinement.
   Scope: post-login visual/UX refinement only. P6 behavior and login baseline stay unchanged. */
:root{
  --v11-panel:rgba(23,26,33,.94);
  --v11-panel-soft:rgba(255,255,255,.028);
  --v11-panel-raised:rgba(34,38,48,.96);
  --v11-line:rgba(255,255,255,.085);
  --v11-line-strong:rgba(196,181,253,.24);
  --v11-text-muted:rgba(210,212,218,.58);
  --v11-shadow:0 22px 60px -46px rgba(0,0,0,.94),0 1px 0 rgba(255,255,255,.025) inset;
  --v11-motion-fast:160ms;
  --v11-motion:220ms;
  --v11-ease:cubic-bezier(.2,.8,.2,1);
}

/* 1. Navigation / action hierarchy */
body:not(.login-open) .topbar{padding-block:13px;}
body:not(.login-open) .top-actions{display:flex;align-items:center;gap:7px;}
body:not(.login-open) #statusBtn{
  border-color:rgba(196,181,253,.28);
  background:linear-gradient(135deg,rgba(79,70,229,.72),rgba(124,58,237,.56));
  color:#fff;
  box-shadow:0 10px 26px -18px rgba(124,58,237,.9),inset 0 1px 0 rgba(255,255,255,.08);
}
body:not(.login-open) #adminBtn{background:rgba(255,255,255,.055);border-color:rgba(255,255,255,.11);}
body:not(.login-open) #resetBtn,body:not(.login-open) #moreBtn{color:rgba(210,212,218,.68);background:transparent;border-color:rgba(255,255,255,.07);box-shadow:none;}
body:not(.login-open) #resetBtn:hover,body:not(.login-open) #moreBtn:hover{color:#fff;background:rgba(255,255,255,.05);}

/* 2. Overview / identity / role hierarchy */
body:not(.login-open) .overview-panel{
  border-radius:24px;
  background:radial-gradient(70% 120% at 100% 0%,rgba(129,140,248,.105),transparent 58%),linear-gradient(145deg,rgba(26,29,36,.965),rgba(16,18,23,.94));
  box-shadow:0 26px 70px -52px rgba(99,102,241,.58),var(--v11-shadow);
}
body:not(.login-open) .overview-panel .badge-id label{color:rgba(196,181,253,.72);}
body:not(.login-open) .overview-panel .name-input{font-size:30px;font-weight:760;letter-spacing:-.04em;}
body:not(.login-open) .overview-panel .emp-meta{max-width:520px;color:rgba(210,212,218,.52);}
body:not(.login-open) .role-picker>label{color:rgba(210,212,218,.56);}
body:not(.login-open) .demo-preview-note{border:0;border-left:2px solid rgba(129,140,248,.24);border-radius:0 10px 10px 0;background:rgba(129,140,248,.035);}
@media (min-width:960px){
  body:not(.login-open) .overview-panel{display:grid;grid-template-columns:minmax(0,.88fr) minmax(420px,1.12fr);align-items:stretch;}
  body:not(.login-open) .overview-panel .badge-top{grid-column:1;padding:30px 30px 26px;align-items:center;}
  body:not(.login-open) .overview-panel .badge-divider{display:none;}
  body:not(.login-open) .overview-panel .role-picker{grid-column:2;padding:26px 30px;border-left:1px solid rgba(255,255,255,.065);background:rgba(255,255,255,.012);}
  body:not(.login-open) .overview-panel .progress-wrap{grid-column:1/-1;margin:0;border-radius:0 0 24px 24px;padding:14px 28px 15px;}
  body:not(.login-open) .overview-panel{padding:0;overflow:hidden;}
}

/* 3. Progress becomes quieter except for the current/next task. */
body:not(.login-open) .progress-wrap{background:rgba(4,5,8,.24);}
body:not(.login-open) .progress-step{gap:5px;}
body:not(.login-open) .progress-step .step-circle{width:26px;height:26px;border-width:1px;background:rgba(255,255,255,.025);}
body:not(.login-open) .progress-step.done{opacity:.68;}
body:not(.login-open) .progress-step.current{opacity:1;}
body:not(.login-open) .progress-step.current .step-circle{width:30px;height:30px;box-shadow:0 0 0 5px rgba(99,102,241,.12),0 8px 22px -14px rgba(124,58,237,.95);}
body:not(.login-open) .progress-step.current .step-label{font-weight:750;color:#fff;}
body:not(.login-open) .progress-hint{display:flex;align-items:center;justify-content:center;gap:7px;text-align:left;color:rgba(210,212,218,.66);}
body:not(.login-open) .demo-step-kicker::after{letter-spacing:.06em;}

/* 4. Filter bar is a compact sticky command surface. */
body:not(.login-open) .tools-bar{
  position:sticky;top:70px;z-index:28;
  width:max-content;max-width:100%;
  margin:26px 0 20px;padding:5px;
  border:1px solid rgba(255,255,255,.07);border-radius:14px;
  background:rgba(13,15,19,.82);box-shadow:0 16px 34px -30px rgba(0,0,0,.92);
  backdrop-filter:blur(16px) saturate(125%);-webkit-backdrop-filter:blur(16px) saturate(125%);
}
body:not(.login-open) .filter-tabs{gap:3px;}
body:not(.login-open) .filter-chip{min-height:36px;border-color:transparent;background:transparent;padding-inline:13px;}
body:not(.login-open) .filter-chip:hover{background:rgba(255,255,255,.045);border-color:transparent;}
body:not(.login-open) .filter-chip.active{
  background:linear-gradient(135deg,rgba(99,102,241,.25),rgba(168,85,247,.18));
  border-color:rgba(196,181,253,.22);color:#F2EEFF;
  box-shadow:0 8px 18px -16px rgba(168,85,247,.85),inset 0 1px 0 rgba(255,255,255,.035);
}

/* 5. Card scanability / information architecture */
body:not(.login-open) .licenses.role-secondary{margin-top:38px;}
body:not(.login-open) .section-head{margin-bottom:12px;}
body:not(.login-open) .section-head h2{font-size:21px;font-weight:760;letter-spacing:-.03em;}
body:not(.login-open) .card{
  border-color:rgba(255,255,255,.075);
  background:linear-gradient(165deg,rgba(27,30,37,.94),rgba(18,20,25,.92));
  box-shadow:0 18px 42px -38px rgba(0,0,0,.92),inset 0 1px 0 rgba(255,255,255,.022);
  transition:transform var(--v11-motion) var(--v11-ease),border-color var(--v11-motion-fast) ease,background var(--v11-motion-fast) ease,box-shadow var(--v11-motion) var(--v11-ease);
}
body:not(.login-open) #roleGrid .card{min-height:176px;padding:20px 20px 17px;}
body:not(.login-open) #roleGrid .card-top{margin-bottom:15px;}
body:not(.login-open) #roleGrid .card-owner{margin:0 0 13px;padding:0 0 13px;border-bottom:1px solid rgba(255,255,255,.055);font-size:11.5px;}
body:not(.login-open) #roleGrid .card-bottom{min-height:42px;align-items:center;gap:10px;}
body:not(.login-open) .card-status-group{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
body:not(.login-open) #roleGrid .cta{border:0;min-width:88px;box-shadow:0 12px 26px -17px rgba(99,102,241,.72);}
body:not(.login-open) .card:hover{transform:translateY(-2px);border-color:rgba(196,181,253,.20);box-shadow:0 22px 50px -38px rgba(99,102,241,.32),inset 0 1px 0 rgba(255,255,255,.03);}

/* Semantic states read without relying on color alone. */
body:not(.login-open) .status-pill{display:inline-flex;align-items:center;gap:5px;}
body:not(.login-open) .status-pill::before{font-size:9px;font-weight:900;line-height:1;}
body:not(.login-open) .status-auto::before,body:not(.login-open) .status-approved::before,body:not(.login-open) .status-completed::before{content:"✓";}
body:not(.login-open) .status-request::before{content:"＋";}
body:not(.login-open) .status-pending::before{content:"…";letter-spacing:-.08em;}
body:not(.login-open) .status-approval::before,body:not(.login-open) .status-rejected::before{content:"!";}
body:not(.login-open) .sla-pill,body:not(.login-open) .sla-health{opacity:.82;}

/* 6. Modal / drawer action zones */
body:not(.login-open) .request-modal,body:not(.login-open) .action-modal{overflow:hidden;}
body:not(.login-open) .modal-actions{
  position:sticky;bottom:-28px;z-index:3;
  margin:22px -28px -28px;padding:15px 28px 20px;
  border-top:1px solid rgba(255,255,255,.07);
  background:linear-gradient(180deg,rgba(23,25,32,.82),rgba(15,17,22,.99));
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
}
body:not(.login-open) .modal-actions .primary-btn,body:not(.login-open) .modal-actions .btn-primary{box-shadow:0 12px 28px -18px rgba(99,102,241,.75);}
body:not(.login-open) .drawer-head{border-bottom-color:rgba(255,255,255,.07);}
body:not(.login-open) .request-actions{border-top:1px solid rgba(255,255,255,.055);}
body:not(.login-open) .request-actions button{border-radius:11px;}

/* 7. Empty/completion states */
body:not(.login-open) .empty-state{
  position:relative;overflow:hidden;padding:42px 26px;
  border:1px dashed rgba(196,181,253,.17);
  background:radial-gradient(70% 120% at 50% 0%,rgba(99,102,241,.075),transparent 68%),rgba(255,255,255,.012);
}
body:not(.login-open) .empty-state::before{
  content:"◇";display:flex;align-items:center;justify-content:center;
  width:34px;height:34px;margin:0 auto 12px;border:1px solid rgba(196,181,253,.20);border-radius:12px;
  background:rgba(196,181,253,.06);color:rgba(196,181,253,.72);font-size:16px;
}
body:not(.login-open) .empty-state b{font-size:15.5px;letter-spacing:-.015em;}
body:not(.login-open) .complete-box.is-complete{box-shadow:0 22px 56px -38px rgba(110,231,183,.46);}

/* 8. Tablet / mobile density and motion */
@media (max-width:1024px) and (min-width:769px){
  body:not(.login-open) main{max-width:920px;}
  body:not(.login-open) .overview-panel{padding:26px 28px 0;}
  body:not(.login-open) .overview-panel .badge-top{padding-bottom:20px;}
  body:not(.login-open) .overview-panel .progress-wrap{margin-inline:-28px;}
  body:not(.login-open) #commonGrid,body:not(.login-open) #roleGrid,body:not(.login-open) #roleGrid.balanced-four{grid-template-columns:repeat(2,minmax(0,1fr));}
  body:not(.login-open) #roleGrid .card{min-height:166px;}
  body:not(.login-open) .tools-bar{top:68px;}
}
@media (max-width:768px){
  body:not(.login-open) .tools-bar{top:62px;width:100%;overflow-x:auto;scrollbar-width:none;}
  body:not(.login-open) .tools-bar::-webkit-scrollbar{display:none;}
  body:not(.login-open) .filter-tabs{width:max-content;}
  body:not(.login-open) .overview-panel .name-input{font-size:25px;}
  body:not(.login-open) .progress-hint{justify-content:flex-start;line-height:1.55;}
  body:not(.login-open) #roleGrid .card{min-height:0;}
}
@media (max-width:560px){
  body:not(.login-open) .top-actions{gap:5px;}
  body:not(.login-open) #statusBtn,body:not(.login-open) #adminBtn{padding-inline:10px;}
  body:not(.login-open) .overview-panel .name-input{font-size:24px;}
  body:not(.login-open) .overview-panel .progress-wrap{padding-inline:13px;}
  body:not(.login-open) .progress-step{min-width:66px;}
  body:not(.login-open) .progress-step .step-label{font-size:10px;}
  body:not(.login-open) .filter-chip{padding-inline:11px;}
  body:not(.login-open) .modal-actions{bottom:-22px;margin:20px -18px -22px;padding:13px 18px 17px;}
}
@media (hover:hover) and (pointer:fine){
  body:not(.login-open) :where(.top-btn,.filter-chip,.role-tab,.cta,.request-actions button,.modal-actions button){transition-duration:var(--v11-motion-fast);transition-timing-function:var(--v11-ease);}
}
@media (prefers-reduced-motion:reduce){
  body:not(.login-open) .card,body:not(.login-open) :where(.top-btn,.filter-chip,.role-tab,.cta,.request-actions button,.modal-actions button){transition-duration:0s!important;}
}
`;

const spec = `const fs = require('fs');
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

test('[E2] overview compresses identity and role selection into a two-zone desktop surface',async({page})=>{
  await stabilize(page);await login(page);
  const panel=await css(page.locator('.overview-panel'));
  expect(panel.display).toBe('grid');
  expect(panel.gridTemplateColumns.split(' ').length).toBe(2);
  expect(panel.borderRadius).toBe('24px');
  await shot(page.locator('.overview-panel'),'E2-overview-composition.png');
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
  expect(tools.position).toBe('sticky');
  expect(active.backgroundImage).toContain('gradient');
  await shot(page.locator('.tools-bar'),'E4-filter-command-surface.png');
});

test('[E5] role cards keep a stable scan rhythm and status meaning without color alone',async({page})=>{
  await stabilize(page);await login(page);
  const card=page.locator('#roleGrid .card').first();
  const state=await css(card);
  expect(parseFloat(state.minHeight)).toBeGreaterThanOrEqual(176);
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
  expect(state.backgroundImage).toContain('gradient');
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
`;

const config = `const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir:'./tests',
  testMatch:['**/experience-refinement.spec.js'],
  timeout:45_000,
  expect:{timeout:7_000},
  fullyParallel:false,
  retries:process.env.CI ? 1 : 0,
  reporter:[['list'],['json',{outputFile:'verification/experience-refinement-playwright.json'}]],
  use:{...devices['Desktop Chrome'],baseURL:'http://127.0.0.1:4173',viewport:{width:1440,height:1000},trace:'retain-on-failure',timezoneId:'Asia/Seoul'},
  projects:[{name:'experience-refinement-chromium'}],
  webServer:{command:'node scripts/serve.js',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:15_000}
});
`;

write('experience-refinement.css',css);
write('tests/experience-refinement.spec.js',spec);
write('playwright.experience-refinement.config.js',config);

let index=read('index.html');
const link='<link href="experience-refinement.css" rel="stylesheet"/>';
if(!index.includes(link)) index=index.replace('<link href="login-font-lock.css" rel="stylesheet"/>',`<link href="login-font-lock.css" rel="stylesheet"/>\n${link}`);
write('index.html',index);

const pkg=JSON.parse(read('package.json'));
pkg.scripts['test:experience']='playwright test -c playwright.experience-refinement.config.js';
write('package.json',JSON.stringify(pkg,null,2));

const manifest=JSON.parse(read('integrity-assets.json'));
if(!manifest.requiredFiles.includes('experience-refinement.css')){
  const at=manifest.requiredFiles.indexOf('login-font-lock.css');
  manifest.requiredFiles.splice(at+1,0,'experience-refinement.css');
}
write('integrity-assets.json',JSON.stringify(manifest,null,2));

// Bootstrap helper is intentionally one-shot; keep only product/test artifacts in the final PR.
try{fs.unlinkSync(__filename);}catch{}
console.log('v11 experience refinement applied');
