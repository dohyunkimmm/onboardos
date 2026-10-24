'use strict';

// Basic recommendations use the allowlisted role catalog, without an external AI request.
// Gemini refinement is optional and requires explicit consent and a detailed task description.
const aiInlineDetail = document.getElementById('aiInlineDetail');
const aiInlineConsent = document.getElementById('aiInlineConsent');
const aiInlineStatus = document.getElementById('aiInlineStatus');
const aiInlineResults = document.getElementById('aiInlineResults');
let aiInlineTimer = null;
let aiInlineController = null;
let aiInlineSequence = 0;
let aiInlineSignature = '';

// These are transparent role-based starter suggestions, never presented as Gemini output.
const aiInlineRoleDefaults = {
  design:[
    {toolId:'FG',reason:'디자인 시안 제작과 팀 협업에 활용합니다.'},
    {toolId:'FJ',reason:'아이디어 정리와 사용자 흐름 협업에 활용합니다.'},
    {toolId:'CC',reason:'그래픽·이미지 등 디자인 산출물 제작에 활용합니다.'}
  ],
  dev:[
    {toolId:'GH',reason:'소스 코드 관리와 개발 협업에 활용합니다.'},
    {toolId:'JB',reason:'코드 작성과 개발 환경 구성에 활용합니다.'},
    {toolId:'CP',reason:'코드 작성 및 검토를 보조하는 데 활용합니다.'}
  ],
  data:[
    {toolId:'DB',reason:'데이터베이스 조회와 SQL 작업에 활용합니다.'},
    {toolId:'PBI',reason:'데이터 시각화와 보고서 작성에 활용합니다.'},
    {toolId:'SF',reason:'승인된 데이터 분석 환경에 접근할 때 활용합니다.'}
  ],
  office:[
    {toolId:'MO',reason:'문서·스프레드시트 및 업무 보고서 작성에 활용합니다.'},
    {toolId:'HG',reason:'한글 문서 작성과 편집에 활용합니다.'},
    {toolId:'MD',reason:'업무 관련 계약과 전자서명에 활용합니다.'}
  ]
};
const aiInlineRolePrompts = {
  design:'디자인 직군에서 일반적으로 필요한 도구를 추천해 주세요. 구체적인 업무 설명은 제공되지 않았습니다.',
  dev:'개발 직군에서 일반적으로 필요한 도구를 추천해 주세요. 구체적인 업무 설명은 제공되지 않았습니다.',
  data:'데이터 직군에서 일반적으로 필요한 도구를 추천해 주세요. 구체적인 업무 설명은 제공되지 않았습니다.',
  office:'경영지원·총무 직군에서 일반적으로 필요한 도구를 추천해 주세요. 구체적인 업무 설명은 제공되지 않았습니다.'
};
const aiInlineRoleHints = [
  ['design',/디자인|디자이너|피그마|figma|figjam|fig jam/i],
  ['dev',/개발|프론트엔드|백엔드|코딩|깃허브|github/i],
  ['data',/데이터|snowflake|파워 ?bi|sql\b/i],
  ['office',/경영지원|총무|회계|인사|사무지원/i]
];

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
  aiInlineConsent.checked = false;
  updateAiInlineRole();
}

function updateAiInlineRole(){
  queueAiInlineRecommendation();
}

function aiInlineDifferentRole(detail, selectedRole){
  const matches = aiInlineRoleHints.filter(([,pattern])=>pattern.test(detail)).map(([role])=>role);
  return matches.length === 1 && matches[0] !== selectedRole ? matches[0] : null;
}

function aiInlineStatusWithSwitch(role){
  const label = roles[role].label;
  aiInlineStatus.textContent = `입력한 업무는 ${label} 직군에 가까워 보입니다. 현재 직군을 확인해 주세요.`;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ghost-btn ai-inline-role-switch';
  button.textContent = `${label} 직군으로 변경`;
  button.addEventListener('click',()=>{
    if(!loggedIn || aiInlineDifferentRole(aiInlineDetail.value.trim(), currentRole) !== role) return;
    setRole(role);
    document.getElementById('roleSelect')?.focus({preventScroll:true});
  });
  aiInlineStatus.append(' ',button);
}

function aiInlineCatalogItem(role, toolId){
  return [...commonLicenses,...roles[role].cards].find(item=>item.mono === toolId);
}

function renderAiInlineCards(recommendations, role, detail, sequence, source){
  const seen = new Set();
  const fragment = document.createDocumentFragment();
  for(const recommendation of recommendations){
    const item = aiInlineCatalogItem(role,recommendation.toolId);
    if(!item || seen.has(item.mono)) throw new Error('추천 정보를 확인하지 못했습니다.');
    seen.add(item.mono);
    const status = getEffectiveStatus(item);
    const card = document.createElement('article');
    card.className = 'ai-inline-result';
    const title = document.createElement('h3');
    title.textContent = item.name;
    const meta = document.createElement('p');
    meta.className = 'ai-inline-meta';
    meta.textContent = `${source === 'ai' ? 'Gemini 맞춤 추천' : '직군 기본 추천'} · ${statusConfig[status].label}`;
    const reason = document.createElement('p');
    reason.className = 'ai-inline-reason';
    reason.textContent = recommendation.reason;
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'ghost-btn';
    action.textContent = ['auto','completed'].includes(status) ? '사용 안내'
      : status === 'rejected' ? '반려 사유 확인'
      : ['pending','approved'].includes(status) ? '신청현황 확인' : '신청 내용 확인';
    action.addEventListener('click',()=>{
      if(!loggedIn || sequence !== aiInlineSequence || currentRole !== role) return;
      if(source === 'ai' && (!aiInlineConsent.checked || aiInlineDetail.value.trim() !== detail)) return;
      openLicenseAction(item.name,source === 'ai' && detail.length >= 5
        ? {role,toolId:item.mono,draft:recommendationRequestDraft(detail,recommendation.reason)}
        : undefined);
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
  const signature = JSON.stringify([role,detail,consent,loggedIn]);
  if(signature === aiInlineSignature) return;
  aiInlineSignature = signature;
  cancelAiInlineRecommendation();
  aiInlineResults.replaceChildren();

  if(!loggedIn){
    aiInlineStatus.textContent = '로그인 후 직군별 추천을 확인할 수 있습니다.';
    return;
  }
  if(!Object.prototype.hasOwnProperty.call(roles,role) || roles[role].exception){
    aiInlineStatus.textContent = '직군을 확인한 후 추천받을 수 있습니다.';
    return;
  }

  const sequence = aiInlineSequence;
  const otherRole = aiInlineDifferentRole(detail,role);
  if(otherRole){
    // Do not show recommendations from a selected role that conflicts with the input.
    aiInlineStatusWithSwitch(otherRole);
    return;
  }
  renderAiInlineCards(aiInlineRoleDefaults[role],role,'',sequence,'default');
  if(!consent){
    aiInlineStatus.textContent = '직군 기본 추천입니다. Gemini로 자동 추천하려면 외부 전송에 동의해 주세요. 세부 업무 입력은 선택사항입니다.';
    return;
  }
  const apiDetail = detail.length >= 5 ? detail : aiInlineRolePrompts[role];
  aiInlineStatus.textContent = '직군 기본 추천을 표시하고 있습니다. Gemini가 추천을 준비합니다…';
  aiInlineTimer = setTimeout(()=>{
    aiInlineTimer = null;
    void requestAiInlineRecommendation(role,detail,apiDetail,sequence);
  },1000);
}

function aiInlineError(response){
  const retryAfter = Number(response.headers.get('Retry-After'));
  if(response.status === 429 && Number.isFinite(retryAfter) && retryAfter > 0){
    return '요청이 많습니다. ' + Math.ceil(retryAfter) + '초 후 업무 설명을 수정하거나 동의를 다시 선택해 주세요. 기본 추천은 그대로 이용할 수 있습니다.';
  }
  const messages = {
    400:'담당 업무 내용을 확인해 주세요. 직군 기본 추천은 계속 이용할 수 있습니다.',
    429:'요청이 많습니다. 잠시 후 다시 시도해 주세요. 기본 추천은 계속 이용할 수 있습니다.',
    503:'AI 추천이 아직 연결되지 않았습니다. 직군 기본 추천을 이용해 주세요.'
  };
  return messages[response.status] || 'Gemini 맞춤 추천을 가져오지 못했습니다. 직군 기본 추천을 이용해 주세요.';
}

function showAiInlineResults(data,role,detail,sequence){
  if(!data || !Array.isArray(data.recommendations) || data.recommendations.length > 3
    || (data.followUpQuestion !== null && (typeof data.followUpQuestion !== 'string'
      || !data.followUpQuestion.trim() || data.followUpQuestion.length > 300))
    || (data.followUpQuestion && data.recommendations.length)){
    throw new Error('맞춤 추천 응답을 확인하지 못했습니다. 직군 기본 추천을 이용해 주세요.');
  }
  const seen = new Set();
  for(const result of data.recommendations){
    if(!result || !aiInlineCatalogItem(role,result.toolId) || seen.has(result.toolId)
      || typeof result.reason !== 'string' || !result.reason.trim()
      || result.reason.length > 300){
      throw new Error('맞춤 추천 응답을 확인하지 못했습니다. 직군 기본 추천을 이용해 주세요.');
    }
    seen.add(result.toolId);
  }
  if(data.recommendations.length){
    renderAiInlineCards(data.recommendations,role,detail,sequence,'ai');
    aiInlineStatus.textContent = 'Gemini 맞춤 추천 결과입니다. 신청 전 지급 상태와 사용 목적을 확인해 주세요.';
  }else{
    // Ambiguous tasks must not erase useful, clearly labeled role defaults.
    aiInlineStatus.textContent = data.followUpQuestion
      ? `Gemini 추가 질문: ${data.followUpQuestion} (위에는 직군 기본 추천을 표시합니다.)`
      : '맞춤 추천 항목이 없어 직군 기본 추천을 표시합니다.';
  }
}

async function requestAiInlineRecommendation(role,detail,apiDetail,sequence){
  if(sequence !== aiInlineSequence || currentRole !== role || !loggedIn
    || !aiInlineConsent.checked || aiInlineDetail.value.trim() !== detail
    || aiInlineDifferentRole(detail,role)) return;
  const controller = new AbortController();
  aiInlineController = controller;
  const timeout = setTimeout(()=>controller.abort(),25000);
  aiInlineStatus.textContent = 'Gemini가 업무에 맞는 라이선스를 찾고 있습니다…';
  try{
    const response = await fetch('/api/recommend',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({role,detail:apiDetail}),
      signal:controller.signal
    });
    if(!response.ok) throw new Error(aiInlineError(response));
    const data = await response.json();
    if(sequence !== aiInlineSequence || currentRole !== role || !loggedIn
      || !aiInlineConsent.checked || aiInlineDetail.value.trim() !== detail) return;
    showAiInlineResults(data,role,detail,sequence);
  }catch(error){
    if(sequence !== aiInlineSequence || currentRole !== role || !loggedIn
      || !aiInlineConsent.checked) return;
    aiInlineStatus.textContent = error.name === 'AbortError'
      ? 'Gemini 응답이 지연되고 있습니다. 직군 기본 추천을 이용해 주세요.'
      : error.message;
  }finally{
    clearTimeout(timeout);
    if(sequence === aiInlineSequence) aiInlineController = null;
  }
}

aiInlineDetail.addEventListener('input',queueAiInlineRecommendation);
aiInlineConsent.addEventListener('change',queueAiInlineRecommendation);
updateAiInlineRole();
