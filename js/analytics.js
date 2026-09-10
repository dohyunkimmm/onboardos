'use strict';

// Vercel Web Analytics custom events. Never send employee identifiers or free-text request notes.
function trackEvent(name, data = {}){
  try{
    if(typeof window.va !== 'function') return;
    const payload = {name};
    if(data && Object.keys(data).length) payload.data = data;
    window.va('event', payload);
  }catch(_e){}
}
