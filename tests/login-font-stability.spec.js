const { test, expect } = require('@playwright/test');

// Covers the full left login copy surface because the deferred brand-font activation happens before the login screen exits.
const selectors = [
  '.login-brand',
  '.login-eyebrow',
  '#loginTitle',
  '#loginIntro',
  '.scenario-item:nth-child(1)',
  '.scenario-item:nth-child(2)',
  '.scenario-item:nth-child(3)',
  '.login-meta'
];

async function readMetrics(page){
  return page.evaluate(selectors => selectors.map(selector => {
    const el = document.querySelector(selector);
    if(!el) throw new Error(`Missing login metric target: ${selector}`);
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(el);
    const textRect = range.getBoundingClientRect();
    return {
      selector,
      fontFamily:style.fontFamily,
      width:rect.width,
      height:rect.height,
      textWidth:textRect.width,
      textHeight:textRect.height
    };
  }), selectors);
}

test('Google SSO 클릭 전 brand font activation이 왼쪽 로그인 문구 크기를 바꾸지 않는다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', {name:'Google SSO로 시작하기'})).toBeVisible();

  const before = await readMetrics(page);
  for(const metric of before){
    expect(metric.fontFamily.toLowerCase(), metric.selector).toContain('system-ui');
  }

  await page.evaluate(async () => {
    const stylesheet = document.getElementById('brandFontStylesheet');
    if(stylesheet) stylesheet.media = 'all';
    if(document.fonts?.ready) await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });

  const after = await readMetrics(page);
  for(let i = 0; i < before.length; i += 1){
    const a = before[i];
    const b = after[i];
    expect(b.fontFamily, a.selector).toBe(a.fontFamily);
    expect(Math.abs(b.width - a.width), `${a.selector} box width`).toBeLessThanOrEqual(0.75);
    expect(Math.abs(b.height - a.height), `${a.selector} box height`).toBeLessThanOrEqual(0.75);
    expect(Math.abs(b.textWidth - a.textWidth), `${a.selector} text width`).toBeLessThanOrEqual(0.75);
    expect(Math.abs(b.textHeight - a.textHeight), `${a.selector} text height`).toBeLessThanOrEqual(0.75);
  }
});
