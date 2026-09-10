const { test, expect } = require('@playwright/test');

async function login(page){
  await page.goto('/');
  await page.getByRole('button', { name: 'Google SSO로 시작하기' }).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
}

const ymd = value => new Date(value).toISOString().slice(0, 10);

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-11T12:00:00+09:00'));
});

test('영업일 계산이 주말·월말·연말 경계에서 일관된다', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => ({
    fridayPlus1: businessDate(1, new Date('2026-09-11T12:00:00+09:00')).toISOString(),
    fridayPlus2: businessDate(2, new Date('2026-09-11T12:00:00+09:00')).toISOString(),
    monthEnd: businessDate(1, new Date('2026-01-30T12:00:00+09:00')).toISOString(),
    yearEnd: businessDate(2, new Date('2026-12-31T12:00:00+09:00')).toISOString(),
    forwardDistance: businessDayDistance(new Date('2026-09-11T12:00:00+09:00'), new Date('2026-09-14T12:00:00+09:00')),
    reverseDistance: businessDayDistance(new Date('2026-09-14T12:00:00+09:00'), new Date('2026-09-11T12:00:00+09:00')),
    slaToday: getSlaHealth({status:'pending', dueDate:new Date('2026-09-11T12:00:00+09:00').toISOString()}).label,
    slaSoon: getSlaHealth({status:'pending', dueDate:new Date('2026-09-14T12:00:00+09:00').toISOString()}).label,
    slaOver: getSlaHealth({status:'pending', dueDate:new Date('2026-09-10T12:00:00+09:00').toISOString()}).label
  }));
  expect(ymd(result.fridayPlus1)).toBe('2026-09-14');
  expect(ymd(result.fridayPlus2)).toBe('2026-09-15');
  expect(ymd(result.monthEnd)).toBe('2026-02-02');
  expect(ymd(result.yearEnd)).toBe('2027-01-04');
  expect(result.forwardDistance).toBe(1);
  expect(result.reverseDistance).toBe(-1);
  expect(result.slaToday).toBe('오늘 마감');
  expect(result.slaSoon).toBe('마감 임박 · D-1');
  expect(result.slaOver).toBe('SLA 초과 · D+1');
});

test('요청 상태는 request → pending → approved → completed이며 티켓은 유지된다', async ({ page }) => {
  await login(page);
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  expect(await page.evaluate(() => findLicenseByName('Microsoft Office').status)).toBe('request');
  await card.getByRole('button', {name:'신청하기'}).click();
  await page.getByRole('button', {name:'신청 완료'}).click();
  const pending = await page.evaluate(() => ({status:requestState['Microsoft Office'].status, ticket:requestState['Microsoft Office'].ticket}));
  expect(pending.status).toBe('pending');
  await page.locator('#adminBtn').click();
  await page.locator('.request-item').filter({hasText:'Microsoft Office'}).getByRole('button', {name:'IT 검토 완료'}).click();
  const approved = await page.evaluate(() => ({status:requestState['Microsoft Office'].status, ticket:requestState['Microsoft Office'].ticket}));
  expect(approved).toEqual({status:'approved', ticket:pending.ticket});
  await page.getByRole('button', {name:'지급 완료 처리'}).click();
  const completed = await page.evaluate(() => ({status:requestState['Microsoft Office'].status, ticket:requestState['Microsoft Office'].ticket}));
  expect(completed).toEqual({status:'completed', ticket:pending.ticket});
});

test('반려 후 보완 재신청은 동일 ITSM 티켓의 이력을 이어간다', async ({ page }) => {
  await login(page);
  await page.locator('.role-tab[data-role="design"]').click();
  const card = page.locator('#roleGrid .card').filter({hasText:'Adobe Creative Cloud'});
  await card.getByRole('button', {name:'승인 요청하기'}).click();
  await page.locator('#requestNote').fill('디자인 제작 업무용');
  await page.getByRole('button', {name:'신청 완료'}).click();
  const original = await page.evaluate(() => requestState['Adobe Creative Cloud'].ticket);
  await page.locator('#adminBtn').click();
  await page.locator('.request-item').filter({hasText:'Adobe Creative Cloud'}).getByRole('button', {name:'반려'}).click();
  await page.getByRole('button', {name:'반려 처리'}).click();
  await page.locator('.drawer-close').click();
  await page.locator('#statusBtn').click();
  await page.locator('.request-item').filter({hasText:'Adobe Creative Cloud'}).getByRole('button', {name:'수정 후 재신청'}).click();
  await page.locator('#requestNote').fill('필요 기간과 사용 목적을 보완했습니다.');
  await page.getByRole('button', {name:'재신청하기'}).click();
  const after = await page.evaluate(() => ({ticket:requestState['Adobe Creative Cloud'].ticket, status:requestState['Adobe Creative Cloud'].status, history:requestState['Adobe Creative Cloud'].history.map(x => x.label)}));
  expect(after.ticket).toBe(original);
  expect(after.status).toBe('pending');
  expect(after.history.some(label => label.includes('재신청 접수'))).toBeTruthy();
});
