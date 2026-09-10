from pathlib import Path
import json

ROOT = Path('.')


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'missing marker: {label}')
    return text.replace(old, new, 1)


def clear_grid(html, start_marker, end_marker, replacement, label):
    start = html.find(start_marker)
    end = html.find(end_marker, start)
    if start < 0 or end < 0:
        raise SystemExit(f'missing grid marker: {label}')
    return html[:start] + replacement + html[end:]

# 1) index.html: data.js becomes the single source of truth for card markup.
index_path = ROOT / 'index.html'
html = index_path.read_text()
html = clear_grid(
    html,
    '<div class="card-grid" id="commonGrid">',
    '<div class="empty-state no-result" hidden="" id="commonEmpty">',
    '<div class="card-grid" id="commonGrid"></div>\n',
    'commonGrid',
)
html = clear_grid(
    html,
    '<div class="card-grid" id="roleGrid">',
    '<div class="empty-state no-result" hidden="" id="roleEmpty">',
    '<div class="card-grid" id="roleGrid"></div>\n',
    'roleGrid',
)
html = replace_once(
    html,
    '<a class="notion-cta" href="https://dohyunkimm.notion.site/SaaS-38521460c93481498afce73336d4a17a"',
    '<a class="notion-cta" id="caseStudyLink" href="https://dohyunkimm.notion.site/SaaS-38521460c93481498afce73336d4a17a"',
    'case study link id',
)
old_scripts = '''<script src="data.js"></script>\n<script src="app.js"></script>\n<script>\n  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };\n  window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };\n</script>'''
new_scripts = '''<script>\n  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };\n  window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };\n</script>\n<script src="data.js"></script>\n<script src="js/state.js"></script>\n<script src="js/analytics.js"></script>\n<script src="js/a11y.js"></script>\n<script src="app.js"></script>'''
html = replace_once(html, old_scripts, new_scripts, 'script order')
index_path.write_text(html)

# 2) app.js: split state/session and overlay/accessibility concerns into focused files.
app_path = ROOT / 'app.js'
original = app_path.read_text()

state_start = original.index('let requestState = {};')
state_end = original.index('const overlayReturnFocus')
state_header = original[state_start:state_end]

a11y_decl_start = state_end
a11y_decl_end = original.index('function saveSession(){')
a11y_decls = original[a11y_decl_start:a11y_decl_end]

session_start = a11y_decl_end
session_end = original.index('function syncFilterUI(){')
session_block = original[session_start:session_end]

a11y_fn_start = original.index('function toggleMoreMenu(event){')
a11y_fn_end = original.index('function escapeHTML(value){')
a11y_functions = original[a11y_fn_start:a11y_fn_end]

current_role_line = "let currentRole = 'office';\n"
if current_role_line not in original:
    raise SystemExit('missing currentRole declaration')

state_js = "'use strict';\n\n" + state_header + current_role_line + '\n' + session_block
Path('js').mkdir(exist_ok=True)
(ROOT / 'js/state.js').write_text(state_js)

a11y_js = "'use strict';\n\n" + a11y_decls + a11y_functions
(ROOT / 'js/a11y.js').write_text(a11y_js)

analytics_js = """'use strict';

// Vercel Web Analytics custom events. Never send employee identifiers or free-text request notes.
function trackEvent(name, data = {}){
  try{
    if(typeof window.va !== 'function') return;
    const payload = {name};
    if(data && Object.keys(data).length) payload.data = data;
    window.va('event', payload);
  }catch(_e){}
}
"""
(ROOT / 'js/analytics.js').write_text(analytics_js)

app = original
for block, label in [
    (state_header, 'state header'),
    (a11y_decls, 'a11y declarations'),
    (session_block, 'session block'),
    (a11y_functions, 'a11y functions'),
    (current_role_line, 'current role'),
]:
    if block not in app:
        raise SystemExit(f'missing extraction block: {label}')
    app = app.replace(block, '', 1)

# Keep layout concerns in CSS rather than dynamic HTML strings.
app = app.replace('<p style="color:var(--slate);font-size:13.5px;line-height:1.7;margin:0 0 16px;">', '<p class="action-guide-copy">')
app = app.replace('<p style="color:var(--slate);font-size:13.5px;line-height:1.7;margin:0 0 14px;">', '<p class="admin-review-copy">')
app = app.replace('<div class="empty-state" style="grid-column:1/-1;">', '<div class="empty-state span-full">')

# 3) Product analytics funnel (max 2 custom data keys per event; no PII/free text).
app = replace_once(
    app,
    "  wrap.querySelectorAll('.role-tab').forEach(btn=>{\n    btn.addEventListener('click', () => setRole(btn.dataset.role));\n  });",
    "  wrap.querySelectorAll('.role-tab').forEach(btn=>{\n    btn.addEventListener('click', () => {\n      trackEvent('Role Preview',{role:btn.dataset.role});\n      setRole(btn.dataset.role);\n    });\n  });",
    'role preview analytics',
)
app = replace_once(
    app,
    "  const ticket = requestState[name].ticket;\n  supportRequestContext = null;",
    "  const ticket = requestState[name].ticket;\n  trackEvent('Fallback Request',{kind,role:currentRole});\n  supportRequestContext = null;",
    'fallback analytics',
)
app = replace_once(
    app,
    "function resetDemo(){\n  requestState = {};",
    "function resetDemo(){\n  trackEvent('Demo Reset',{role:currentRole});\n  requestState = {};",
    'reset analytics',
)
app = replace_once(
    app,
    "    loggedIn = true;\n    saveSession();\n    button.removeAttribute('aria-busy');",
    "    loggedIn = true;\n    saveSession();\n    trackEvent('Demo Login',{role:currentRole});\n    button.removeAttribute('aria-busy');",
    'login analytics',
)
app = replace_once(
    app,
    "  delete cancelledHistory[item.name];\n  delete cancelledTickets[item.name];",
    "  trackEvent(isResubmit ? 'License Resubmit' : 'License Request',{license:item.name,type:item.status});\n  delete cancelledHistory[item.name];\n  delete cancelledTickets[item.name];",
    'license request analytics',
)
app = replace_once(
    app,
    "  requestState[name].history.push({actor:requestState[name].owner || 'IT팀',label:'라이선스 지급 완료',at:timeLabel()});\n  if(drawerMode === 'admin')",
    "  requestState[name].history.push({actor:requestState[name].owner || 'IT팀',label:'라이선스 지급 완료',at:timeLabel()});\n  trackEvent('License Complete',{license:name,type:requestState[name].baseStatus});\n  if(drawerMode === 'admin')",
    'complete analytics',
)
app = replace_once(
    app,
    "    requestState[name].history.push({actor:requestState[name].owner || 'IT팀',label:'요청 처리 완료',at:timeLabel()});\n    if(drawerMode === 'admin')",
    "    requestState[name].history.push({actor:requestState[name].owner || 'IT팀',label:'요청 처리 완료',at:timeLabel()});\n    trackEvent('Fallback Complete',{request:name,role:requestState[name].roleLabel});\n    if(drawerMode === 'admin')",
    'fallback complete analytics',
)
app = replace_once(
    app,
    "  requestState[name].history.push({actor:requestState[name].owner || 'IT팀',label:requestState[name].baseStatus === 'approval' ? '관리자 승인 완료' : 'IT 검토 완료',at:timeLabel()});\n  if(drawerMode === 'admin')",
    "  requestState[name].history.push({actor:requestState[name].owner || 'IT팀',label:requestState[name].baseStatus === 'approval' ? '관리자 승인 완료' : 'IT 검토 완료',at:timeLabel()});\n  trackEvent('Admin Review',{type:requestState[name].baseStatus,decision:'approved'});\n  if(drawerMode === 'admin')",
    'admin approve analytics',
)
app = replace_once(
    app,
    "  req.history.push({actor:req.owner || 'IT팀',label:'요청 반려 · 사유 전달',at:timeLabel()});\n  if(drawerMode === 'admin')",
    "  req.history.push({actor:req.owner || 'IT팀',label:'요청 반려 · 사유 전달',at:timeLabel()});\n  trackEvent('Admin Review',{type:req.baseStatus,decision:'rejected'});\n  if(drawerMode === 'admin')",
    'admin reject analytics',
)
app = replace_once(
    app,
    "restoreSession();\nrenderCommon();",
    "document.getElementById('caseStudyLink')?.addEventListener('click',()=>trackEvent('Case Study CTA',{source:'footer'}));\n\nrestoreSession();\nrenderCommon();",
    'case study analytics',
)
app_path.write_text(app)

# 4) CSS cleanup: centralize presentation previously embedded in JS templates.
styles_path = ROOT / 'styles.css'
styles = styles_path.read_text()
css_block = '''\n\n/* ---- Content helpers: keep dynamic templates free of inline layout styles ---- */\n.span-full{grid-column:1/-1;}\n.action-guide-copy,.admin-review-copy{color:var(--slate);font-size:13.5px;line-height:1.7;}\n.action-guide-copy{margin:0 0 16px;}\n.admin-review-copy{margin:0 0 14px;}\n'''
if '.action-guide-copy' not in styles:
    styles += css_block
styles_path.write_text(styles)

# 5) Vercel P2: docs-only build skip + conservative security headers.
vercel_path = ROOT / 'vercel.json'
config = json.loads(vercel_path.read_text())
config['ignoreCommand'] = "git diff --quiet HEAD^ HEAD -- . ':!*.md' ':!docs/**'"
config['headers'] = [{
    'source': '/(.*)',
    'headers': [
        {'key': 'X-Content-Type-Options', 'value': 'nosniff'},
        {'key': 'Referrer-Policy', 'value': 'strict-origin-when-cross-origin'},
        {'key': 'Permissions-Policy', 'value': 'camera=(), microphone=(), geolocation=()'},
        {'key': 'X-Frame-Options', 'value': 'DENY'},
    ],
}]
vercel_path.write_text(json.dumps(config, ensure_ascii=False, indent=2) + '\n')

# 6) E2E: verify analytics queue and PII exclusion in the static/local environment.
test_path = ROOT / 'tests/onboard.spec.js'
tests = test_path.read_text()
analytics_test = r'''

test('핵심 사용자 Flow 이벤트가 Analytics queue에 PII 없이 기록된다', async ({ page }) => {
  await page.goto('/');
  await login(page);
  await page.locator('.role-tab[data-role="design"]').click();
  const designCard = await card(page, 'Adobe Creative Cloud');
  await designCard.getByRole('button', { name: '승인 요청하기' }).click();
  await page.locator('#requestNote').fill('이 내용은 Analytics에 전송되면 안 됩니다');
  await page.getByRole('button', { name: '신청 완료' }).click();

  const events = await page.evaluate(() => (window.vaq || [])
    .filter(entry => entry[0] === 'event')
    .map(entry => entry[1]));
  const names = events.map(event => event.name);
  expect(names).toContain('Demo Login');
  expect(names).toContain('Role Preview');
  expect(names).toContain('License Request');

  const serialized = JSON.stringify(events);
  expect(serialized).not.toContain('hong.gildong@company.com');
  expect(serialized).not.toContain('홍길동');
  expect(serialized).not.toContain('이 내용은 Analytics에 전송되면 안 됩니다');
});
'''
if "Analytics queue에 PII 없이" not in tests:
    tests += analytics_test
test_path.write_text(tests)

# 7) README: document maintainability, analytics, headers, and ignored builds.
readme_path = ROOT / 'README.md'
readme = readme_path.read_text()
readme = replace_once(
    readme,
    "- HTML5 / CSS3 / Vanilla JavaScript\n- `sessionStorage`\n- Playwright E2E\n- GitHub Actions\n- GitHub → Vercel Production",
    "- HTML5 / CSS3 / Vanilla JavaScript\n- `sessionStorage`\n- Vercel Web Analytics custom events\n- Playwright E2E\n- GitHub Actions\n- GitHub → Vercel Production",
    'README tech stack',
)
readme = replace_once(
    readme,
    "├── data.js\n├── app.js",
    "├── data.js\n├── js/\n│   ├── state.js\n│   ├── analytics.js\n│   └── a11y.js\n├── app.js",
    'README structure',
)
observability = '''## Observability & Security\n\n- **Product events** — `Demo Login`, `Role Preview`, `License Request`, `License Resubmit`, `Fallback Request`, `Admin Review`, `License Complete`, `Fallback Complete`, `Case Study CTA`\n- **Privacy boundary** — 이름·이메일·EMP ID·자유 입력 신청 사유는 Custom Event data에 넣지 않습니다.\n- **Security headers** — `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`를 Vercel 응답에 적용합니다.\n- **Docs-only deploy skip** — Markdown/`docs/`만 변경된 commit은 Vercel Ignored Build Step으로 새 배포를 생성하지 않습니다.\n\n## Code Structure\n\n`data.js`를 라이선스 카드 데이터의 단일 Source of Truth로 사용하며 `index.html`에는 카드 목록을 중복 하드코딩하지 않습니다. 런타임 책임은 `js/state.js`(세션·상태), `js/analytics.js`(이벤트), `js/a11y.js`(오버레이·포커스), `app.js`(화면·업무 Flow)로 분리했습니다.\n\n'''
readme = replace_once(readme, '## Deployment\n', observability + '## Deployment\n', 'README P2 section')
readme_path.write_text(readme)

# Final source-level assertions.
final_html = index_path.read_text()
final_app = app_path.read_text()
assert '<div class="card-grid" id="commonGrid"></div>' in final_html
assert '<div class="card-grid" id="roleGrid"></div>' in final_html
assert 'js/state.js' in final_html and 'js/analytics.js' in final_html and 'js/a11y.js' in final_html
assert "let requestState = {};" not in final_app
assert 'const overlayReturnFocus' not in final_app
assert 'style="grid-column:1/-1;"' not in final_app
assert 'trackEvent(' in final_app
print('P2 refactor source assertions: PASS')
