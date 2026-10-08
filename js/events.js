'use strict';

// Large post-login presentation styles should not block the initial login paint.
function activatePostLoginStyles(){
  for(const id of ['experienceRefinementStylesheet','executionHierarchyStylesheet']){
    const link = document.getElementById(id);
    if(link) link.media = 'all';
  }
}
if(loggedIn) activatePostLoginStyles();

const actionHandlers = {
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
  'demo-next': () => nextDemoAction(),
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