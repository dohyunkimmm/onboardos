const {test,expect} = require('@playwright/test');

async function login(page){
  await page.goto('/');
  await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
}

const panel = page => page.locator('#aiInlinePanel');
const consent = page => panel(page).locator('#aiInlineConsent');

test('inline AI never sends user input before consent; then recommends and hands off a reviewed draft',async({page})=>{
  let requests = 0;
  await page.route('**/api/recommend',route=>{
    requests++;
    return route.fulfill({json:{recommendations:[{toolId:'AD',reason:'계약서 PDF 검토에 필요합니다.'}],followUpQuestion:null}});
  });
  await login(page);
  await panel(page).getByLabel('담당 업무 설명').fill('계약서 PDF 검토를 담당합니다.');
  await page.waitForTimeout(1250);
  expect(requests).toBe(0);
  await consent(page).check();
  await expect(panel(page).locator('.ai-inline-result')).toHaveCount(1);
  expect(requests).toBe(1);
  await expect(panel(page)).toContainText('Adobe Acrobat Pro DC');
  await panel(page).getByRole('button',{name:'신청 내용 확인'}).click();
  await expect(page.locator('#requestBackdrop')).toHaveAttribute('aria-hidden','false');
  await expect(page.locator('#requestNote')).toHaveValue(/담당 역할: 계약서 PDF 검토를 담당합니다/);
  await expect(page.locator('#requestNote')).toHaveValue(/활용 목적: 계약서 PDF 검토에 필요합니다/);
  await expect(page.getByLabel('신청 사유를 확인했습니다')).not.toBeChecked();
});

test('editing input invalidates a pending response and renders only the latest role detail',async({page})=>{
  let release;
  let firstStarted;
  const started = new Promise(resolve => { firstStarted = resolve; });
  let requests = 0;
  await page.route('**/api/recommend',async route=>{
    requests++;
    const detail = JSON.parse(route.request().postData()).detail;
    if(detail.includes('이전')){
      firstStarted();
      await new Promise(resolve => { release = resolve; });
      try{await route.fulfill({json:{recommendations:[{toolId:'MO',reason:'이전 업무 결과'}],followUpQuestion:null}});}
      catch(_error){/* The browser intentionally aborted this stale request. */}
    }else{
      await route.fulfill({json:{recommendations:[{toolId:'AD',reason:'최신 업무 결과'}],followUpQuestion:null}});
    }
  });
  await login(page);
  await consent(page).check();
  await panel(page).getByLabel('담당 업무 설명').fill('이전 계약서 자료를 검토합니다.');
  await started;
  await panel(page).getByLabel('담당 업무 설명').fill('최신 계약서 PDF를 검토합니다.');
  await expect(panel(page).locator('.ai-inline-result')).toHaveCount(1);
  await expect(panel(page)).toContainText('최신 업무 결과');
  release();
  await expect(panel(page)).not.toContainText('이전 업무 결과');
  expect(requests).toBe(2);
});

test('consent removal and role change clear output, and no new request is sent without consent',async({page})=>{
  let calls = 0;
  await page.route('**/api/recommend',route=>{
    calls++;
    return route.fulfill({json:{recommendations:[{toolId:'NT',reason:'공통 문서 작성에 사용합니다.'}],followUpQuestion:null}});
  });
  await login(page);
  await panel(page).getByLabel('담당 업무 설명').fill('업무 문서를 정리합니다.');
  await consent(page).check();
  await expect(panel(page).locator('.ai-inline-result')).toHaveCount(1);
  await consent(page).uncheck();
  await expect(panel(page).locator('.ai-inline-result')).toHaveCount(3);
  await page.getByRole('combobox',{name:'직군 선택'}).selectOption('dev');
  await page.waitForTimeout(1250);
  expect(calls).toBe(1);
  await consent(page).check();
  await expect(panel(page).locator('.ai-inline-result')).toHaveCount(1);
  expect(calls).toBe(2);
  await page.locator('[data-action="reset-demo"]').first().evaluate(el=>el.click());
  await expect(panel(page).getByLabel('담당 업무 설명')).toHaveValue('');
  await expect(consent(page)).not.toBeChecked();
});

test('inline AI errors leave the normal catalog available and never execute returned markup',async({page})=>{
  await page.route('**/api/recommend',route=>route.fulfill({status:503,json:{error:'ai_not_configured'}}));
  await login(page);
  await panel(page).getByLabel('담당 업무 설명').fill('계약서 PDF 자료를 검토합니다.');
  await consent(page).check();
  await expect(panel(page).locator('#aiInlineStatus')).toContainText('아직 연결되지 않았습니다');
  await expect(page.locator('#roleGrid .card')).toHaveCount(4);
  await page.unroute('**/api/recommend');
  await page.route('**/api/recommend',route=>route.fulfill({json:{recommendations:[{toolId:'AD',reason:'<img src=x onerror="alert(1)">'}],followUpQuestion:null}}));
  await consent(page).uncheck();
  await consent(page).check();
  await expect(panel(page)).toContainText('<img');
  await expect(panel(page).locator('img')).toHaveCount(0);
});

test('inline AI does not persist input or consent across reload',async({page})=>{
  await login(page);
  await panel(page).getByLabel('담당 업무 설명').fill('월별 예산 보고서를 정리합니다.');
  await consent(page).check();
  await page.reload();
  await expect(panel(page).getByLabel('담당 업무 설명')).toHaveValue('');
  await expect(consent(page)).not.toBeChecked();
});


test('office design editing recommends Figma as an exception without changing employee role',async({page})=>{
  let calls=0;
  await page.route('**/api/recommend',route=>{calls++;return route.fulfill({json:{recommendations:[],followUpQuestion:null}});});
  await login(page);
  await expect(panel(page).locator('.ai-inline-result')).toHaveCount(3);
  await panel(page).getByLabel('업무·케이스 검색').fill('디자인 편집');
  await expect(panel(page).locator('.ai-inline-result').first()).toContainText('Figma');
  await expect(panel(page).locator('.ai-inline-result').first()).toContainText('예외 검토 필요');
  await expect(page.locator('#roleSelect')).toHaveValue('office');
  await expect.poll(()=>calls,{timeout:2500}).toBe(0);
  await panel(page).locator('.ai-inline-result').first().getByRole('button',{name:'예외 요청 작성'}).click();
  await expect(page.locator('#actionModalBackdrop')).toHaveClass(/show/);
  await expect(page.locator('#supportRequestNote')).toHaveValue(/Figma.*예외/);
  await expect(page.locator('#requestBackdrop')).not.toHaveClass(/show/);
});

test('design role PDF editing recommends Acrobat as an exception and short text triggers Gemini only after consent',async({page})=>{
  const seen=[];
  await page.route('**/api/recommend',route=>{
    const body=JSON.parse(route.request().postData());
    seen.push(body);
    return route.fulfill({json:{recommendations:[{toolId:'AD',reason:'PDF 편집 용도'}],followUpQuestion:null}});
  });
  await login(page);
  await page.getByRole('combobox',{name:'직군 선택'}).selectOption('design');
  await panel(page).getByLabel('업무·케이스 검색').fill('PDF');
  await expect(panel(page).locator('.ai-inline-result').first()).toContainText('Adobe Acrobat Pro DC');
  await expect(panel(page)).toContainText('직군 외 · 예외 검토 필요');
  expect(seen).toHaveLength(0);
  await consent(page).check();
  await expect.poll(()=>seen.length).toBe(1);
  expect(seen[0]).toMatchObject({role:'design',detail:'PDF',caseId:'pdf-edit'});
  await expect(panel(page).locator('.ai-inline-result').first()).toContainText('Gemini 추천');
  await panel(page).locator('.ai-inline-result').first().getByRole('button',{name:'예외 요청 작성'}).click();
  await expect(page.locator('#supportRequestNote')).toHaveValue(/Adobe Acrobat Pro DC/);
});

test('shared and selected case works across roles with no task description',async({page})=>{
  await login(page);
  await panel(page).locator('#aiInlineCase').selectOption('pm-work');
  await expect(panel(page).locator('.ai-inline-result').first()).toContainText('Asana');
  await expect(panel(page).locator('.ai-inline-result').first()).toContainText('예외 검토 필요');
  await page.getByRole('combobox',{name:'직군 선택'}).selectOption('dev');
  await expect(panel(page).locator('#aiInlineCase')).toHaveValue('pm-work');
  await expect(panel(page).locator('.ai-inline-result').first()).toContainText('Asana');
  await expect(consent(page)).not.toBeChecked();
});

test('expanded license categories contain five optional tools per role and are searchable',async({page})=>{
  await login(page);
  const extra=page.locator('#roleExtraTools');
  await expect(extra.locator('#extraGrid .card')).toHaveCount(5);
  await extra.locator('summary').click();
  await extra.getByRole('button',{name:'PM툴',exact:true}).click();
  await expect(extra.locator('#extraGrid .card:not(.is-hidden)')).toHaveCount(2);
  await expect(extra).toContainText('Asana');
  await expect(extra).toContainText('Trello');
  await extra.getByRole('button',{name:'전체',exact:true}).click();
  await page.getByRole('searchbox',{name:'라이선스 검색'}).fill('Zoom');
  await expect(extra).toHaveAttribute('open');
  await expect(extra.locator('#extraGrid .card:not(.is-hidden)')).toHaveCount(1);
  await page.getByRole('searchbox',{name:'라이선스 검색'}).fill('');
  await page.getByRole('combobox',{name:'직군 선택'}).selectOption('dev');
  await expect(extra.locator('#extraGrid .card')).toHaveCount(5);
  await extra.getByRole('button',{name:'AI',exact:true}).click();
  await expect(extra.locator('#extraGrid .card:not(.is-hidden)')).toHaveCount(1);
  await expect(extra.locator('#extraGrid .card:not(.is-hidden)')).toContainText('Cursor');
});
