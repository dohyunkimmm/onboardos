from pathlib import Path
import json

BRANCH_MARKER = 'v10 visual hierarchy & responsive polish'


def read(path):
    return Path(path).read_text()


def write(path, text):
    Path(path).write_text(text)


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing replacement marker: {label}')
    return text.replace(old, new, 1)

css_path = Path('login-font-lock.css')
css = css_path.read_text()
if BRANCH_MARKER not in css:
    css += r'''

/* v10 visual hierarchy & responsive polish: post-login product surfaces only; P6 flow and login baseline remain unchanged. */
:root{
  --v10-surface:rgba(24,27,34,.92);
  --v10-surface-strong:rgba(31,35,44,.97);
  --v10-surface-soft:rgba(255,255,255,.035);
  --v10-line:rgba(255,255,255,.115);
  --v10-line-strong:rgba(151,160,255,.28);
  --v10-radius-card:18px;
  --v10-radius-panel:24px;
  --v10-shadow:0 18px 46px -34px rgba(0,0,0,.92),0 1px 0 rgba(255,255,255,.025) inset;
}
body:not(.login-open) .topbar{
  padding:16px clamp(20px,4vw,52px);
  background:rgba(10,11,14,.82);
  border-bottom-color:rgba(255,255,255,.075);
  box-shadow:0 8px 30px -28px rgba(0,0,0,.9);
}
body:not(.login-open) .logo{font-size:20px;letter-spacing:-.025em;}
body:not(.login-open) .topbar .sub{margin-top:2px;color:rgba(210,212,218,.62);}
body:not(.login-open) .top-btn{
  border-color:rgba(255,255,255,.10);
  background:rgba(255,255,255,.045);
  border-radius:11px;
  padding-inline:13px;
}
body:not(.login-open) .top-btn:hover{background:rgba(255,255,255,.075);border-color:rgba(196,181,253,.26);}
body:not(.login-open) main{max-width:1180px;padding:44px 32px 112px;}
body:not(.login-open) .overview-panel{
  border-radius:var(--v10-radius-panel);
  border-color:rgba(255,255,255,.105);
  background:radial-gradient(82% 120% at 96% -20%,rgba(129,140,248,.12),transparent 58%),linear-gradient(145deg,rgba(27,30,37,.95),rgba(18,20,25,.92));
  box-shadow:0 24px 64px -46px rgba(99,102,241,.55),var(--v10-shadow);
  padding:30px 32px 0;
}
body:not(.login-open) .overview-panel .badge-top{align-items:center;gap:20px;padding-bottom:20px;}
body:not(.login-open) .overview-panel .avatar{
  width:60px;height:60px;font-size:24px;
  box-shadow:0 12px 30px -14px rgba(99,102,241,.72),0 0 0 1px rgba(255,255,255,.08) inset;
}
body:not(.login-open) .overview-panel .badge-id label{font-size:11px;letter-spacing:.065em;}
body:not(.login-open) .overview-panel .name-input{font-size:28px;letter-spacing:-.035em;line-height:1.15;}
body:not(.login-open) .overview-panel .emp-meta{margin-top:7px;font-size:11.5px;}
body:not(.login-open) .overview-panel .role-meta-pill{margin-top:11px;border:1px solid rgba(110,231,183,.16);padding:6px 11px;background:rgba(110,231,183,.09);}
body:not(.login-open) .overview-panel .badge-divider{margin:0;border-color:rgba(255,255,255,.075);}
body:not(.login-open) .overview-panel .role-picker{padding:20px 0 18px;}
body:not(.login-open) .role-picker>label{font-size:11px;font-weight:700;color:rgba(210,212,218,.64);letter-spacing:.055em;text-transform:uppercase;}
body:not(.login-open) .role-tabs{gap:8px;}
body:not(.login-open) .role-tab{
  min-height:38px;padding:8px 13px;border:1px solid rgba(255,255,255,.095);border-radius:11px;
  background:rgba(255,255,255,.035);color:var(--ink-soft);font-weight:650;
}
body:not(.login-open) .role-tab:hover{background:rgba(255,255,255,.065);border-color:rgba(129,140,248,.26);}
body:not(.login-open) .role-tab.active{
  color:#fff;border-color:rgba(196,181,253,.30);
  background:linear-gradient(135deg,rgba(79,70,229,.92),rgba(124,58,237,.78));
  box-shadow:0 10px 24px -16px rgba(124,58,237,.8),0 0 0 1px rgba(255,255,255,.06) inset;
}
body:not(.login-open) .demo-preview-note{margin-top:12px;border-color:rgba(255,255,255,.07);background:rgba(255,255,255,.025);color:rgba(210,212,218,.68);}
body:not(.login-open) .overview-panel .progress-wrap{
  margin:0 -32px;border-top:1px solid rgba(255,255,255,.07);padding:18px 26px 20px;
  background:rgba(7,8,11,.20);border-radius:0 0 var(--v10-radius-panel) var(--v10-radius-panel);
}
body:not(.login-open) .progress-bar{padding:0;border:0;background:transparent;box-shadow:none;backdrop-filter:none;}
body:not(.login-open) .progress-hint{margin-top:15px;padding-top:13px;border-top-color:rgba(255,255,255,.07);}
body:not(.login-open) .tools-bar{margin:30px 0 20px;}
body:not(.login-open) .filter-tabs{gap:8px;}
body:not(.login-open) .filter-chip{
  min-height:38px;padding:8px 13px;border-radius:10px;border:1px solid rgba(255,255,255,.085);
  background:rgba(255,255,255,.025);color:rgba(210,212,218,.72);font-weight:650;
}
body:not(.login-open) .filter-chip.active{background:rgba(196,181,253,.12);border-color:rgba(196,181,253,.28);color:#E9E5FF;box-shadow:0 8px 20px -18px rgba(196,181,253,.8);}
body:not(.login-open) .licenses{margin-top:44px;}
body:not(.login-open) .licenses.common-first{margin-top:0;}
body:not(.login-open) .section-head{gap:12px;margin-bottom:9px;align-items:center;}
body:not(.login-open) .section-head h2{font-size:20.5px;line-height:1.25;letter-spacing:-.025em;}
body:not(.login-open) .section-head .count{
  padding:4px 8px;border:1px solid rgba(255,255,255,.07);border-radius:999px;background:rgba(255,255,255,.025);
  font-size:10.5px;color:rgba(210,212,218,.56);
}
body:not(.login-open) .section-sub{max-width:760px;color:rgba(210,212,218,.62);}
body:not(.login-open) .card-grid{gap:14px;}
body:not(.login-open) #commonGrid{grid-template-columns:repeat(3,minmax(0,1fr));}
body:not(.login-open) #roleGrid{grid-template-columns:repeat(3,minmax(0,1fr));}
body:not(.login-open) #roleGrid.balanced-four{grid-template-columns:repeat(2,minmax(0,1fr));}
body:not(.login-open) .card{
  border-radius:var(--v10-radius-card);border-color:rgba(255,255,255,.09);
  background:linear-gradient(155deg,var(--v10-surface),rgba(18,20,25,.90));
  box-shadow:var(--v10-shadow);padding:19px 20px;
}
body:not(.login-open) .card:hover{
  transform:translateY(-3px);border-color:var(--v10-line-strong);
  background:linear-gradient(155deg,var(--v10-surface-strong),rgba(21,23,29,.94));
  box-shadow:0 20px 48px -34px rgba(99,102,241,.5),0 1px 0 rgba(255,255,255,.035) inset;
}
body:not(.login-open) .card-top{gap:12px;margin-bottom:14px;}
body:not(.login-open) .logo-chip{width:42px;height:42px;border-radius:12px;padding:6px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07);}
body:not(.login-open) .card-title{font-size:14px;font-weight:700;letter-spacing:-.012em;}
body:not(.login-open) .card-cat{margin-top:3px;font-size:10.5px;color:rgba(210,212,218,.52);}
body:not(.login-open) .card-owner{margin-bottom:12px;color:rgba(210,212,218,.64);}
body:not(.login-open) .status-pill{border:1px solid currentColor;padding:4px 9px;font-size:10.5px;font-weight:700;letter-spacing:.005em;background-color:transparent;}
body:not(.login-open) .status-auto,body:not(.login-open) .status-approved,body:not(.login-open) .status-completed{background:rgba(110,231,183,.075);border-color:rgba(110,231,183,.24);}
body:not(.login-open) .status-request,body:not(.login-open) .status-pending{background:rgba(251,191,107,.075);border-color:rgba(251,191,107,.24);}
body:not(.login-open) .status-approval,body:not(.login-open) .status-rejected{background:rgba(251,113,133,.075);border-color:rgba(251,113,133,.24);}
body:not(.login-open) #roleGrid .cta{
  min-height:38px;min-width:82px;padding:8px 13px;border-radius:11px;border-color:rgba(196,181,253,.30);
  background:linear-gradient(135deg,#5B5FEF,#7C3AED);font-weight:750;
  box-shadow:0 10px 24px -16px rgba(99,102,241,.72);
}
body:not(.login-open) #roleGrid .cta:hover{transform:translateY(-1px);box-shadow:0 14px 30px -16px rgba(168,85,247,.68);}
body:not(.login-open) .empty-state{border-radius:18px;border-color:rgba(255,255,255,.10);background:rgba(255,255,255,.018);padding:36px 24px;}
body:not(.login-open) .complete-box{border-radius:22px;padding:24px;}
body:not(.login-open) .request-modal,body:not(.login-open) .action-modal{
  border-radius:24px;border-color:rgba(255,255,255,.12);
  background:linear-gradient(155deg,rgba(33,36,45,.985),rgba(15,17,22,.985));
  box-shadow:0 28px 80px -36px rgba(0,0,0,.95),0 0 0 1px rgba(129,140,248,.05) inset;
}
body:not(.login-open) .request-modal{width:min(520px,100%);padding:28px;}
body:not(.login-open) .request-modal h3,body:not(.login-open) .action-modal h3{font-size:23px;letter-spacing:-.025em;}
body:not(.login-open) .detail-list{border-radius:15px;border-color:rgba(255,255,255,.085);background:rgba(0,0,0,.08);}
body:not(.login-open) .detail-row{padding:13px 14px;background:rgba(255,255,255,.018);}
body:not(.login-open) .modal-actions{gap:9px;padding-top:2px;}
body:not(.login-open) .modal-actions button{min-height:42px;border-radius:11px;padding-inline:17px;}
body:not(.login-open) .drawer{
  width:min(440px,100%);border-left-color:rgba(255,255,255,.10);
  background:linear-gradient(165deg,rgba(28,31,39,.995),rgba(12,14,18,.997));
  box-shadow:-18px 0 64px -30px rgba(0,0,0,.92);
}
body:not(.login-open) .drawer h3{font-size:23px;letter-spacing:-.025em;}
body:not(.login-open) .admin-kpi{border-radius:13px;background:rgba(255,255,255,.032);}
body:not(.login-open) .request-item{border-radius:17px;background:rgba(255,255,255,.032);box-shadow:0 14px 34px -30px rgba(0,0,0,.95);}
body:not(.login-open) .request-item-title{font-size:14px;}
body:not(.login-open) footer{margin-top:52px;border-top-color:rgba(255,255,255,.065);}
@media (max-width:1024px) and (min-width:769px){
  body:not(.login-open) main{padding:40px 24px 100px;}
  body:not(.login-open) #commonGrid,body:not(.login-open) #roleGrid{grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media (max-width:768px){
  body:not(.login-open) main{padding:28px 18px 88px;}
  body:not(.login-open) .overview-panel{padding:24px 22px 0;}
  body:not(.login-open) .overview-panel .progress-wrap{margin-inline:-22px;padding-inline:18px;}
  body:not(.login-open) #commonGrid{grid-template-columns:repeat(2,minmax(0,1fr));}
  body:not(.login-open) #roleGrid,body:not(.login-open) #roleGrid.balanced-four{grid-template-columns:1fr;}
  body:not(.login-open) .licenses{margin-top:34px;}
  body:not(.login-open) .section-head{align-items:flex-start;flex-direction:column;gap:5px;}
  body:not(.login-open) .section-head .count{padding-left:0;border:0;background:transparent;}
}
@media (max-width:560px){
  body:not(.login-open) .topbar{padding:14px 16px;gap:10px;}
  body:not(.login-open) main{padding:24px 14px 76px;}
  body:not(.login-open) .overview-panel{padding:21px 18px 0;border-radius:20px;}
  body:not(.login-open) .overview-panel .badge-top{gap:14px;padding-bottom:17px;}
  body:not(.login-open) .overview-panel .avatar{width:52px;height:52px;font-size:21px;}
  body:not(.login-open) .overview-panel .name-input{font-size:23px;}
  body:not(.login-open) .overview-panel .progress-wrap{margin-inline:-18px;padding:15px 12px 17px;border-radius:0 0 20px 20px;}
  body:not(.login-open) .role-tabs{gap:7px;}
  body:not(.login-open) .role-tab{min-height:38px;padding-inline:11px;}
  body:not(.login-open) .tools-bar{margin:24px 0 17px;}
  body:not(.login-open) #commonGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
  body:not(.login-open) #commonGrid .card{padding:13px;}
  body:not(.login-open) #roleGrid{gap:11px;}
  body:not(.login-open) .card{border-radius:16px;}
  body:not(.login-open) .section-head h2{font-size:18.5px;}
  body:not(.login-open) .request-modal{padding:22px 18px;border-radius:20px;}
}
@media (max-width:359px){
  body:not(.login-open) #commonGrid{grid-template-columns:1fr;}
}
'''
    css_path.write_text(css)

release = json.loads(read('release.json'))
release['schemaVersion'] = 9
release['version'] = '10.0.0'
release['releaseClass'] = 'visual-hierarchy-responsive-polish'
release['scope'] = 'post-login-visual-hierarchy-responsive-polish'
if 'design-polish' not in release['verificationContract']:
    release['verificationContract'].insert(release['verificationContract'].index('release-evidence-consistency'), 'design-polish')
release['designPolishContract'] = {
    'schemaVersion': 1,
    'requiredScenarios': [f'D{i}' for i in range(1,9)],
    'requiredVisualEvidence': ['D1-dashboard-hierarchy.png','D4-role-card-system.png','D6-request-modal-polish.png','D7-mobile-dashboard.png']
}
release['evidenceContract']['schemaVersion'] = 8
if 'Design polish' not in release['evidenceContract']['requiredGates']:
    idx = release['evidenceContract']['requiredGates'].index('Cross-browser')
    release['evidenceContract']['requiredGates'].insert(idx, 'Design polish')
write('release.json', json.dumps(release, ensure_ascii=False, indent=2) + '\n')

package = json.loads(read('package.json'))
package['version'] = '10.0.0'
package['scripts']['test:design-polish'] = 'playwright test -c playwright.design-polish.config.js'
write('package.json', json.dumps(package, ensure_ascii=False, indent=2) + '\n')
lock = json.loads(read('package-lock.json'))
lock['version'] = '10.0.0'
lock['packages']['']['version'] = '10.0.0'
write('package-lock.json', json.dumps(lock, ensure_ascii=False, indent=2) + '\n')

write('version.txt', '''ONBOARD·OS v10.0.0
P6 feature freeze
releaseChannel=production
release.json
integrity-assets.json
resilienceContract=R1-R8
securityContract=S1-S8
uxContract=U1-U8
designSystemContract=V1-V8
designPolishContract=D1-D8
Visual hierarchy & responsive polish
Typography hierarchy · spacing rhythm · card surfaces · status badges · CTA priority · modal/drawer polish · tablet/mobile density
''')

write('playwright.design-polish.config.js', '''const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: ['**/design-polish.spec.js'],
  timeout: 45_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['json', { outputFile: 'verification/design-polish-playwright.json' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    timezoneId: 'Asia/Seoul'
  },
  projects: [{ name: 'design-polish-chromium' }],
  webServer: {
    command: 'node scripts/serve.js',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000
  }
});
''')

write('tests/design-polish.spec.js', r'''const fs = require('fs');
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

test('[D8] v10 polish is scoped after login so the approved login surface is not restyled', async ({page}) => {
  await stabilize(page);
  await expect(page.locator('body')).toHaveClass(/login-open/);
  const before = await css(page.locator('.login-card'));
  expect(before.borderRadius).not.toBe('24px');
  await login(page);
  await expect(page.locator('body')).not.toHaveClass(/login-open/);
  const panel = await css(page.locator('.overview-panel'));
  expect(panel.borderRadius).toBe('24px');
});
''')

# Keep dedicated D-suite out of the generic two-project run; the new CI gate owns it.
pw = read('playwright.config.js')
pw = replace_once(pw, "testIgnore: ['**/production.spec.js', '**/cross-browser.spec.js', '**/recovery.spec.js'],", "testIgnore: ['**/production.spec.js', '**/cross-browser.spec.js', '**/recovery.spec.js', '**/design-polish.spec.js'],", 'playwright ignore D suite')
write('playwright.config.js', pw)

contract = read('scripts/release-contract.js')
contract = replace_once(contract, "if(release.schemaVersion !== 8) fail(`schemaVersion must be 8, found ${release.schemaVersion}`);", "if(release.schemaVersion !== 9) fail(`schemaVersion must be 9, found ${release.schemaVersion}`);", 'release schema')
contract = replace_once(contract, "    'visual-system-usability',\n    'release-evidence-consistency'", "    'visual-system-usability',\n    'design-polish',\n    'release-evidence-consistency'", 'verification contract D')
marker = "  try {\n    validateEvidenceContract(release);"
block = """  const designPolish = release.designPolishContract;\n  if(!designPolish || designPolish.schemaVersion !== 1) fail('designPolishContract.schemaVersion must be 1');\n  for(const scenario of ['D1','D2','D3','D4','D5','D6','D7','D8']){\n    if(!Array.isArray(designPolish.requiredScenarios) || !designPolish.requiredScenarios.includes(scenario)){\n      fail(`designPolishContract.requiredScenarios missing ${scenario}`);\n    }\n  }\n  for(const visual of ['D1-dashboard-hierarchy.png','D4-role-card-system.png','D6-request-modal-polish.png','D7-mobile-dashboard.png']){\n    if(!Array.isArray(designPolish.requiredVisualEvidence) || !designPolish.requiredVisualEvidence.includes(visual)){\n      fail(`designPolishContract.requiredVisualEvidence missing ${visual}`);\n    }\n  }\n\n  try {\n    validateEvidenceContract(release);"""
contract = replace_once(contract, marker, block, 'design polish validation')
contract = replace_once(contract, "if(!/^designSystemContract=V1-V8$/m.test(versionText)) fail('version.txt must declare designSystemContract=V1-V8');", "if(!/^designSystemContract=V1-V8$/m.test(versionText)) fail('version.txt must declare designSystemContract=V1-V8');\n  if(!/^designPolishContract=D1-D8$/m.test(versionText)) fail('version.txt must declare designPolishContract=D1-D8');", 'version D contract')
contract = replace_once(contract, "· visual=${release.designSystemContract.requiredScenarios.length} scenarios`);", "· visual=${release.designSystemContract.requiredScenarios.length} · design=${release.designPolishContract.requiredScenarios.length} scenarios`);", 'contract output')
write('scripts/release-contract.js', contract)

evidence = read('scripts/release-evidence.js')
evidence = replace_once(evidence, "if(contract.schemaVersion !== 7) fail(`evidenceContract.schemaVersion must be 7, found ${contract.schemaVersion}`);", "if(contract.schemaVersion !== 8) fail(`evidenceContract.schemaVersion must be 8, found ${contract.schemaVersion}`);", 'evidence schema')
evidence = replace_once(evidence, "    'Visual system & usability',\n    'Cross-browser',", "    'Visual system & usability',\n    'Design polish',\n    'Cross-browser',", 'evidence D gate')
evidence = replace_once(evidence, "Release evidence contract PASS: v${release.version} · schema 7", "Release evidence contract PASS: v${release.version} · schema 8", 'evidence output')
write('scripts/release-evidence.js', evidence)

summary = read('scripts/verification-summary.js')
summary = replace_once(summary, "const visualSystemResult = process.env.VISUAL_SYSTEM_RESULT || 'unknown';", "const visualSystemResult = process.env.VISUAL_SYSTEM_RESULT || 'unknown';\nconst designPolishResult = process.env.DESIGN_POLISH_RESULT || 'unknown';", 'summary D env')
summary = replace_once(summary, "  {area:'Visual system & usability', gate:'Playwright V1-V8 + visual state evidence', result:visualSystemResult, scope:'focus ring + press feedback + card focus parity + selection clarity + modal/drawer hierarchy + forced-colors + mobile touch halo'},", "  {area:'Visual system & usability', gate:'Playwright V1-V8 + visual state evidence', result:visualSystemResult, scope:'focus ring + press feedback + card focus parity + selection clarity + modal/drawer hierarchy + forced-colors + mobile touch halo'},\n  {area:'Design polish', gate:'Playwright D1-D8 + visual evidence', result:designPolishResult, scope:'post-login hierarchy + spacing rhythm + grid density + card surfaces + semantic status + modal polish + tablet/mobile responsiveness + login baseline scope'},", 'summary D gate')
summary = replace_once(summary, '  schemaVersion:7,', '  schemaVersion:8,', 'summary schema')
summary = replace_once(summary, "    designSystemContract:release.designSystemContract,", "    designSystemContract:release.designSystemContract,\n    designPolishContract:release.designPolishContract,", 'summary D contract')
write('scripts/verification-summary.js', summary)

print('v10 materialization complete')
