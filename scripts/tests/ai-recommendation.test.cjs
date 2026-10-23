'use strict';
const {test,afterEach} = require('node:test');
const assert = require('node:assert/strict');
const {catalogFor,validateRecommendation} = require('../../lib/recommendation');
const handler = require('../../api/recommend');
const originalFetch = global.fetch;
const originalEnv = {...process.env};
afterEach(()=>{
  global.fetch = originalFetch;
  for(const name of ['GEMINI_API_KEY','AI_RECOMMENDATIONS_ENABLED']){
    if(originalEnv[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnv[name];
  }
});
function request(overrides={}){
  return {method:'POST',headers:{host:'example.com',origin:'https://example.com','content-type':'application/json'},body:{role:'office',detail:'계약서 PDF 검토를 담당합니다.'},...overrides};
}
async function call(req=request()){
  const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
  await handler(req,res);
  return res;
}
function enable(){
  process.env.AI_RECOMMENDATIONS_ENABLED='true';
  process.env.GEMINI_API_KEY='test-key-never-live';
}
function provider(value,overrides={}){
  return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(value)}]}}],...overrides})};
}
const valid={recommendations:[{toolId:'AD',reason:'계약서 PDF 검토에 활용할 수 있습니다.'}],followUpQuestion:null};

test('each role can access common tools and only its own additional catalog',()=>{
  for(const role of ['office','design','dev','data']){
    const ids=catalogFor(role).map(item=>item.toolId);
    assert.equal(ids.length,new Set(ids).size);
    for(const common of ['SL','NT','CF','JR','JSM']) assert.ok(ids.includes(common));
  }
  assert.ok(!catalogFor('office').some(item=>item.toolId==='FG'));
  assert.ok(!catalogFor('office').some(item=>item.toolId==='GW'));
  for(const invalid of ['unmapped','unknown','__proto__','constructor']) assert.equal(catalogFor(invalid),null);
});
test('unknown, duplicate and cross-role model results fail closed',()=>{
  const catalog=catalogFor('office');
  for(const recommendations of [[{toolId:'FG',reason:'wrong role'}],[{toolId:'UNKNOWN',reason:'invented'}],[valid.recommendations[0],valid.recommendations[0]]]){
    assert.throws(()=>validateRecommendation({recommendations,followUpQuestion:null},catalog));
  }
  assert.throws(()=>validateRecommendation({...valid,followUpQuestion:'question'},catalog));
  assert.throws(()=>validateRecommendation({recommendations:[{toolId:'AD',reason:''}],followUpQuestion:null},catalog));
});
test('missing AI configuration does not invoke a provider or simulate AI',async()=>{
  delete process.env.AI_RECOMMENDATIONS_ENABLED;
  global.fetch=()=>{throw new Error('Must not fetch');};
  assert.equal((await call()).code,503);
});
test('method, origin, media type, malformed and oversized input fail before AI',async()=>{
  enable();
  global.fetch=()=>{throw new Error('Must not fetch');};
  assert.equal((await call(request({method:'GET'}))).code,405);
  assert.equal((await call(request({headers:{host:'example.com',origin:'https://other.com'}}))).code,403);
  assert.equal((await call(request({headers:{host:'example.com'}}))).code,403);
  assert.equal((await call(request({headers:{host:'example.com',origin:'https://example.com','content-type':'text/plain'}}))).code,415);
  assert.equal((await call(request({body:'{broken'}))).code,400);
  assert.equal((await call(request({body:'x'.repeat(4097)}))).code,413);
  for(const body of [{role:'unmapped',detail:'test detail'},{role:'constructor',detail:'test detail'},{role:'office',detail:'x'.repeat(501)},{role:'office',detail:'  '}]) assert.equal((await call(request({body}))).code,400);
});
test('Gemini request uses the fixed free-tier model, server catalog and bounded output',async()=>{
  enable();
  global.fetch=async(url,options)=>{
    assert.equal(url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
    assert.equal(options.headers['x-goog-api-key'],'test-key-never-live');
    assert.ok(!url.includes('test-key'));
    const payload=JSON.parse(options.body);
    assert.equal(payload.generationConfig.responseFormat.text.mimeType,'APPLICATION_JSON');
    assert.ok(payload.generationConfig.responseFormat.text.schema.properties.recommendations);
    assert.ok(payload.generationConfig.maxOutputTokens<=1200);
    assert.ok(!JSON.parse(payload.contents[0].parts[0].text).catalog.some(item=>item.toolId==='FG'));
    assert.ok(payload.systemInstruction.parts[0].text);
    return provider(valid);
  };
  const result=await call(request({body:{role:'office',detail:'계약서 PDF를 검토합니다.',catalog:[{toolId:'FG'}]}}));
  assert.equal(result.code,200);
  assert.deepEqual(result.body,valid);
  assert.equal(result.headers['Cache-Control'],'no-store');
});
test('ambiguous role detail returns a follow-up with no recommendation',async()=>{
  enable();
  const result={recommendations:[],followUpQuestion:'어떤 문서를 주로 다루시나요?'};
  global.fetch=async()=>provider(result);
  assert.deepEqual((await call()).body,result);
});
test('invalid, incomplete, refused, failed and rate-limited provider outputs are contained',async()=>{
  enable();
  for(const [mock,code] of [
    [provider({recommendations:[{toolId:'FG',reason:'wrong role'}],followUpQuestion:null}),502],
    [provider(valid,{candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{}'}]}}]}),502],
    [provider(valid,{promptFeedback:{blockReason:'SAFETY'}}),422],
    [provider(valid,{candidates:[{finishReason:'SAFETY'}]}),422],
    [provider(valid,{candidates:[]}),502],
    [{ok:false,status:429},429],
    [{ok:false,status:401},502]
  ]){
    global.fetch=async()=>mock;
    const result=await call();
    assert.equal(result.code,code);
    assert.ok(!JSON.stringify(result.body).includes('test-key'));
  }
  global.fetch=async()=>{throw new Error('secret provider error');};
  assert.deepEqual((await call()).body,{error:'recommendation_unavailable'});
});

test('free quota exhaustion returns 429 without retrying or switching provider',async()=>{
  enable();
  let calls=0;
  global.fetch=async()=>{calls++;return {ok:false,status:429};};
  assert.equal((await call()).code,429);
  assert.equal(calls,1);
});
