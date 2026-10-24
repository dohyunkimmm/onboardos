const {test,expect}=require('@playwright/test');

test('new role licenses load icons and support AI-led requests',async({page},testInfo)=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
  for(const [role,id,name,detail] of [
    ['data','PBI','Power BI Pro','매출 데이터를 시각화하고 대시보드를 공유합니다.'],
    ['dev','PM','Postman','API 요청과 응답을 테스트하고 팀과 공유합니다.'],
    ['office','MD','모두싸인','계약서를 발송하고 전자서명을 관리합니다.']
  ]){
    await page.getByRole('combobox',{name:'직군 선택'}).selectOption(role);
    const card=page.locator('#roleGrid .card').filter({hasText:name});
    await expect(card).toHaveCount(1);
    await expect(card.locator('.requirement-pill')).toHaveText('선택');
    await expect.poll(()=>card.locator('img').evaluate(img=>img.complete && img.naturalWidth>0)).toBe(true);
    await testInfo.attach(role+'-new-license',{body:await card.screenshot(),contentType:'image/png'});
    await page.route('**/api/recommend',route=>route.fulfill({json:{recommendations:[{toolId:id,reason:detail}],followUpQuestion:null}}));
    await page.getByRole('button',{name:'AI 추천',exact:true}).click();
    await page.getByLabel('세부 직무·담당 역할').fill(detail);
    await page.getByRole('button',{name:'추천 받기',exact:true}).click();
    await expect(page.locator('#aiRecommendationResults')).toContainText(name);
    await page.getByRole('button',{name:'신청 내용 확인',exact:true}).click();
    await page.getByLabel('신청 사유를 확인했습니다').check();
    await page.getByRole('button',{name:'신청 제출',exact:true}).click();
    await expect(card).toContainText('검토 대기');
    await page.unroute('**/api/recommend');
  }
});
