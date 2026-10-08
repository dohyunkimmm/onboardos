'use strict';
const fs=require('fs');
const vm=require('vm');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const read=file=>fs.readFileSync(file,'utf8');
function setup(){
 const nodes=new Map();
 const node=id=>{
   if(!nodes.has(id)) nodes.set(id,{id,value:'',textContent:'',innerHTML:'',hidden:false,dataset:{},inert:false,focus(){},setAttribute(){},removeAttribute(){},classList:{add(){},remove(){},toggle(){},contains(){return false;}},querySelectorAll(){return [];},closest(){return null;}});
   return nodes.get(id);
 };
 const context=vm.createContext({console,Date,Set,Map,setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:fn=>fn(),window:{},sessionStorage:{setItem(){},removeItem(){},getItem(){return null;}},document:{getElementById:node,querySelectorAll:()=>[],querySelector:()=>null},trackEvent(){},activateOverlay(){},deactivateOverlay(){},focusCurrentOverlay(){},overlayReturnFocus:new Map(),syncPageInert(){}});
 const app=read('app.js');
 for(const file of ['data.js','js/state.js','js/product-readiness.js']) vm.runInContext(read(file),context);
 vm.runInContext(app.slice(0,app.indexOf('// 모바일 더보기')),context);
 return {node,context,run:code=>vm.runInContext(code,context)};
}
test('필수 도구와 선택 도구를 구분하고 도구 유형에 맞는 시작 안내를 제공한다',()=>{
 const {run}=setup();
 assert.equal(run("requirementFor(findLicenseByName('Figma'))"),'필수');
 assert.equal(run("requirementFor(findLicenseByName('Adobe Creative Cloud'))"),'선택');
 assert.equal(run("startLabel(findLicenseByName('한글(HWP)'))"),'설치 안내');
 assert.equal(run("startLabel(findLicenseByName('Slack'))"),'계정·초대 안내');
});
test('완료 필터는 미완료 카드를 숨기고 키보드 접근에서도 제외한다',()=>{
 const {run,context}=setup();
 const cards=['completed','request','approval'].map(status=>({dataset:{status},classList:{toggle(){}},hidden:false,inert:false}));
 context.document.querySelectorAll=()=>cards;
 run("selectedFilter='done'; applyFilters()");
 assert.deepEqual(cards.map(c=>c.hidden),[false,true,true]);
 assert.deepEqual(cards.map(c=>c.inert),[false,true,true]);
 assert.match(read('product-readiness.css'),/\.card\.is-hidden[^}]*display:none!important/);
});
test('선택 도구 지급 완료가 필수 도구 준비 완료로 오인되지 않는다',()=>{
 const {run,node}=setup();
 run("currentRole='design'; activateRoleState('design'); requestState['Adobe Creative Cloud']={status:'completed'}; renderReadiness()");
 assert.match(node('readinessSummary').innerHTML,/필수 도구 0\/1개/);
 run("requestState.Figma={status:'completed'}; renderReadiness()");
 assert.match(node('readinessSummary').innerHTML,/필수 도구 1\/1개/);
});
test('승인 요청은 목적·제품 범위·기간이 모두 입력될 때만 접수한다',()=>{
 const {run,node}=setup();
 run("currentRole='design'; activateRoleState('design'); selectedRequestItem=findLicenseByName('Adobe Creative Cloud'); submitRequest()");
 assert.equal(run('Object.keys(requestState).length'),0);
 node('requestNote').value='이미지 제작';
 run('submitRequest()');assert.equal(run('Object.keys(requestState).length'),0);
 node('requestScope').value='Photoshop';
 run('submitRequest()');assert.equal(run('Object.keys(requestState).length'),0);
 node('requestPeriod').value='3개월';node('requestBudget').value='디자인팀';
 run('submitRequest()');assert.equal(run("requestState['Adobe Creative Cloud'].status"),'pending');
 assert.equal(run("requestState['Adobe Creative Cloud'].scope"),'Photoshop');
 assert.equal(run("requestState['Adobe Creative Cloud'].period"),'3개월');
});
test('승인 판단 정보와 입력 내용은 복원되며 사용자 입력은 HTML로 실행되지 않는다',()=>{
 const {run}=setup();
 run("drawerMode='admin'");
 const result=run("sanitizeRequestRecord('Adobe Creative Cloud',{ticket:'ITSM-1042',status:'pending',scope:'Photoshop',period:'3개월',budget:'<img onerror=bad>'},'design')");
 assert.equal(result.scope,'Photoshop');assert.equal(result.period,'3개월');
 const html=run("adminDecisionHTML({name:'Adobe Creative Cloud',scope:'Photoshop',period:'3개월',budget:'<img onerror=bad>'})");
 assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);assert.match(html,/미연동/);
});
test('설치 가이드는 활성화·담당자·문의 경로와 실제 연동 범위를 명시한다',()=>{
 const {run,node}=setup();
 run("requestState['한글(HWP)']={status:'completed'}; showActionGuideModal(findLicenseByName('한글(HWP)'))");
 assert.match(node('actionModalBody').innerHTML,/활성화/);assert.match(node('actionModalBody').innerHTML,/연결되어 있지 않습니다/);
 assert.match(node('actionModalActions').innerHTML,/설치·접속 문의/);
});
test('업무 우선 순서와 모바일 직무 선택·대비 스타일을 유지한다',()=>{
 const html=read('index.html');
 assert.ok(html.indexOf('task-overview')<html.indexOf('licenses role-secondary'));
 assert.ok(html.indexOf('licenses role-secondary')<html.indexOf('licenses common-first'));
 assert.match(html,/<details class="licenses common-first">/);
 assert.match(read('product-readiness.css'),/role-tabs\{flex-wrap:wrap/);
});
