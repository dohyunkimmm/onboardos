from pathlib import Path

root = Path('.')

events = (root/'js/events.js').read_text(encoding='utf-8')
old = """document.addEventListener('click', event => {
  const actionTarget = event.target.closest('[data-action]');
  if(actionTarget){
    const handler = actionHandlers[actionTarget.dataset.action];
    if(handler) handler(event, actionTarget.dataset.value || '');
  }

  const filter = event.target.closest('#filterTabs .filter-chip[data-filter]');
  if(filter) setFilter(filter.dataset.filter);
});
"""
new = """function closestFromEvent(event, selector){
  const direct = event.target && event.target.nodeType === 1 ? event.target : event.target?.parentElement;
  if(direct?.closest) return direct.closest(selector);
  const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
  return path.find(node => node?.nodeType === 1 && node.matches?.(selector)) || null;
}

document.addEventListener('click', event => {
  const actionTarget = closestFromEvent(event, '[data-action]');
  if(actionTarget){
    const handler = actionHandlers[actionTarget.dataset.action];
    if(handler) handler(event, actionTarget.dataset.value || '');
  }

  const filter = closestFromEvent(event, '#filterTabs .filter-chip[data-filter]');
  if(filter) setFilter(filter.dataset.filter);
});
"""
if old not in events:
    raise SystemExit('event delegation anchor not found')
(root/'js/events.js').write_text(events.replace(old, new), encoding='utf-8')

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
