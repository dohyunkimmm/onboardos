from pathlib import Path
import json, re

ROOT = Path('.')

def read(path):
    return (ROOT / path).read_text()

def write(path, text):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text)

def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing expected pattern: {label}')
    if text.count(old) != 1:
        raise SystemExit(f'expected one occurrence for {label}, got {text.count(old)}')
    return text.replace(old, new, 1)

# ---- index.html: remove inline handlers / inline analytics bootstrap ----
html = read('index.html')
static_replacements = {
    " onclick=\"openDrawer('user')\"": " data-action=\"open-user-drawer\"",
    " onclick=\"openDrawer('admin')\"": " data-action=\"open-admin-drawer\"",
    " onclick=\"resetDemo()\"": " data-action=\"reset-demo\"",
    " onclick=\"toggleMoreMenu(event)\"": " data-action=\"toggle-more\"",
    " onclick=\"resetDemo();closeMoreMenu()\"": " data-action=\"reset-demo-close-more\"",
    " onclick=\"fakeLogin()\"": " data-action=\"fake-login\"",
    " onclick=\"openSupportRequest('other')\"": " data-action=\"support-other\"",
    " onclick=\"backdropClose(event)\"": "",
    " onclick=\"closeRequestModal()\"": " data-action=\"close-request\"",
    " onclick=\"submitRequest()\"": " data-action=\"submit-request\"",
    " onclick=\"drawerBackdropClose(event)\"": "",
    " onclick=\"closeDrawer()\"": " data-action=\"close-drawer\"",
    " onclick=\"closeActionModal(event)\"": "",
    " onclick=\"event.stopPropagation()\"": "",
    " onclick=\"hideActionModal()\"": " data-action=\"hide-action\"",
}
for old, new in static_replacements.items():
    html = html.replace(old, new)
html = re.sub(r'\s+onclick="setFilter\(\'([^\']+)\'\)"', '', html)
html = re.sub(
    r'<script>\s*window\.va = window\.va \|\| function \(\) \{ \(window\.vaq = window\.vaq \|\| \[\]\)\.push\(arguments\); \};\s*window\.si = window\.si \|\| function \(\) \{ \(window\.siq = window\.siq \|\| \[\]\)\.push\(arguments\); \};\s*</script>\s*',
    '', html, flags=re.S
)
html = replace_once(html, '<script src="app.js"></script>', '<script src="app.js"></script>\n<script src="js/events.js"></script>', 'events script include')
write('index.html', html)

# ---- analytics bootstrap moves to external file ----
analytics = read('js/analytics.js')
bootstrap = """'use strict';\n\nwindow.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };\nwindow.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };\n\n"""
analytics = analytics.replace("'use strict';\n\n", bootstrap, 1)
write('js/analytics.js', analytics)

# ---- app.js: dynamic handlers -> data actions; inline style mutations -> classes/hidden ----
app = read('app.js')
app = app.replace('document.getElementById(\'actionModalBackdrop\').style.display = \'flex\';', "document.getElementById('actionModalBackdrop').classList.add('show');")
app = app.replace('document.getElementById(\'actionModalBackdrop\').style.display = \'none\';', "document.getElementById('actionModalBackdrop').classList.remove('show');")
app = app.replace("if(action) action.style.display = 'none';", "if(action) action.classList.remove('show');")
app = app.replace("document.getElementById('loginLoader').style.display = 'block';", "document.getElementById('loginLoader').classList.add('is-visible');")
app = app.replace("login.style.display = 'none';", "login.hidden = true;")
app = app.replace("loginScreen.style.display = 'none';", "loginScreen.hidden = true;")
app = app.replace("loginScreen.style.display = 'flex';", "loginScreen.hidden = false;")
app = app.replace("action && action.style.display === 'flex'", "action && action.classList.contains('show')")

app = app.replace('onclick=\"hideActionModal()\"', 'data-action=\"hide-action\"')
app = app.replace('onclick=\"submitSupportRequest()\"', 'data-action=\"submit-support\"')
app = app.replace('onclick=\"openSupportRequest(\'role\')\"', 'data-action=\"support-role\"')
app = app.replace('onclick=\"toggleAdminFilter(\'${status}\')\"', 'data-action=\"toggle-admin-filter\" data-value=\"${status}\"')

old_cta = "const ctaBtn = (!isAuto && showCta !== false) ? `<button class=\"cta\" onclick=\"openLicenseAction('${item.name.replace(/'/g, \"\\\\'\")}')\">${sc.cta}</button>` : '';"
new_cta = "const ctaBtn = (!isAuto && showCta !== false) ? `<button class=\"cta\" data-action=\"license-action\" data-value=\"${escapeHTML(item.name)}\">${sc.cta}</button>` : '';"
app = replace_once(app, old_cta, new_cta, 'license CTA')

app = app.replace('onclick=\"confirmReject(\'${name.replace(/\'/g,\"\\\\\'\")}\')\"', 'data-action=\"confirm-reject\" data-value=\"${escapeHTML(name)}\"')
app = app.replace('onclick=\"approveLicense(\'${req.name}\')\"', 'data-action=\"approve-license\" data-value=\"${escapeHTML(req.name)}\"')
app = app.replace('onclick=\"rejectLicense(\'${req.name}\')\"', 'data-action=\"reject-license\" data-value=\"${escapeHTML(req.name)}\"')
app = app.replace('onclick=\"completeLicense(\'${req.name}\')\"', 'data-action=\"complete-license\" data-value=\"${escapeHTML(req.name)}\"')
app = app.replace('onclick=\"cancelRequest(\'${req.name}\')\"', 'data-action=\"cancel-request\" data-value=\"${escapeHTML(req.name)}\"')
app = app.replace('onclick=\"resubmitRequest(\'${req.name}\')\"', 'data-action=\"resubmit-request\" data-value=\"${escapeHTML(req.name)}\"')
write('app.js', app)

# ---- a11y: class-based overlay state ----
a11y = read('js/a11y.js')
a11y = a11y.replace("if(id === 'actionModalBackdrop') return el.style.display === 'flex';", "if(id === 'actionModalBackdrop') return el.classList.contains('show');")
write('js/a11y.js', a11y)

# ---- delegated event layer ----
events = r"""'use strict';

const actionHandlers = {
  'open-user-drawer': () => openDrawer('user'),
  'open-admin-drawer': () => openDrawer('admin'),
  'reset-demo': () => resetDemo(),
  'reset-demo-close-more': () => { resetDemo(); closeMoreMenu(); },
  'toggle-more': event => toggleMoreMenu(event),
  'fake-login': () => fakeLogin(),
  'support-other': () => openSupportRequest('other'),
  'support-role': () => openSupportRequest('role'),
  'close-request': () => closeRequestModal(),
  'submit-request': () => submitRequest(),
  'close-drawer': () => closeDrawer(),
  'hide-action': () => hideActionModal(),
  'submit-support': () => submitSupportRequest(),
  'toggle-admin-filter': (_event, value) => toggleAdminFilter(value),
  'license-action': (_event, value) => openLicenseAction(value),
  'confirm-reject': (_event, value) => confirmReject(value),
  'approve-license': (_event, value) => approveLicense(value),
  'reject-license': (_event, value) => rejectLicense(value),
  'complete-license': (_event, value) => completeLicense(value),
  'cancel-request': (_event, value) => cancelRequest(value),
  'resubmit-request': (_event, value) => resubmitRequest(value)
};

document.addEventListener('click', event => {
  const actionTarget = event.target.closest('[data-action]');
  if(actionTarget){
    const handler = actionHandlers[actionTarget.dataset.action];
    if(handler) handler(event, actionTarget.dataset.value || '');
  }

  const filter = event.target.closest('#filterTabs .filter-chip[data-filter]');
  if(filter) setFilter(filter.dataset.filter);
});

document.getElementById('requestBackdrop')?.addEventListener('click', backdropClose);
document.getElementById('drawerBackdrop')?.addEventListener('click', drawerBackdropClose);
document.getElementById('actionModalBackdrop')?.addEventListener('click', closeActionModal);
"""
write('js/events.js', events)

# ---- CSS state helpers (no runtime style attributes) ----
css = read('styles.css')
css += """\n\n/* P3 CSP-safe runtime states */\n[hidden]{display:none!important;}\n.action-modal-backdrop.show{display:flex;}\n.login-loader.is-visible{display:block;}\n"""
write('styles.css', css)

# ---- CSP/security headers ----
vercel = json.loads(read('vercel.json'))
headers = vercel.setdefault('headers', [])
root = next((h for h in headers if h.get('source') == '/(.*)'), None)
if not root:
    root = {'source':'/(.*)', 'headers':[]}
    headers.append(root)
root_headers = root.setdefault('headers', [])
root_headers = [h for h in root_headers if h.get('key','').lower() != 'content-security-policy']
root_headers.append({
    'key':'Content-Security-Policy',
    'value': "default-src 'self'; script-src 'self' https://vercel.live; script-src-attr 'none'; style-src 'self' https://cdn.jsdelivr.net https://vercel.live 'unsafe-inline'; style-src-attr 'none'; font-src 'self' data: https://cdn.jsdelivr.net https://vercel.live https://assets.vercel.com; img-src 'self' data: blob: https://vercel.live https://vercel.com; connect-src 'self' https://vitals.vercel-analytics.com https://vercel.live wss://ws-us3.pusher.com; frame-src https://vercel.live; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests"
})
root['headers'] = root_headers
write('vercel.json', json.dumps(vercel, ensure_ascii=False, indent=2) + '\n')

# ---- Node quality gate ----
quality = r"""'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const read = p => fs.readFileSync(p, 'utf8');
const fail = message => { console.error(`QUALITY GATE FAILED: ${message}`); process.exit(1); };

const runtimeFiles = ['index.html','app.js','js/a11y.js','js/analytics.js','js/events.js'];
for(const file of runtimeFiles){
  const text = read(file);
  if(/\son[a-z]+\s*=/i.test(text)) fail(`${file} still contains an inline event handler`);
  if(/\sstyle\s*=/i.test(text)) fail(`${file} still contains an inline style attribute`);
  if(/\.style\s*[.=]/.test(text)) fail(`${file} still mutates inline style`);
}
const html = read('index.html');
if(/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) fail('index.html contains an inline script block');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(read('data.js') + '\n;globalThis.__catalog={commonLicenses,roles};', sandbox);
const { commonLicenses, roles } = sandbox.__catalog;
const cards = [...commonLicenses, ...Object.values(roles).flatMap(role => role.cards || [])];
if(cards.length !== 21) fail(`expected 21 tools, found ${cards.length}`);
const names = new Set();
for(const item of cards){
  for(const key of ['name','cat','owner','audience','status','url']) if(!item[key]) fail(`${item.name || 'unknown'} missing ${key}`);
  if(names.has(item.name)) fail(`duplicate tool name: ${item.name}`);
  names.add(item.name);
  if(!['auto','request','approval'].includes(item.status)) fail(`${item.name} has invalid base status ${item.status}`);
  if(!/^https:\/\//.test(item.url)) fail(`${item.name} URL must use https`);
  if(item.icon && !fs.existsSync(path.join('.', item.icon))) fail(`${item.name} icon missing: ${item.icon}`);
}
for(const roleName of ['design','dev','data','office','unmapped']) if(!roles[roleName]) fail(`missing role ${roleName}`);

const config = JSON.parse(read('vercel.json'));
const allHeaders = (config.headers || []).flatMap(rule => rule.headers || []);
const csp = allHeaders.find(h => h.key.toLowerCase() === 'content-security-policy')?.value || '';
for(const directive of ["script-src-attr 'none'", "style-src-attr 'none'", "object-src 'none'", "frame-ancestors 'none'"]){
  if(!csp.includes(directive)) fail(`CSP missing ${directive}`);
}
console.log(`Quality gate PASS: ${cards.length} tools, ${names.size} unique names, CSP + runtime source checks`);
"""
write('scripts/quality-check.js', quality)

# ---- local test server mirrors Vercel response headers ----
serve = r"""'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const config = JSON.parse(fs.readFileSync('vercel.json','utf8'));
const securityHeaders = Object.fromEntries((config.headers || []).flatMap(rule => rule.headers || []).map(h => [h.key, h.value]));
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json; charset=utf-8'};

http.createServer((req,res) => {
  let pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  if(pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, '.' + pathname);
  if(!file.startsWith(root + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){
    res.writeHead(404, {...securityHeaders, 'Cache-Control':'no-store'}); res.end('Not found'); return;
  }
  res.writeHead(200, {...securityHeaders, 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`QA server listening on http://127.0.0.1:${port}`));
"""
write('scripts/serve.js', serve)

# ---- Playwright config: CSP-aware server + KST ----
pw = read('playwright.config.js')
pw = pw.replace("trace: 'retain-on-failure'", "trace: 'retain-on-failure',\n    timezoneId: 'Asia/Seoul'")
pw = pw.replace("command: 'python3 -m http.server 4173 --bind 127.0.0.1'", "command: 'node scripts/serve.js'")
write('playwright.config.js', pw)

# ---- axe accessibility tests ----
a11y_test = r"""const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function login(page){
  await page.goto('/');
  await page.getByRole('button', { name: 'Google SSO로 시작하기' }).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
}
async function assertA11y(page, label){
  const result = await new AxeBuilder({ page }).analyze();
  const blocking = result.violations.filter(v => ['critical','serious'].includes(v.impact));
  expect(blocking, `${label}: ${blocking.map(v => `${v.id}(${v.nodes.length})`).join(', ')}`).toEqual([]);
}

test('로그인 화면에 critical/serious axe 위반이 없다', async ({ page }) => {
  await page.goto('/');
  await assertA11y(page, 'login');
});

test('메인 대시보드에 critical/serious axe 위반이 없다', async ({ page }) => {
  await login(page);
  await assertA11y(page, 'dashboard');
});

test('라이선스 신청 모달에 critical/serious axe 위반이 없다', async ({ page }) => {
  await login(page);
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button', {name:'신청하기'}).click();
  await assertA11y(page, 'request-modal');
});

test('사용자 신청현황 Drawer에 critical/serious axe 위반이 없다', async ({ page }) => {
  await login(page);
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button', {name:'신청하기'}).click();
  await page.getByRole('button', {name:'신청 완료'}).click();
  await page.locator('#statusBtn').click();
  await assertA11y(page, 'user-drawer');
});

test('관리자 체험 Drawer에 critical/serious axe 위반이 없다', async ({ page }) => {
  await login(page);
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button', {name:'신청하기'}).click();
  await page.getByRole('button', {name:'신청 완료'}).click();
  await page.locator('#adminBtn').click();
  await assertA11y(page, 'admin-drawer');
});
"""
write('tests/accessibility.spec.js', a11y_test)

# ---- visual regression tests ----
visual_test = r"""const { test, expect } = require('@playwright/test');

async function stabilize(page){
  await page.clock.setFixedTime(new Date('2026-09-10T12:00:00+09:00'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(async () => { if(document.fonts?.ready) await document.fonts.ready; });
}
async function login(page){
  await page.getByRole('button', { name: 'Google SSO로 시작하기' }).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
  await page.locator('img').evaluateAll(images => { images.forEach(img => { img.loading = 'eager'; }); });
  await page.waitForFunction(() => [...document.images].every(img => img.complete));
}

const screenshotOptions = { animations:'disabled', caret:'hide', maxDiffPixelRatio:0.01 };

test('로그인 카드 visual baseline', async ({ page }) => {
  await stabilize(page);
  await expect(page.locator('.login-card')).toHaveScreenshot('login-card.png', screenshotOptions);
});

test('기본 대시보드 visual baseline', async ({ page }) => {
  await stabilize(page);
  await login(page);
  await expect(page).toHaveScreenshot('office-dashboard.png', { ...screenshotOptions, fullPage:true });
});

test('신청 모달 visual baseline', async ({ page }) => {
  await stabilize(page);
  await login(page);
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button', {name:'신청하기'}).click();
  await expect(page.locator('.request-modal')).toHaveScreenshot('request-modal.png', screenshotOptions);
});
"""
write('tests/visual.spec.js', visual_test)

# ---- package scripts/version; dependency itself is installed by workflow ----
pkg = json.loads(read('package.json'))
pkg['version'] = '1.6.0'
scripts = pkg.setdefault('scripts', {})
scripts['quality'] = 'node scripts/quality-check.js'
scripts['test:a11y'] = 'playwright test tests/accessibility.spec.js'
scripts['test:visual'] = 'playwright test tests/visual.spec.js'
scripts['test:visual:update'] = 'playwright test tests/visual.spec.js --update-snapshots'
write('package.json', json.dumps(pkg, ensure_ascii=False, indent=2) + '\n')

# ---- README ----
readme = read('README.md')
readme = readme.replace('- **Responsive & Accessibility** — PC/태블릿/모바일, focus trap, `aria-*`, `inert`, ESC 닫기, skip link, reduced motion', '- **Responsive & Accessibility** — PC/태블릿/모바일, focus trap, `aria-*`, `inert`, ESC 닫기, skip link, reduced motion + axe 자동 검사')
readme = readme.replace('- Playwright E2E\n- GitHub Actions', '- Playwright E2E / axe accessibility / Visual Regression\n- GitHub Actions Quality Gate')
readme = readme.replace('├── tests/\n│   └── onboard.spec.js', '├── scripts/\n│   ├── quality-check.js\n│   └── serve.js\n├── tests/\n│   ├── onboard.spec.js\n│   ├── accessibility.spec.js\n│   ├── visual.spec.js\n│   └── visual.spec.js-snapshots/')
readme = readme.replace('npm run test:e2e\n```', 'npm run quality\nnpm run test:e2e\n```')
readme = readme.replace('PR 및 `main` push에서 GitHub Actions E2E가 실행됩니다.', 'PR 및 `main` push에서 GitHub Actions가 데이터·CSP·소스 Quality Gate를 먼저 실행하고, 이후 기능 E2E·axe 접근성 검사·Desktop/Mobile Visual Regression을 검증합니다.')
readme = readme.replace('- **Security headers** — `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`를 Vercel 응답에 적용합니다.', '- **Security headers** — 기존 보안 Header와 함께 CSP를 적용하고 `script-src-attr`/`style-src-attr`을 `none`으로 제한해 inline handler·style attribute 실행을 차단합니다.')
write('README.md', readme)

print('P3 refactor staged')
