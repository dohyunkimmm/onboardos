'use strict';
const {test,afterEach} = require('node:test');
const assert = require('node:assert/strict');
const {catalogFor,validateRecommendation} = require('../../lib/recommendation');
const handler = require('../../api/recommend');
const originalFetch = global.fetch;
const originalEnv = {...process.env};
afterEach(()=>{
  global.fetch = originalFetch;
  for(const name of ['GEMINI_API_KEY','AI_RECOMMENDATIONS_ENABLED','VERCEL']){
    if(originalEnv[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnv[name];
  }
});
let requestSequence=0;
function request(overrides={}){
  return {socket:{remoteAddress:'192.0.2.'+(++requestSequence)},method:'POST',headers:{host:'example.com',origin:'https://example.com','content-type':'application/json'},body:{role:'office',detail:'계약서 PDF 검토를 담당합니다.'},...overrides};
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
test('new licenses are scoped to their owning role and requestable',()=>{
  for(const [role,id] of [['data','PBI'],['dev','PM'],['office','MD']]){
    for(const other of ['office','design','dev','data']){
      assert.equal(catalogFor(other).some(item=>item.toolId===id),other===role);
    }
    assert.equal(catalogFor(role).find(item=>item.toolId===id).provision,'request');
    assert.equal(validateRecommendation({recommendations:[{toolId:id,reason:'담당 직무에 활용합니다.'}],followUpQuestion:null},catalogFor(role)).recommendations[0].toolId,id);
  }
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

test('rate limiter blocks bursts, concurrent work and resets elapsed windows',()=>{
  const {createLimiter}=require('../../lib/recommendation-rate-limit');
  let time=0;const acquire=createLimiter(()=>time);
  const first=acquire('client');assert.equal(first.ok,true);
  assert.equal(acquire('client').ok,false);first.release();
  for(let i=1;i<5;i++) acquire('client').release();
  assert.equal(acquire('client').retryAfter,60);
  time=60000;const next=acquire('client');assert.equal(next.ok,true);next.release();
  const hourly=createLimiter(()=>time);
  for(let i=0;i<20;i++){time=i*60000;hourly('other').release();}
  assert.equal(hourly('other').ok,false);
  time=3600000;assert.equal(hourly('other').ok,true);
});
test('handler rejects concurrent and burst requests before invoking the AI',async()=>{
  enable();
  let resolveProvider,calls=0;
  global.fetch=()=>{calls++;return new Promise(resolve=>{resolveProvider=resolve;});};
  const req=request({socket:{remoteAddress:'192.0.2.240'}});
  const pending=call(req);
  const denied=await call(req);
  assert.equal(denied.code,429);assert.ok(Number(denied.headers['Retry-After'])>0);
  assert.equal(calls,1);
  resolveProvider(provider(valid));assert.equal((await pending).code,200);
  global.fetch=async()=>{calls++;return provider(valid);};
  for(let i=1;i<5;i++) assert.equal((await call(req)).code,200);
  assert.equal((await call(req)).code,429);assert.equal(calls,5);
});
test('provider failures release the in-flight lease for a later retry',async()=>{
  enable();const req=request({socket:{remoteAddress:'192.0.2.241'}});
  global.fetch=async()=>{throw new Error('mock failure');};
  assert.equal((await call(req)).code,502);
  global.fetch=async()=>provider(valid);
  assert.equal((await call(req)).code,200);
});
test('forwarded IP is trusted only behind Vercel and stored as an opaque key',()=>{
  const {clientKey}=require('../../lib/recommendation-rate-limit');
  const req={headers:{'x-forwarded-for':'192.0.2.1'},socket:{remoteAddress:'192.0.2.2'}};
  delete process.env.VERCEL;
  const peer=clientKey(req);
  assert.equal(clientKey({...req,headers:{'x-forwarded-for':'192.0.2.3'}}),peer);
  process.env.VERCEL='1';
  assert.notEqual(clientKey(req),peer);assert.equal(clientKey(req).length,64);
});
test('corrupt and inherited session roles recover to a valid catalog',()=>{
  const vm=require('node:vm'),fs=require('node:fs');
  const {roles}=require('../../data');
  for(const role of ['constructor','toString','__proto__','missing',null,{},'dev']){
    const saved={schemaVersion:4,currentRole:role,loggedIn:true,requestStateByRole:{}};
    const ctx={roles,sessionStorage:{getItem:k=>k==='onboard-os:v4'?JSON.stringify(saved):null,setItem(){},removeItem(){}}};
    vm.createContext(ctx);vm.runInContext(fs.readFileSync('js/state.js','utf8'),ctx);
    vm.runInContext('restoreSession()',ctx);
    assert.equal(vm.runInContext('currentRole',ctx),role==='dev'?'dev':'office');
    assert.ok(vm.runInContext('roles[currentRole].cards.length',ctx)>0);
  }
});
