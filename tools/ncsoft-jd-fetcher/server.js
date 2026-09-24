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
    const n = Number(ip.split('.')[1]);
    if (n >= 16 && n <= 31) return true;
  }
  return ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:');
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
  return {
    postingId: m?.[1] || url.searchParams.get('jopenId') || '',
    companyId: url.searchParams.get('companyId') || ''
  };
}

function normalize(s = '') {
  return String(s)
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractBlock(text, startRe, endRe) {
  const start = text.search(startRe);
  if (start < 0) return '';
  const tail = text.slice(start).replace(startRe, '');
  const end = tail.search(endRe);
  return normalize(end >= 0 ? tail.slice(0, end) : tail);
}

function splitBullets(text = '') {
  const cleaned = normalize(text)
    .replace(/^아래 중 하나의 직무 경험 필수\s*/i, '')
    .replace(/^주요 업무\s*/i, '');
  const parts = cleaned
    .split(/(?:^|\n|\s)-\s+(?=[A-Za-z0-9가-힣])/)
    .map(v => normalize(v).replace(/^[-•·▪◦*]\s*/, ''))
    .filter(v => v.length >= 2);
  if (parts.length > 1) return [...new Set(parts)].slice(0, 30);
  return cleaned ? [cleaned] : [];
}

function parseStructuredText(raw) {
  const text = normalize(raw);
  const team = extractBlock(text, /\[\s*팀\/프로젝트 소개\s*\]/i, /\[\s*업무내용\s*\]/i);
  const work = extractBlock(text, /\[\s*업무내용\s*\]/i, /\[\s*지원자격\s*\]/i);
  const qualifications = extractBlock(text, /\[\s*지원자격\s*\]/i, /\[\s*제출서류\s*\]/i);
  const submission = extractBlock(text, /\[\s*제출서류\s*\]/i, /\[\s*전형단계\s*\]/i);
  const selection = extractBlock(text, /\[\s*전형단계\s*\]/i, /\[\s*도움말\s*\]/i);

  let responsibilityText = work;
  const mainMatch = work.match(/주요\s*업무\s*([\s\S]*)/i);
  if (mainMatch) responsibilityText = mainMatch[1];

  const requiredMarker = /이런 역량을 갖추신 분을 찾고 있습니다\s*\(필수\)/i;
  const preferredMarker = /이런 역량도 있다면 더욱 도움이 됩니다\s*\(우대\)/i;
  let requiredText = qualifications;
  let preferredText = '';
  const reqMatch = qualifications.match(requiredMarker);
  if (reqMatch) requiredText = qualifications.slice(reqMatch.index + reqMatch[0].length);
  const prefMatch = requiredText.match(preferredMarker);
  if (prefMatch) {
    preferredText = requiredText.slice(prefMatch.index + prefMatch[0].length);
    requiredText = requiredText.slice(0, prefMatch.index);
  } else {
    const p2 = qualifications.match(preferredMarker);
    if (p2) preferredText = qualifications.slice(p2.index + p2[0].length);
  }

  const education = qualifications.match(/학력\s*:\s*([^\n]+)/i)?.[1]?.trim() || '';
  const experienceRequirement = qualifications.match(/경력\s*:\s*\n?\s*(\d+년)\s*~?/i)?.[1] || '';
  const applicationPeriod = text.match(/\d{4}\.\d{2}\.\d{2}\s*~\s*\d{4}\.\d{2}\.\d{2}/)?.[0] || '';
  const status = text.match(/(?:^|\n)(D-\d+|마감|상시)(?:\n|$)/)?.[1] || '';
  const careerType = text.match(/(?:^|\n)(경력|신입|인턴|단기)(?:\n|$)/)?.[1] || '';

  const selectionProcess = [...selection.matchAll(/STEP\s*\d+\s*\n?\s*([^\n]+)/gi)].map(m => normalize(m[1]));

  return {
    team,
    responsibilities: splitBullets(responsibilityText),
    required_qualifications: splitBullets(requiredText),
    preferred_qualifications: splitBullets(preferredText),
    education,
    experience_requirement: experienceRequirement,
    career_type: careerType,
    application_period: applicationPeriod,
    status,
    submission_materials: splitBullets(submission),
    selection_process: selectionProcess
  };
}

function parseHtml(html, sourceUrl) {
  const $ = cheerio.load(html || '');
  $('script,style,noscript,svg').remove();
  $('br').replaceWith('\n');
  $('li,p,h1,h2,h3,h4,section,article').each((_, el) => $(el).append('\n'));
  const bodyText = normalize($('body').text());
  let title = normalize($('h1').first().text()) || normalize($('h2').first().text()) || normalize($('title').text());
  if (!title || /NC Careers|공고보기|채용공고/i.test(title)) {
    const candidates = $('h1,h2,h3,strong,.title,[class*=title]')
      .map((_, el) => normalize($(el).text()))
      .get()
      .filter(t => t.length > 3 && t.length < 180 && !/NC Careers|채용공고|공고보기/i.test(t));
    if (candidates.length) title = candidates[0];
  }
  return { title, bodyText, structured: parseStructuredText(bodyText), sourceUrl };
}

function isUseful(parsed) {
  const s = parsed?.structured || {};
  return Boolean(
    parsed?.title &&
    parsed.bodyText?.includes('[ 업무내용 ]') &&
    parsed.bodyText?.includes('[ 지원자격 ]') &&
    s.responsibilities?.length &&
    s.required_qualifications?.length
  );
}

async function directFetch(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
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
    return { status: res.status, finalUrl: res.url, text: await res.text() };
  } finally {
    clearTimeout(timer);
  }
}

function candidatesFor(url, postingId, companyId) {
  const q = companyId ? `?companyId=${encodeURIComponent(companyId)}` : '';
  const jq = `${companyId ? `companyId=${encodeURIComponent(companyId)}&` : ''}jopenId=${encodeURIComponent(postingId)}`;
  return [...new Set([
    url.toString(),
    `https://m-careers.ncsoft.com/apply/view/${postingId}${q}`,
    `https://m-careers.ncsoft.com/apply/view/${postingId}`,
    `https://m-careers.ncsoft.com/apply/view/?${jq}`,
    `https://m-careers.ncsoft.com/apply/view?${jq}`,
    `https://careers.ncsoft.com/apply/view/?${jq}`,
    `https://careers.ncsoft.com/apply/view?${jq}`
  ])];
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
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8' });
      const networkBodies = [];
      page.on('response', async response => {
        try {
          const ct = (response.headers()['content-type'] || '').toLowerCase();
          const u = response.url();
          if ((ct.includes('json') || ct.includes('text')) && (u.includes(postingId) || u.includes('apply') || u.includes('recruit') || u.includes('job'))) {
            const body = await response.text();
            if (body && body.length < 2_000_000) networkBodies.push({ url: u, body });
          }
        } catch {}
      });
      try {
        await page.goto(target, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2500));
        const parsed = parseHtml(await page.content(), page.url());
        if (isUseful(parsed)) return { ...parsed, finalUrl: page.url(), retrievalMethod: 'puppeteer_dom' };
        for (const n of networkBodies) {
          if (!n.body.includes(postingId)) continue;
          const p = parseHtml(`<body>${n.body.replaceAll('<','&lt;')}</body>`, n.url);
          if (isUseful(p)) return { ...p, finalUrl: page.url(), retrievalMethod: 'puppeteer_network' };
        }
      } catch {}
      finally { await page.close(); }
    }
    return null;
  } finally {
    await browser.close();
  }
}

function buildResult(parsed, identity, originalUrl, retrievalMethod) {
  const s = parsed.structured || {};
  const identityMatch = Boolean(
    identity.postingId &&
    ((parsed.finalUrl || parsed.sourceUrl || '').includes(identity.postingId) || parsed.bodyText.includes(identity.postingId))
  );
  const verified = Boolean(
    identityMatch &&
    parsed.title &&
    s.responsibilities?.length &&
    s.required_qualifications?.length &&
    s.preferred_qualifications?.length
  );

  return {
    source_url: originalUrl,
    resolved_url: parsed.sourceUrl || parsed.finalUrl || null,
    posting_id: identity.postingId,
    company_id: identity.companyId,
    title: parsed.title,
    company: 'NCSOFT',
    team: s.team || '',
    responsibilities: s.responsibilities || [],
    required_qualifications: s.required_qualifications || [],
    preferred_qualifications: s.preferred_qualifications || [],
    education: s.education || '',
    experience_requirement: s.experience_requirement || '',
    career_type: s.career_type || '',
    employment_type: '',
    location: '',
    application_period: s.application_period || '',
    status: s.status || '',
    submission_materials: s.submission_materials || [],
    selection_process: s.selection_process || [],
    raw_text: parsed.bodyText.slice(0, 50000),
    retrieval_method: retrievalMethod,
    verified
  };
}

async function fetchJob(input) {
  const url = await validateUrl(input);
  const identity = parseIdentity(url);
  if (!identity.postingId) throw new Error('postingId not found in URL');
  const candidates = candidatesFor(url, identity.postingId, identity.companyId);

  for (const target of candidates) {
    try {
      const d = await directFetch(target);
      if (d.status >= 200 && d.status < 400 && d.text) {
        const parsed = parseHtml(d.text, d.finalUrl || target);
        if (isUseful(parsed)) {
          return buildResult({ ...parsed, finalUrl: d.finalUrl }, identity, input, 'direct_http');
        }
      }
    } catch {}
  }

  const browserParsed = await browserFetch(candidates, identity.postingId);
  if (browserParsed) return buildResult(browserParsed, identity, input, browserParsed.retrievalMethod);

  return {
    source_url: input,
    posting_id: identity.postingId,
    company_id: identity.companyId,
    verified: false,
    error: 'Exact posting content could not be retrieved from allowed NCSOFT routes'
  };
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'ncsoft-jd-fetcher' }));

app.post('/fetch', async (req, res) => {
  const input = req.body?.url;
  if (!input || typeof input !== 'string') return res.status(400).json({ error: 'url is required', verified: false });
  try {
    const result = await fetchJob(input);
    return res.status(result.error ? 502 : 200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err?.message || 'request failed', verified: false });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`ncsoft-jd-fetcher listening on ${PORT}`));
