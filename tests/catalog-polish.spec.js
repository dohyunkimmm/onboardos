const {test,expect}=require('@playwright/test');
async function login(page){await page.goto('/');await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();await expect(page.locator('#loginScreen')).toBeHidden();}
test('basic license guidance opens without creating a request',async({page})=>{
 await login(page);
 const card=page.locator('#commonGrid .card[data-name="Notion"]');
 await expect(card).toContainText('문서 작성·지식 정리');
 await card.getByRole('button',{name:'사용 안내',exact:true}).click();
 await expect(page.locator('#actionModalTitle')).toHaveText('Notion');
 await expect(page.locator('#requestCount')).toHaveText('0');
 await page.locator('#actionModalActions').getByRole('button',{name:'닫기',exact:true}).click();
 await expect(card.getByRole('button',{name:'사용 안내',exact:true})).toBeFocused();
});
test('wide catalogs use three columns for every role',async({page},testInfo)=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.setViewportSize({width:1280,height:1080});await login(page);
 for(const width of [1280,1920]){
  await page.setViewportSize({width,height:1080});
  for(const role of ['office','design','dev','data']){
   await page.getByRole('combobox',{name:'직군 선택'}).selectOption(role);
   const grid=page.locator('#roleGrid');
   const boxes=await grid.locator('.card').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {y:r.y,right:r.right};}));
   expect(new Set(boxes.slice(0,3).map(b=>Math.round(b.y))).size).toBe(1);
   expect(new Set(boxes.map(b=>Math.round(b.y))).size).toBe(2);
   const bounds=await grid.boundingBox();
   expect(Math.abs(boxes[2].right-(bounds.x+bounds.width))).toBeLessThan(2);
  }
  await testInfo.attach('catalog-'+width,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
 }
});
test('short mobile approval form scrolls its fields above submit actions',async({page},testInfo)=>{
 await page.setViewportSize({width:360,height:640});await login(page);
 await page.getByRole('combobox',{name:'직군 선택'}).selectOption('design');
 const card=page.locator('#roleGrid .card[data-name="Adobe Creative Cloud"]');
 await card.getByRole('button',{name:'승인 요청하기'}).click();
 await page.locator('#requestNote').fill('제품 디자인 이미지 제작에 사용합니다.');
 await page.locator('#requestScope').selectOption({label:'Photoshop'});
 await page.locator('#requestPeriod').selectOption({label:'3개월'});
 await page.locator('#requestBudget').fill('디자인팀');
 const budget=await page.locator('#requestBudget').boundingBox();
 const actions=await page.locator('.request-modal .modal-actions').boundingBox();
 expect(budget.y+budget.height).toBeLessThanOrEqual(actions.y+1);
 const body=page.locator('#requestDetails');
 expect(await body.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
 await testInfo.attach('short-approval-modal',{body:await page.screenshot(),contentType:'image/png'});
 await page.getByRole('button',{name:'신청 제출',exact:true}).click();
 await expect(card).toContainText('검토 대기');
});
