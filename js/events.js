'use strict';

// Large post-login presentation styles should not block the initial login paint.
function activatePostLoginStyles(){
  for(const id of ["baseStylesheet","loginFontLockStylesheet","visualSystemStylesheet","productReadinessStylesheet","typographyStylesheet","experienceRefinementStylesheet","executionHierarchyStylesheet","catalogStylesheet"]){
    const link = document.getElementById(id);
    if(link) link.media = 'all';
  }
}
if(loggedIn) activatePostLoginStyles();

// Optional prototype reviewer controls stay outside the employee navigation.
const reviewerMode = new URLSearchParams(location.search).get('review') === '1';
document.querySelectorAll('[data-reviewer-only]').forEach(el => { el.hidden = !reviewerMode; });

const actionHandlers = {
  'ai-recommend': () => { document.getElementById('onboardingHelp')?.close(); openAiRecommendation(); },
  'preview-unmapped': () => { document.getElementById('onboardingHelp')?.close(); setRole('unmapped'); },
  'go-home': () => {
    document.getElementById('onboardingHelp')?.close();
    const loginButton = document.querySelector('.google-btn');
    loginButton.disabled = false;
    loginButton.removeAttribute('aria-busy');
    document.getElementById('loginLoader').classList.remove('is-visible');
    loggedIn = false;
    if(typeof resetAiInlineRecommendation === 'function') resetAiInlineRecommendation();
    saveSession();
    const screen = document.getElementById('loginScreen');
    screen.hidden = false;
    screen.inert = false;
    screen.setAttribute('aria-hidden','false');
    document.body.classList.add('login-open');
    syncPageInert();
    document.querySelector('.login-card')?.focus({preventScroll:true});
  },
  'open-onboarding-help': () => document.getElementById('onboardingHelp')?.showModal(),
  'close-onboarding-help': () => document.getElementById('onboardingHelp')?.close(),
  'open-user-drawer': () => openDrawer('user'),
  'open-admin-drawer': () => openDrawer('admin'),
  'reset-demo': () => resetDemo(),
  'reset-demo-close-more': () => { resetDemo(); closeMoreMenu(); },
  'toggle-more': event => toggleMoreMenu(event),
  'fake-login': () => { activatePostLoginStyles(); fakeLogin(); },
  'support-other': () => openSupportRequest('other'),
  'support-role': () => openSupportRequest('role'),
  'close-request': () => closeRequestModal(),
  'submit-request': () => submitRequest(),
  'close-drawer': () => closeDrawer(),
  'hide-action': () => hideActionModal(),
  'submit-support': () => submitSupportRequest(),
  'toggle-admin-filter': (_event, value) => toggleAdminFilter(value),
  'demo-next': () => { document.getElementById('onboardingHelp')?.close(); nextDemoAction(); },
  'guide-support': (_event,value) => { hideActionModal(); openSupportRequest('other'); const field=document.getElementById('supportRequestNote'); if(field) field.value=value+' 설치·접속 지원 요청'; },
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
// Search composes with the active status filter without changing request state.
let commonWasOpenBeforeSearch = null;
document.getElementById('toolSearch')?.addEventListener('input', event => {
  const common = document.querySelector('details.common-first');
  if(event.target.value.trim()){
    if(commonWasOpenBeforeSearch === null) commonWasOpenBeforeSearch = common?.open || false;
    if(common) common.open = true;
  } else if(commonWasOpenBeforeSearch !== null){
    if(common) common.open = commonWasOpenBeforeSearch;
    commonWasOpenBeforeSearch = null;
  }
  applyFilters();
});


document.getElementById('roleSelect')?.addEventListener('change', event => {
  trackEvent('Role Preview',{role:event.target.value});
  setRole(event.target.value);
});
