'use strict';

let requestState = {};
let cancelledHistory = {};  // 취소된 요청의 이력 보관(재신청 시 이어붙임)
let cancelledTickets = {};  // 취소된 요청의 번호 보관
let ticketSeq = 1041;       // JSM 연동을 가정한 요청번호(운영에서는 JSM이 발급)
const nextTicket = () => `ITSM-${++ticketSeq}`;
let selectedFilter = 'all';
let selectedRequestItem = null;
let drawerMode = 'user';
let adminStatusFilter = 'all';
let loggedIn = false;
let supportRequestContext = null;
const SESSION_KEY = 'onboard-os:v3';
const FILTER_GROUPS = {
  all:null,
  todo:new Set(['request','approval','rejected']),
  processing:new Set(['pending','approved']),
  done:new Set(['auto','completed'])
};
let currentRole = 'office';

function saveSession(){
  try{
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({requestState,cancelledHistory,cancelledTickets,ticketSeq,selectedFilter,currentRole,loggedIn}));
  }catch(_e){}
}
function restoreSession(){
  try{
    const raw = sessionStorage.getItem(SESSION_KEY);
    if(!raw) return;
    const saved = JSON.parse(raw);
    if(saved && typeof saved === 'object'){
      requestState = saved.requestState && typeof saved.requestState === 'object' ? saved.requestState : {};
      cancelledHistory = saved.cancelledHistory && typeof saved.cancelledHistory === 'object' ? saved.cancelledHistory : {};
      cancelledTickets = saved.cancelledTickets && typeof saved.cancelledTickets === 'object' ? saved.cancelledTickets : {};
      ticketSeq = Number.isFinite(saved.ticketSeq) ? saved.ticketSeq : 1041;
      selectedFilter = Object.prototype.hasOwnProperty.call(FILTER_GROUPS,saved.selectedFilter) ? saved.selectedFilter : 'all';
      currentRole = roles[saved.currentRole] ? saved.currentRole : 'office';
      loggedIn = saved.loggedIn === true;
    }
  }catch(_e){}
}
function clearSession(){ try{ sessionStorage.removeItem(SESSION_KEY); }catch(_e){} }
