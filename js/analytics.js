'use strict';

window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };

const ANALYTICS_FIELD_ALLOWLIST = Object.freeze({
  'Role Preview': new Set(['role']),
  'Fallback Request': new Set(['kind','role']),
  'Demo Reset': new Set(['role']),
  'Demo Login': new Set(['role']),
  'License Request': new Set(['license','type']),
  'License Resubmit': new Set(['license','type']),
  'License Complete': new Set(['license','type']),
  'Fallback Complete': new Set(['request','role']),
  'Admin Review': new Set(['type','decision'])
});

function isSafeAnalyticsValue(value){
  if(typeof value !== 'string' || !value || value.length > 80) return false;
  if(/[\r\n]/.test(value)) return false;
  if(/@|:\/\/|^ITSM-\d+$/i.test(value)) return false;
  return true;
}

function sanitizeAnalyticsData(name,data){
  const allow = ANALYTICS_FIELD_ALLOWLIST[name];
  if(!allow || !data || typeof data !== 'object' || Array.isArray(data)) return {};
  const clean = {};
  for(const key of allow){
    const value = data[key];
    if(isSafeAnalyticsValue(value)) clean[key] = value;
  }
  return clean;
}

// Vercel Web Analytics custom events. Free text, identifiers, URLs and ticket numbers are dropped at this boundary.
function trackEvent(name, data = {}){
  try{
    if(typeof window.va !== 'function' || !ANALYTICS_FIELD_ALLOWLIST[name]) return;
    const payload = {name};
    const clean = sanitizeAnalyticsData(name,data);
    if(Object.keys(clean).length) payload.data = clean;
    window.va('event', payload);
  }catch(_e){}
}
