import assert from 'node:assert/strict';
import test from 'node:test';
import { detectIdentity, retrieveJD } from '../src/retriever.js';

test('detects Korean recruiting platform posting identities', () => {
  const cases: Array<[string, string, string]> = [
    ['https://www.jobkorea.co.kr/Recruit/GI_Read/49999338?Oem_Code=C1', 'jobkorea', '49999338'],
    ['https://www.saramin.co.kr/zf_user/jobs/relay/view?rec_idx=123456', 'saramin', '123456'],
    ['https://www.wanted.co.kr/wd/47797', 'wanted', '47797'],
    ['https://career.rememberapp.co.kr/job/posting/331884', 'remember', '331884'],
    ['https://jumpit.saramin.co.kr/position/53669062', 'jumpit', '53669062'],
    ['https://job.incruit.com/jobdb_info/jobpost.asp?job=2607290002119', 'incruit', '2607290002119'],
    ['https://www.catch.co.kr/NCS/RecruitInfoDetails/569961', 'catch', '569961'],
    ['https://www.work24.go.kr/wk/a/b/1500/empDetailAuthView.do?wantedAuthNo=K123456789', 'work24', 'K123456789'],
  ];
  for (const [url, platform, id] of cases) {
    const result = detectIdentity(url);
    assert.equal(result.platform, platform);
    assert.equal(result.primaryIdentity, id);
    assert.equal(result.status, 'locked');
  }
});

test('detects domain-specific exact identities', () => {
  const greeting = detectIdentity('https://acme.career.greetinghr.com/ko/o/abc-123');
  assert.equal(greeting.platform, 'greetinghr');
  assert.equal(greeting.primaryIdentity, 'abc-123');

  const ncsoft = detectIdentity('https://careers.ncsoft.com/apply/view/101294?companyId=NCH');
  assert.equal(ncsoft.platform, 'ncsoft');
  assert.equal(ncsoft.primaryIdentity, '101294');
  assert.equal(ncsoft.secondaryIdentity.companyId, 'NCH');

  const kia = detectIdentity('https://career.kia.com/apply/applyView.kc?recuYy=2026&recuType=N2&recuCls=204');
  assert.equal(kia.platform, 'kia');
  assert.equal(kia.primaryIdentity, '2026:N2:204');
});

test('LinkedIn slug text does not replace numeric job id', () => {
  const result = detectIdentity('https://kr.linkedin.com/jobs/view/some-role-at-company-4455483539');
  assert.equal(result.platform, 'linkedin');
  assert.equal(result.primaryIdentity, '4455483539');
});

test('generic URLs stay partial instead of inventing a posting id', () => {
  const result = detectIdentity('https://jobs.example.com/careers/cloud-engineer');
  assert.equal(result.platform, 'generic');
  assert.equal(result.primaryIdentity, null);
  assert.equal(result.status, 'partial');
});

test('analytics parameters do not destabilize known posting fingerprints', () => {
  const a = detectIdentity('https://www.wanted.co.kr/wd/47797?utm_source=a');
  const b = detectIdentity('https://www.wanted.co.kr/wd/47797?utm_source=b');
  assert.equal(a.fingerprint, b.fingerprint);
});

test('blocks direct private-IP SSRF targets before retrieval', async () => {
  await assert.rejects(
    () => retrieveJD({ url: 'http://127.0.0.1/admin' }),
    /Private IP targets are not allowed/,
  );
});

test('blocks credential-bearing URLs before retrieval', async () => {
  await assert.rejects(
    () => retrieveJD({ url: 'https://user:password@example.com/job' }),
    /Credential-bearing URLs are not allowed/,
  );
});

test('blocks non-standard target ports before retrieval', async () => {
  await assert.rejects(
    () => retrieveJD({ url: 'https://example.com:8443/job' }),
    /Non-standard ports are not allowed/,
  );
});
