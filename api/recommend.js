'use strict';

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
  if(process.env.AI_RECOMMENDATIONS_ENABLED !== 'true' || !process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) return res.status(503).json({error:'ai_not_configured'});
  try{
    const response = await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
      signal:AbortSignal.timeout(20000),
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL,store:false,max_output_tokens:1200,
        instructions,
        input:JSON.stringify({role:body.role,detail:body.detail.trim(),catalog}),
        text:{format:{type:'json_schema',name:'role_tool_recommendation',strict:true,schema:schemaFor(catalog)}}
      })
    });
    if(!response.ok) return res.status(response.status === 429 ? 429 : 502).json({error:'provider_unavailable'});
    const data = await response.json();
    if(data.status !== 'completed') throw new Error('Incomplete model response');
    const parts = (data.output || []).filter(item=>item.type === 'message').flatMap(item=>item.content || []);
    if(parts.some(part=>part.type === 'refusal')) return res.status(422).json({error:'cannot_recommend'});
    const raw = parts.filter(part=>part.type === 'output_text').map(part=>part.text).join('');
    const result = validateRecommendation(JSON.parse(raw),catalog);
    return res.status(200).json(result);
  }catch(_error){
    // No provider payload, input text, or credentials are returned or logged.
    return res.status(502).json({error:'recommendation_unavailable'});
  }
};
