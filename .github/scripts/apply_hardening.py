from pathlib import Path
import json
import re

ROOT = Path('.')


def read(path):
    return (ROOT / path).read_text(encoding='utf-8')


def write(path, text):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')


def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected exactly one match, found {count}: {old[:80]!r}')
    write(path, text.replace(old, new, 1))


def regex_once(path, pattern, replacement, flags=0):
    text = read(path)
    new_text, count = re.subn(pattern, replacement, text, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f'{path}: regex expected one match, found {count}: {pattern[:100]!r}')
    write(path, new_text)


# 1) Fallback requests become first-class ITSM demo requests.
replace_once(
    'index.html',
    '<a class="jsm-btn" href="#" onclick="showToast();return false;">🎫 IT 헬프데스크 문의하기</a>',
    '<button class="jsm-btn" onclick="openSupportRequest(\'other\')" type="button">🎫 IT 헬프데스크 문의하기</button>'
)
replace_once(
    'app.js',
    '<button class="jsm-btn" onclick="showToast(\'직무 정보 확인 요청이 IT 헬프데스크로 전달되는 데모입니다\')">직무 정보 확인 요청</button>',
    '<button class="jsm-btn" onclick="openSupportRequest(\'role\')">직무 정보 확인 요청</button>'
)
replace_once(
    'app.js',
    "let loggedIn = false;\nconst SESSION_KEY = 'onboard-os:v3';",
    "let loggedIn = false;\nlet supportRequestContext = null;\nconst SESSION_KEY = 'onboard-os:v3';"
)

support_functions = r'''function openSupportRequest(kind){
  const roleRequest = kind === 'role';
  const name = roleRequest ? '직무 정보 확인 요청' : '기타 라이선스 요청';
  const existing = requestState[name];
  if(existing){
    showToast(`${name}은 이미 접수되어 있습니다. 신청현황에서 같은 ITSM 번호로 상태를 확인해 주세요.`);
    openDrawer('user');
    return;
  }
  supportRequestContext = {kind,name};
  document.getElementById('actionModalEyebrow').textContent = 'IT HELPDESK';
  document.getElementById('actionModalTitle').textContent = roleRequest ? '직무 정보 확인 요청' : '목록에 없는 라이선스 요청';
  document.getElementById('actionModalBody').innerHTML = `
    <p class="support-request-lead">${roleRequest
      ? 'Google Workspace 조직·직무 정보가 매핑되지 않은 상황을 가정한 Fallback Flow입니다. 접수 후 사용자와 IT 관리자 화면에서 같은 요청번호로 추적됩니다.'
      : '필요한 SaaS·업무 도구가 목록에 없는 상황을 가정한 IT 헬프데스크 Flow입니다. 필요한 도구와 사용 목적을 입력해 주세요.'}</p>
    <div class="action-grid">
      <div class="action-info"><label>담당 부서</label><div>IT팀</div></div>
      <div class="action-info"><label>SLA 기준</label><div>영업일 기준 1~2일 이내</div></div>
    </div>
    <label class="request-note-label" for="supportRequestNote">${roleRequest ? '확인 요청 내용 (선택)' : '필요한 도구 · 사용 목적 (필수)'}</label>
    <textarea id="supportRequestNote" class="request-note" rows="3" maxlength="200" placeholder="${roleRequest ? '예: 신규 입사자 직무 정보가 포털에 매핑되지 않습니다' : '예: Tableau Creator · 데이터 시각화 대시보드 제작 목적'}"></textarea>
    <div class="detail-hint">접수 시 데모 ITSM 요청번호가 발급되며 신청현황과 관리자 체험에서 동일하게 표시됩니다.</div>`;
  document.getElementById('actionModalActions').innerHTML =
    `<button class="ghost-btn" onclick="hideActionModal()">취소</button>` +
    `<button class="primary-btn" onclick="submitSupportRequest()">요청 접수</button>`;
  document.getElementById('actionModalBackdrop').style.display = 'flex';
  activateOverlay('actionModalBackdrop','#supportRequestNote');
}

function submitSupportRequest(){
  if(!supportRequestContext) return;
  const {kind,name} = supportRequestContext;
  const noteEl = document.getElementById('supportRequestNote');
  let note = (noteEl?.value || '').trim();
  if(kind === 'other' && !note){
    showToast('필요한 도구와 사용 목적을 입력해 주세요.');
    noteEl?.focus();
    return;
  }
  if(!note) note = 'Google Workspace 조직·직무 정보 매핑 확인 요청';
  const today = new Date();
  requestState[name] = {
    name,
    owner:'IT팀',
    ticket:nextTicket(),
    baseStatus:'request',
    status:'pending',
    createdAt:`${today.getMonth()+1}월 ${today.getDate()}일`,
    createdTs:Date.now(),
    dueDate:businessDate(2).toISOString(),
    expected:expectedDate(2),
    note,
    roleLabel:roles[currentRole]?.label || '직무 확인 필요',
    history:[{actor:'홍길동',label:'IT 헬프데스크 요청 접수 · 사유 기재',at:timeLabel()}]
  };
  const ticket = requestState[name].ticket;
  supportRequestContext = null;
  hideActionModal();
  renderCommon();
  setRole(currentRole);
  updateDashboard();
  requestAnimationFrame(()=>document.getElementById('statusBtn')?.focus({preventScroll:true}));
  showToast(`${name}이 접수되었습니다 (${ticket}). 신청현황과 관리자 체험에서 같은 번호로 추적할 수 있습니다.`);
}

'''
replace_once('app.js', 'function resetDemo(){', support_functions + 'function resetDemo(){')
replace_once(
    'app.js',
    "  adminStatusFilter = 'all';\n  currentRole = 'office';",
    "  adminStatusFilter = 'all';\n  supportRequestContext = null;\n  currentRole = 'office';"
)

# 2) Admin KPI/state wording consistency.
regex_once(
    'app.js',
    r"function renderAdminSummary\(requests\)\{.*?\n\}\nfunction toggleAdminFilter",
    """function renderAdminSummary(requests){
  const pending = requests.filter(req => req.status === 'pending').length;
  const approved = requests.filter(req => req.status === 'approved').length;
  const rejected = requests.filter(req => req.status === 'rejected').length;
  const completed = requests.filter(req => req.status === 'completed').length;
  const makeKpi = (status,label,count) => `<button type=\"button\" class=\"admin-kpi ${status}${adminStatusFilter===status?' is-active':''}\" aria-pressed=\"${adminStatusFilter===status?'true':'false'}\" onclick=\"toggleAdminFilter('${status}')\" title=\"${label} 요청만 보기 · 다시 누르면 전체 보기\"><span class=\"admin-kpi-label\">${label}</span><strong class=\"admin-kpi-value mono\">${count}</strong></button>`;
  return `<div class=\"admin-kpis\" aria-label=\"요청 처리 현황 요약 및 상태 필터\">
    ${makeKpi('pending','검토 대기',pending)}
    ${makeKpi('approved','지급 대기',approved)}
    ${makeKpi('rejected','보완 대기',rejected)}
    ${makeKpi('completed','완료',completed)}
  </div>`;
}
function toggleAdminFilter""",
    flags=re.S
)
replace_once(
    'app.js',
    "  const adminSummary = drawerMode === 'admin' ? renderAdminSummary(allRequests) : '';\n  document.getElementById('drawerTitle').textContent = drawerMode === 'admin' ? '관리자 화면' : '신청현황';",
    "  const adminSummary = drawerMode === 'admin' ? renderAdminSummary(allRequests) : '';\n  const adminDemoNote = drawerMode === 'admin' ? `<div class=\"admin-demo-note\"><b>Interactive Prototype</b> · IT 관리자 역할 미리보기</div>` : '';\n  const adminHeader = adminSummary + adminDemoNote;\n  document.getElementById('drawerTitle').textContent = drawerMode === 'admin' ? '관리자 체험' : '신청현황';"
)
# Every drawer branch should carry the same admin header.
text = read('app.js')
text = text.replace('body.innerHTML = adminSummary +', 'body.innerHTML = adminHeader +')
write('app.js', text)
replace_once(
    'app.js',
    "    const label = adminStatusFilter === 'pending' ? '검토 대기' : adminStatusFilter === 'approved' ? '지급 대기' : '완료';",
    "    const label = adminStatusFilter === 'pending' ? '검토 대기' : adminStatusFilter === 'approved' ? '지급 대기' : adminStatusFilter === 'rejected' ? '보완 대기' : '완료';"
)
replace_once(
    'app.js',
    "    const sc = statusConfig[req.status];\n    const sla = getSlaMeta(req.baseStatus);\n    const reviewLabel = req.baseStatus === 'approval' ? '관리자 승인하기' : 'IT 검토 완료';",
    "    const sc = statusConfig[req.status];\n    const isSupportRequest = !findLicenseByName(req.name);\n    const stateLabel = isSupportRequest && req.status === 'completed' ? '처리 완료' : sc.label;\n    const sla = getSlaMeta(req.baseStatus);\n    const reviewLabel = isSupportRequest ? '요청 처리 완료' : req.baseStatus === 'approval' ? '관리자 승인하기' : 'IT 검토 완료';"
)
replace_once(
    'app.js',
    "상태 · <b>${sc.label}</b><br><span class=\"request-sla\">",
    "상태 · <b>${stateLabel}</b><br><span class=\"request-sla\">"
)
replace_once(
    'app.js',
    "function approveLicense(name){\n  if(!requestState[name]) return;\n  requestState[name].status = 'approved';",
    "function approveLicense(name){\n  if(!requestState[name]) return;\n  if(!findLicenseByName(name)){\n    requestState[name].status = 'completed';\n    requestState[name].completedAt = Date.now();\n    requestState[name].history.push({actor:requestState[name].owner || 'IT팀',label:'요청 처리 완료',at:timeLabel()});\n    if(drawerMode === 'admin') adminStatusFilter = 'completed';\n    renderCommon();\n    setRole(currentRole);\n    renderDrawer();\n    requestAnimationFrame(()=>focusCurrentOverlay('.drawer-close'));\n    showToast(`${name} 처리가 완료되었습니다. 사용자 신청현황에서도 동일 상태로 확인할 수 있습니다.`);\n    return;\n  }\n  requestState[name].status = 'approved';"
)
replace_once(
    'app.js',
    "  showToast(`${name} 검토·승인이 완료되었습니다. 관리자 화면에서 지급 완료 처리를 진행해 보세요.`);",
    "  showToast(`${name} ${requestState[name].baseStatus === 'approval' ? '관리자 승인이' : 'IT 검토가'} 완료되었습니다. 관리자 체험에서 지급 완료 처리를 진행해 보세요.`);"
)
replace_once(
    'app.js',
    "    msg='상단 <b>관리자 화면</b>에서 접수된 요청을 검토해 보세요.';",
    "    msg='상단 <b>관리자 체험</b>에서 접수된 요청을 검토해 보세요.';"
)
replace_once(
    'app.js',
    "    msg='상단 <b>관리자 화면</b>에서 라이선스 지급 완료를 처리해 보세요.';",
    "    msg='상단 <b>관리자 체험</b>에서 처리 완료 또는 라이선스 지급 완료를 진행해 보세요.';"
)
replace_once(
    'data.js',
    "  pending:  { label:'처리 중',    cls:'status-pending',  cta:'상태 보기',          timing:'담당자 검토 및 승인 대기 중' },",
    "  pending:  { label:'처리 중',    cls:'status-pending',  cta:'상태 보기',          timing:'담당자 처리 대기 중' },"
)
replace_once(
    'data.js',
    "  approved: { label:'지급 대기',  cls:'status-approved', cta:'상태 보기', timing:'검토·승인 완료 · 라이선스 지급 대기' },",
    "  approved: { label:'지급 대기',  cls:'status-approved', cta:'상태 보기', timing:'검토 또는 승인 완료 · 라이선스 지급 대기' },"
)
replace_once(
    'data.js',
    "  pending: '신청이 접수되어 담당자 검토 또는 관리자 승인 대기 중입니다.',",
    "  pending: '신청이 접수되어 담당자 처리를 기다리고 있습니다.',"
)
replace_once(
    'data.js',
    "  approved: '검토·승인이 완료되어 라이선스 지급을 기다리고 있습니다.',",
    "  approved: '필요한 검토 또는 승인이 완료되어 라이선스 지급을 기다리고 있습니다.',"
)

# Keep keyboard focus in a deterministic place after a request rerender removes the originating CTA.
replace_once(
    'app.js',
    "  showToast(`${item.name} 신청이 접수되었습니다 (${requestState[item.name].ticket}). 상단 신청현황에서 처리 상태를 확인해 보세요.`);",
    "  showToast(`${item.name} 신청이 접수되었습니다 (${requestState[item.name].ticket}). 상단 신청현황에서 처리 상태를 확인해 보세요.`);\n  requestAnimationFrame(()=>document.getElementById('statusBtn')?.focus({preventScroll:true}));"
)

# 3) Make persona switching explicit rather than implying real RBAC.
replace_once(
    'index.html',
    '<button aria-controls="drawerPanel" aria-expanded="false" class="top-btn" id="adminBtn" onclick="openDrawer(\'admin\')"><span class="desktop-label">관리자 화면</span><span class="mobile-label">관리자</span> </button>',
    '<button aria-controls="drawerPanel" aria-expanded="false" aria-label="IT 관리자 역할 체험" class="top-btn" id="adminBtn" onclick="openDrawer(\'admin\')"><span class="desktop-label">관리자 체험</span><span class="mobile-label">관리자</span> </button>'
)

# 7) Accessibility cleanup: the mobile overflow is a popover, not an ARIA menu, and low-contrast metadata is raised.
replace_once(
    'index.html',
    '<div class="more-menu" hidden="" id="moreMenu" role="menu">\n<button onclick="resetDemo();closeMoreMenu()" role="menuitem" type="button">↺ 체험 초기화</button>\n</div>',
    '<div class="more-menu" hidden="" id="moreMenu">\n<button onclick="resetDemo();closeMoreMenu()" type="button">↺ 체험 초기화</button>\n</div>'
)
replace_once(
    'app.js',
    "  if(opening) requestAnimationFrame(()=>menu.querySelector('[role=\"menuitem\"]')?.focus({preventScroll:true}));",
    "  if(opening) requestAnimationFrame(()=>menu.querySelector('button,a')?.focus({preventScroll:true}));"
)
replace_once('styles.css', '  --slate-light:#777A82;', '  --slate-light:#989BA5;')
replace_once(
    'styles.css',
    '.admin-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:-2px 0 16px;}',
    '.admin-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:-2px 0 16px;}'
)
replace_once(
    'styles.css',
    '  .admin-kpis{gap:6px;}',
    '  .admin-kpis{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;}'
)
css = read('styles.css')
css += r'''

/* ---- v1.5 hardening: admin persona, fallback requests, accessibility ---- */
.admin-kpi.rejected{border-color:rgba(251,113,133,.18);background:rgba(251,113,133,.055);}
.admin-kpi.rejected .admin-kpi-value{color:var(--alert);}
.admin-kpi.rejected.is-active{border-color:rgba(251,113,133,.44);}
.admin-demo-note{margin:-6px 0 16px;padding:10px 12px;border:1px dashed rgba(129,140,248,.24);border-radius:12px;background:rgba(99,102,241,.06);color:var(--slate);font-size:11.5px;line-height:1.55;}
.admin-demo-note b{color:var(--indigo-soft);}
.support-request-lead{color:var(--slate);font-size:13.5px;line-height:1.7;margin:0 0 16px;}
.top-btn,.cta,.btn-primary,.btn-secondary,.primary-btn,.ghost-btn,.jsm-btn{min-height:40px;}
@media (max-width:560px){
  .admin-demo-note{margin-top:-4px;}
  .support-request-lead{font-size:13px;}
}
'''
write('styles.css', css)

# 4) Playwright E2E + CI.
package = {
    'name': 'onboardos',
    'version': '1.5.0',
    'private': True,
    'scripts': {
        'test:e2e': 'playwright test',
        'test:e2e:report': 'playwright show-report'
    },
    'devDependencies': {
        '@playwright/test': '^1.55.0'
    }
}
write('package.json', json.dumps(package, ensure_ascii=False, indent=2) + '\n')

write('playwright.config.js', r'''const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } }
  ],
  webServer: {
    command: 'python3 -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000
  }
});
''')

write('tests/onboard.spec.js', r'''const { test, expect } = require('@playwright/test');

async function login(page) {
  await page.getByRole('button', { name: 'Google SSO로 시작하기' }).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
  await expect(page.locator('#mainContent')).toBeFocused();
}

async function card(page, name) {
  return page.locator('#roleGrid .card').filter({ hasText: name });
}

test('신청 → IT 검토 → 지급 완료가 동일 티켓으로 연결되고 세션이 유지된다', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await login(page);

  const officeCard = await card(page, 'Microsoft Office');
  await officeCard.getByRole('button', { name: '신청하기' }).click();
  await page.locator('#requestNote').fill('신규 입사 업무용 문서 편집');
  await page.getByRole('button', { name: '신청 완료' }).click();
  await expect(page.locator('#statusBtn')).toBeFocused();

  await page.locator('#statusBtn').click();
  const userRequest = page.locator('.request-item').filter({ hasText: 'Microsoft Office' });
  const ticket = (await userRequest.locator('.ticket-key').textContent()).trim();
  expect(ticket).toMatch(/^ITSM-\d+$/);
  await page.locator('.drawer-close').click();

  await page.locator('#adminBtn').click();
  await expect(page.locator('.admin-demo-note')).toContainText('IT 관리자 역할 미리보기');
  const adminRequest = page.locator('.request-item').filter({ hasText: 'Microsoft Office' });
  await expect(adminRequest.locator('.ticket-key')).toHaveText(ticket);
  await adminRequest.getByRole('button', { name: 'IT 검토 완료' }).click();
  await expect(page.locator('.request-item').filter({ hasText: 'Microsoft Office' })).toContainText('지급 대기');
  await page.getByRole('button', { name: '지급 완료 처리' }).click();
  await expect(page.locator('.request-item').filter({ hasText: 'Microsoft Office' })).toContainText('지급 완료');
  await page.locator('.drawer-close').click();

  await page.reload();
  await expect(page.locator('#loginScreen')).toBeHidden();
  await page.locator('#statusBtn').click();
  await expect(page.locator('.request-item').filter({ hasText: ticket })).toContainText('지급 완료');
  expect(pageErrors).toEqual([]);
});

test('승인 필요 항목은 반려 사유 → 보완 → 재신청 → 관리자 승인으로 이어진다', async ({ page }) => {
  await page.goto('/');
  await login(page);
  await page.locator('.role-tab[data-role="design"]').click();

  const designCard = await card(page, 'Adobe Creative Cloud');
  await designCard.getByRole('button', { name: '승인 요청하기' }).click();
  await page.locator('#requestNote').fill('디자인 제작 업무용');
  await page.getByRole('button', { name: '신청 완료' }).click();

  await page.locator('#adminBtn').click();
  const request = page.locator('.request-item').filter({ hasText: 'Adobe Creative Cloud' });
  await request.getByRole('button', { name: '반려' }).click();
  await page.getByRole('button', { name: '반려 처리' }).click();
  await page.locator('.drawer-close').click();

  await page.locator('#statusBtn').click();
  const rejected = page.locator('.request-item').filter({ hasText: 'Adobe Creative Cloud' });
  await expect(rejected).toContainText('반려 사유');
  await rejected.getByRole('button', { name: '수정 후 재신청' }).click();
  await page.locator('#requestNote').fill('사용 목적과 필요 기간을 보완했습니다.');
  await page.getByRole('button', { name: '재신청하기' }).click();

  await page.locator('#adminBtn').click();
  const resubmitted = page.locator('.request-item').filter({ hasText: 'Adobe Creative Cloud' });
  await resubmitted.getByRole('button', { name: '관리자 승인하기' }).click();
  await expect(page.locator('.request-item').filter({ hasText: 'Adobe Creative Cloud' })).toContainText('지급 대기');
});

test('직무 미매핑 Fallback이 실제 데모 ITSM 요청으로 생성된다', async ({ page }) => {
  await page.goto('/');
  await login(page);
  await page.locator('.role-tab[data-role="unmapped"]').click();
  await page.getByRole('button', { name: '직무 정보 확인 요청' }).click();
  await page.getByRole('button', { name: '요청 접수' }).click();
  await expect(page.locator('#statusBtn')).toBeFocused();

  await page.locator('#statusBtn').click();
  const request = page.locator('.request-item').filter({ hasText: '직무 정보 확인 요청' });
  await expect(request.locator('.ticket-key')).toHaveText(/ITSM-\d+/);
  await page.locator('.drawer-close').click();

  await page.locator('#adminBtn').click();
  const adminRequest = page.locator('.request-item').filter({ hasText: '직무 정보 확인 요청' });
  await adminRequest.getByRole('button', { name: '요청 처리 완료' }).click();
  await expect(page.locator('.request-item').filter({ hasText: '직무 정보 확인 요청' })).toContainText('처리 완료');
});

test('목록에 없는 라이선스도 IT 헬프데스크 요청으로 추적된다', async ({ page }) => {
  await page.goto('/');
  await login(page);
  await page.getByRole('button', { name: 'IT 헬프데스크 문의하기' }).click();
  await page.locator('#supportRequestNote').fill('Tableau Creator · 대시보드 제작 목적');
  await page.getByRole('button', { name: '요청 접수' }).click();
  await page.locator('#statusBtn').click();
  const request = page.locator('.request-item').filter({ hasText: '기타 라이선스 요청' });
  await expect(request).toContainText('Tableau Creator');
  await expect(request.locator('.ticket-key')).toHaveText(/ITSM-\d+/);
});
''')

write('.github/workflows/e2e.yml', r'''name: E2E

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  playwright:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
''')

# 6) README: stronger visual first impression + architecture/state diagrams + test instructions.
readme = r'''# ONBOARD·OS

신규입사자가 직무에 맞는 SaaS·업무 도구를 확인하고, 라이선스 **신청 → 검토·승인 → 지급 완료**까지의 흐름을 직접 체험할 수 있도록 설계한 인터랙티브 온보딩 포털 프로토타입입니다.

> 포트폴리오용 가상 데이터 기반 프로토타입입니다. Google SSO, Google Workspace 조직·직무 정보, Jira Service Management, SaaS Provisioning API는 실제 운영 환경을 가정한 Mock Flow이며 실제 계정·티켓 시스템과 연결되어 있지 않습니다.

![ONBOARD·OS preview](./og-image.png)

[Live Demo](https://onboardos-rho.vercel.app/) · [Case Study / 운영 정책](https://dohyunkimm.notion.site/SaaS-38521460c93481498afce73336d4a17a)

## 주요 기능

- **가상 Google SSO 로그인** — 신규입사자 인증 시나리오 체험
- **직무별 라이선스 노출** — 디자인 / 개발 / 데이터 / 경영지원·총무 / 직무 미매핑 시나리오
- **전사 공통 + 직무별 추가 라이선스 구분** — 자동 지급과 신청·승인 필요 항목 분리
- **라이선스 신청 Flow** — 신청 사유, 예상 지급일, 담당 부서, SLA 확인
- **신청현황 Tracking** — 요청번호, 처리 상태, 이력, 반려 사유 확인
- **관리자 체험** — 검토, 승인, 반려, 지급 완료와 보완 대기 KPI
- **재신청 Flow** — 반려 사유 확인 → 보완 내용 입력 → 동일 요청 이력 기반 재접수
- **Fallback Flow** — 직무 미매핑과 목록 외 라이선스도 데모 ITSM 요청번호를 발급해 사용자/관리자에서 동일하게 추적
- **State Consistency** — 사용자/관리자에서 동일 요청 상태·티켓·이력 유지
- **SLA 상태** — 정상 / 마감 임박 / 초과 / 완료 상태를 같은 기준으로 표시
- **세션 상태 유지** — `sessionStorage` 기반 체험 상태 유지 및 명시적 초기화
- **Responsive & Accessibility** — PC/태블릿/모바일, focus trap, `aria-*`, `inert`, ESC 닫기, skip link, reduced motion

## Prototype Architecture

```mermaid
flowchart LR
    GW["Google Workspace 조직·직무 정보\nMock"] --> SSO["Google SSO\nMock"]
    SSO --> PORTAL["ONBOARD·OS\nInteractive Prototype"]
    PORTAL --> JSM["Jira Service Management\nMock ITSM Request"]
    JSM --> APPROVAL["IT 검토 / 관리자 승인\nMock Workflow"]
    APPROVAL --> API["SaaS Provisioning API\nMock"]
    API --> DONE["계정·라이선스·권한 지급"]
```

## State Model

```mermaid
stateDiagram-v2
    [*] --> 신청필요
    신청필요 --> 처리중: 신청 / ITSM 발급
    처리중 --> 지급대기: IT 검토 또는 관리자 승인
    처리중 --> 반려: 반려 사유 전달
    반려 --> 처리중: 보완 후 재신청
    지급대기 --> 지급완료: 라이선스 지급
    처리중 --> 처리완료: Fallback/Helpdesk 요청
```

## SLA 기준

- 자동 지급: 계정 생성 후 **1시간 이내**
- 신청 필요: 영업일 기준 **D+1~2**
- 승인 필요: 영업일 기준 **D+2~3**

프로토타입의 영업일 계산은 **주말만 제외**합니다. 실제 운영 시에는 회사 영업일·공휴일 Calendar와 조직의 기준 시간대를 적용하는 것을 전제로 합니다.

## Tech Stack

- HTML5 / CSS3 / Vanilla JavaScript
- `sessionStorage`
- Playwright E2E
- GitHub Actions
- GitHub → Vercel Production

프레임워크 없이 정적 웹 구조로 구현했으며, Vercel Production은 GitHub `main` 브랜치와 연결되어 있습니다.

## Project Structure

```text
.
├── index.html
├── styles.css
├── data.js
├── app.js
├── og-image.png
├── icons/
│   └── *.svg
├── tests/
│   └── onboard.spec.js
├── playwright.config.js
├── package.json
├── package-lock.json
├── .github/workflows/e2e.yml
├── vercel.json
└── README.md
```

## Local Run

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`으로 접속합니다.

## E2E QA

```bash
npm ci
npx playwright install chromium
npm run test:e2e
```

Playwright는 Desktop Chromium과 Mobile Chromium에서 다음 핵심 Flow를 검증합니다.

- 신청 → IT 검토 → 지급 완료 → reload 후 session 유지
- 승인 필요 → 반려 → 보완 → 재신청 → 관리자 승인
- 직무 미매핑 → ITSM 요청 생성 → 관리자 처리 완료
- 목록 외 라이선스 → IT 헬프데스크 ITSM 요청 생성

PR 및 `main` push에서 GitHub Actions E2E가 실행됩니다.

## Deployment

```text
Feature Branch
    ↓
GitHub Pull Request + Playwright E2E
    ↓
Vercel Preview
    ↓
Merge to main
    ↓
Vercel Production
    ↓
onboardos-rho.vercel.app
```

## Prototype Scope

실제 SaaS 라이선스 발급 시스템이 아니라 아래 운영 시나리오를 검증하기 위한 Interactive Prototype입니다.

- 신규입사자의 직무 정보 기반 개인화
- 자동 지급 / 신청 / 승인 필요 항목의 구분
- Jira Service Management 요청번호 기반 Tracking 가정
- 사용자와 관리자 사이의 상태 일관성
- 반려·재신청과 직무 미매핑·목록 외 요청 Fallback
- SLA와 처리 이력의 가시성
- 모바일 환경을 포함한 주요 Service Flow

---

**기획 · 설계 · 프로토타입 구현: 김도현**
'''
write('README.md', readme)

print('Hardening files prepared successfully.')
