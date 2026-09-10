'use strict';

window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
window.si = window.si || function () { (window.siq = window.siq || []).push(arguments); };

// Vercel Web Analytics custom events. Never send employee identifiers or free-text request notes.
function trackEvent(name, data = {}){
  try{
    if(typeof window.va !== 'function') return;
    const payload = {name};
    if(data && Object.keys(data).length) payload.data = data;
    window.va('event', payload);
  }catch(_e){}
}
