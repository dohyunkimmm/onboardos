const { test, expect } = require('@playwright/test');

function capturePageErrors(page){
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

async function completeLogin(page){
  await page.getByRole('button', {name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
  await expect(page.locator('#roleGrid')).toBeVisible();
}

test.describe('Fault injection & recovery contract', () => {
  test('깨진 v4 JSON은 안전한 초기 상태로 복구되고 새 세션으로 덮어쓴다', async ({ page }) => {
    const pageErrors = capturePageErrors(page);
    await page.addInitScript(() => sessionStorage.setItem('onboard-os:v4', '{broken-json'));
    await page.goto('/');
    await expect(page.getByRole('button', {name:'Google SSO로 시작하기'})).toBeVisible();
    await completeLogin(page);
    const stored = await page.evaluate(() => sessionStorage.getItem('onboard-os:v4'));
    expect(() => JSON.parse(stored)).not.toThrow();
    expect(pageErrors).toEqual([]);
  });

  test('malformed v4 nested request는 폐기하고 정상 dashboard를 유지한다', async ({ page }) => {
    const pageErrors = capturePageErrors(page);
    await page.addInitScript(() => {
      sessionStorage.setItem('onboard-os:v4', JSON.stringify({
        currentRole:'office',
        loggedIn:true,
        selectedFilter:'not-a-filter',
        ticketSeq:'not-a-number',
        requestStateByRole:{
          office:{
            'Microsoft Office':null,
            'Adobe Acrobat':{status:'pending', ticket:'BROKEN-TICKET'}
          }
        },
        cancelledHistoryByRole:{office:{'Microsoft Office':'broken-history'}},
        cancelledTicketsByRole:{office:{'Microsoft Office':42}}
      }));
    });
    await page.goto('/');
    await expect(page.locator('#loginScreen')).toBeHidden();
    await expect(page.locator('#requestCount')).toHaveText('0');
    await expect(page.locator('.role-tab[data-role="office"]')).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'}).getByRole('button',{name:'신청하기'})).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('malformed v3 session은 v4로 안전하게 migration하고 legacy key를 제거한다', async ({ page }) => {
    const pageErrors = capturePageErrors(page);
    await page.addInitScript(() => {
      sessionStorage.setItem('onboard-os:v3', JSON.stringify({
        currentRole:'office',
        loggedIn:true,
        selectedFilter:'invalid',
        requestState:{'Microsoft Office':null},
        cancelledHistory:{'Microsoft Office':'broken'},
        cancelledTickets:{'Microsoft Office':123}
      }));
    });
    await page.goto('/');
    await expect(page.locator('#loginScreen')).toBeHidden();
    const session = await page.evaluate(() => ({
      legacy:sessionStorage.getItem('onboard-os:v3'),
      current:sessionStorage.getItem('onboard-os:v4')
    }));
    expect(session.legacy).toBeNull();
    expect(session.current).not.toBeNull();
    const parsed = JSON.parse(session.current);
    expect(parsed.currentRole).toBe('office');
    expect(parsed.requestStateByRole.office).toEqual({});
    expect(pageErrors).toEqual([]);
  });

  test('sessionStorage read/write 장애가 있어도 핵심 Flow는 계속 동작한다', async ({ page }) => {
    const pageErrors = capturePageErrors(page);
    await page.addInitScript(() => {
      const originalGet = Storage.prototype.getItem;
      const originalSet = Storage.prototype.setItem;
      const originalRemove = Storage.prototype.removeItem;
      const isOnboardKey = key => String(key).startsWith('onboard-os:');
      Storage.prototype.getItem = function(key){
        if(isOnboardKey(key)) throw new DOMException('Injected storage read failure','QuotaExceededError');
        return originalGet.call(this,key);
      };
      Storage.prototype.setItem = function(key,value){
        if(isOnboardKey(key)) throw new DOMException('Injected storage write failure','QuotaExceededError');
        return originalSet.call(this,key,value);
      };
      Storage.prototype.removeItem = function(key){
        if(isOnboardKey(key)) throw new DOMException('Injected storage remove failure','QuotaExceededError');
        return originalRemove.call(this,key);
      };
    });
    await page.goto('/');
    await completeLogin(page);
    const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
    await card.getByRole('button',{name:'신청하기'}).click();
    await expect(page.locator('#requestBackdrop')).toHaveClass(/show/);
    expect(pageErrors).toEqual([]);
  });

  test('Analytics/Speed Insights 장애는 업무 Flow와 분리된다', async ({ page }) => {
    const pageErrors = capturePageErrors(page);
    await page.route('**/_vercel/insights/script.js', route => route.fulfill({status:503, body:'unavailable'}));
    await page.route('**/_vercel/speed-insights/script.js', route => route.fulfill({status:503, body:'unavailable'}));
    await page.route('**/vitals.vercel-analytics.com/**', route => route.abort('failed'));
    await page.goto('/');
    await completeLogin(page);
    const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
    await card.getByRole('button',{name:'신청하기'}).click();
    await page.getByRole('button',{name:'신청 완료'}).click();
    await page.locator('#statusBtn').click();
    await expect(page.locator('.request-item').filter({hasText:'Microsoft Office'})).toContainText(/ITSM-\d+/);
    expect(pageErrors).toEqual([]);
  });
});
