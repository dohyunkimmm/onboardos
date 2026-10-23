const {test,expect}=require('@playwright/test');
async function login(page){await page.goto('/');await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();await expect(page.locator('#loginScreen')).toBeHidden();}
async function openAI(page){await page.getByRole('button',{name:'AI 추천',exact:true}).click();await page.getByLabel('세부 직무·담당 역할').fill('계약서 PDF 검토를 담당합니다.');}
test('AI transitions return keyboard focus to the visible entry control',async({page})=>{
 await login(page);
 for(const id of ['AD','NT']){
  await page.route('**/api/recommend',route=>route.fulfill({json:{recommendations:[{toolId:id,reason:'입력한 역할에 활용합니다.'}],followUpQuestion:null}}));
  await openAI(page);await page.getByRole('button',{name:'추천 받기',exact:true}).click();
  await page.locator('#aiRecommendationResults button').click();
  if(id==='AD')await page.getByRole('button',{name:'취소',exact:true}).click();
  else await page.locator('#actionModalActions').getByRole('button',{name:'닫기',exact:true}).click();
  await expect(page.getByRole('button',{name:'AI 추천',exact:true})).toBeFocused();
  await page.unroute('**/api/recommend');
 }
});
test('editing role detail discards completed recommendations and uses fresh draft input',async({page})=>{
 await page.route('**/api/recommend',route=>route.fulfill({json:{recommendations:[{toolId:'AD',reason:'PDF 문서에 활용합니다.'}],followUpQuestion:null}}));
 await login(page);await openAI(page);
 await page.getByRole('button',{name:'추천 받기',exact:true}).click();
 await expect(page.locator('#aiRecommendationResults .ai-recommendation-card')).toHaveCount(1);
 await page.getByLabel('세부 직무·담당 역할').fill('월별 예산 보고서 PDF를 편집합니다.');
 await expect(page.locator('#aiRecommendationResults')).toBeEmpty();
 await expect(page.locator('#aiRecommendationStatus')).toContainText('다시 추천');
 await page.getByRole('button',{name:'추천 받기',exact:true}).click();
 await page.getByRole('button',{name:'신청 내용 확인',exact:true}).click();
 await expect(page.locator('#requestNote')).toHaveValue(/월별 예산 보고서 PDF를 편집합니다/);
 await expect(page.locator('#requestNote')).not.toHaveValue(/계약서 PDF 검토/);
});
test('editing during a pending recommendation prevents a late result from appearing',async({page})=>{
 let release;
 await page.route('**/api/recommend',async route=>{
  await new Promise(resolve=>{release=resolve;});
  try{await route.fulfill({json:{recommendations:[{toolId:'AD',reason:'이전 입력의 결과'}],followUpQuestion:null}});}catch(_error){/* The edited input intentionally aborted this request. */}
 });
 await login(page);await openAI(page);
 await page.getByRole('button',{name:'추천 받기',exact:true}).click();
 await expect.poll(()=>typeof release).toBe('function');
 await page.getByLabel('세부 직무·담당 역할').fill('입력 내용을 새 담당 역할로 수정합니다.');
 release();
 await expect(page.locator('#aiRecommendationResults')).toBeEmpty();
 await expect(page.locator('#aiRecommendationStatus')).toContainText('변경');
 await expect(page.getByRole('button',{name:'추천 받기',exact:true})).toBeEnabled();
});
test('invalid persisted roles recover without a page initialization error',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>sessionStorage.setItem('onboard-os:v4',JSON.stringify({schemaVersion:4,currentRole:'constructor',loggedIn:true,requestStateByRole:{}})));
 await page.goto('/');
 await expect(page.getByRole('combobox',{name:'직군 선택'})).toHaveValue('office');
 await expect(page.locator('#roleGrid .card')).toHaveCount(4);
 expect(errors).toEqual([]);
});
test('API cooldown responses show their retry delay without an automatic retry',async({page})=>{
 let calls=0;
 await page.route('**/api/recommend',route=>{calls++;return route.fulfill({status:429,headers:{'Retry-After':'60'},json:{error:'rate_limited'}});});
 await login(page);await openAI(page);
 await page.getByRole('button',{name:'추천 받기',exact:true}).click();
 await expect(page.locator('#aiRecommendationStatus')).toContainText('60초');
 expect(calls).toBe(1);
});
