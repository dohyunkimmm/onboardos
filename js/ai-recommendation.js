'use strict';

let aiRecommendationController = null;
let aiRecommendationSequence = 0;

// Reuse the returned AI reasoning; no second API call or extra quota is needed.
function recommendationRequestDraft(detail,reason){
  const clean = value => String(value || '').replace(/\s+/g,' ').trim();
  const roleDetail = clean(detail).slice(0,85);
  const purpose = clean(reason).slice(0,85);
  return roleDetail && purpose ? `담당 역할: ${roleDetail}\n활용 목적: ${purpose}`.slice(0,200) : '';
}

function cancelAiRecommendation(){
  aiRecommendationSequence++;
  aiRecommendationController?.abort();
  aiRecommendationController = null;
}

function openAiRecommendation(){
  cancelAiRecommendation();
  const role = roles[currentRole];
  document.getElementById('actionModalEyebrow').textContent = 'AI 추천';
  document.getElementById('actionModalTitle').textContent = '내 직무에 맞는 라이선스 찾기';
  const body = document.getElementById('actionModalBody');
  body.innerHTML = role.exception
    ? '<p>직군 확인 후 맞춤 추천을 받을 수 있습니다. 기본 제공 라이선스는 먼저 이용할 수 있습니다.</p>'
    : `<p class="action-guide-copy">선택한 직군과 실제 업무를 바탕으로 추천합니다. 다른 직군의 도구도 예외 요청으로 검토할 수 있습니다.</p>
       <form id="aiRecommendationForm">
         <label class="request-note-label" for="aiRoleDetail">세부 직무·담당 역할</label>
         <textarea class="request-note" id="aiRoleDetail" rows="3" maxlength="500" placeholder="예: 디자인 편집 / PDF 편집 / 개발" aria-describedby="aiPrivacyNote"></textarea>
         <p class="guide-notice" id="aiPrivacyNote">입력한 역할과 직군·라이선스 목록을 외부 AI에 전송합니다. 개인정보나 회사 기밀은 입력하지 마세요. 추천이 자동 신청이나 승인을 의미하지는 않습니다.</p>
         <button class="primary-btn" id="aiRecommendSubmit" type="submit">추천 받기</button>
       </form>
       <p id="aiRecommendationStatus" role="status" aria-live="polite"></p>
       <div id="aiRecommendationResults"></div>`;
  document.getElementById('actionModalActions').innerHTML = '<button class="ghost-btn" data-action="hide-action">닫기</button>';
  document.getElementById('actionModalBackdrop').classList.add('show');
  activateOverlay('actionModalBackdrop',role.exception ? '.action-modal-close' : '#aiRoleDetail');
  document.getElementById('aiRecommendationForm')?.addEventListener('submit', submitAiRecommendation);
  document.getElementById('aiRoleDetail')?.addEventListener('input',()=>{
    const status=document.getElementById('aiRecommendationStatus');
    const results=document.getElementById('aiRecommendationResults');
    const hadRecommendation=!!aiRecommendationController || results.childElementCount>0 || !!status.textContent;
    cancelAiRecommendation();
    results.replaceChildren();
    status.textContent=hadRecommendation ? '입력 내용이 변경되었습니다. 다시 추천받아 주세요.' : '';
    const button=document.getElementById('aiRecommendSubmit');
    button.disabled=false;
    button.removeAttribute('aria-busy');
  });
}

async function submitAiRecommendation(event){
  event.preventDefault();
  cancelAiRecommendation();
  const sequence = aiRecommendationSequence;
  const role = currentRole;
  const field = document.getElementById('aiRoleDetail');
  const detail = field.value.trim();
  const status = document.getElementById('aiRecommendationStatus');
  const results = document.getElementById('aiRecommendationResults');
  const button = document.getElementById('aiRecommendSubmit');
  const controller = new AbortController();
  aiRecommendationController = controller;
  const timeout = setTimeout(()=>controller.abort(),25000);
  button.disabled = true;
  button.setAttribute('aria-busy','true');
  status.textContent = '직무와 담당 역할에 맞는 라이선스를 찾고 있습니다…';
  results.replaceChildren();
  try{
    const response = await fetch('/api/recommend',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({role,detail,caseId:null}), signal:controller.signal
    });
    if(!response.ok){
      const messages = {
        400:'세부 직무와 담당 역할을 다시 확인해 주세요.',
        429:'요청이 많습니다. 잠시 후 다시 시도해 주세요.',
        503:'AI 추천이 아직 연결되지 않았습니다. 기존 직군별 목록에서 라이선스를 확인해 주세요.'
      };
      const retryAfter=Number(response.headers.get('Retry-After'));
      if(response.status===429 && Number.isFinite(retryAfter) && retryAfter>0) throw new Error('요청이 많습니다. '+Math.ceil(retryAfter)+'초 후 다시 시도해 주세요.');
      throw new Error(messages[response.status] || '추천을 가져오지 못했습니다. 다시 시도하거나 기존 목록을 이용해 주세요.');
    }
    const data = await response.json();
    if(sequence !== aiRecommendationSequence || role !== currentRole) return;
    if(!Array.isArray(data.recommendations) || data.recommendations.length > 3) throw new Error('추천 형식을 확인하지 못했습니다. 다시 시도해 주세요.');
    const chosen = null; // Manual modal uses a role-wide catalog; inline AI handles cross-role cases.
    const all = [...commonLicenses,...Object.values(roles).flatMap(group=>[...group.cards,...(group.extras||[])])];
    const catalog = chosen
      ? chosen.recommendations.map(entry=>all.find(tool=>tool.mono===entry.toolId))
      : [...commonLicenses,...roles[role].cards,...(roles[role].extras||[])];
    const seen = new Set();
    for(const recommendation of data.recommendations){
      const item = catalog.find(tool=>tool.mono === recommendation.toolId);
      if(!item || seen.has(item.mono) || typeof recommendation.reason !== 'string') throw new Error('추천 정보를 확인하지 못했습니다. 다시 시도해 주세요.');
      seen.add(item.mono);
    }
    status.textContent = data.followUpQuestion || (data.recommendations.length ? '추천 이유와 현재 지급 상태를 확인해 주세요.' : '적합한 라이선스를 찾지 못했습니다. 담당 역할을 구체적으로 적거나 IT 헬프데스크에 문의해 주세요.');
    for(const recommendation of data.recommendations){
      const item = catalog.find(tool=>tool.mono === recommendation.toolId);
      const card = document.createElement('section');
      card.className = 'action-info ai-recommendation-card';
      const title = document.createElement('h4');
      title.textContent = item.name;
      const reason = document.createElement('p');
      reason.textContent = recommendation.reason;
      const meta = document.createElement('p');
      const effective = getEffectiveStatus(item);
      const exception = !commonLicenses.includes(item) && ![...roles[role].cards,...(roles[role].extras||[])].includes(item);
      meta.textContent = exception ? '다른 직군 도구 · IT 예외 검토 필요'
        : `${commonLicenses.includes(item) ? '기본 제공' : roles[role].label+' 직군'} · ${statusConfig[effective].label}`;
      const action = document.createElement('button');
      action.className = 'ghost-btn';
      action.type = 'button';
      action.textContent = exception ? '예외 요청 작성'
        : ['auto','completed'].includes(effective) ? '사용 안내' : effective === 'rejected' ? '반려 사유 확인' : ['pending','approved'].includes(effective) ? '신청현황 확인' : '신청 내용 확인';
      action.addEventListener('click',()=>{
        if(currentRole !== role) return;
        const returnFocus=overlayReturnFocus.get('actionModalBackdrop');
        hideActionModal();
        // Another team's tool can be suggested, never automatically issued or applied for.
        if(exception){
          openSupportRequest('other',item);
          const note = document.getElementById('supportRequestNote');
          if(note) note.value = `${item.name} 예외 검토 요청 · ${recommendation.reason}`.slice(0,200);
        }else{
          openLicenseAction(item.name,{
            role,toolId:item.mono,
            draft:recommendationRequestDraft(detail,recommendation.reason)
          });
        }
        const nextOverlay=currentOverlay();
        if(nextOverlay && returnFocus?.isConnected) overlayReturnFocus.set(nextOverlay.id,returnFocus);
      });
      card.append(title,reason,meta,action);
      results.append(card);
    }
  }catch(error){
    if(sequence !== aiRecommendationSequence || role !== currentRole) return;
    results.replaceChildren();
    status.textContent = error.name === 'AbortError' ? '추천 응답이 지연되고 있습니다. 다시 시도하거나 기존 목록을 이용해 주세요.' : error.message;
  }finally{
    clearTimeout(timeout);
    if(sequence === aiRecommendationSequence){
      button.disabled = false;
      button.removeAttribute('aria-busy');
      aiRecommendationController = null;
    }
  }
}
