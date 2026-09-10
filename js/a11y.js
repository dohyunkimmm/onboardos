'use strict';

const overlayReturnFocus = new Map();
const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

function toggleMoreMenu(event){
  event?.stopPropagation();
  const menu=document.getElementById('moreMenu');
  const btn=document.getElementById('moreBtn');
  if(!menu || !btn) return;
  const opening=menu.hidden;
  menu.hidden=!opening;
  btn.setAttribute('aria-expanded',opening?'true':'false');
  if(opening) requestAnimationFrame(()=>menu.querySelector('button,a')?.focus({preventScroll:true}));
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

