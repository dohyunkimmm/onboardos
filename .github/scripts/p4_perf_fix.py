from pathlib import Path

root = Path('.')

# 1) Keep Pretendard for the authenticated prototype, but make it non-render-blocking
# on the initial login screen and use the official variable dynamic subset.
index_path = root / 'index.html'
index = index_path.read_text(encoding='utf-8')
old_font = '<link as="style" crossorigin="" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css" rel="stylesheet"/>'
new_font = '<link as="style" crossorigin="" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" id="brandFontStylesheet" media="print" rel="stylesheet"/>'
if old_font not in index:
    raise SystemExit('Pretendard stylesheet anchor not found')
index_path.write_text(index.replace(old_font, new_font), encoding='utf-8')

# 2) Do not build the hidden dashboard before SSO. Hydrate it only when the user
# starts the demo (or when a logged-in session is restored). This prevents the
# login performance path from fetching role icon assets that cannot yet be used.
app_path = root / 'app.js'
app = app_path.read_text(encoding='utf-8')
old_login = """function fakeLogin(){
  const button = document.querySelector('.google-btn');
  if(button.disabled) return;
  button.disabled = true;
  button.setAttribute('aria-busy','true');
  document.getElementById('loginLoader').classList.add('is-visible');
  setTimeout(()=>{
    const login = document.getElementById('loginScreen');
    login.hidden = true;
    login.setAttribute('aria-hidden','true');
    login.inert = true;
    document.body.classList.remove('login-open');
    loggedIn = true;
    saveSession();
    trackEvent('Demo Login',{role:currentRole});
    button.removeAttribute('aria-busy');
    syncPageInert();
    document.getElementById('mainContent').focus({preventScroll:true});
    showToast('가상 SSO 로그인 완료 · 직무별 라이선스를 불러왔습니다.');
  }, 1150);
}
"""
new_login = """let dashboardHydrated = false;

function hydrateDashboard(){
  if(dashboardHydrated) return;
  renderCommon();
  renderRoleTabs();
  syncFilterUI();
  setRole(currentRole);
  dashboardHydrated = true;
}

function loadBrandFont(){
  const link = document.getElementById('brandFontStylesheet');
  if(!link) return Promise.resolve();
  link.media = 'all';
  const stylesheetReady = link.sheet
    ? Promise.resolve()
    : new Promise(resolve => {
        const done = () => resolve();
        link.addEventListener('load', done, {once:true});
        link.addEventListener('error', done, {once:true});
      });
  const fontReady = stylesheetReady.then(() => {
    // Force a style pass so the newly active @font-face rules are discoverable.
    void document.body.offsetWidth;
    return document.fonts?.ready || Promise.resolve();
  });
  // Never make the prototype unusable because a third-party font CDN is slow.
  return Promise.race([fontReady, new Promise(resolve => setTimeout(resolve, 1400))]);
}

function fakeLogin(){
  const button = document.querySelector('.google-btn');
  if(button.disabled) return;
  button.disabled = true;
  button.setAttribute('aria-busy','true');
  document.getElementById('loginLoader').classList.add('is-visible');
  hydrateDashboard();
  const minimumDemoDelay = new Promise(resolve => setTimeout(resolve, 900));
  Promise.all([minimumDemoDelay, loadBrandFont()]).then(()=>{
    const login = document.getElementById('loginScreen');
    login.hidden = true;
    login.setAttribute('aria-hidden','true');
    login.inert = true;
    document.body.classList.remove('login-open');
    loggedIn = true;
    saveSession();
    trackEvent('Demo Login',{role:currentRole});
    button.removeAttribute('aria-busy');
    syncPageInert();
    document.getElementById('mainContent').focus({preventScroll:true});
    showToast('가상 SSO 로그인 완료 · 직무별 라이선스를 불러왔습니다.');
  });
}
"""
if old_login not in app:
    raise SystemExit('fakeLogin anchor not found')
app = app.replace(old_login, new_login)

old_init = """restoreSession();
renderCommon();
renderRoleTabs();
syncFilterUI();
setRole(currentRole);
const loginScreen = document.getElementById('loginScreen');
if(loggedIn){
  loginScreen.hidden = true;
  loginScreen.setAttribute('aria-hidden','true');
  loginScreen.inert = true;
  document.body.classList.remove('login-open');
} else {
  loginScreen.hidden = false;
  loginScreen.setAttribute('aria-hidden','false');
}
syncPageInert();
if(loggedIn) requestAnimationFrame(()=>document.getElementById('mainContent')?.focus({preventScroll:true}));
else requestAnimationFrame(()=>document.querySelector('.login-card')?.focus({preventScroll:true}));
"""
new_init = """restoreSession();
const loginScreen = document.getElementById('loginScreen');
if(loggedIn){
  hydrateDashboard();
  loadBrandFont();
  loginScreen.hidden = true;
  loginScreen.setAttribute('aria-hidden','true');
  loginScreen.inert = true;
  document.body.classList.remove('login-open');
} else {
  loginScreen.hidden = false;
  loginScreen.setAttribute('aria-hidden','false');
}
syncPageInert();
if(loggedIn) requestAnimationFrame(()=>document.getElementById('mainContent')?.focus({preventScroll:true}));
else requestAnimationFrame(()=>document.querySelector('.login-card')?.focus({preventScroll:true}));
"""
if old_init not in app:
    raise SystemExit('initial hydration anchor not found')
app_path.write_text(app.replace(old_init, new_init), encoding='utf-8')
