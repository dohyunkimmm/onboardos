const {test,expect} = require('@playwright/test');

async function openRecommendation(page){
  await page.goto('/');
  await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
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
  await page.getByRole('button',{name:'신청 완료',exact:true}).click();
  await expect(page.locator('#roleGrid .card[data-name="Adobe Acrobat Pro DC"]')).toContainText('검토 대기');
});

test('common recommendations show usage guidance without a new application',async({page})=>{
  await page.route('**/api/recommend',route=>route.fulfill({json:{recommendations:[{toolId:'NT',reason:'업무 문서 정리에 활용합니다.'}],followUpQuestion:null}}));
  await openRecommendation(page);
  await page.getByLabel('세부 직무·담당 역할').fill('사내 업무 문서를 정리합니다.');
  await page.getByRole('button',{name:'추천 받기',exact:true}).click();
  await expect(page.locator('#aiRecommendationResults')).toContainText('전사 공통 · 자동 지급');
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
