const sleep = ms => new Promise(r => setTimeout(r, ms));

await sleep(5000);

const url = 'http://127.0.0.1:' + (process.env.PORT || 3000) + '/fetch';
const body = { url: 'https://careers.ncsoft.com/apply/view/101294?companyId=NCH' };

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  console.log('SELFTEST_STATUS', res.status);
  console.log('SELFTEST_RESULT', text);
} catch (err) {
  console.error('SELFTEST_ERROR', err?.stack || err?.message || String(err));
}
