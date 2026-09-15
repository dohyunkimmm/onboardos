'use strict';

function installV12Experience(){
  if(!document.getElementById('v12ExperienceStylesheet')){
    const link=document.createElement('link');
    link.id='v12ExperienceStylesheet';
    link.rel='stylesheet';
    link.href='experience-evolution.css';
    document.head.appendChild(link);
  }
  if(!document.getElementById('v12CompatibilityStylesheet')){
    const link=document.createElement('link');
    link.id='v12CompatibilityStylesheet';
    link.rel='stylesheet';
    link.href='experience-evolution-compat.css';
    document.head.appendChild(link);
  }

  const overview=document.querySelector('.overview-panel');
  if(!overview || document.getElementById('v12FocusPanel')) return;

  const panel=document.createElement('section');
  panel.id='v12FocusPanel';
  panel.className='v12-focus-panel';
  panel.setAttribute('aria-label','다음 작업 요약');
  panel.innerHTML=`
    <div class="v12-focus-copy">
      <div class="v12-focus-eyebrow">Next action</div>
      <p class="v12-focus-title" id="v12FocusTitle">현재 단계의 다음 작업을 확인하고 있습니다.</p>
      <div class="v12-focus-meta" aria-label="현재 체험 상태">
        <span class="v12-focus-chip" id="v12FocusStep">체험 1/3</span>
        <span class="v12-focus-chip" id="v12FocusRequests">열린 요청 0건</span>
        <span class="v12-focus-chip" id="v12FocusRole">경영지원·총무 직군</span>
      </div>
    </div>
    <button class="v12-focus-action" id="v12FocusAction" type="button">다음 라이선스 보기</button>`;
  overview.appendChild(panel);

  const action=panel.querySelector('#v12FocusAction');
  const title=panel.querySelector('#v12FocusTitle');
  const step=panel.querySelector('#v12FocusStep');
  const requests=panel.querySelector('#v12FocusRequests');
  const role=panel.querySelector('#v12FocusRole');

  function syncV12Experience(){
    const progressHint=document.getElementById('progressHint');
    const kicker=progressHint?.querySelector('.demo-step-kicker')?.textContent?.trim() || '체험 1/3';
    const hintParts=[...(progressHint?.querySelectorAll('span') || [])];
    const hint=hintParts.at(-1)?.textContent?.trim() || '현재 단계의 다음 작업을 확인해 주세요.';
    const openCount=Number(document.getElementById('requestCount')?.textContent || 0);
    const roleLabel=document.getElementById('userRoleMeta')?.textContent?.trim() || '직무 확인 필요';

    title.textContent=hint;
    step.textContent=kicker;
    requests.textContent=`열린 요청 ${openCount}건`;
    role.textContent=roleLabel;

    let target='licenses';
    let label='다음 라이선스 보기';
    if(kicker.includes('완료')){
      target='complete';
      label='설계 배경 보기';
    }else if(kicker.includes('2/3')){
      target='admin';
      label='관리자 검토 계속';
    }else if(kicker.includes('3/3')){
      target='admin';
      label='지급 처리 계속';
    }else if(kicker.includes('보완')){
      target='user';
      label='반려 사유 확인';
    }
    action.dataset.v12Target=target;
    action.textContent=label;
  }

  action.addEventListener('click',()=>{
    const target=action.dataset.v12Target;
    if(target==='admin'){
      openDrawer('admin');
      return;
    }
    if(target==='user'){
      openDrawer('user');
      return;
    }
    if(target==='complete'){
      const complete=document.getElementById('demoComplete');
      complete?.scrollIntoView({behavior:'smooth',block:'center'});
      complete?.querySelector('a,button')?.focus({preventScroll:true});
      return;
    }
    const nextAction=document.querySelector('#roleGrid .card:not(.is-hidden) .cta, #roleGrid .jsm-btn');
    const roleSection=document.querySelector('.role-secondary');
    roleSection?.scrollIntoView({behavior:'smooth',block:'start'});
    nextAction?.focus({preventScroll:true});
  });

  const observer=new MutationObserver(syncV12Experience);
  ['progressHint','requestCount','userRoleMeta','roleGrid'].forEach(id=>{
    const node=document.getElementById(id);
    if(node) observer.observe(node,{childList:true,subtree:true,characterData:true,attributes:true});
  });
  syncV12Experience();
}

const actionHandlers = {
  'open-user-drawer': () => openDrawer('user'),
  'open-admin-drawer': () => openDrawer('admin'),
  'reset-demo': () => resetDemo(),
  'reset-demo-close-more': () => { resetDemo(); closeMoreMenu(); },
  'toggle-more': event => toggleMoreMenu(event),
  'fake-login': () => fakeLogin(),
  'support-other': () => openSupportRequest('other'),
  'support-role': () => openSupportRequest('role'),
  'close-request': () => closeRequestModal(),
  'submit-request': () => submitRequest(),
  'close-drawer': () => closeDrawer(),
  'hide-action': () => hideActionModal(),
  'submit-support': () => submitSupportRequest(),
  'toggle-admin-filter': (_event, value) => toggleAdminFilter(value),
  'license-action': (_event, value) => openLicenseAction(value),
  'confirm-reject': (_event, value) => confirmReject(value),
  'approve-license': (_event, value) => approveLicense(value),
  'reject-license': (_event, value) => rejectLicense(value),
  'complete-license': (_event, value) => completeLicense(value),
  'cancel-request': (_event, value) => cancelRequest(value),
  'resubmit-request': (_event, value) => resubmitRequest(value)
};

document.addEventListener('click', event => {
  const actionTarget = event.target.closest('[data-action]');
  if(actionTarget){
    const handler = actionHandlers[actionTarget.dataset.action];
    if(handler) handler(event, actionTarget.dataset.value || '');
  }

  const filter = event.target.closest('#filterTabs .filter-chip[data-filter]');
  if(filter) setFilter(filter.dataset.filter);
});

document.getElementById('requestBackdrop')?.addEventListener('click', backdropClose);
document.getElementById('drawerBackdrop')?.addEventListener('click', drawerBackdropClose);
document.getElementById('actionModalBackdrop')?.addEventListener('click', closeActionModal);

installV12Experience();
