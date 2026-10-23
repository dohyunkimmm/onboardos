'use strict';

const {acquireRecommendation}=require('../lib/recommendation-rate-limit');
const {catalogFor,schemaFor,validateRecommendation,instructions} = require('../lib/recommendation');

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method !== 'POST'){
    res.setHeader('Allow','POST');
    return res.status(405).json({error:'method_not_allowed'});
  }
  // Browser SSO is a demo, not an authentication boundary for this API.
  const origin = req.headers.origin;
  try{
    if(!origin || new URL(origin).host !== req.headers.host) return res.status(403).json({error:'origin_not_allowed'});
  }catch(_error){ return res.status(403).json({error:'origin_not_allowed'}); }
  if(!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return res.status(415).json({error:'json_required'});
  let body;
  try{
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if(!raw || Buffer.byteLength(raw) > 4096) return res.status(413).json({error:'payload_too_large'});
    body = typeof req.body === 'string' ? JSON.parse(raw) : req.body;
  }catch(_error){ return res.status(400).json({error:'invalid_input'}); }
  const catalog = typeof body?.role === 'string' ? catalogFor(body.role) : null;
  if(!catalog || typeof body.detail !== 'string' || body.detail.trim().length < 5 || body.detail.length > 500) return res.status(400).json({error:'invalid_input'});
  if(process.env.AI_RECOMMENDATIONS_ENABLED !== 'true' || !process.env.GEMINI_API_KEY) return res.status(503).json({error:'ai_not_configured'});
  const lease=acquireRecommendation(req);
  if(!lease.ok){
    res.setHeader('Retry-After',String(lease.retryAfter));
    return res.status(429).json({error:'rate_limited'});
  }
  // Use one documented free-tier model; never fall back to a paid provider/model.
  const model = 'gemini-3.5-flash-lite';
  try{
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{
      method:'POST',
      headers:{'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json'},
      signal:AbortSignal.timeout(20000),
      body:JSON.stringify({
        systemInstruction:{parts:[{text:instructions}]},
        contents:[{role:'user',parts:[{text:JSON.stringify({role:body.role,detail:body.detail.trim(),catalog})}]}],
        generationConfig:{
          maxOutputTokens:1200,
          responseFormat:{text:{mimeType:'APPLICATION_JSON',schema:schemaFor(catalog)}}
        }
      })
    });
    if(!response.ok) return res.status(response.status === 429 ? 429 : 502).json({error:'provider_unavailable'});
    const data = await response.json();
    if(data.promptFeedback?.blockReason) return res.status(422).json({error:'cannot_recommend'});
    const candidate = data.candidates?.[0];
    if(['SAFETY','RECITATION','BLOCKLIST','PROHIBITED_CONTENT'].includes(candidate?.finishReason)) return res.status(422).json({error:'cannot_recommend'});
    if(candidate?.finishReason !== 'STOP') throw new Error('Incomplete model response');
    const raw = (candidate.content?.parts || []).filter(part=>typeof part.text === 'string' && !part.thought).map(part=>part.text).join('');
    const result = validateRecommendation(JSON.parse(raw),catalog);
    return res.status(200).json(result);
  }catch(_error){
    // No provider payload, input text, or credentials are returned or logged.
    return res.status(502).json({error:'recommendation_unavailable'});
  }finally{
    lease.release();
  }
};
