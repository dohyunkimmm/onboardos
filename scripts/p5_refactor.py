from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor
import json
import re
import shutil

ROOT = Path('.')
FONT_CSS_URL = 'https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css'
FONT_LICENSE_URL = 'https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/LICENSE'


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, content):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding='utf-8')


def replace_once(path, old, new):
    text = read(path)
    if old not in text:
        raise RuntimeError(f'expected text not found in {path}: {old[:100]}')
    if text.count(old) != 1:
        raise RuntimeError(f'expected one match in {path}, found {text.count(old)}')
    write(path, text.replace(old, new, 1))


def fetch_bytes(url):
    req = Request(url, headers={'User-Agent': 'onboardos-p5-vendor/1.0'})
    with urlopen(req, timeout=30) as response:
        return response.read()


def vendor_pretendard():
    css = fetch_bytes(FONT_CSS_URL).decode('utf-8')
    refs = []
    for raw in re.findall(r'url\(([^)]+)\)', css):
        ref = raw.strip().strip('"\'')
        if ref.lower().endswith('.woff2'):
            refs.append(ref)
    refs = sorted(set(refs))
    if not refs:
        raise RuntimeError('Pretendard CSS did not contain WOFF2 references')

    font_dir = Path('fonts/pretendard')
    shutil.rmtree(font_dir, ignore_errors=True)
    font_dir.mkdir(parents=True, exist_ok=True)

    def download(ref):
        source = urljoin(FONT_CSS_URL, ref)
        name = Path(urlparse(source).path).name
        data = fetch_bytes(source)
        if not data.startswith(b'wOF2'):
            raise RuntimeError(f'{name} is not a WOFF2 file')
        (font_dir / name).write_bytes(data)
        return ref, name, len(data)

    with ThreadPoolExecutor(max_workers=8) as pool:
        downloaded = list(pool.map(download, refs))

    for ref, name, _size in downloaded:
        css = css.replace(ref, f'./pretendard/{name}')
    write('fonts/pretendard.css', css)
    Path('fonts/PRETENDARD-LICENSE.txt').write_bytes(fetch_bytes(FONT_LICENSE_URL))
    total = sum(size for _ref, _name, size in downloaded)
    print(f'Vendored Pretendard: {len(downloaded)} WOFF2 files, {total} bytes')


STATE_JS = r'''\'use strict\';

let requestStateByRole = {};
let cancelledHistoryByRole = {};  // 역할별 취소 요청 이력
let cancelledTicketsByRole = {};  // 역할별 취소 요청 번호
let requestState = {};
let cancelledHistory = {};
let cancelledTickets = {};
let ticketSeq = 1041;       // JSM 연동을 가정한 요청번호(운영에서는 JSM이 발급)
const nextTicket = () => `ITSM-${++ticketSeq}`;
let selectedFilter = 'all';
let selectedRequestItem = null;
let drawerMode = 'user';
let adminStatusFilter = 'all';
let loggedIn = false;
let supportRequestContext = null;
const SESSION_KEY = 'onboard-os:v4';
const LEGACY_SESSION_KEY = 'onboard-os:v3';
const FILTER_GROUPS = {
  all:null,
  todo:new Set(['request','approval','rejected']),
  processing:new Set(['pending','approved']),
  done:new Set(['auto','completed'])
};
let currentRole = 'office';

function ensureRoleBucket(store, role){
  if(!store[role] || typeof store[role] !== 'object' || Array.isArray(store[role])) store[role] = {};
  return store[role];
}

function activateRoleState(role=currentRole){
  currentRole = role;
  requestState = ensureRoleBucket(requestStateByRole, role);
  cancelledHistory = ensureRoleBucket(cancelledHistoryByRole, role);
  cancelledTickets = ensureRoleBucket(cancelledTicketsByRole, role);
}

activateRoleState(currentRole);

function saveSession(){
  try{
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      requestStateByRole,
      cancelledHistoryByRole,
      cancelledTicketsByRole,
      ticketSeq,
      selectedFilter,
      currentRole,
      loggedIn
    }));
  }catch(_e){}
}
function restoreSession(){
  try{
    const currentRaw = sessionStorage.getItem(SESSION_KEY);
    const legacyRaw = currentRaw ? null : sessionStorage.getItem(LEGACY_SESSION_KEY);
    const raw = currentRaw || legacyRaw;
    if(!raw) return;
    const saved = JSON.parse(raw);
    if(saved && typeof saved === 'object'){
      currentRole = roles[saved.currentRole] ? saved.currentRole : 'office';
      if(saved.requestStateByRole && typeof saved.requestStateByRole === 'object'){
        requestStateByRole = saved.requestStateByRole;
        cancelledHistoryByRole = saved.cancelledHistoryByRole && typeof saved.cancelledHistoryByRole === 'object' ? saved.cancelledHistoryByRole : {};
        cancelledTicketsByRole = saved.cancelledTicketsByRole && typeof saved.cancelledTicketsByRole === 'object' ? saved.cancelledTicketsByRole : {};
      } else {
        // v3 session migration: 기존 단일 상태는 당시 선택 직무 버킷으로만 이동한다.
        requestStateByRole = {[currentRole]: saved.requestState && typeof saved.requestState === 'object' ? saved.requestState : {}};
        cancelledHistoryByRole = {[currentRole]: saved.cancelledHistory && typeof saved.cancelledHistory === 'object' ? saved.cancelledHistory : {}};
        cancelledTicketsByRole = {[currentRole]: saved.cancelledTickets && typeof saved.cancelledTickets === 'object' ? saved.cancelledTickets : {}};
      }
      ticketSeq = Number.isFinite(saved.ticketSeq) ? saved.ticketSeq : 1041;
      selectedFilter = Object.prototype.hasOwnProperty.call(FILTER_GROUPS,saved.selectedFilter) ? saved.selectedFilter : 'all';
      loggedIn = saved.loggedIn === true;
      activateRoleState(currentRole);
      if(legacyRaw) sessionStorage.removeItem(LEGACY_SESSION_KEY);
    }
  }catch(_e){
    activateRoleState('office');
  }
}
function clearSession(){
  try{
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
  }catch(_e){}
}
'''

ASSET_INTEGRITY_JS = r'''\'use strict\';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseUrl = process.argv[2] || process.env.PRODUCTION_URL;
if(!baseUrl){
  console.error('Usage: node scripts/asset-integrity.js <production-url>');
  process.exit(2);
}

const critical = [
  'index.html',
  'styles.css',
  'data.js',
  'app.js',
  'js/state.js',
  'js/analytics.js',
  'js/a11y.js',
  'js/events.js',
  'fonts/pretendard.css'
];
const fontDir = path.join('fonts','pretendard');
const fontAssets = fs.existsSync(fontDir)
  ? fs.readdirSync(fontDir).filter(name => name.endsWith('.woff2')).sort().map(name => `fonts/pretendard/${name}`)
  : [];
const assets = [...critical, ...fontAssets];
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const verificationDir = path.join('verification');
fs.mkdirSync(verificationDir, {recursive:true});

async function fetchAsset(asset){
  const target = new URL('/' + asset, baseUrl.replace(/\/$/,'') + '/');
  target.searchParams.set('integrity', process.env.GITHUB_SHA || String(Date.now()));
  let lastError;
  for(let attempt=1; attempt<=3; attempt++){
    try{
      const response = await fetch(target, {headers:{'cache-control':'no-cache'}});
      if(!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return Buffer.from(await response.arrayBuffer());
    }catch(error){
      lastError = error;
      if(attempt < 3) await new Promise(resolve => setTimeout(resolve, 1200 * attempt));
    }
  }
  throw new Error(`${asset}: ${lastError?.message || 'fetch failed'}`);
}

(async()=>{
  const results = [];
  const concurrency = 8;
  for(let i=0; i<assets.length; i+=concurrency){
    const batch = assets.slice(i, i+concurrency);
    const rows = await Promise.all(batch.map(async asset => {
      if(!fs.existsSync(asset)) throw new Error(`local asset missing: ${asset}`);
      const local = fs.readFileSync(asset);
      const remote = await fetchAsset(asset);
      const localSha256 = hash(local);
      const remoteSha256 = hash(remote);
      return {asset, bytes:local.length, localSha256, remoteSha256, match:localSha256 === remoteSha256};
    }));
    results.push(...rows);
  }
  const report = {
    schemaVersion:1,
    generatedAt:new Date().toISOString(),
    commit:process.env.GITHUB_SHA || null,
    productionUrl:baseUrl,
    assetCount:results.length,
    allMatch:results.every(row => row.match),
    assets:results
  };
  fs.writeFileSync(path.join(verificationDir,'asset-integrity.json'), JSON.stringify(report,null,2) + '\n');
  const mismatches = results.filter(row => !row.match);
  if(mismatches.length){
    for(const row of mismatches) console.error(`HASH MISMATCH ${row.asset}\n  local  ${row.localSha256}\n  remote ${row.remoteSha256}`);
    process.exit(1);
  }
  console.log(`Production source integrity PASS: ${results.length}/${results.length} assets match SHA-256`);
})().catch(error => {
  console.error(`Production source integrity FAILED: ${error.message}`);
  process.exit(1);
});
'''

VERIFICATION_SUMMARY_JS = r'''\'use strict\';
const fs = require('fs');
const path = require('path');

const event = process.env.GITHUB_EVENT_NAME || 'local';
const isProductionRun = event === 'push' && process.env.GITHUB_REF === 'refs/heads/main';
const productionResult = process.env.PRODUCTION_RESULT || (isProductionRun ? 'unknown' : 'not_applicable');
const gates = [
  {area:'Chromium regression', gate:'Playwright', result:process.env.CHROMIUM_RESULT || 'unknown', scope:'Quality + Functional + WCAG/Keyboard/ARIA + Domain/SLA + Role Isolation + Visual'},
  {area:'Cross-browser', gate:'Playwright', result:process.env.CROSS_BROWSER_RESULT || 'unknown', scope:'Firefox + WebKit core flow'},
  {area:'Performance', gate:'Lighthouse CI', result:process.env.LIGHTHOUSE_RESULT || 'unknown', scope:'3-run budget'},
  {area:'Supply chain', gate:'npm audit + Dependency Review', result:process.env.SUPPLY_CHAIN_RESULT || 'unknown', scope:'high+ advisories + SHA-pinned Actions'},
  {area:'Production smoke', gate:'Playwright + Vercel status', result:isProductionRun ? productionResult : 'not_applicable', scope:'live flow + CSP + assets + page/console errors'},
  {area:'Deployment integrity', gate:'SHA-256', result:isProductionRun ? productionResult : 'not_applicable', scope:'deployed core assets + vendored font assets'}
];
const report = {
  schemaVersion:1,
  generatedAt:new Date().toISOString(),
  repository:process.env.GITHUB_REPOSITORY || null,
  commit:process.env.GITHUB_SHA || null,
  event,
  runId:process.env.GITHUB_RUN_ID || null,
  runUrl:process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null,
  gates
};
const dir = path.join('verification');
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'verification-summary.json'), JSON.stringify(report,null,2) + '\n');
const status = value => value === 'success' ? 'PASS' : value === 'not_applicable' || value === 'skipped' ? 'N/A' : value.toUpperCase();
const lines = [
  '# Verification Evidence',
  '',
  `- Commit: \`${report.commit || 'local'}\``,
  `- Event: \`${event}\``,
  report.runUrl ? `- Run: ${report.runUrl}` : null,
  '',
  '| Area | Gate | Result | Scope |',
  '| --- | --- | --- | --- |',
  ...gates.map(row => `| ${row.area} | ${row.gate} | **${status(row.result)}** | ${row.scope} |`),
  ''
].filter(line => line !== null);
const markdown = lines.join('\n');
fs.writeFileSync(path.join(dir,'verification-summary.md'), markdown + '\n');
if(process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + '\n');
console.log(markdown);
'''

ROLE_ISOLATION_SPEC = r'''const { test, expect } = require('@playwright/test');

async function login(page){
  await page.goto('/');
  if(await page.getByRole('button', {name:'Google SSO로 시작하기'}).isVisible()){
    await page.getByRole('button', {name:'Google SSO로 시작하기'}).click();
    await expect(page.locator('#loginScreen')).toBeHidden();
  }
}

test('직무 Preview의 신청 상태는 역할별로 격리되고 reload 후에도 복원된다', async ({ page }) => {
  await login(page);
  const officeCard = page.locator('#roleGrid .card[data-name="Microsoft Office"]');
  await officeCard.getByRole('button', {name:'신청하기'}).click();
  await page.getByRole('button', {name:'신청 완료'}).click();
  await expect(page.locator('#requestCount')).toHaveText('1');

  await page.locator('#statusBtn').click();
  const officeRequest = page.locator('.request-item').filter({hasText:'Microsoft Office'});
  const ticket = (await officeRequest.locator('.ticket-key').textContent()).trim();
  expect(ticket).toMatch(/^ITSM-\d+$/);
  await page.locator('.drawer-close').click();

  await page.locator('.role-tab[data-role="design"]').click();
  await expect(page.locator('#requestCount')).toHaveText('0');
  await page.locator('#statusBtn').click();
  await expect(page.locator('#drawerBody')).not.toContainText('Microsoft Office');
  await page.locator('.drawer-close').click();

  await page.reload();
  await expect(page.locator('#loginScreen')).toBeHidden();
  await expect(page.locator('.role-tab[data-role="design"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#requestCount')).toHaveText('0');

  await page.locator('.role-tab[data-role="office"]').click();
  await expect(page.locator('#requestCount')).toHaveText('1');
  await page.locator('#statusBtn').click();
  const restored = page.locator('.request-item').filter({hasText:'Microsoft Office'});
  await expect(restored.locator('.ticket-key')).toHaveText(ticket);
});
'''

DEPENDABOT_YML = '''version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
      time: "09:00"
      timezone: Asia/Seoul
    open-pull-requests-limit: 5
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
      time: "09:15"
      timezone: Asia/Seoul
    open-pull-requests-limit: 5
'''

QUALITY_CHECK_JS = r'''\'use strict\';
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
if(/cdn\.jsdelivr\.net/i.test(html)) fail('index.html still has a jsDelivr runtime dependency');
if(!/href="fonts\/pretendard\.css"/.test(html)) fail('self-hosted Pretendard stylesheet is not linked');

const fontCssPath = path.join('fonts','pretendard.css');
if(!fs.existsSync(fontCssPath)) fail('self-hosted Pretendard CSS is missing');
if(!fs.existsSync(path.join('fonts','PRETENDARD-LICENSE.txt'))) fail('Pretendard license file is missing');
const fontCss = read(fontCssPath);
const fontRefs = [...fontCss.matchAll(/url\(([^)]+)\)/g)].map(match => match[1].trim().replace(/^['"]|['"]$/g,''));
if(!fontRefs.length) fail('Pretendard CSS has no font files');
for(const ref of fontRefs){
  if(/^https?:/i.test(ref)) fail(`Pretendard CSS still uses remote font URL: ${ref}`);
  const resolved = path.resolve(path.dirname(fontCssPath), ref);
  if(!fs.existsSync(resolved)) fail(`Pretendard font file missing: ${ref}`);
}

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

const stateSource = read('js/state.js');
for(const token of ['requestStateByRole','cancelledHistoryByRole','cancelledTicketsByRole','activateRoleState','onboard-os:v4']){
  if(!stateSource.includes(token)) fail(`role-isolated state contract missing ${token}`);
}

const config = JSON.parse(read('vercel.json'));
const allHeaders = (config.headers || []).flatMap(rule => rule.headers || []);
const csp = allHeaders.find(h => h.key.toLowerCase() === 'content-security-policy')?.value || '';
for(const directive of ["script-src-attr 'none'", "style-src-attr 'none'", "object-src 'none'", "frame-ancestors 'none'"]){
  if(!csp.includes(directive)) fail(`CSP missing ${directive}`);
}
if(/cdn\.jsdelivr\.net/i.test(csp)) fail('CSP still allows the removed font CDN');

const workflowDir = path.join('.github','workflows');
for(const name of fs.readdirSync(workflowDir).filter(name => /\.ya?ml$/i.test(name))){
  const workflow = read(path.join(workflowDir,name));
  for(const match of workflow.matchAll(/^\s*(?:-\s*)?uses:\s*([^\s#]+)/gm)){
    const target = match[1];
    if(target.startsWith('./')) continue;
    const at = target.lastIndexOf('@');
    const ref = at >= 0 ? target.slice(at+1) : '';
    if(!/^[0-9a-f]{40}$/.test(ref)) fail(`${name} uses mutable action ref: ${target}`);
  }
}
const dependabot = read(path.join('.github','dependabot.yml'));
if(!/package-ecosystem:\s*npm/.test(dependabot) || !/package-ecosystem:\s*github-actions/.test(dependabot)) fail('Dependabot must cover npm and GitHub Actions');
const e2eWorkflow = read(path.join('.github','workflows','e2e.yml'));
if(!/npm audit --audit-level=high/.test(e2eWorkflow)) fail('high+ npm audit gate missing');
if(!/dependency-review-action@[0-9a-f]{40}/.test(e2eWorkflow)) fail('Dependency Review action is not SHA pinned');

console.log(`Quality gate PASS: ${cards.length} tools, ${names.size} unique names, ${fontRefs.length} self-hosted font subsets, role isolation, CSP + SHA-pinned workflows`);
'''


def main():
    vendor_pretendard()
    write('js/state.js', STATE_JS)
    write('scripts/asset-integrity.js', ASSET_INTEGRITY_JS)
    write('scripts/verification-summary.js', VERIFICATION_SUMMARY_JS)
    write('tests/role-isolation.spec.js', ROLE_ISOLATION_SPEC)
    write('.github/dependabot.yml', DEPENDABOT_YML)
    write('scripts/quality-check.js', QUALITY_CHECK_JS)

    replace_once(
        'index.html',
        '<link crossorigin="" href="https://cdn.jsdelivr.net" rel="preconnect"/>\n<link as="style" crossorigin="" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" id="brandFontStylesheet" media="print" rel="stylesheet"/>',
        '<link as="style" href="fonts/pretendard.css" id="brandFontStylesheet" media="print" rel="stylesheet"/>'
    )

    replace_once(
        'app.js',
        "function setRole(key){\n  currentRole = key;",
        "function setRole(key){\n  currentRole = roles[key] ? key : 'office';\n  activateRoleState(currentRole);\n  key = currentRole;"
    )
    replace_once(
        'app.js',
        "  requestState = {};\n  cancelledHistory = {};\n  cancelledTickets = {};\n  ticketSeq = 1041;\n  selectedFilter = 'all';\n  selectedRequestItem = null;\n  drawerMode = 'user';\n  adminStatusFilter = 'all';\n  supportRequestContext = null;\n  currentRole = 'office';\n  clearSession();",
        "  requestStateByRole = {};\n  cancelledHistoryByRole = {};\n  cancelledTicketsByRole = {};\n  currentRole = 'office';\n  activateRoleState(currentRole);\n  ticketSeq = 1041;\n  selectedFilter = 'all';\n  selectedRequestItem = null;\n  drawerMode = 'user';\n  adminStatusFilter = 'all';\n  supportRequestContext = null;\n  clearSession();"
    )
    replace_once(
        'app.js',
        '// Never make the prototype unusable because a third-party font CDN is slow.',
        '// Never make the prototype unusable if the optional self-hosted brand font is delayed.'
    )

    replace_once(
        'scripts/serve.js',
        "'.svg':'image/svg+xml','.png':'image/png','.json':'application/json; charset=utf-8'",
        "'.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.json':'application/json; charset=utf-8'"
    )

    vercel = json.loads(read('vercel.json'))
    for rule in vercel.get('headers', []):
        for header in rule.get('headers', []):
            if header.get('key','').lower() == 'content-security-policy':
                header['value'] = header['value'].replace(' https://cdn.jsdelivr.net', '')
    write('vercel.json', json.dumps(vercel, ensure_ascii=False, indent=2) + '\n')

    print('P5 refactor staged successfully')


if __name__ == '__main__':
    main()
