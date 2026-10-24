const {test,expect} = require('@playwright/test');

async function openRecommendation(page){
  await page.goto('/');
  await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
  await expect(page.locator('.catalog-search-row').getByRole('button',{name:'AI 추천',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'AI 추천',exact:true}).click();
}

test('AI recommends allowlisted tools and reuses the existing application flow',async({page})=>{
  await page.route('**/api/recommend',route=>route.fulfill({json:{recommendations:[{toolId:'AD',reason:'계약서 PDF 검토에 활용합니다.'}],followUpQuestion:null}}));
  await openRecommendation(page);
  await page.getByLabel('세부 직무·담당 역할').fill('계약서 PDF 검토를 담당합니다.');
  await page.getByRole('button',{name:'추천 받기',exact:true}).click();
  await expect(page.locator('#aiRecommendationResults')).toContainText('Adobe Acrobat Pro DC');
  await expect(page.locator('#aiRecommendationResults')).toContainText('신청 필요');
  await page.getByRole('button',{name:'신청 내용 확인',exact:true}).click();
  await expect(page.locator('#requestBackdrop')).toHaveAttribute('aria-hidden','false');
  await expect(page.locator('#requestNote')).toHaveValue(/담당 역할: 계약서 PDF 검토를 담당합니다\./);
  await expect(page.locator('#requestNote')).toHaveValue(/활용 목적: 계약서 PDF 검토에 활용합니다\./);
  await page.getByRole('button',{name:'신청 제출',exact:true}).click();
  await expect(page.locator('#requestCount')).toHaveText('0');
  await expect(page.locator('#requestBackdrop')).toHaveAttribute('aria-hidden','false');
  await page.locator('#requestNote').fill('계약서 PDF 검토와 주석 작성에 사용합니다.');
  await page.getByLabel('신청 사유를 확인했습니다').check();
  await page.getByRole('button',{name:'신청 제출',exact:true}).click();
  await expect(page.locator('#roleGrid .card[data-name="Adobe Acrobat Pro DC"]')).toContainText('검토 대기');
  await page.locator('#statusBtn').click();
  await expect(page.locator('.request-note-view')).toContainText('계약서 PDF 검토와 주석 작성에 사용합니다.');
});

test('cancelled recommendation draft does not leak into a manual application',async({page})=>{
  await page.route('**/api/recommend',route=>route.fulfill({json:{recommendations:[{toolId:'AD',reason:'계약서 PDF 검토에 활용합니다.'}],followUpQuestion:null}}));
  await openRecommendation(page);
  await page.getByLabel('세부 직무·담당 역할').fill('계약서 PDF 검토를 담당합니다.');
  await page.getByRole('button',{name:'추천 받기',exact:true}).click();
  await page.getByRole('button',{name:'신청 내용 확인',exact:true}).click();
  await page.getByRole('button',{name:'취소',exact:true}).click();
  await page.locator('#roleGrid .card[data-name="Microsoft Office"]').getByRole('button',{name:'신청하기',exact:true}).click();
  await expect(page.locator('#requestNote')).toHaveValue('');
  await expect(page.locator('#recommendationDraftReviewed')).toHaveCount(0);
});

test('recommendation drafts are bounded and inserted as editable text',async({page})=>{
  const reason='<img src=x onerror="alert(1)">'+' PDF 검토'.repeat(30);
  await page.route('**/api/recommend',route=>route.fulfill({json:{recommendations:[{toolId:'AD',reason}],followUpQuestion:null}}));
  await openRecommendation(page);
  await page.getByLabel('세부 직무·담당 역할').fill('계약서 검토와 문서 정리 '.repeat(25));
  await page.getByRole('button',{name:'추천 받기',exact:true}).click();
  await page.getByRole('button',{name:'신청 내용 확인',exact:true}).click();
  const value=await page.locator('#requestNote').inputValue();
  expect(value.length).toBeLessThanOrEqual(200);
  expect(value).toContain('<img');
  await expect(page.locator('#requestDetails img')).toHaveCount(0);
});

test('common recommendations show usage guidance without a new application',async({page})=>{
  await page.route('**/api/recommend',route=>route.fulfill({json:{recommendations:[{toolId:'NT',reason:'업무 문서 정리에 활용합니다.'}],followUpQuestion:null}}));
  await openRecommendation(page);
  await page.getByLabel('세부 직무·담당 역할').fill('사내 업무 문서를 정리합니다.');
  await page.getByRole('button',{name:'추천 받기',exact:true}).click();
  await expect(page.locator('#aiRecommendationResults')).toContainText('기본 제공 · 자동 지급');
  await page.locator('#aiRecommendationResults').getByRole('button',{name:'사용 안내',exact:true}).click();
  await expect(page.locator('#actionModalTitle')).toHaveText('Notion');
  await expect(page.locator('#requestCount')).toHaveText('0');
});

test('AI errors preserve manual catalog access and an escaped result cannot execute markup',async({page})=>{
  await page.route('**/api/recommend',route=>route.fulfill({status:503,json:{error:'ai_not_configured'}}));
  await openRecommendation(page);
  await page.getByLabel('세부 직무·담당 역할').fill('계약서를 정리하고 검토합니다.');
  await page.getByRole('button',{name:'추천 받기',exact:true}).click();
  await expect(page.locator('#aiRecommendationStatus')).toContainText('아직 연결되지 않았습니다');
  await expect(page.getByRole('button',{name:'추천 받기',exact:true})).toBeEnabled();
  await page.unroute('**/api/recommend');
  await page.route('**/api/recommend',route=>route.fulfill({json:{recommendations:[{toolId:'AD',reason:'<img src=x onerror="alert(1)">'}],followUpQuestion:null}}));
  await page.getByRole('button',{name:'추천 받기',exact:true}).click();
  await expect(page.locator('#aiRecommendationResults')).toContainText('<img');
  await expect(page.locator('#aiRecommendationResults img')).toHaveCount(0);
  await page.locator('#actionModalActions').getByRole('button',{name:'닫기',exact:true}).click();
  await expect(page.locator('#roleGrid')).toBeVisible();
});

test('long AI results and application fields stay inside their dialog',async({page},testInfo)=>{
  await page.route('**/api/recommend',route=>route.fulfill({json:{recommendations:[{toolId:'AD',reason:'계약서 검토 목적입니다. '.repeat(20)},{toolId:'MO',reason:'문서 편집과 정리에 활용합니다. '.repeat(15)},{toolId:'HG',reason:'월별 자료를 관리합니다.'}],followUpQuestion:null}}));
  await openRecommendation(page);
  await page.getByLabel('세부 직무·담당 역할').fill('계약서 검토와 월별 예산 문서 정리를 담당합니다.');
  await page.getByRole('button',{name:'추천 받기',exact:true}).click();
  await expect(page.locator('.ai-recommendation-card')).toHaveCount(3);
  const modal=page.locator('.action-modal');
  expect(await modal.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  expect(await modal.evaluate(el=>el.getBoundingClientRect().height<=window.innerHeight)).toBe(true);
  await testInfo.attach('ai-results-layout',{body:await page.screenshot(),contentType:'image/png'});
  await page.getByRole('button',{name:'신청 내용 확인',exact:true}).first().click();
  expect(await page.locator('#requestDetails').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await testInfo.attach('ai-request-layout',{body:await page.screenshot(),contentType:'image/png'});
});
