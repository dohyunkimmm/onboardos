import express from 'express';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import dns from 'node:dns/promises';
import net from 'node:net';

const app = express();
app.use(express.json({ limit: '1mb' }));

const ALLOWED_HOSTS = new Set(['careers.ncsoft.com', 'm-careers.ncsoft.com']);
const PORT = process.env.PORT || 3000;

function isPrivateIp(ip) {
  if (!net.isIP(ip)) return false;
  if (ip.startsWith('10.') || ip.startsWith('127.') || ip.startsWith('169.254.') || ip.startsWith('192.168.')) return true;
  if (ip.startsWith('172.')) {
    const second = Number(ip.split('.')[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) return true;
  return false;
}

async function validateUrl(input) {
  let url;
  try { url = new URL(input); } catch { throw new Error('Invalid URL'); }
  if (url.protocol !== 'https:') throw new Error('Only HTTPS is allowed');
  if (!ALLOWED_HOSTS.has(url.hostname)) throw new Error('Host not allowed');
  const records = await dns.lookup(url.hostname, { all: true });
  if (!records.length || records.some(r => isPrivateIp(r.address))) throw new Error('Unsafe destination');
  return url;
}

function parseIdentity(url) {
  const m = url.pathname.match(/\/apply\/view\/(\d+)/);
  const postingId = m?.[1] || url.searchParams.get('jopenId') || '';
  const companyId = url.searchParams.get('companyId') || '';
  return { postingId, companyId };
}

function normalize(s='') {
  return s.replace(/\u00a0/g, ' ').replace(/[\t\r]+/g, ' ').replace(/ +/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

const HEADING_MAP = [
  ['responsibilities', [/주요\s*업무/i,/업무\s*내용/i,/담당\s*업무/i,/job\s*description/i,/responsibilit/i]],
  ['required_qualifications', [/지원\s*자격/i,/자격\s*요건/i,/필수\s*요건/i,/requirements?/i,/qualification/i]],
  ['preferred_qualifications', [/우대\s*사항/i,/우대\s*요건/i,/preferred/i]],
  ['team', [/조직\s*소개/i,/팀\s*소개/i,/프로젝트\s*소개/i,/organization/i,/team/i]],
  ['employment_type', [/고용\s*형태/i,/채용\s*구분/i,/employment\s*type/i]],
  ['location', [/근무\s*지/i,/근무\s*지역/i,/location/i]],
  ['application_period', [/모집\s*기간/i,/접수\s*기간/i,/지원\s*기간/i,/application\s*period/i]],
  ['status', [/공고\s*상태/i,/지원\s*상태/i,/status/i]]
];

function splitItems(text='') {
  return normalize(text)
    .split(/\n|(?:^|\s)[•·▪◦*-]\s+/)
    .map(s => s.replace(/^[-•·▪◦*]\s*/, '').trim())
    .filter(s => s.length >= 2 && s.length < 1200);
}

function extractSectionsFromText(raw='') {
  const lines = normalize(raw).split('\n').map(x=>x.trim()).filter(Boolean);
  const sections = { responsibilities: [], required_qualifications: [], preferred_qualifications: [] };
  let current = null;
  for (const line of lines) {
    let matched = null;
    for (const [key, pats] of HEADING_MAP) {
      if (pats.some(p => p.test(line)) && line.length < 80) { matched = key; break; }
    }
    if (matched) { current = matched; continue; }
    if (!current) continue;
    if (['responsibilities','required_qualifications','preferred_qualifications'].includes(current)) {
      if (line.length >= 2) sections[current].push(line);
    } else if (!sections[current]) {
      sections[current] = line;
    }
  }
  for (const k of ['responsibilities','required_qualifications','preferred_qualifications']) {
    sections[k] = [...new Set(sections[k])].slice(0, 30);
  }
  return sections;
}

function parseHtml(html, sourceUrl) {
  const $ = cheerio.load(html || '');
  $('script,style,noscript,svg').remove();
  const bodyText = normalize($('body').text().replace(/\s*\n\s*/g, '\n'));
  let title = normalize($('h1').first().text()) || normalize($('h2').first().text()) || normalize($('title').text());
  if (/NC Careers|공고보기|채용공고/i.test(title)) {
    const candidates = $('h1,h2,h3,strong,.title,[class*=title]').map((_,el)=>normalize($(el).text())).get().filter(t=>t.length>3 && t.length<180 && !/NC Careers|채용공고|공고보기/i.test(t));
    if (candidates.length) title = candidates[0];
  }
  const sections = extractSectionsFromText(bodyText);
  return { title, bodyText, sections, sourceUrl };
}

async function directFetch(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
        'accept-language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });
    const text = await res.text();
    return { status: res.status, finalUrl: res.url, text, contentType: res.headers.get('content-type') || '' };
  } finally { clearTimeout(timer); }
}

function isUseful(parsed) {
  const s = parsed.sections || {};
  return Boolean(parsed.title && parsed.title.length > 3 && parsed.bodyText.length > 300 && (s.responsibilities?.length || s.required_qualifications?.length || s.preferred_qualifications?.length));
}

function mobileCandidates(url, postingId, companyId) {
  if (!postingId) return [];
  const q = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
  return [
    `https://m-careers.ncsoft.com/apply/view/${postingId}${q}`,
    `https://m-careers.ncsoft.com/apply/view/${postingId}`,
    `https://m-careers.ncsoft.com/apply/view/?${companyId ? `companyId=${encodeURIComponent(companyId)}&` : ''}jopenId=${postingId}`,
    `https://careers.ncsoft.com/apply/view/?${companyId ? `companyId=${encodeURIComponent(companyId)}&` : ''}jopenId=${postingId}`
  ];
}

async function browserFetch(candidates, postingId) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-zygote']
  });
  try {
    for (const target of candidates) {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36');
      await page.setExtraHTTPHeaders({'Accept-Language':'ko-KR,ko;q=0.9,en;q=0.8'});
      const networkBodies = [];
      page.on('response', async response => {
        try {
          const ct = (response.headers()['content-type'] || '').toLowerCase();
          const u = response.url();
          if ((ct.includes('json') || ct.includes('text')) && (u.includes(postingId) || u.includes('apply') || u.includes('recruit') || u.includes('job'))) {
            const body = await response.text();
            if (body && body.length < 2_000_000) networkBodies.push({url:u, body});
          }
        } catch {}
      });
      try {
        await page.goto(target, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2500));
        const html = await page.content();
        const finalUrl = page.url();
        const parsed = parseHtml(html, finalUrl);
        if (isUseful(parsed)) return { ...parsed, retrievalMethod: 'puppeteer_dom', networkBodies, finalUrl };
        for (const n of networkBodies) {
          if (!n.body.includes(postingId)) continue;
          if (n.body.trim().startsWith('{') || n.body.trim().startsWith('[')) {
            const text = normalize(n.body);
            const fakeHtml = `<body>${text.replaceAll('<','&lt;')}</body>`;
            const p = parseHtml(fakeHtml, n.url);
            if (p.bodyText.length > parsed.bodyText.length) return { ...p, retrievalMethod: 'puppeteer_network_json', networkBodies, finalUrl };
          }
        }
      } catch {}
      finally { await page.close(); }
    }
    return null;
  } finally { await browser.close(); }
}

function buildResult(parsed, identity, originalUrl, retrievalMethod) {
  const s = parsed?.sections || {};
  const title = normalize(parsed?.title || '');
  const responsibilities = Array.isArray(s.responsibilities) ? s.responsibilities : splitItems(s.responsibilities || '');
  const required = Array.isArray(s.required_qualifications) ? s.required_qualifications : splitItems(s.required_qualifications || '');
  const preferred = Array.isArray(s.preferred_qualifications) ? s.preferred_qualifications : splitItems(s.preferred_qualifications || '');
  const identityMatch = Boolean(identity.postingId) && (!parsed?.finalUrl || parsed.finalUrl.includes(identity.postingId) || parsed.bodyText?.includes(identity.postingId) || retrievalMethod?.includes('network'));
  const verified = Boolean(identityMatch && title && responsibilities.length && required.length && preferred.length);
  return {
    source_url: originalUrl,
    resolved_url: parsed?.sourceUrl || parsed?.finalUrl || null,
    posting_id: identity.postingId,
    company_id: identity.companyId,
    title,
    company: 'NCSOFT',
    team: typeof s.team === 'string' ? s.team : '',
    responsibilities,
    required_qualifications: required,
    preferred_qualifications: preferred,
    employment_type: typeof s.employment_type === 'string' ? s.employment_type : '',
    location: typeof s.location === 'string' ? s.location : '',
    application_period: typeof s.application_period === 'string' ? s.application_period : '',
    status: typeof s.status === 'string' ? s.status : '',
    raw_text: (parsed?.bodyText || '').slice(0, 50000),
    retrieval_method: retrievalMethod,
    verified
  };
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'ncsoft-jd-fetcher' }));

app.post('/fetch', async (req, res) => {
  const input = req.body?.url;
  if (!input || typeof input !== 'string') return res.status(400).json({ error: 'url is required' });
  try {
    const url = await validateUrl(input);
    const identity = parseIdentity(url);
    if (!identity.postingId) return res.status(400).json({ error: 'postingId not found in URL' });

    const attempts = [url.toString(), ...mobileCandidates(url, identity.postingId, identity.companyId)];
    for (const target of [...new Set(attempts)]) {
      try {
        const d = await directFetch(target);
        if (d.status >= 200 && d.status < 400 && d.text) {
          const parsed = parseHtml(d.text, d.finalUrl || target);
          if (isUseful(parsed)) return res.json(buildResult({ ...parsed, finalUrl: d.finalUrl }, identity, input, 'direct_http'));
        }
      } catch {}
    }

    const browserParsed = await browserFetch([...new Set(attempts)], identity.postingId);
    if (browserParsed) return res.json(buildResult(browserParsed, identity, input, browserParsed.retrievalMethod));

    return res.status(502).json({
      source_url: input,
      posting_id: identity.postingId,
      company_id: identity.companyId,
      verified: false,
      error: 'Exact posting content could not be retrieved from allowed NCSOFT routes'
    });
  } catch (err) {
    return res.status(400).json({ error: err?.message || 'request failed', verified: false });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`ncsoft-jd-fetcher listening on ${PORT}`));
