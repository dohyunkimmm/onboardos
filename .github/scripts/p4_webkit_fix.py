from pathlib import Path

root = Path('.')

# Production is HTTPS, so keep upgrade-insecure-requests there. The local QA server
# is intentionally HTTP; WebKit upgrades localhost subresources under that directive
# and then fails the TLS handshake. Remove only this directive from the local server.
serve = (root/'scripts/serve.js').read_text(encoding='utf-8')
old_headers = "const securityHeaders = Object.fromEntries((config.headers || []).flatMap(rule => rule.headers || []).map(h => [h.key, h.value]));\n"
new_headers = """const securityHeaders = Object.fromEntries((config.headers || []).flatMap(rule => rule.headers || []).map(h => [h.key, h.value]));
if(securityHeaders['Content-Security-Policy']){
  securityHeaders['Content-Security-Policy'] = securityHeaders['Content-Security-Policy']
    .replace(/;?\\s*upgrade-insecure-requests\\s*;?/g, ';')
    .replace(/;;+/g, ';')
    .replace(/^;|;$/g, '')
    .trim();
}
"""
if old_headers not in serve:
    raise SystemExit('local CSP header anchor not found')
(root/'scripts/serve.js').write_text(serve.replace(old_headers, new_headers), encoding='utf-8')

# Keep useful diagnostics in the cross-browser smoke without changing application code.
cross = (root/'tests/cross-browser.spec.js').read_text(encoding='utf-8')
old_cross = """  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', {name:'Google SSO로 시작하기'}).click();
  await expect(page.locator('#loginScreen')).toBeHidden();
"""
new_cross = """  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', msg => { if(msg.type() === 'error') consoleErrors.push(msg.text()); });
  await page.goto('/');
  const loginButton = page.getByRole('button', {name:'Google SSO로 시작하기'});
  await loginButton.click();
  try {
    await expect(page.locator('#loginScreen')).toBeHidden({timeout: 8_000});
  } catch (error) {
    const state = await page.evaluate(() => ({
      fakeLogin: typeof fakeLogin,
      busy: document.querySelector('.google-btn')?.getAttribute('aria-busy'),
      disabled: document.querySelector('.google-btn')?.disabled,
      loaderVisible: document.getElementById('loginLoader')?.classList.contains('is-visible'),
      loginHidden: document.getElementById('loginScreen')?.hidden,
      loggedIn: typeof loggedIn === 'boolean' ? loggedIn : null
    }));
    throw new Error(`Cross-browser login failed: ${JSON.stringify({state,pageErrors,consoleErrors})}\n${error.message}`);
  }
"""
if old_cross not in cross:
    raise SystemExit('cross-browser login anchor not found')
cross = cross.replace(old_cross, new_cross)
cross = cross.replace("  expect(pageErrors).toEqual([]);\n", "  expect(pageErrors).toEqual([]);\n  expect(consoleErrors.filter(text => /TypeError|ReferenceError|Content Security Policy|Refused to/i.test(text))).toEqual([]);\n")
(root/'tests/cross-browser.spec.js').write_text(cross, encoding='utf-8')
