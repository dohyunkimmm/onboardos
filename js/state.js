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
const REQUEST_STATUSES = new Set(['pending','approved','rejected','completed']);
let currentRole = 'office';

function isPlainObject(value){
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function sanitizeHistory(history){
  if(!Array.isArray(history)) return [];
  return history.filter(isPlainObject).map(entry => ({
    actor: typeof entry.actor === 'string' ? entry.actor.slice(0,80) : '',
    label: typeof entry.label === 'string' ? entry.label.slice(0,200) : '',
    at: typeof entry.at === 'string' ? entry.at.slice(0,80) : ''
  })).filter(entry => entry.label || entry.at);
}
function sanitizeRequestRecord(name,value,role){
  if(!isPlainObject(value)) return null;
  if(!REQUEST_STATUSES.has(value.status)) return null;
  if(typeof value.ticket !== 'string' || !/^ITSM-\d+$/.test(value.ticket)) return null;
  const baseStatus = value.baseStatus === 'approval' ? 'approval' : 'request';
  return {
    ...value,
    name: typeof value.name === 'string' && value.name.trim() ? value.name.slice(0,120) : name,
    owner: typeof value.owner === 'string' && value.owner.trim() ? value.owner.slice(0,120) : 'IT팀',
    ticket:value.ticket,
    baseStatus,
    status:value.status,
    createdAt:typeof value.createdAt === 'string' ? value.createdAt.slice(0,80) : '',
    createdTs:Number.isFinite(value.createdTs) ? value.createdTs : Date.now(),
    dueDate:typeof value.dueDate === 'string' ? value.dueDate : '',
    expected:typeof value.expected === 'string' ? value.expected.slice(0,120) : '',
    note:typeof value.note === 'string' ? value.note.slice(0,200) : '',
    rejectionReason:typeof value.rejectionReason === 'string' ? value.rejectionReason.slice(0,200) : '',
    completedAt:typeof value.completedAt === 'string' ? value.completedAt : '',
    roleLabel:typeof value.roleLabel === 'string' && value.roleLabel.trim()
      ? value.roleLabel.slice(0,120)
      : (roles[role]?.label || '직무 확인 필요'),
    history:sanitizeHistory(value.history)
  };
}
function sanitizeRequestBucket(bucket,role){
  if(!isPlainObject(bucket)) return {};
  const clean = {};
  for(const [name,value] of Object.entries(bucket)){
    const request = sanitizeRequestRecord(name,value,role);
    if(request) clean[name] = request;
  }
  return clean;
}
function sanitizeRequestStore(store){
  if(!isPlainObject(store)) return {};
  const clean = {};
  for(const role of Object.keys(roles)){
    if(Object.prototype.hasOwnProperty.call(store,role)) clean[role] = sanitizeRequestBucket(store[role],role);
  }
  return clean;
}
function sanitizeHistoryStore(store){
  if(!isPlainObject(store)) return {};
  const clean = {};
  for(const role of Object.keys(roles)){
    if(!isPlainObject(store[role])) continue;
    clean[role] = {};
    for(const [name,history] of Object.entries(store[role])){
      const sanitized = sanitizeHistory(history);
      if(sanitized.length) clean[role][name] = sanitized;
    }
  }
  return clean;
}
function sanitizeTicketStore(store){
  if(!isPlainObject(store)) return {};
  const clean = {};
  for(const role of Object.keys(roles)){
    if(!isPlainObject(store[role])) continue;
    clean[role] = {};
    for(const [name,ticket] of Object.entries(store[role])){
      if(typeof ticket === 'string' && /^ITSM-\d+$/.test(ticket)) clean[role][name] = ticket;
    }
  }
  return clean;
}
function resetRuntimeState(){
  requestStateByRole = {};
  cancelledHistoryByRole = {};
  cancelledTicketsByRole = {};
  ticketSeq = 1041;
  selectedFilter = 'all';
  currentRole = 'office';
  loggedIn = false;
  activateRoleState(currentRole);
}
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
    if(!isPlainObject(saved)) throw new Error('Invalid session payload');

    currentRole = roles[saved.currentRole] ? saved.currentRole : 'office';
    if(saved.requestStateByRole && isPlainObject(saved.requestStateByRole)){
      requestStateByRole = sanitizeRequestStore(saved.requestStateByRole);
      cancelledHistoryByRole = sanitizeHistoryStore(saved.cancelledHistoryByRole);
      cancelledTicketsByRole = sanitizeTicketStore(saved.cancelledTicketsByRole);
    } else {
      // v3 session migration: 기존 단일 상태는 당시 선택 직무 버킷으로만 이동한다.
      requestStateByRole = {[currentRole]: sanitizeRequestBucket(saved.requestState,currentRole)};
      const legacyHistory = isPlainObject(saved.cancelledHistory) ? {[currentRole]:saved.cancelledHistory} : {};
      const legacyTickets = isPlainObject(saved.cancelledTickets) ? {[currentRole]:saved.cancelledTickets} : {};
      cancelledHistoryByRole = sanitizeHistoryStore(legacyHistory);
      cancelledTicketsByRole = sanitizeTicketStore(legacyTickets);
    }
    ticketSeq = Number.isSafeInteger(saved.ticketSeq) && saved.ticketSeq >= 1041 ? saved.ticketSeq : 1041;
    selectedFilter = Object.prototype.hasOwnProperty.call(FILTER_GROUPS,saved.selectedFilter) ? saved.selectedFilter : 'all';
    loggedIn = saved.loggedIn === true;
    activateRoleState(currentRole);
    if(legacyRaw) sessionStorage.removeItem(LEGACY_SESSION_KEY);
  }catch(_e){
    resetRuntimeState();
    clearSession();
  }
}
function clearSession(){
  try{
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
  }catch(_e){}
}
