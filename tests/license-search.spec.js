const {test,expect}=require('@playwright/test');
test('Employee search composes with status and preserves common-tool visibility',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
 await expect(page.locator('#loginScreen')).toBeHidden();
 const search=page.getByRole('searchbox',{name:'도구 검색'});
 await expect(page.locator('.walkthrough')).not.toHaveAttribute('open');
 await expect(page.locator('details.common-first')).toHaveAttribute('open');
 await page.locator('details.common-first > summary').click();
 await search.fill('Slack');
 await expect(page.locator('details.common-first')).toHaveAttribute('open');
 await expect(page.locator('.card:not(.is-hidden)')).toHaveCount(1);
 await expect(page.locator('.card:not(.is-hidden)')).toHaveAttribute('data-name','Slack');
 await page.getByRole('button',{name:'해야 할 일',exact:true}).click();
 await expect(page.locator('.card:not(.is-hidden)')).toHaveCount(0);
 await page.getByRole('button',{name:'전체',exact:true}).click();
 await search.fill('office');
 await expect(page.locator('.card:not(.is-hidden)')).toHaveAttribute('data-name','Microsoft Office');
 await search.fill('');
 await expect(page.locator('details.common-first')).not.toHaveAttribute('open');
 await expect(page.locator('#roleGrid .card:not(.is-hidden)')).toHaveCount(3);
});

test('First screen exposes role control and shared tools without duplicate Case Study',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('link',{name:'Case Study',exact:true})).toHaveCount(1);
 await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
 await expect(page.locator('#loginScreen')).toBeHidden();
 await expect(page.locator('main a').filter({hasText:'Case Study'})).toHaveCount(0);
 const picker=page.getByRole('combobox',{name:'직군 선택'});
 await expect(picker).toBeVisible();
 await page.getByRole('combobox',{name:'직군 선택'}).selectOption('dev');
 await expect(page.locator('#currentRoleLabel')).toHaveText('개발 직군');
 await expect(page.locator('#roleGrid .card')).toHaveCount(4);
 const common=page.locator('#commonTools');
 await expect(common).toHaveAttribute('open');
 await common.locator('summary').click();
 await common.locator('summary').click();
 await expect(common).toHaveAttribute('open');
 await expect(common.getByRole('heading',{name:'전사 공통 도구'})).toBeVisible();
});

test('Catalog has no repeated shared-tool summary or guidance buttons',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
 await expect(page.locator('#loginScreen')).toBeHidden();
 await expect(page.locator('#readinessSummary')).not.toContainText('공통 도구');
 await expect(page.locator('#commonGrid .card')).toHaveCount(6);
 await expect(page.locator('#commonGrid button')).toHaveCount(0);
 await expect(page.locator('#roleHeading')).toHaveCSS('font-size','18px');
 await expect(page.locator('#commonTools h2')).toHaveCSS('font-size','18px');
 await expect(page.locator('#roleGrid .card-title').first()).toHaveCSS('font-size','16px');
 await expect(page.locator('#commonGrid .card-title').first()).toHaveCSS('font-size','16px');
 await page.getByRole('searchbox',{name:'도구 검색'}).fill('Slack');
 await expect(page.locator('.card:not(.is-hidden)')).toHaveCount(1);
 await page.getByRole('button',{name:'해야 할 일',exact:true}).click();
 await expect(page.locator('.card:not(.is-hidden)')).toHaveCount(0);
 await page.getByRole('button',{name:'전체',exact:true}).click();
 await expect(page.locator('.card:not(.is-hidden)')).toHaveCount(1);
});

test('Instructions stay outside the catalog and help closes with Escape',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
 await expect(page.locator('#loginScreen')).toBeHidden();
 await expect(page.locator('main .walkthrough, main .overview-panel')).toHaveCount(0);
 await page.getByRole('button',{name:'도움말',exact:true}).click();
 const help=page.getByRole('dialog',{name:'사용 안내'});
 await expect(help).toBeVisible();
 await help.getByRole('button',{name:'도움말 닫기'}).press('Escape');
 await expect(help).not.toBeVisible();
 await expect(page.getByRole('button',{name:'도움말',exact:true})).toBeFocused();
});

test('First page return preserves the role and allows SSO again',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
 await expect(page.locator('#loginScreen')).toBeHidden();
 await page.getByRole('combobox',{name:'직군 선택'}).selectOption('dev');
 await page.getByRole('button',{name:'첫 페이지',exact:true}).click();
 await expect(page.locator('#loginScreen')).toBeVisible();
 await expect(page.getByRole('button',{name:'Google SSO로 시작하기'})).toBeEnabled();
 await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
 await expect(page.locator('#loginScreen')).toBeHidden();
 await expect(page.locator('#currentRoleLabel')).toHaveText('개발 직군');
});

test('Role filters stay in normal flow and do not jump the page at desktop width',async({page})=>{
 await page.setViewportSize({width:1920,height:1080});
 await page.goto('/');
 await page.getByRole('button',{name:'Google SSO로 시작하기'}).click();
 await expect(page.locator('#loginScreen')).toBeHidden();
 const group=page.getByRole('combobox',{name:'직군 선택'});
 await expect(group).toBeVisible();
 const before=await group.boundingBox();
 const scroll=await page.evaluate(()=>window.scrollY);
 for(const name of ['개발','디자인','데이터','경영지원·총무']){
   await group.selectOption({label:name});
   await expect(group.locator('option:checked')).toHaveText(name);
   const after=await group.boundingBox();
   expect(Math.abs(after.y-before.y)).toBeLessThanOrEqual(1);
   expect(await page.evaluate(()=>window.scrollY)).toBe(scroll);
 }
});
