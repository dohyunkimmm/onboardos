const { test, expect } = require('@playwright/test');

const loginCopySelectors = [
  '#loginTitle',
  '#loginIntro',
  '.scenario-item:nth-child(1)',
  '.scenario-item:nth-child(2)',
  '.scenario-item:nth-child(3)',
  '.login-meta'
];

async function captureLoginCopyMetrics(page) {
  return page.evaluate(selectors => Object.fromEntries(selectors.map(selector => {
    const el = document.querySelector(selector);
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return [selector, {
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      height: rect.height
    }];
  })), loginCopySelectors);
}

test('Google SSO 클릭 중 로그인 왼쪽 카피의 글꼴·크기·높이가 변하지 않는다', async ({ page }) => {
  await page.goto('/');

  const fontLink = page.locator('#brandFontStylesheet');
  await expect(fontLink).toHaveAttribute('media', 'print');
  const before = await captureLoginCopyMetrics(page);

  await page.getByRole('button', { name: 'Google SSO로 시작하기' }).click();
  await expect(page.locator('#loginLoader')).toBeVisible();
  await expect(fontLink).toHaveAttribute('media', 'all');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#loginLoader')).toBeVisible();

  const during = await captureLoginCopyMetrics(page);
  expect(during).toEqual(before);
});
