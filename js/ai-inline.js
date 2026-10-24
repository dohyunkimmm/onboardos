'use strict';

// Role defaults and task cases are local catalog guidance, never Gemini output.
// The Gemini endpoint is called only after explicit consent; no input is persisted.
const aiInlineDetail = document.getElementById('aiInlineDetail');
const aiInlineCase = document.getElementById('aiInlineCase');
const aiInlineConsent = document.getElementById('aiInlineConsent');
const aiInlineStatus = document.getElementById('aiInlineStatus');
const aiInlineResults = document.getElementById('aiInlineResults');
let aiInlineTimer = null;
let aiInlineController = null;
let aiInlineSequence = 0;
let aiInlineSignature = '';

const aiInlineRoleDefaults = {
  design:[['FG','화면 시안과 UI 작업을 협업합니다.'],['FJ','아이디어와 사용자 흐름을 정리합니다.'],['CC','그래픽 산출물을 제작합니다.']],
  dev:[['GH','코드 변경과 리뷰를 관리합니다.'],['JB','코드를 작성·디버깅합니다.'],['CP','코드 작성과 검토를 보조합니다.']],
  data:[['DB','SQL로 데이터를 조회합니다.'],['PBI','분석 결과를 시각화합니다.'],['SF','승인된 분석 데이터 환경에 접근합니다.']],
  office:[['MO','문서·스프레드시트와 보고서를 작성합니다.'],['HG','한글 문서를 작성합니다.'],['MD','계약과 전자서명을 관리합니다.']]
};

function aiInlineAvailableCases(role){
  return [...recommendationCases.shared,...(recommendationCases[role] || [])];
}
function aiInlineAllLicenses(){
  return [...commonLicenses,...Object.values(roles).flatMap(group=>[...group.cards,...(group.extras || [])])];
}
function aiInlineFindItem(toolId){
  return aiInlineAllLicenses().find(item=>item.mono===toolId);
}
function aiInlineIsException(role,item){
  return !commonLicenses.includes(item)
    && ![...roles[role].cards,...(roles[role].extras || [])].includes(item);
}
function aiInlineChoice(role){
  const explicitId = aiInlineCase.value;
  const autoId = detectRecommendationCase(aiInlineDetail.value.trim());
  const id = explicitId || autoId;
  return aiInlineAvailableCases(role).find(entry=>entry.id===id) || null;
}
function aiInlineRefreshCases(){
  const previous = aiInlineCase.value;
  const fragment = document.createDocumentFragment();
  const defaultOption = new Option('자동 탐색 · 직접 선택하지 않음','');
  fragment.append(defaultOption);
  for(const group of ['공통 업무 케이스','선택 직군 케이스']){
    const isShared = group==='공통 업무 케이스';
    const cases = isShared ? recommendationCases.shared : (recommendationCases[currentRole] || []);
    if(!cases.length) continue;
    const section = document.createElement('optgroup');
    section.label = group;
    for(const entry of cases){
      const option = new Option(entry.label,entry.id);
      section.append(option);
    }
    fragment.append(section);
  }
  aiInlineCase.replaceChildren(fragment);
  aiInlineCase.value = aiInlineAvailableCases(currentRole).some(entry=>entry.id===previous) ? previous : '';
}
function cancelAiInlineRecommendation(){
  aiInlineSequence++;
  clearTimeout(aiInlineTimer);
  aiInlineTimer = null;
  aiInlineController?.abort();
  aiInlineController = null;
}
function resetAiInlineRecommendation(){
  cancelAiInlineRecommendation();
  aiInlineSignature = '';
  aiInlineDetail.value = '';
  aiInlineCase.value = '';
  aiInlineConsent.checked = false;
  updateAiInlineRole();
}
function updateAiInlineRole(){
  aiInlineRefreshCases();
  queueAiInlineRecommendation();
}
function aiInlineDefaultResults(role,chosenCase){
  if(chosenCase) return chosenCase.recommendations.slice(0,3);
  return aiInlineRoleDefaults[role].map(([toolId,reason])=>({toolId,reason}));
}
function aiInlineStatusText(){
  const chosen = aiInlineChoice(currentRole);
  const source = chosen ? '업무 케이스' : '직군';
  if(!chosen && aiInlineDetail.value.trim()){
    return '해당 업무에 대한 기본 케이스를 찾지 못했습니다. 직군 기준 추천을 보여줍니다. 자세한 도구 비교는 Gemini를 이용할 수 있습니다.';
  }
  return `${source} 기준 기본 추천입니다. Gemini를 통한 추가 추천은 외부 전송에 동의하면 자동 실행됩니다.`;
}
function aiInlineShowExceptionRequest(item,reason){
  // Use the existing optional helpdesk demo request rather than granting another role's license.
  openSupportRequest('other',item);
  const field = document.getElementById('supportRequestNote');
  if(field) field.value = `${item.name} 예외 라이선스 검토 요청 · ${reason}`.slice(0,200);
}
function renderAiInlineCards(recommendations,role,detail,sequence,source,caseId){
  const seen = new Set();
  const fragment = document.createDocumentFragment();
  for(const recommendation of recommendations){
    const item = aiInlineFindItem(recommendation.toolId);
    if(!item || seen.has(item.mono)) throw new Error('추천 정보를 확인하지 못했습니다.');
    seen.add(item.mono);
    const exceptional = aiInlineIsException(role,item);
    const status = getEffectiveStatus(item);
    const card = document.createElement('article');
    card.className = 'ai-inline-result';
    const title = document.createElement('h3');
    title.textContent = item.name;
    const meta = document.createElement('p');
    meta.className = 'ai-inline-meta';
    meta.textContent = `${source==='ai' ? 'Gemini 추천' : caseId ? '업무 케이스 추천' : '직군 기본 추천'} · ${exceptional ? '직군 외 · 예외 검토 필요' : statusConfig[status].label}`;
    const reason = document.createElement('p');
    reason.className = 'ai-inline-reason';
    reason.textContent = recommendation.reason;
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'ghost-btn';
    action.textContent = exceptional ? '예외 요청 작성'
      : ['auto','completed'].includes(status) ? '사용 안내'
      : status === 'rejected' ? '반려 사유 확인'
      : ['pending','approved'].includes(status) ? '신청현황 확인'
      : '신청 내용 확인';
    action.addEventListener('click',()=>{
      if(!loggedIn || sequence!==aiInlineSequence || currentRole!==role
        || aiInlineDetail.value.trim()!==detail || (aiInlineChoice(role)?.id || '')!==caseId) return;
      if(source==='ai' && !aiInlineConsent.checked) return;
      if(exceptional){aiInlineShowExceptionRequest(item,recommendation.reason);return;}
      const draft = detail && source==='ai' ? recommendationRequestDraft(detail,recommendation.reason) : '';
      openLicenseAction(item.name,draft ? {role,toolId:item.mono,draft} : undefined);
    });
    card.append(title,meta,reason,action);
    fragment.append(card);
  }
  aiInlineResults.replaceChildren(fragment);
}
function queueAiInlineRecommendation(){
  const role = currentRole;
  const detail = aiInlineDetail.value.trim();
  const consent = aiInlineConsent.checked;
  const caseId = aiInlineChoice(role)?.id || '';
  const signature = JSON.stringify([role,detail,consent,caseId,loggedIn]);
  if(signature===aiInlineSignature) return;
  aiInlineSignature = signature;
  cancelAiInlineRecommendation();
  aiInlineResults.replaceChildren();
  if(!loggedIn){aiInlineStatus.textContent='로그인 후 추천을 확인할 수 있습니다.';return;}
  if(!Object.prototype.hasOwnProperty.call(roles,role)||roles[role].exception){
    aiInlineStatus.textContent='직군을 확인한 뒤 추천받을 수 있습니다.';return;
  }
  const sequence = aiInlineSequence;
  const chosenCase = aiInlineChoice(role);
  renderAiInlineCards(aiInlineDefaultResults(role,chosenCase),role,detail,sequence,'default',caseId);
  if(!consent){aiInlineStatus.textContent=aiInlineStatusText();return;}
  aiInlineStatus.textContent = '기본 추천을 표시하고 있습니다. Gemini가 추가 추천을 준비합니다…';
  aiInlineTimer = setTimeout(()=>{
    aiInlineTimer = null;
    void requestAiInlineRecommendation(role,detail,caseId,sequence);
  },1000);
}
function aiInlineError(response){
  const seconds = Number(response.headers.get('Retry-After'));
  if(response.status===429 && Number.isFinite(seconds) && seconds>0){
    return `요청이 많습니다. ${Math.ceil(seconds)}초 후 다시 시도해 주세요. 기본 추천을 이용할 수 있습니다.`;
  }
  return {
    400:'업무 케이스를 확인해 주세요. 기본 추천은 이용할 수 있습니다.',
    429:'추천 호출 한도가 적용됐습니다. 기본 추천을 이용해 주세요.',
    503:'Gemini가 연결되지 않았습니다. 기본 추천을 이용해 주세요.'
  }[response.status] || 'Gemini 추천을 가져오지 못했습니다. 기본 추천을 이용해 주세요.';
}
function showAiInlineResults(data,role,detail,caseId,sequence){
  if(!data || !Array.isArray(data.recommendations) || data.recommendations.length>3
    || (data.followUpQuestion!==null && (typeof data.followUpQuestion!=='string'
      || !data.followUpQuestion.trim() || data.followUpQuestion.length>300))
    || (data.followUpQuestion && data.recommendations.length)) throw Error('AI 응답 형식을 확인하지 못했습니다.');
  const candidateIds = new Set(caseId
    ? (aiInlineAvailableCases(role).find(entry=>entry.id===caseId)?.recommendations||[]).map(entry=>entry.toolId)
    : [...commonLicenses,...roles[role].cards,...(roles[role].extras||[])].map(item=>item.mono));
  const used = new Set();
  for(const rec of data.recommendations){
    if(!rec || !candidateIds.has(rec.toolId) || used.has(rec.toolId)
      || typeof rec.reason!=='string' || !rec.reason.trim() || rec.reason.length>300){
      throw Error('AI 추천 후보를 확인하지 못했습니다. 기본 추천을 이용해 주세요.');
    }
    used.add(rec.toolId);
  }
  if(data.recommendations.length){
    renderAiInlineCards(data.recommendations,role,detail,sequence,'ai',caseId);
    aiInlineStatus.textContent='Gemini 추천 결과입니다. 신청과 권한 지급은 기존 절차로 진행합니다.';
  }else{
    aiInlineStatus.textContent = data.followUpQuestion
      ? `Gemini 추가 질문: ${data.followUpQuestion} (기본 추천은 위에 표시됩니다.)`
      : '추가 AI 추천이 없어 기본 추천을 계속 표시합니다.';
  }
}
async function requestAiInlineRecommendation(role,detail,caseId,sequence){
  if(sequence!==aiInlineSequence || currentRole!==role || !loggedIn
    || !aiInlineConsent.checked || aiInlineDetail.value.trim()!==detail
    || (aiInlineChoice(role)?.id||'')!==caseId) return;
  const controller = new AbortController();
  aiInlineController = controller;
  const timeout = setTimeout(()=>controller.abort(),25000);
  aiInlineStatus.textContent='Gemini가 업무 도구를 비교하고 있습니다…';
  try{
    const response=await fetch('/api/recommend',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({role,caseId:caseId||null,detail}),
      signal:controller.signal
    });
    if(!response.ok) throw Error(aiInlineError(response));
    const data=await response.json();
    if(sequence!==aiInlineSequence || currentRole!==role || !loggedIn
      || !aiInlineConsent.checked || aiInlineDetail.value.trim()!==detail
      || (aiInlineChoice(role)?.id||'')!==caseId) return;
    showAiInlineResults(data,role,detail,caseId,sequence);
  }catch(error){
    if(sequence!==aiInlineSequence || currentRole!==role || !loggedIn || !aiInlineConsent.checked) return;
    aiInlineStatus.textContent=error.name==='AbortError'
      ? '추천 응답이 지연되고 있습니다. 기본 추천을 이용해 주세요.' : error.message;
  }finally{
    clearTimeout(timeout);
    if(sequence===aiInlineSequence) aiInlineController=null;
  }
}
aiInlineDetail.addEventListener('input',queueAiInlineRecommendation);
aiInlineCase.addEventListener('change',queueAiInlineRecommendation);
aiInlineConsent.addEventListener('change',queueAiInlineRecommendation);
updateAiInlineRole();
