const { test, expect } = require('@playwright/test');
const fs = require('fs');

function globalHeaders(){
  const config = JSON.parse(fs.readFileSync('vercel.json','utf8'));
  const rule = (config.headers || []).find(row => row.source === '/(.*)');
  return new Map((rule?.headers || []).map(row => [String(row.key).toLowerCase(), String(row.value)]));
}

async function completeLogin(page){
  await page.getByRole('button', {name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
}

async function submitOfficeRequest(page,note){
  const card = page.locator('#roleGrid .card').filter({hasText:'Microsoft Office'});
  await card.getByRole('button',{name:'신청하기'}).click();
  if(note) await page.locator('#requestNote').fill(note);
  await page.getByRole('button',{name:'신청 완료'}).click();
  await expect(page.locator('#requestCount')).toHaveText('1');
}

test.describe('Security & failure-containment contract', () => {
  test('[S1] 전역 security headers가 최소 방어 baseline을 유지한다', async () => {
    const headers = globalHeaders();
    expect(headers.get('x-content-type-options')).toBe('nosniff');
    expect(headers.get('x-frame-options')).toBe('DENY');
    expect(headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('permissions-policy')).toContain('camera=()');
    expect(headers.get('permissions-policy')).toContain('microphone=()');
    expect(headers.get('permissions-policy')).toContain('geolocation=()');
  });

  test('[S2] CSP는 script injection·framing·object·base/form 우회를 차단한다', async () => {
    const csp = globalHeaders().get('content-security-policy') || '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src-attr 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain('upgrade-insecure-requests');
    expect(csp).not.toContain("'unsafe-eval'");
  });

  test('[S3] analytics boundary는 allowlist 외 필드와 identifier-like 값을 폐기한다', async ({ page }) => {
    await page.goto('/');
    const payloads = await page.evaluate(() => {
      const captured = [];
      window.va = (...args) => captured.push(args);
      trackEvent('License Request', {
        license:'Microsoft Office',
        type:'request',
        email:'employee@example.com',
        note:'free text must not leave browser',
        ticket:'ITSM-9999',
        url:'https://example.com/private'
      });
      trackEvent('License Request', {license:'employee@example.com',type:'request'});
      trackEvent('Unknown Event', {role:'office'});
      return captured;
    });
    expect(payloads).toHaveLength(2);
    expect(payloads[0][0]).toBe('event');
    expect(payloads[0][1]).toEqual({name:'License Request',data:{license:'Microsoft Office',type:'request'}});
    expect(payloads[1][1]).toEqual({name:'License Request',data:{type:'request'}});
  });

  test('[S4] 사용자 자유입력은 URL·link destination으로 전파되지 않는다', async ({ page }) => {
    const canary = 'SECURITY_CANARY_PRIVATE_NOTE';
    await page.goto('/');
    await completeLogin(page);
    await submitOfficeRequest(page,canary);
    const leak = await page.evaluate(value => ({
      url:location.href.includes(value),
      link:[...document.querySelectorAll('a[href]')].some(a => a.href.includes(value))
    }),canary);
    expect(leak).toEqual({url:false,link:false});
  });

  test('[S5] ONBOARD·OS 상태는 localStorage에 복제하지 않고 session key로 한정한다', async ({ page }) => {
    await page.goto('/');
    await completeLogin(page);
    await submitOfficeRequest(page,'session-only state');
    const keys = await page.evaluate(() => ({
      local:Object.keys(localStorage).filter(key => key.startsWith('onboard-os:')),
      session:Object.keys(sessionStorage).filter(key => key.startsWith('onboard-os:')).sort()
    }));
    expect(keys.local).toEqual([]);
    expect(keys.session).toEqual(['onboard-os:v4']);
  });

  test('[S6] 자유입력·ticket은 console에 기록되지 않는다', async ({ page }) => {
    const canary = 'SECURITY_CANARY_CONSOLE';
    const messages = [];
    page.on('console', msg => messages.push(msg.text()));
    await page.goto('/');
    await completeLogin(page);
    await submitOfficeRequest(page,canary);
    await page.locator('#statusBtn').click();
    await expect(page.locator('.request-item').filter({hasText:'Microsoft Office'})).toContainText(/ITSM-\d+/);
    expect(messages.join('\n')).not.toContain(canary);
    expect(messages.join('\n')).not.toMatch(/ITSM-\d+/);
  });

  test('[S7] telemetry 함수가 throw해도 신청 Flow는 containment된다', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.evaluate(() => { window.va = () => { throw new Error('injected telemetry failure'); }; });
    await completeLogin(page);
    await submitOfficeRequest(page,'telemetry containment');
    await page.locator('#statusBtn').click();
    await expect(page.locator('.request-item').filter({hasText:'Microsoft Office'})).toContainText(/ITSM-\d+/);
    expect(errors).toEqual([]);
  });

  test('[S8] DOM에 inline handler·javascript URL을 만들지 않는다', async ({ page }) => {
    await page.goto('/');
    await completeLogin(page);
    const unsafe = await page.evaluate(() => ({
      inlineHandlers:document.querySelectorAll('[onclick],[onerror],[onload],[onmouseover],[onfocus]').length,
      javascriptUrls:[...document.querySelectorAll('[href],[src]')].filter(el => /^(?:\s*)javascript:/i.test(el.getAttribute('href') || el.getAttribute('src') || '')).length
    }));
    expect(unsafe).toEqual({inlineHandlers:0,javascriptUrls:0});
  });
});
