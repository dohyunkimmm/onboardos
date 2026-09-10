'use strict';

let requestState = {};
let cancelledHistory = {};  // 취소된 요청의 이력 보관(재신청 시 이어붙임)
let cancelledTickets = {};  // 취소된 요청의 번호 보관
let ticketSeq = 1041;       // JSM 연동을 가정한 요청번호(운영에서는 JSM이 발급)
const nextTicket = () => `ITSM-${++ticketSeq}`;
let selectedFilter = 'all';
let selectedRequestItem = null;
let drawerMode = 'user';
let adminStatusFilter = 'all';
let loggedIn = false;
const SESSION_KEY = 'onboard-os:v3';
const FILTER_GROUPS = {
  all:null,
  todo:new Set(['request','approval','rejected']),
  processing:new Set(['pending','approved']),
  done:new Set(['auto','completed'])
};
const overlayReturnFocus = new Map();
const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

function saveSession(){
  try{
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({requestState,cancelledHistory,cancelledTickets,ticketSeq,selectedFilter,currentRole,loggedIn}));
  }catch(_e){}
}
function restoreSession(){
  try{
    const raw = sessionStorage.getItem(SESSION_KEY);
    if(!raw) return;
    const saved = JSON.parse(raw);
    if(saved && typeof saved === 'object'){
      requestState = saved.requestState && typeof saved.requestState === 'object' ? saved.requestState : {};
      cancelledHistory = saved.cancelledHistory && typeof saved.cancelledHistory === 'object' ? saved.cancelledHistory : {};
      cancelledTickets = saved.cancelledTickets && typeof saved.cancelledTickets === 'object' ? saved.cancelledTickets : {};
      ticketSeq = Number.isFinite(saved.ticketSeq) ? saved.ticketSeq : 1041;
      selectedFilter = Object.prototype.hasOwnProperty.call(FILTER_GROUPS,saved.selectedFilter) ? saved.selectedFilter : 'all';
      currentRole = roles[saved.currentRole] ? saved.currentRole : 'office';
      loggedIn = saved.loggedIn === true;
    }
  }catch(_e){}
}
function clearSession(){ try{ sessionStorage.removeItem(SESSION_KEY); }catch(_e){} }
function syncFilterUI(){
  document.querySelectorAll('.filter-chip').forEach(chip => {
    const active = chip.dataset.filter === selectedFilter;
    chip.classList.toggle('active', active);
    chip.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}
function toggleMoreMenu(event){
  event?.stopPropagation();
  const menu=document.getElementById('moreMenu');
  const btn=document.getElementById('moreBtn');
  if(!menu || !btn) return;
  const opening=menu.hidden;
  menu.hidden=!opening;
  btn.setAttribute('aria-expanded',opening?'true':'false');
  if(opening) requestAnimationFrame(()=>menu.querySelector('[role="menuitem"]')?.focus({preventScroll:true}));
}
function closeMoreMenu(){
  const menu=document.getElementById('moreMenu');
  const btn=document.getElementById('moreBtn');
  if(menu) menu.hidden=true;
  if(btn) btn.setAttribute('aria-expanded','false');
}

function overlayIsOpen(id){
  const el = document.getElementById(id);
  if(!el) return false;
  if(id === 'loginScreen') return el.getAttribute('aria-hidden') !== 'true' && getComputedStyle(el).display !== 'none';
  if(id === 'actionModalBackdrop') return el.style.display === 'flex';
  return el.classList.contains('show');
}

function currentOverlay(){
  for(const id of ['actionModalBackdrop','requestBackdrop','drawerBackdrop','loginScreen']){
    if(overlayIsOpen(id)) return document.getElementById(id);
  }
  return null;
}

function visibleFocusables(root){
  return [...root.querySelectorAll(focusableSelector)].filter(el => el.getClientRects().length && !el.closest('[inert]'));
}

function syncPageInert(){
  const loginOpen = overlayIsOpen('loginScreen');
  const requestOpen = overlayIsOpen('requestBackdrop');
  const drawerOpen = overlayIsOpen('drawerBackdrop');
  const actionOpen = overlayIsOpen('actionModalBackdrop');
  const pageBlocked = loginOpen || requestOpen || drawerOpen || actionOpen;
  document.body.classList.toggle('overlay-open',requestOpen || drawerOpen || actionOpen);
  document.querySelector('.topbar').inert = pageBlocked;
  document.getElementById('mainContent').inert = pageBlocked;
  document.getElementById('skipLink').inert = pageBlocked;
  document.getElementById('loginScreen').inert = !loginOpen;
  document.getElementById('requestBackdrop').inert = !requestOpen || actionOpen;
  document.getElementById('drawerBackdrop').inert = !drawerOpen || actionOpen;
  document.getElementById('actionModalBackdrop').inert = !actionOpen;
}

function focusCurrentOverlay(preferredSelector){
  const overlay = currentOverlay();
  if(!overlay) return;
  const dialog = overlay.matches('[role="dialog"]') ? overlay : overlay.querySelector('[role="dialog"]');
  const preferred = preferredSelector ? overlay.querySelector(preferredSelector) : null;
  const target = preferred || visibleFocusables(overlay)[0] || dialog;
  target?.focus({preventScroll:true});
}

function activateOverlay(id, preferredSelector){
  const overlay = document.getElementById(id);
  if(!overlay) return;
  overlayReturnFocus.set(id, document.activeElement);
  overlay.setAttribute('aria-hidden','false');
  syncPageInert();
  requestAnimationFrame(() => focusCurrentOverlay(preferredSelector));
}

function deactivateOverlay(id){
  const overlay = document.getElementById(id);
  if(!overlay) return;
  overlay.setAttribute('aria-hidden','true');
  overlay.inert = true;
  syncPageInert();
  const returnTarget = overlayReturnFocus.get(id);
  overlayReturnFocus.delete(id);
  requestAnimationFrame(() => {
    if(returnTarget?.isConnected && !returnTarget.closest('[inert]')) returnTarget.focus({preventScroll:true});
    else focusCurrentOverlay();
  });
}

function trapOverlayFocus(event){
  if(event.key !== 'Tab') return;
  const overlay = currentOverlay();
  if(!overlay) return;
  const focusable = visibleFocusables(overlay);
  if(!focusable.length){
    event.preventDefault();
    focusCurrentOverlay();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length-1];
  if(!overlay.contains(document.activeElement)){
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if(event.shiftKey && document.activeElement === first){
    event.preventDefault();
    last.focus();
  } else if(!event.shiftKey && document.activeElement === last){
    event.preventDefault();
    first.focus();
  }
}

function escapeHTML(value){
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
let currentRole = 'office';

function openLicenseAction(name){
  const item = findLicenseByName(name);
  if(!item) return;
  const status = getEffectiveStatus(item);
  if(status === 'request' || status === 'approval'){
    openRequestModal(name);
  } else if(status === 'pending' || status === 'approved' || status === 'rejected'){
    openDrawer('user');
  } else if(status === 'completed'){
    showActionGuideModal(item);
  } else {
    showActionGuideModal(item);
  }
}

function showActionGuideModal(item){
  const st = getEffectiveStatus(item);
  const sc = statusConfig[st];
  const isDone = st === 'completed';
  document.getElementById('actionModalEyebrow').textContent = isDone ? 'LICENSE READY' : 'LICENSE GUIDE';
  document.getElementById('actionModalTitle').textContent = `${item.name} ${isDone ? '지급 완료' : '안내'}`;
  document.getElementById('actionModalBody').innerHTML = `
    <p style="color:var(--slate);font-size:13.5px;line-height:1.7;margin:0 0 16px;">${tooltipText[st] || ''}${isDone ? ' 아래 버튼은 실제 서비스로 연결되는 지점으로, 새 탭에서 열립니다.' : ''}</p>
    <div class="action-grid">
      <div class="action-info"><label>담당 부서</label><div>${item.owner}</div></div>
      <div class="action-info"><label>처리 안내</label><div>${sc.timing}</div></div>
    </div>`;
  document.getElementById('actionModalActions').innerHTML = `<button class="ghost-btn" onclick="hideActionModal()">닫기</button><a class="ghost-btn service-link-btn" href="${item.url}" target="_blank" rel="noopener noreferrer">서비스 접속 ↗</a>`;
  document.getElementById('actionModalBackdrop').style.display = 'flex';
  activateOverlay('actionModalBackdrop','.action-modal-close');
}

function hideActionModal(){
  document.getElementById('actionModalBackdrop').style.display = 'none';
  deactivateOverlay('actionModalBackdrop');
}

function closeActionModal(e){
  if(e.target.id === 'actionModalBackdrop') hideActionModal();
}

function getEffectiveStatus(item){
  const req = requestState[item.name];
  return req ? req.status : item.status;
}

// 영업일 기준으로 예상 지급일을 계산한다(주말 제외).
function businessDate(businessDays, fromDate=new Date()){
  const d = new Date(fromDate);
  d.setHours(12,0,0,0);
  let left = businessDays;
  while(left > 0){
    d.setDate(d.getDate()+1);
    const day = d.getDay();
    if(day !== 0 && day !== 6) left--;
  }
  return d;
}
function formatExpectedDate(d){
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${['일','월','화','수','목','금','토'][d.getDay()]})`;
}
function expectedDate(businessDays){
  return formatExpectedDate(businessDate(businessDays));
}
function normalizeDay(date){
  const d = new Date(date);
  if(Number.isNaN(d.getTime())) return null;
  d.setHours(12,0,0,0);
  return d;
}
function businessDayDistance(fromDate,toDate){
  const from = normalizeDay(fromDate);
  const to = normalizeDay(toDate);
  if(!from || !to) return null;
  if(from.getTime() === to.getTime()) return 0;
  const step = to > from ? 1 : -1;
  const cursor = new Date(from);
  let count = 0;
  while(cursor.getTime() !== to.getTime()){
    cursor.setDate(cursor.getDate()+step);
    const day = cursor.getDay();
    if(day !== 0 && day !== 6) count += step;
  }
  return count;
}
function requestDueDate(req){
  if(req?.dueDate){
    const parsed = normalizeDay(req.dueDate);
    if(parsed) return parsed;
  }
  const match = String(req?.expected || '').match(/(\d+)월\s*(\d+)일/);
  if(!match) return null;
  const now = new Date();
  let d = new Date(now.getFullYear(),Number(match[1])-1,Number(match[2]),12);
  if(d.getTime() < now.getTime() - 180*24*60*60*1000) d.setFullYear(d.getFullYear()+1);
  return d;
}

// 운영 SLA를 카드·신청 상세·관리자 화면에서 같은 기준으로 표시한다.
function getSlaMeta(baseStatus){
  if(baseStatus === 'approval') return { short:'D+2~3', detail:'영업일 기준 2~3일 이내' };
  if(baseStatus === 'request') return { short:'D+1~2', detail:'영업일 기준 1~2일 이내' };
  return { short:'≤1시간', detail:'계정 생성 후 1시간 이내' };
}
function getSlaHealth(req){
  if(!req) return null;
  if(req.status === 'rejected') return {label:'사용자 보완 대기', cls:'sla-health-paused'};
  const due = requestDueDate(req);
  if(req.status === 'completed'){
    if(!due || !req.completedAt) return {label:'SLA 충족', cls:'sla-health-done'};
    const late = businessDayDistance(due,new Date(req.completedAt));
    return late > 0
      ? {label:`SLA 초과 · D+${late}`, cls:'sla-health-over'}
      : {label:'SLA 충족', cls:'sla-health-done'};
  }
  if(!due) return {label:'SLA 정상', cls:'sla-health-good'};
  const left = businessDayDistance(new Date(),due);
  if(left < 0) return {label:`SLA 초과 · D+${Math.abs(left)}`, cls:'sla-health-over'};
  if(left === 0) return {label:'오늘 마감', cls:'sla-health-warn'};
  if(left === 1) return {label:'마감 임박 · D-1', cls:'sla-health-warn'};
  return {label:`SLA 정상 · D-${left}`, cls:'sla-health-good'};
}
function slaHealthHTML(req){
  const health = getSlaHealth(req);
  return health ? `<span class="sla-health ${health.cls}"><span class="sla-health-dot" aria-hidden="true"></span>${health.label}</span>` : '';
}

function renderAdminSummary(requests){
  const pending = requests.filter(req => req.status === 'pending').length;
  const approved = requests.filter(req => req.status === 'approved').length;
  const completed = requests.filter(req => req.status === 'completed').length;
  const makeKpi = (status,label,count) => `<button type="button" class="admin-kpi ${status}${adminStatusFilter===status?' is-active':''}" aria-pressed="${adminStatusFilter===status?'true':'false'}" onclick="toggleAdminFilter('${status}')" title="${label} 요청만 보기 · 다시 누르면 전체 보기"><span class="admin-kpi-label">${label}</span><strong class="admin-kpi-value mono">${count}</strong></button>`;
  return `<div class="admin-kpis" aria-label="요청 처리 현황 요약 및 상태 필터">
    ${makeKpi('pending','검토 대기',pending)}
    ${makeKpi('approved','지급 대기',approved)}
    ${makeKpi('completed','완료',completed)}
  </div>`;
}
function toggleAdminFilter(status){
  adminStatusFilter = adminStatusFilter === status ? 'all' : status;
  renderDrawer();
  requestAnimationFrame(()=>document.querySelector(`.admin-kpi.${status}`)?.focus({preventScroll:true}));
}

function renderCard(item, showCta){
  const effectiveStatus = getEffectiveStatus(item);
  const sc = statusConfig[effectiveStatus];
  const sla = getSlaMeta(item.status);
  const isApplied = !!requestState[item.name];
  const isAuto = item.status === 'auto';
  const ctaBtn = (!isAuto && showCta !== false) ? `<button class="cta" onclick="openLicenseAction('${item.name.replace(/'/g, "\\'")}')">${sc.cta}</button>` : '';
  const slaPill = isAuto ? '' : (isApplied
    ? slaHealthHTML(requestState[item.name])
    : `<span class="sla-pill mono" title="SLA ${sla.detail}">SLA · ${sla.short}</span>`);
  const ownerRow = isAuto ? '' : `<div class="card-owner">담당 · <b>${item.owner}</b></div>`;
  const bottomRight = ctaBtn ? `<div class="card-action">${ctaBtn}</div>` : '';
  return `
    <div class="card${isApplied ? ' applied' : ''}" data-name="${item.name}" data-status="${effectiveStatus}">
      <div class="card-top">
        <div class="logo-chip" aria-hidden="true">${item.icon ? `<img src="${item.icon}" alt="" loading="lazy">` : `<div class="mono-chip">${item.mono}</div>`}</div>
        <div>
          <div class="card-title">${item.name}</div>
          <div class="card-cat">${item.cat}</div>
        </div>
      </div>
      ${ownerRow}
      <div class="card-bottom">
        <div class="card-status-group">
          <span class="status-pill ${sc.cls}">${sc.label}</span>
          ${slaPill}
        </div>
        ${bottomRight}
      </div>
    </div>`;
}

function renderCommon(){
  document.getElementById('commonGrid').innerHTML = commonLicenses.map(item => renderCard(item, false)).join('');
  const cc = document.getElementById('commonCount');
  cc.dataset.base = `${commonLicenses.length}종 · 계정 생성 후 1시간 이내 자동 지급`;
  cc.textContent = cc.dataset.base;
}

function renderRoleTabs(){
  const wrap = document.getElementById('roleTabs');
  wrap.innerHTML = Object.keys(roles).map(key => {
    const r = roles[key];
    return `<button type="button" class="role-tab${key===currentRole?' active':''}${r.exception?' exception':''}" data-role="${key}" aria-pressed="${key===currentRole?'true':'false'}">${r.exception?'⚠ ':''}${r.label}</button>`;
  }).join('');
  wrap.querySelectorAll('.role-tab').forEach(btn=>{
    btn.addEventListener('click', () => setRole(btn.dataset.role));
  });
}

function setRole(key){
  currentRole = key;
  document.querySelectorAll('.role-tab').forEach(b=>{
    b.classList.toggle('active', b.dataset.role === key);
    b.setAttribute('aria-pressed', b.dataset.role === key ? 'true' : 'false');
  });
  const r = roles[key];
  document.getElementById('roleHeading').textContent = r.heading;
  const rc = document.getElementById('roleCount');
  rc.dataset.base = r.cards.length ? `${r.cards.length}종 · 직무별 추가 항목` : '';
  rc.textContent = rc.dataset.base;
  document.getElementById('userRoleMeta').textContent = r.exception
    ? '직무 정보 확인 필요'
    : `${r.label} 직군`;

  const grid = document.getElementById('roleGrid');
  grid.classList.toggle('balanced-four', r.cards.length === 4);
  if(r.cards.length === 0){
    grid.innerHTML = r.exception
      ? `<div class="empty-state" style="grid-column:1/-1;"><b>직무 매핑 확인이 필요합니다</b>전사 공통 라이선스는 우선 이용할 수 있습니다.<br><button class="jsm-btn" onclick="showToast('직무 정보 확인 요청이 IT 헬프데스크로 전달되는 데모입니다')">직무 정보 확인 요청</button></div>`
      : `<div class="empty-state" style="grid-column:1/-1;"><b>맞춤 라이선스가 없습니다</b>현재 직무에는 별도 라이선스가 없습니다. 위의 전사 공통 라이선스만 확인하시면 됩니다.</div>`;
  } else {
    grid.innerHTML = r.cards.map(item => renderCard(item, true)).join('');
  }
  applyFilters();
  updateDashboard();
}

function showToast(message){
  const t = document.getElementById('toast');
  t.textContent = message || '목록에 없는 라이선스는 JSM 문의 요청으로 접수되어 같은 형식의 요청번호가 발급됩니다.';
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=>t.classList.remove('show'), 2400);
}


function resetDemo(){
  requestState = {};
  cancelledHistory = {};
  cancelledTickets = {};
  ticketSeq = 1041;
  selectedFilter = 'all';
  selectedRequestItem = null;
  drawerMode = 'user';
  adminStatusFilter = 'all';
  currentRole = 'office';
  clearSession();


  syncFilterUI();

  document.getElementById('requestBackdrop')?.classList.remove('show');
  document.getElementById('drawerBackdrop')?.classList.remove('show');
  const action = document.getElementById('actionModalBackdrop');
  if(action) action.style.display = 'none';
  ['requestBackdrop','drawerBackdrop','actionModalBackdrop'].forEach(id => {
    const overlay = document.getElementById(id);
    if(!overlay) return;
    overlay.setAttribute('aria-hidden','true');
    overlay.inert = true;
  });
  overlayReturnFocus.clear();
  document.getElementById('statusBtn').setAttribute('aria-expanded','false');
  document.getElementById('adminBtn').setAttribute('aria-expanded','false');
  syncPageInert();

  renderCommon();
  renderRoleTabs();
  setRole('office');
  applyFilters();
  updateDashboard();
  showToast('체험 상태가 초기화되었습니다. 경영지원·총무 직무부터 다시 시작할 수 있습니다.');
}

function fakeLogin(){
  const button = document.querySelector('.google-btn');
  if(button.disabled) return;
  button.disabled = true;
  button.setAttribute('aria-busy','true');
  document.getElementById('loginLoader').style.display = 'block';
  setTimeout(()=>{
    const login = document.getElementById('loginScreen');
    login.style.display = 'none';
    login.setAttribute('aria-hidden','true');
    login.inert = true;
    document.body.classList.remove('login-open');
    loggedIn = true;
    saveSession();
    button.removeAttribute('aria-busy');
    syncPageInert();
    document.getElementById('mainContent').focus({preventScroll:true});
    showToast('가상 SSO 로그인 완료 · 직무별 라이선스를 불러왔습니다.');
  }, 1150);
}

function findLicenseByName(name){
  const all = [...commonLicenses];
  Object.values(roles).forEach(r => all.push(...r.cards));
  return all.find(x => x.name === name);
}

function setFilter(filter){
  selectedFilter = Object.prototype.hasOwnProperty.call(FILTER_GROUPS,filter) ? filter : 'all';
  syncFilterUI();
  applyFilters();
  saveSession();
}

function applyFilters(){
  const group = FILTER_GROUPS[selectedFilter];
  document.querySelectorAll('.card').forEach(card => {
    const matchesFilter = !group || group.has(card.dataset.status);
    card.classList.toggle('is-hidden', !matchesFilter);
  });
  updateSectionEmptyStates();
}

// 상태 필터로 카드가 모두 숨겨진 섹션에 안내와 개수 표시를 맞춘다.
function updateSectionEmptyStates(){
  const filtering = selectedFilter !== 'all';
  let totalVisible = 0;
  [['commonGrid','commonEmpty','commonCount'],['roleGrid','roleEmpty','roleCount']].forEach(([gridId,emptyId,countId])=>{
    const grid = document.getElementById(gridId);
    const empty = document.getElementById(emptyId);
    const countEl = document.getElementById(countId);
    if(!grid || !empty) return;
    const cards = grid.querySelectorAll('.card');
    const visible = grid.querySelectorAll('.card:not(.is-hidden)').length;
    totalVisible += visible;
    empty.hidden = true;
    grid.closest('.licenses')?.classList.toggle('is-filter-empty', filtering && cards.length > 0 && visible === 0);
    if(countEl && countEl.dataset.base){
      countEl.textContent = filtering ? `${visible}종 표시 중 · 전체 ${cards.length}종` : countEl.dataset.base;
    }
  });
  const globalEmpty = document.getElementById('globalEmpty');
  const hasRoleException = !!document.querySelector('#roleGrid .empty-state:not(.no-result)');
  if(globalEmpty) globalEmpty.hidden = !(filtering && totalVisible === 0 && !hasRoleException);
}

function openRequestModal(name){
  const existing = requestState[name];
  if(existing && existing.status !== 'rejected'){
    showToast('이미 신청된 라이선스입니다. 신청현황에서 처리 상태를 확인해 주세요.');
    openDrawer('user');
    return;
  }
  selectedRequestItem = findLicenseByName(name);
  if(!selectedRequestItem) return;
  const sc = statusConfig[selectedRequestItem.status];
  const sla = getSlaMeta(selectedRequestItem.status);
  const days = selectedRequestItem.status === 'approval' ? 3 : 2;
  const expected = expectedDate(days);
  document.getElementById('requestTitle').textContent = `${selectedRequestItem.name} 신청`;
  document.getElementById('requestDesc').textContent = selectedRequestItem.status === 'approval'
    ? '해당 라이선스는 관리자 승인 후 지급됩니다. 담당 부서와 예상 지급일을 확인해 주세요.'
    : '해당 라이선스는 신청 후 IT 담당자 검토를 거쳐 지급됩니다.';
  const isResubmit = !!(existing && existing.status === 'rejected');
  if(isResubmit){
    document.getElementById('requestTitle').textContent = `${selectedRequestItem.name} 수정 후 재신청`;
    document.getElementById('requestDesc').textContent = '반려 사유를 확인하고 보완 내용을 입력하면 다시 접수됩니다.';
  }
  document.getElementById('requestDetails').innerHTML =
    (isResubmit ? `<div class="reject-recap"><b>반려 사유</b><br>${existing.rejectionReason}</div>` : '') + `
    <div class="detail-row"><span>담당 부서</span><b>${selectedRequestItem.owner}</b></div>
    <div class="detail-row"><span>지급 대상</span><b>${selectedRequestItem.audience || roles[currentRole].label + ' 직군'}</b></div>
    <div class="detail-row"><span>상태</span><b>${sc.label}</b></div>
    <div class="detail-row"><span>예상 처리 시간</span><b>${sc.timing}</b></div>
    <div class="detail-row"><span>SLA 기준</span><b class="sla-detail"><span class="sla-pill mono">SLA · ${sla.short}</span> ${sla.detail}</b></div>
    <div class="detail-row"><span>예상 지급일</span><b>${expected}</b></div>
    <div class="detail-row"><span>신청 경로</span><b>Jira Service Management</b></div>
    <div class="detail-hint">접수 시 JSM 요청번호가 발급되고, 신청현황과 관리자 화면에서 같은 번호로 추적됩니다.</div>` +
    `<label class="request-note-label" for="requestNote">${isResubmit ? '보완 내용 (필수)' : '신청 사유 (선택)'}</label>
     <textarea id="requestNote" class="request-note" rows="2" maxlength="200" placeholder="${isResubmit ? '반려 사유에 대한 보완 내용을 입력해 주세요' : '사용 목적이나 필요 기간을 적어두면 검토가 빨라집니다'}"></textarea>`;
  document.getElementById('submitRequestBtn').textContent = isResubmit ? '재신청하기' : '신청 완료';
  document.getElementById('requestBackdrop').classList.add('show');
  activateOverlay('requestBackdrop','#requestNote');
}

function closeRequestModal(){
  document.getElementById('requestBackdrop').classList.remove('show');
  selectedRequestItem = null;
  deactivateOverlay('requestBackdrop');
}

function backdropClose(e){
  if(e.target.id === 'requestBackdrop') closeRequestModal();
}

function submitRequest(){
  if(!selectedRequestItem) return;
  const item = selectedRequestItem;
  const prevReq = requestState[item.name];
  const isResubmit = !!(prevReq && prevReq.status === 'rejected');
  const note = (document.getElementById('requestNote')?.value || '').trim();
  if(isResubmit && !note){
    showToast('보완 내용을 입력해야 재신청할 수 있습니다.');
    document.getElementById('requestNote')?.focus();
    return;
  }
  const today = new Date();
  const days = item.status === 'approval' ? 3 : 2;
  const previous = requestState[item.name];
  requestState[item.name] = {
    name:item.name,
    owner:item.owner,
    ticket: previous?.ticket || cancelledTickets[item.name] || nextTicket(),
    baseStatus:item.status,
    status:'pending',
    createdAt:`${today.getMonth()+1}월 ${today.getDate()}일`,
    createdTs:Date.now(),
    dueDate:businessDate(days).toISOString(),
    expected:expectedDate(days),
    note:note,
    roleLabel:previous?.roleLabel || roles[currentRole].label,
    history:[...(previous?.history || cancelledHistory[item.name] || []),
             {actor:'홍길동',label:((previous || cancelledHistory[item.name]) ? '재신청 접수' : '신청 접수') + (note ? ' · 사유 기재' : ''), at:timeLabel()}]
  };
  delete cancelledHistory[item.name];
  delete cancelledTickets[item.name];
  closeRequestModal();
  renderCommon();
  setRole(currentRole);
  // 4) 드로어를 자동으로 열지 않는다 — 연속 신청을 막지 않기 위해 안내만 남긴다.
  showToast(`${item.name} 신청이 접수되었습니다 (${requestState[item.name].ticket}). 상단 신청현황에서 처리 상태를 확인해 보세요.`);
}

function completeLicense(name){
  if(!requestState[name]) return;
  requestState[name].status = 'completed';
  requestState[name].completedAt = Date.now();
  requestState[name].history.push({actor:requestState[name].owner || 'IT팀',label:'라이선스 지급 완료',at:timeLabel()});
  if(drawerMode === 'admin') adminStatusFilter = 'completed';
  renderCommon();
  setRole(currentRole);
  renderDrawer();
  requestAnimationFrame(()=>focusCurrentOverlay('.drawer-close'));
  showToast(`${name} 라이선스 지급이 완료되었습니다. 아래에서 설계 배경과 운영 정책을 이어서 확인할 수 있습니다.`);
}

function approveLicense(name){
  if(!requestState[name]) return;
  requestState[name].status = 'approved';
  requestState[name].approvedAt = Date.now();
  requestState[name].history.push({actor:requestState[name].owner || 'IT팀',label:requestState[name].baseStatus === 'approval' ? '관리자 승인 완료' : 'IT 검토 완료',at:timeLabel()});
  if(drawerMode === 'admin') adminStatusFilter = 'approved';
  renderCommon();
  setRole(currentRole);
  renderDrawer();
  requestAnimationFrame(()=>focusCurrentOverlay('.drawer-close'));
  showToast(`${name} 검토·승인이 완료되었습니다. 관리자 화면에서 지급 완료 처리를 진행해 보세요.`);
}

// 관리자가 반려 사유를 직접 선택한다(운영에서는 사유가 사용자 안내·재신청 기준이 되므로 고정 문구로 두지 않는다).
function rejectLicense(name){
  const req=requestState[name];
  if(!req) return;
  document.getElementById('actionModalEyebrow').textContent = 'ADMIN REVIEW';
  document.getElementById('actionModalTitle').textContent = `${name} 반려 사유 선택`;
  document.getElementById('actionModalBody').innerHTML =
    `<p style="color:var(--slate);font-size:13.5px;line-height:1.7;margin:0 0 14px;">선택한 사유가 신청자에게 그대로 전달되며, 재신청 시 보완 기준이 됩니다.</p>
     <div class="reason-list">` +
    REJECT_REASONS.map((r,i)=>`<label class="reason-item"><input type="radio" name="rejectReason" value="${i}"${i===0?' checked':''}><span>${r}</span></label>`).join('') +
    `</div>`;
  document.getElementById('actionModalActions').innerHTML =
    `<button class="ghost-btn" onclick="hideActionModal()">취소</button>` +
    `<button class="primary-btn" onclick="confirmReject('${name.replace(/'/g,"\\'")}')">반려 처리</button>`;
  document.getElementById('actionModalBackdrop').style.display = 'flex';
  activateOverlay('actionModalBackdrop','.action-modal-close');
}

function confirmReject(name){
  const req=requestState[name];
  if(!req) return;
  const picked = document.querySelector('input[name="rejectReason"]:checked');
  req.status='rejected';
  req.rejectionReason = REJECT_REASONS[picked ? Number(picked.value) : 0];
  req.rejectedAt = Date.now();
  req.history.push({actor:req.owner || 'IT팀',label:'요청 반려 · 사유 전달',at:timeLabel()});
  if(drawerMode === 'admin') adminStatusFilter = 'all';
  hideActionModal();
  renderCommon();
  setRole(currentRole);
  renderDrawer();
  requestAnimationFrame(()=>focusCurrentOverlay('.drawer-close'));
  showToast(`${name} 요청이 반려되었습니다. 사용자 신청현황에서 사유와 재신청 흐름을 확인해 보세요.`);
}

function cancelRequest(name){
  const req=requestState[name];
  if(!req || req.status !== 'pending') return;
  // 취소도 상태 변경 이력의 일부이므로 기록을 남기고 카드만 신청 전 상태로 되돌린다.
  req.history.push({actor:'홍길동',label:'사용자 신청 취소', at:timeLabel()});
  cancelledHistory[name] = req.history;
  cancelledTickets[name] = req.ticket;
  delete requestState[name];
  renderCommon();
  setRole(currentRole);
  renderDrawer();
  requestAnimationFrame(()=>focusCurrentOverlay('.drawer-close'));
  showToast(`${name} 신청이 취소되었습니다. 취소 이력은 재신청 시 함께 표시됩니다.`);
}

// 재신청은 '보완'이 핵심이므로 반려 사유를 다시 보여주고 보완 내용을 받는다.
function resubmitRequest(name){
  closeDrawer();
  openRequestModal(name);
}

function timeLabel(){
  const d=new Date();
  return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function openDrawer(mode){
  drawerMode = mode;
  if(mode === 'admin') adminStatusFilter = 'all';
  document.getElementById('drawerBackdrop').classList.add('show');
  renderDrawer();
  document.getElementById('statusBtn').setAttribute('aria-expanded',mode === 'user' ? 'true' : 'false');
  document.getElementById('adminBtn').setAttribute('aria-expanded',mode === 'admin' ? 'true' : 'false');
  activateOverlay('drawerBackdrop','.drawer-close');
}

function closeDrawer(){
  document.getElementById('drawerBackdrop').classList.remove('show');
  document.getElementById('statusBtn').setAttribute('aria-expanded','false');
  document.getElementById('adminBtn').setAttribute('aria-expanded','false');
  deactivateOverlay('drawerBackdrop');
}

function drawerBackdropClose(e){
  if(e.target.id === 'drawerBackdrop') closeDrawer();
}

function historyActor(entry,req){
  if(entry?.actor) return entry.actor;
  return /신청 접수|재신청|신청 취소/.test(entry?.label || '') ? '홍길동' : (req?.owner || 'IT팀');
}

function renderDrawer(){
  const allRequests = Object.values(requestState);
  const body = document.getElementById('drawerBody');
  const adminSummary = drawerMode === 'admin' ? renderAdminSummary(allRequests) : '';
  document.getElementById('drawerTitle').textContent = drawerMode === 'admin' ? '관리자 화면' : '신청현황';
  if(!allRequests.length){
    const hadHistory = Object.keys(cancelledHistory).length > 0;
    body.innerHTML = adminSummary + `<div class="empty-drawer"><b>${hadHistory ? '진행 중인 신청이 없습니다.' : '아직 신청한 라이선스가 없습니다.'}</b><br>${hadHistory ? '취소한 요청의 이력은 다시 신청할 때 이어서 표시됩니다.' : '신청 필요 또는 승인 필요 라이선스의 버튼을 눌러 신청 흐름을 확인해 보세요.'}</div>`;
    return;
  }
  const arr = drawerMode === 'admin' && adminStatusFilter !== 'all'
    ? allRequests.filter(req => req.status === adminStatusFilter)
    : allRequests;
  if(!arr.length){
    const label = adminStatusFilter === 'pending' ? '검토 대기' : adminStatusFilter === 'approved' ? '지급 대기' : '완료';
    body.innerHTML = adminSummary + `<div class="empty-drawer"><b>${label} 요청이 없습니다.</b><br>선택한 KPI를 다시 누르면 전체 요청을 볼 수 있습니다.</div>`;
    return;
  }
  body.innerHTML = adminSummary + arr.map(req => {
    const sc = statusConfig[req.status];
    const sla = getSlaMeta(req.baseStatus);
    const reviewLabel = req.baseStatus === 'approval' ? '관리자 승인하기' : 'IT 검토 완료';
    const adminActions = drawerMode === 'admin' && req.status === 'pending'
      ? `<div class="request-actions"><button class="btn-primary" onclick="approveLicense('${req.name}')">${reviewLabel}</button><button class="btn-secondary" onclick="rejectLicense('${req.name}')">반려</button></div>`
      : drawerMode === 'admin' && req.status === 'approved'
      ? `<div class="request-actions"><button class="btn-primary" onclick="completeLicense('${req.name}')">지급 완료 처리</button></div>` : '';
    const userActions = drawerMode !== 'admin' && req.status === 'pending'
      ? `<div class="request-actions"><button class="btn-secondary" onclick="cancelRequest('${req.name}')">신청 취소</button></div>`
      : drawerMode !== 'admin' && req.status === 'rejected'
      ? `<div class="request-actions"><button class="btn-primary" onclick="resubmitRequest('${req.name}')">수정 후 재신청</button></div>` : '';
    const reason = req.status === 'rejected' && req.rejectionReason ? `<div class="rejection-reason"><b>반려 사유</b><br>${escapeHTML(req.rejectionReason)}</div>` : '';
    const history = `<div class="request-history">${(req.history || []).map(h=>`<div class="history-row"><span class="history-dot"></span><span><b class="history-actor">${escapeHTML(historyActor(h,req))}</b> · ${escapeHTML(h.label)} · ${escapeHTML(h.at)}</span></div>`).join('')}</div>`;
    return `<div class="request-item">
      <div class="request-item-title">${req.name}<span class="ticket-key mono">${req.ticket}</span></div>
      <div class="request-item-meta">${drawerMode === 'admin' ? `요청자 · <b>홍길동</b> (${escapeHTML(req.roleLabel || '경영지원·총무')} · 신규입사자)<br>` : ''}담당 · ${req.owner}<br>상태 · <b>${sc.label}</b><br><span class="request-sla">${slaHealthHTML(req)}<span class="sla-target">목표 ${req.expected} · 기준 ${sla.short}</span></span><br>신청일 · ${req.createdAt}</div>
      ${req.note ? `<div class="request-note-view"><b>${req.status === 'rejected' ? '직전 신청 사유' : '신청 사유'}</b><br>${escapeHTML(req.note)}</div>` : ''}
      ${reason}${history}${adminActions}${userActions}
    </div>`;
  }).join('');
}

function updateDemoCompleteState({requests,completed}){
  const box = document.getElementById('demoComplete');
  const title = document.getElementById('demoCompleteTitle');
  const lead = document.getElementById('demoCompleteLead');
  if(!box || !title || !lead) return;
  const done = requests.length > 0 && completed === requests.length;
  box.classList.toggle('is-complete',done);
  title.textContent = done ? '🎉 체험 완료' : '기획 배경 · 운영 정책';
  lead.textContent = done
    ? '신청 → 검토·승인 → 지급 완료 흐름을 모두 확인했습니다.'
    : '프로토타입의 설계 기준과 운영 시나리오를 정리했습니다.';
}

function updateDashboard(){
  const requests = Object.values(requestState);
  const pending = Object.values(requestState).filter(x => x.status === 'pending').length;
  const approved = Object.values(requestState).filter(x => x.status === 'approved').length;
  const rejected = Object.values(requestState).filter(x => x.status === 'rejected').length;
  const completed = Object.values(requestState).filter(x => x.status === 'completed').length;
  
  
  const requestCountEl = document.getElementById('requestCount');
  if(requestCountEl){
    const openCount = pending + approved + rejected;
    requestCountEl.textContent = openCount;
    requestCountEl.classList.toggle('is-empty', openCount === 0);
  }
  
  
  const steps = document.querySelectorAll('.progress-step');
  steps.forEach((s,i)=>{
    s.classList.remove('done','current');
    s.removeAttribute('aria-current');
    if(i < 2) s.classList.add('done');
  });

  // 여러 신청 건이 섞여 있으면 가장 먼저 해결해야 하는 미완료 상태를 우선 표시한다.
  let state = 'ready';
  if(rejected > 0){
    state = 'rejected';
    steps[2]?.classList.add('current');
  } else if(pending > 0){
    state = 'pending';
    steps[2]?.classList.add('done');
    steps[3]?.classList.add('current');
  } else if(approved > 0){
    state = 'approved';
    steps[2]?.classList.add('done');
    steps[3]?.classList.add('done');
    steps[4]?.classList.add('current');
  } else if(requests.length > 0 && completed === requests.length){
    state = 'completed';
    steps[2]?.classList.add('done');
    steps[3]?.classList.add('done');
    steps[4]?.classList.add('done');
  } else {
    steps[2]?.classList.add('current');
  }
  document.querySelector('.progress-step.current')?.setAttribute('aria-current','step');
  updateProgressHint({state});
  updateDemoCompleteState({requests,completed});
  saveSession();
}

// 현재 직무에서 사용자가 바로 체험할 신청 항목을 찾는다.
function getSuggestedRoleLicense(){
  const cards = roles[currentRole]?.cards || [];
  return cards.find(item => getEffectiveStatus(item) === 'request')
      || cards.find(item => getEffectiveStatus(item) === 'approval')
      || cards.find(item => ['rejected','pending','approved'].includes(getEffectiveStatus(item)))
      || null;
}

// 현재 단계에 맞는 다음 행동을 한 줄로 안내한다.
function updateProgressHint({state}){
  const el = document.getElementById('progressHint');
  if(!el) return;
  let step='체험 1/3';
  let done=false;
  let msg;
  if(state === 'rejected'){
    step='체험 1/3 · 보완';
    msg='<b>신청현황</b>에서 반려 사유를 확인하고 보완 내용을 입력해 다시 신청해 보세요.';
  } else if(state === 'ready'){
    const suggested = getSuggestedRoleLicense();
    if(currentRole === 'unmapped'){
      msg='전사 공통 항목을 확인한 뒤, 아래에서 <b>직무 정보 확인 요청</b>을 진행해 보세요.';
    } else {
      msg = suggested
        ? `전사 공통 항목을 확인한 뒤, 아래 <b>${suggested.name}</b> 신청을 진행해 보세요.`
        : '전사 공통 항목을 확인한 뒤, 아래 추가 라이선스를 확인해 보세요.';
    }
  } else if(state === 'pending'){
    step='체험 2/3';
    msg='상단 <b>관리자 화면</b>에서 접수된 요청을 검토해 보세요.';
  } else if(state === 'approved'){
    step='체험 3/3';
    msg='상단 <b>관리자 화면</b>에서 라이선스 지급 완료를 처리해 보세요.';
  } else {
    step='체험 완료'; done=true;
    msg='신청 → 검토·승인 → 지급 완료까지 확인했습니다. 아래에서 <b>설계 배경과 운영 정책</b>을 이어서 확인해 보세요.';
  }
  el.innerHTML=`<span class="demo-step-kicker${done?' is-done':''}">${step}</span><span class="hint-arrow">→</span><span>${msg}</span>`;
}


// 모바일 더보기 메뉴는 바깥 영역을 누르면 닫힌다.
document.addEventListener('click', e => {
  if(!e.target.closest('#moreMenu') && !e.target.closest('#moreBtn')) closeMoreMenu();
});

// ESC로 열려 있는 오버레이를 닫는다(모달 → 드로어 순).
document.addEventListener('keydown', e => {
  trapOverlayFocus(e);
  if(e.key !== 'Escape') return;
  const action = document.getElementById('actionModalBackdrop');
  const request = document.getElementById('requestBackdrop');
  const drawer = document.getElementById('drawerBackdrop');
  if(action && action.style.display === 'flex'){ hideActionModal(); return; }
  if(request && request.classList.contains('show')){ closeRequestModal(); return; }
  if(drawer && drawer.classList.contains('show')){ closeDrawer(); return; }
  if(!document.getElementById('moreMenu')?.hidden){ closeMoreMenu(); document.getElementById('moreBtn')?.focus(); }
});

restoreSession();
renderCommon();
renderRoleTabs();
syncFilterUI();
setRole(currentRole);
const loginScreen = document.getElementById('loginScreen');
if(loggedIn){
  loginScreen.style.display = 'none';
  loginScreen.setAttribute('aria-hidden','true');
  loginScreen.inert = true;
  document.body.classList.remove('login-open');
} else {
  loginScreen.style.display = 'flex';
  loginScreen.setAttribute('aria-hidden','false');
}
syncPageInert();
if(loggedIn) requestAnimationFrame(()=>document.getElementById('mainContent')?.focus({preventScroll:true}));
else requestAnimationFrame(()=>document.querySelector('.login-card')?.focus({preventScroll:true}));
// sessionStorage에 체험 상태를 유지하고, 초기화 버튼으로 명시적으로 리셋한다.
