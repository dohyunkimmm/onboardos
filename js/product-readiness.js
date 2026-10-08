'use strict';

// Catalog policy examples for this prototype; production policy comes from IT/HR.
const REQUIRED_ROLE_TOOLS = new Set(['FG','GH','SF','DB','HG']);
const INSTALLED_TOOLS = new Set(['CC','JB','DB','HG','MO','AD']);
const INVITED_TOOLS = new Set(['SL','NT','CF','JR','JSM','GH','FG','FJ','MZ','GPT']);

function requirementFor(item){
  return item.status === 'auto' || REQUIRED_ROLE_TOOLS.has(item.mono) ? '필수' : '선택';
}
function startLabel(item){
  return INSTALLED_TOOLS.has(item.mono) ? '설치 안내' : INVITED_TOOLS.has(item.mono) ? '계정·초대 안내' : '사용 시작 안내';
}
function employeeTiming(item){
  const req = requestState[item.name];
  if(!req) return item.status === 'auto' ? '사용 가능' : getSlaMeta(item.status).detail.replace('영업일 기준','영업일');
  if(req.status === 'rejected') return '보완 후 재신청';
  if(req.status === 'completed') return '사용 가능';
  const due = requestDueDate(req);
  const late = due && businessDayDistance(new Date(),due) < 0;
  return `${late ? '예정일 경과 · 담당팀 확인 필요' : '지급 예정'}${req.expected ? ' · '+req.expected : ''}`;
}
function requestFields(item,existing,isResubmit){
  if(item.status !== 'approval') return '';
  const permission = ['AWS','SF'].includes(item.mono);
  const scopeLabel = permission ? '권한 범위 (필수)' : '필요한 제품·플랜 (필수)';
  const options = permission
    ? ['조회·읽기 권한','업무 수행·쓰기 권한','관리 권한 · 별도 검토 필요']
    : ['Adobe Creative Cloud 전체 앱','Photoshop','Illustrator','Premiere Pro','기타 · 사용 목적에 기재'];
  const scope = existing?.scope || '';
  const period = existing?.period || '';
  return `<div class="approval-fields">
    <label for="requestScope">${scopeLabel}</label>
    <select id="requestScope" required><option value="">선택해 주세요</option>${options.map(value=>`<option value="${escapeHTML(value)}"${scope===value?' selected':''}>${escapeHTML(value)}</option>`).join('')}</select>
    <label for="requestPeriod">사용 기간 (필수)</label>
    <select id="requestPeriod" required><option value="">선택해 주세요</option>${['1개월','3개월','6개월','상시 · 재직 기간'].map(value=>`<option${period===value?' selected':''}>${value}</option>`).join('')}</select>
    <label for="requestBudget">비용 부담 부서·예산 코드 (선택)</label>
    <input id="requestBudget" type="text" maxlength="80" value="${escapeHTML(existing?.budget || '')}" placeholder="미입력 시 담당 부서가 확인합니다">
    <p class="field-note">비용·좌석 정보는 실제 시스템과 연결되지 않은 데모입니다. 담당자가 제품·권한 범위와 예산을 확인한 뒤 승인합니다.</p>
  </div>`;
}
function adminDecisionHTML(req){
  if(!findLicenseByName(req.name)) return '';
  if(drawerMode !== 'admin') return req.scope ? `<div class="decision-context"><b>신청 내용</b><dl><div><dt>제품·권한 범위</dt><dd>${escapeHTML(req.scope)}</dd></div><div><dt>사용 기간</dt><dd>${escapeHTML(req.period)}</dd></div><div><dt>예산·비용 부서</dt><dd>${escapeHTML(req.budget || '담당자 확인 필요')}</dd></div></dl></div>` : '';
  const rows = [['제품·권한 범위',req.scope || '기본 라이선스'],['사용 기간',req.period || '담당자 확인 필요'],['예산·비용 부서',req.budget || '담당자 확인 필요'],['잔여 좌석','미연동 · 실제 좌석 조회 필요'],['비용','미연동 · 제품·플랜별 견적 확인 필요']];
  return `<div class="decision-context"><b>승인 판단 정보</b><p>프로토타입 · 좌석·비용은 실제 운영 값이 아닙니다.</p><dl>${rows.map(([label,value])=>`<div><dt>${label}</dt><dd>${escapeHTML(value)}</dd></div>`).join('')}</dl></div>`;
}
function renderReadiness(){
  const el = document.getElementById('readinessSummary');
  if(!el) return;
  const role = roles[currentRole];
  const required = role.cards.filter(item=>requirementFor(item)==='필수');
  const ready = required.filter(item=>['auto','completed'].includes(getEffectiveStatus(item))).length;
  const optional = role.cards.filter(item=>requirementFor(item)==='선택');
  const openRequests = Object.values(requestState).filter(req=>['pending','approved','rejected'].includes(req.status));
  document.getElementById('currentRoleLabel').textContent = role.exception ? '직무 확인 필요' : role.label+' 직군';
  el.innerHTML = role.exception
    ? '<strong>직무 확인 후 필수 도구를 안내합니다</strong><p>공통 도구 6개는 먼저 이용할 수 있습니다.</p>'
    : `<strong>필수 도구 ${ready}/${required.length}개 준비 완료</strong><p>${ready===required.length?'필수 도구를 사용할 수 있습니다.':'아래 필수 도구를 신청하고 지급 상태를 확인해 주세요.'} · 공통 도구 ${commonLicenses.length}개 사용 가능</p><span class="optional-summary">선택 도구 ${optional.length}개 · 업무에 필요한 경우에만 신청</span>`;
  const queue = document.getElementById('pendingSummary');
  queue.hidden = openRequests.length === 0;
  queue.innerHTML = openRequests.length ? `<b>처리·보완 중 ${openRequests.length}건</b>${openRequests.map(req=>`<div><span>${escapeHTML(req.name)} · ${escapeHTML(statusConfig[req.status].label)}</span><span>${escapeHTML(req.status==='rejected'?'보완 후 재신청':req.expected+'까지 처리 예정')}</span></div>`).join('')}<button class="btn-secondary" data-action="open-user-drawer">요청 상세 보기</button>` : '';
}
function nextDemoAction(){
  const requests = Object.values(requestState);
  if(requests.some(req=>req.status==='rejected')) return openDrawer('user');
  if(requests.some(req=>['pending','approved'].includes(req.status))) return openDrawer('admin');
  if(currentRole==='unmapped') return openSupportRequest('role');
  const required=roles[currentRole].cards.filter(item=>requirementFor(item)==='필수');
  if(required.length && required.every(item=>['auto','completed'].includes(getEffectiveStatus(item)))) return showActionGuideModal(required[0]);
  const suggested = getSuggestedRoleLicense();
  if(suggested) return openLicenseAction(suggested.name);
  const ready = roles[currentRole].cards.find(item=>['auto','completed'].includes(getEffectiveStatus(item)));
  if(ready) showActionGuideModal(ready);
}
