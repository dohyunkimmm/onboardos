const {test,expect}=require('@playwright/test');

async function login(page){
  await page.goto('/');
  await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
}

test('new hires see the clean dashboard, not inline AI or expanded SaaS category sections',async({page})=>{
  await login(page);
  await expect(page.locator('#aiInlinePanel')).toHaveCount(0);
  await expect(page.locator('#roleExtraTools')).toHaveCount(0);
  await expect(page.locator('#commonGrid .card')).toHaveCount(5);
  await expect(page.locator('#roleGrid .card')).toHaveCount(4);
  await expect(page.getByRole('button',{name:'AI 추천',exact:true})).toBeVisible();
  await expect(page.locator('#actionModalBackdrop')).not.toHaveClass(/show/);
});

test('AI button displays three immediately useful role suggestions; no background Gemini request',async({page})=>{
  let sent=0;
  await page.route('**/api/recommend',route=>{sent++;return route.fulfill({json:{recommendations:[],followUpQuestion:null}});});
  await login(page);
  await page.getByRole('button',{name:'AI 추천',exact:true}).click();
  const modal=page.locator('#actionModalBackdrop');
  await expect(modal).toHaveClass(/show/);
  await expect(modal.locator('.ai-starter-tool')).toHaveCount(3);
  await expect(modal).toContainText('Microsoft Office');
  await expect(modal.locator('#aiRoleDetail')).toHaveValue('');
  await page.waitForTimeout(1100);
  expect(sent).toBe(0);
  await modal.getByRole('button',{name:'추천 받기',exact:true}).click();
  await expect.poll(()=>sent).toBe(1);
});

test('office staff can request Figma exception by typing design editing',async({page})=>{
  let posted;
  await page.route('**/api/recommend',route=>{
    posted=JSON.parse(route.request().postData());
    return route.fulfill({json:{recommendations:[{toolId:'FG',reason:'UI 디자인 화면 편집이 필요합니다.'}],followUpQuestion:null}});
  });
  await login(page);
  await page.getByRole('button',{name:'AI 추천',exact:true}).click();
  await page.getByLabel('세부 직무·담당 역할').fill('디자인 편집');
  await page.getByRole('button',{name:'추천 받기',exact:true}).click();
  await expect(page.locator('#aiRecommendationResults')).toContainText('Figma');
  expect(posted).toMatchObject({role:'office',detail:'디자인 편집',caseId:'design-edit'});
  await expect(page.locator('#roleSelect')).toHaveValue('office');
  await page.locator('#aiRecommendationResults').getByRole('button',{name:'예외 요청 작성'}).click();
  await expect(page.locator('#supportRequestNote')).toHaveValue(/Figma.*예외/);
  await expect(page.locator('#requestBackdrop')).not.toHaveClass(/show/);
});

test('design staff can request Acrobat for PDF from a three-letter task with no minimum',async({page})=>{
  let posted;
  await page.route('**/api/recommend',route=>{
    posted=JSON.parse(route.request().postData());
    return route.fulfill({json:{recommendations:[{toolId:'AD',reason:'PDF 수정 작업을 처리합니다.'}],followUpQuestion:null}});
  });
  await login(page);
  await page.getByRole('combobox',{name:'직군 선택'}).selectOption('design');
  await page.getByRole('button',{name:'AI 추천',exact:true}).click();
  await expect(page.locator('.ai-starter-tool')).toHaveCount(3);
  await page.getByLabel('세부 직무·담당 역할').fill('PDF');
  await page.getByRole('button',{name:'추천 받기',exact:true}).click();
  await expect(page.locator('#aiRecommendationResults')).toContainText('Adobe Acrobat Pro DC');
  expect(posted).toMatchObject({role:'design',detail:'PDF',caseId:'pdf-edit'});
  await expect(page.locator('#aiRecommendationResults')).toContainText('예외 검토 필요');
});

test('modal AI failure keeps starter tools visible, and user input is not persisted',async({page})=>{
  await page.route('**/api/recommend',route=>route.fulfill({status:503,json:{error:'ai_not_configured'}}));
  await login(page);
  await page.getByRole('button',{name:'AI 추천',exact:true}).click();
  await page.getByLabel('세부 직무·담당 역할').fill('AI');
  await page.getByRole('button',{name:'추천 받기',exact:true}).click();
  await expect(page.locator('#aiRecommendationStatus')).toContainText('아직 연결되지 않았습니다');
  await expect(page.locator('.ai-starter-tool')).toHaveCount(3);
  await page.reload();
  await page.getByRole('button',{name:'AI 추천',exact:true}).click();
  await expect(page.locator('#aiRoleDetail')).toHaveValue('');
});
