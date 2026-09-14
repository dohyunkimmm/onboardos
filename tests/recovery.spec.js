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
  test('[R1] 깨진 current JSON은 안전한 초기 상태로 복구되고 새 세션으로 덮어쓴다', async ({ page }) => {
    const pageErrors = capturePageErrors(page);
    await page.addInitScript(() => sessionStorage.setItem('onboard-os:v4', '{broken-json'));
    await page.goto('/');
    await expect(page.getByRole('button', {name:'Google SSO로 시작하기'})).toBeVisible();
    await completeLogin(page);
    const stored = await page.evaluate(() => sessionStorage.getItem('onboard-os:v4'));
    const parsed = JSON.parse(stored);
    expect(parsed.schemaVersion).toBe(4);
    expect(pageErrors).toEqual([]);
  });

  test('[R2] malformed nested request는 폐기하고 정상 dashboard를 유지한다', async ({ page }) => {
    const pageErrors = capturePageErrors(page);
    await page.addInitScript(() => {
      sessionStorage.setItem('onboard-os:v4', JSON.stringify({
        schemaVersion:4,
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

  test('[R3] malformed legacy session은 current schema로 안전하게 migration하고 legacy key를 제거한다', async ({ page }) => {
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
    expect(parsed.schemaVersion).toBe(4);
    expect(parsed.currentRole).toBe('office');
    expect(parsed.requestStateByRole.office).toEqual({});
    expect(pageErrors).toEqual([]);
  });

  test('[R4] sessionStorage read/write 장애가 있어도 핵심 Flow는 계속 동작한다', async ({ page }) => {
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

  test('[R5] Analytics/Speed Insights 장애는 업무 Flow와 분리된다', async ({ page }) => {
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

  test('[R6] valid + corrupt 혼합 상태는 정상 request만 보존하고 손상 record만 폐기한다', async ({ page }) => {
    const pageErrors = capturePageErrors(page);
    await page.addInitScript(() => {
      sessionStorage.setItem('onboard-os:v4', JSON.stringify({
        schemaVersion:4,
        currentRole:'office',
        loggedIn:true,
        selectedFilter:'all',
        ticketSeq:1050,
        requestStateByRole:{
          office:{
            'Microsoft Office':{
              name:'Microsoft Office', owner:'IT팀', ticket:'ITSM-1049', baseStatus:'request', status:'pending',
              createdAt:'9월 14일', createdTs:Date.now(), expected:'9월 16일', roleLabel:'경영지원·총무', history:[]
            },
            'Adobe Acrobat':{name:'Adobe Acrobat', status:'approved', ticket:'CORRUPT'}
          }
        },
        cancelledHistoryByRole:{},
        cancelledTicketsByRole:{}
      }));
    });
    await page.goto('/');
    await expect(page.locator('#loginScreen')).toBeHidden();
    await expect(page.locator('#requestCount')).toHaveText('1');
    await page.locator('#statusBtn').click();
    await expect(page.locator('.request-item').filter({hasText:'Microsoft Office'})).toContainText('ITSM-1049');
    await expect(page.locator('.request-item').filter({hasText:'Adobe Acrobat'})).toHaveCount(0);
    const stored = JSON.parse(await page.evaluate(() => sessionStorage.getItem('onboard-os:v4')));
    expect(Object.keys(stored.requestStateByRole.office)).toEqual(['Microsoft Office']);
    expect(pageErrors).toEqual([]);
  });

  test('[R7] 신청 직후 새로고침해도 로그인·request·ticket 연속성이 유지된다', async ({ page }) => {
    const pageErrors = capturePageErrors(page);
    await page.goto('/');
    await completeLogin(page);
    const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
    await card.getByRole('button',{name:'신청하기'}).click();
    await page.getByRole('button',{name:'신청 완료'}).click();
    const before = JSON.parse(await page.evaluate(() => sessionStorage.getItem('onboard-os:v4')));
    const ticket = before.requestStateByRole.office['Microsoft Office'].ticket;
    await page.reload();
    await expect(page.locator('#loginScreen')).toBeHidden();
    await expect(page.locator('#requestCount')).toHaveText('1');
    await page.locator('#statusBtn').click();
    await expect(page.locator('.request-item').filter({hasText:'Microsoft Office'})).toContainText(ticket);
    const after = JSON.parse(await page.evaluate(() => sessionStorage.getItem('onboard-os:v4')));
    expect(after.requestStateByRole.office['Microsoft Office'].ticket).toBe(ticket);
    expect(pageErrors).toEqual([]);
  });

  test('[R8] 지원 범위보다 미래 session schema는 stale client에서 안전 초기화한다', async ({ page }) => {
    const pageErrors = capturePageErrors(page);
    await page.addInitScript(() => {
      sessionStorage.setItem('onboard-os:v4', JSON.stringify({
        schemaVersion:999,
        currentRole:'developer',
        loggedIn:true,
        requestStateByRole:{developer:{'GitHub Enterprise':{status:'completed',ticket:'ITSM-9999'}}}
      }));
    });
    await page.goto('/');
    await expect(page.getByRole('button', {name:'Google SSO로 시작하기'})).toBeVisible();
    await expect(page.locator('#loginScreen')).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('onboard-os:v4'))).toBeNull();
    expect(pageErrors).toEqual([]);
  });
});
