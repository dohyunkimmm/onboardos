'use strict';

let requestStateByRole = {};
let cancelledHistoryByRole = {};  // 역할별 취소 요청 이력
let cancelledTicketsByRole = {};  // 역할별 취소 요청 번호
let requestState = {};
let cancelledHistory = {};
let cancelledTickets = {};
let ticketSeq = 1041;       // JSM 연동을 가정한 요청번호(운영에서는 JSM이 발급)
const nextTicket = () => `ITSM-${++ticketSeq}`;
let selectedFilter = 'all';
let selectedRequestItem = null;
let drawerMode = 'user';
let adminStatusFilter = 'all';
let loggedIn = false;
let supportRequestContext = null;
const SESSION_KEY = 'onboard-os:v4';
const LEGACY_SESSION_KEY = 'onboard-os:v3';
const FILTER_GROUPS = {
  all:null,
  todo:new Set(['request','approval','rejected']),
  processing:new Set(['pending','approved']),
  done:new Set(['auto','completed'])
};
let currentRole = 'office';

function ensureRoleBucket(store, role){
  if(!store[role] || typeof store[role] !== 'object' || Array.isArray(store[role])) store[role] = {};
  return store[role];
}

function activateRoleState(role=currentRole){
  currentRole = role;
  requestState = ensureRoleBucket(requestStateByRole, role);
  cancelledHistory = ensureRoleBucket(cancelledHistoryByRole, role);
  cancelledTickets = ensureRoleBucket(cancelledTicketsByRole, role);
}

activateRoleState(currentRole);

function saveSession(){
  try{
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      requestStateByRole,
      cancelledHistoryByRole,
      cancelledTicketsByRole,
      ticketSeq,
      selectedFilter,
      currentRole,
      loggedIn
    }));
  }catch(_e){}
}
function restoreSession(){
  try{
    const currentRaw = sessionStorage.getItem(SESSION_KEY);
    const legacyRaw = currentRaw ? null : sessionStorage.getItem(LEGACY_SESSION_KEY);
    const raw = currentRaw || legacyRaw;
    if(!raw) return;
    const saved = JSON.parse(raw);
    if(saved && typeof saved === 'object'){
      currentRole = roles[saved.currentRole] ? saved.currentRole : 'office';
      if(saved.requestStateByRole && typeof saved.requestStateByRole === 'object'){
        requestStateByRole = saved.requestStateByRole;
        cancelledHistoryByRole = saved.cancelledHistoryByRole && typeof saved.cancelledHistoryByRole === 'object' ? saved.cancelledHistoryByRole : {};
        cancelledTicketsByRole = saved.cancelledTicketsByRole && typeof saved.cancelledTicketsByRole === 'object' ? saved.cancelledTicketsByRole : {};
      } else {
        // v3 session migration: 기존 단일 상태는 당시 선택 직무 버킷으로만 이동한다.
        requestStateByRole = {[currentRole]: saved.requestState && typeof saved.requestState === 'object' ? saved.requestState : {}};
        cancelledHistoryByRole = {[currentRole]: saved.cancelledHistory && typeof saved.cancelledHistory === 'object' ? saved.cancelledHistory : {}};
        cancelledTicketsByRole = {[currentRole]: saved.cancelledTickets && typeof saved.cancelledTickets === 'object' ? saved.cancelledTickets : {}};
      }
      ticketSeq = Number.isFinite(saved.ticketSeq) ? saved.ticketSeq : 1041;
      selectedFilter = Object.prototype.hasOwnProperty.call(FILTER_GROUPS,saved.selectedFilter) ? saved.selectedFilter : 'all';
      loggedIn = saved.loggedIn === true;
      activateRoleState(currentRole);
      if(legacyRaw) sessionStorage.removeItem(LEGACY_SESSION_KEY);
    }
  }catch(_e){
    activateRoleState('office');
  }
}
function clearSession(){
  try{
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
  }catch(_e){}
}
