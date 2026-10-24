'use strict';

// Inline recommendations are opt-in. No request is made before explicit consent.
const aiInlineDetail = document.getElementById('aiInlineDetail');
const aiInlineConsent = document.getElementById('aiInlineConsent');
const aiInlineStatus = document.getElementById('aiInlineStatus');
const aiInlineResults = document.getElementById('aiInlineResults');
let aiInlineTimer = null;
let aiInlineController = null;
let aiInlineSequence = 0;
let aiInlineSignature = '';

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
  aiInlineResults.replaceChildren();
  aiInlineStatus.textContent = '담당 업무를 입력하고 전송에 동의하면 자동으로 추천합니다.';
}

function updateAiInlineRole(){
  queueAiInlineRecommendation();
}

function queueAiInlineRecommendation(){
  const role = currentRole;
  const detail = aiInlineDetail.value.trim();
  const consent = aiInlineConsent.checked;
  const signature = JSON.stringify([role, detail, consent, loggedIn]);
  if(signature === aiInlineSignature) return;
  aiInlineSignature = signature;
  cancelAiInlineRecommendation();
  aiInlineResults.replaceChildren();

  if(!loggedIn){
    aiInlineStatus.textContent = '로그인 후 이용할 수 있습니다.';
    return;
  }
  if(roles[role]?.exception){
    aiInlineStatus.textContent = '직군을 확인한 후 추천받을 수 있습니다.';
    return;
  }
  if(!consent){
    aiInlineStatus.textContent = '외부 AI 전송 동의 후 자동 추천이 시작됩니다.';
    return;
  }
  if(detail.length < 5){
    aiInlineStatus.textContent = '담당 업무를 5자 이상 입력하면 자동으로 추천합니다.';
    return;
  }

  aiInlineStatus.textContent = '입력이 완료되면 자동으로 라이선스를 추천합니다…';
  const sequence = aiInlineSequence;
  aiInlineTimer = setTimeout(()=>{ aiInlineTimer = null; void requestAiInlineRecommendation(role, detail, sequence); }, 1000);
}

function aiInlineError(response){
  const retryAfter = Number(response.headers.get('Retry-After'));
  if(response.status === 429 && Number.isFinite(retryAfter) && retryAfter > 0){
    return '요청이 많습니다. ' + Math.ceil(retryAfter) + '초 후 내용을 수정하거나 동의를 다시 선택해 주세요.';
  }
  const messages = {
    400:'담당 업무 내용을 확인해 주세요.',
    429:'요청이 많습니다. 잠시 후 다시 시도해 주세요.',
    503:'AI 추천이 아직 연결되지 않았습니다. 기존 직군별 목록을 이용해 주세요.'
  };
  return messages[response.status] || '추천을 가져오지 못했습니다. 기존 목록을 이용하거나 나중에 다시 시도해 주세요.';
}

function showAiInlineResults(data, role, detail, sequence){
  if(!data || !Array.isArray(data.recommendations) || data.recommendations.length > 3
    || (data.followUpQuestion !== null && (typeof data.followUpQuestion !== 'string'
      || !data.followUpQuestion.trim() || data.followUpQuestion.length > 300))
    || (data.followUpQuestion && data.recommendations.length)){
    throw new Error('추천 정보를 확인하지 못했습니다. 다시 시도해 주세요.');
  }

  const catalog = [...commonLicenses, ...roles[role].cards];
  const seen = new Set();
  const cards = document.createDocumentFragment();
  for(const recommendation of data.recommendations){
    const item = catalog.find(tool=>tool.mono === recommendation?.toolId);
    if(!item || seen.has(item.mono) || typeof recommendation.reason !== 'string'
      || !recommendation.reason.trim() || recommendation.reason.length > 300){
      throw new Error('추천 정보를 확인하지 못했습니다. 다시 시도해 주세요.');
    }
    seen.add(item.mono);
    const card = document.createElement('article');
    card.className = 'ai-inline-result';
    const title = document.createElement('h3');
    title.textContent = item.name;
    const meta = document.createElement('p');
    const effective = getEffectiveStatus(item);
    meta.className = 'ai-inline-meta';
    meta.textContent = `${commonLicenses.includes(item) ? '기본 제공' : roles[role].label + ' 직군'} · ${statusConfig[effective].label}`;
    const reason = document.createElement('p');
    reason.className = 'ai-inline-reason';
    reason.textContent = recommendation.reason;
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'ghost-btn';
    action.textContent = ['auto','completed'].includes(effective) ? '사용 안내'
      : effective === 'rejected' ? '반려 사유 확인'
      : ['pending','approved'].includes(effective) ? '신청현황 확인' : '신청 내용 확인';
    action.addEventListener('click',()=>{
      if(sequence !== aiInlineSequence || currentRole !== role || !loggedIn
        || !aiInlineConsent.checked || aiInlineDetail.value.trim() !== detail) return;
      openLicenseAction(item.name,{
        role, toolId:item.mono,
        draft:recommendationRequestDraft(detail, recommendation.reason)
      });
    });
    card.append(title,meta,reason,action);
    cards.append(card);
  }
  aiInlineResults.replaceChildren(cards);
  aiInlineStatus.textContent = data.followUpQuestion
    || (data.recommendations.length
      ? '추천 결과입니다. 신청 전 현재 지급 상태와 사용 목적을 확인해 주세요.'
      : '적합한 라이선스를 찾지 못했습니다. 역할을 구체적으로 작성하거나 IT 헬프데스크에 문의해 주세요.');
}

async function requestAiInlineRecommendation(role, detail, sequence){
  if(sequence !== aiInlineSequence || currentRole !== role || !loggedIn
    || !aiInlineConsent.checked || aiInlineDetail.value.trim() !== detail) return;
  const controller = new AbortController();
  aiInlineController = controller;
  const timeout = setTimeout(()=>controller.abort(),25000);
  aiInlineStatus.textContent = '직무에 맞는 라이선스를 찾고 있습니다…';
  try{
    const response = await fetch('/api/recommend',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({role,detail}),
      signal:controller.signal
    });
    if(!response.ok) throw new Error(aiInlineError(response));
    const data = await response.json();
    if(sequence !== aiInlineSequence || currentRole !== role || !aiInlineConsent.checked) return;
    showAiInlineResults(data,role,detail,sequence);
  }catch(error){
    if(sequence !== aiInlineSequence || currentRole !== role || !aiInlineConsent.checked) return;
    aiInlineResults.replaceChildren();
    aiInlineStatus.textContent = error.name === 'AbortError'
      ? '추천 응답이 지연되고 있습니다. 다시 시도하거나 기존 목록을 이용해 주세요.'
      : error.message;
  }finally{
    clearTimeout(timeout);
    if(sequence === aiInlineSequence) aiInlineController = null;
  }
}

aiInlineDetail.addEventListener('input', queueAiInlineRecommendation);
aiInlineConsent.addEventListener('change', queueAiInlineRecommendation);
