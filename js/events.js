'use strict';

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
