import * as cheerio from 'cheerio';
import * as iconv from 'iconv-lite';
import { LRUCache } from 'lru-cache';
import pLimit from 'p-limit';
import { getDomain } from 'tldts';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export type EvidenceClass =
  | 'verified-original'
  | 'verified-direct'
  | 'verified-structured'
  | 'verified-linked'
  | 'supported-index'
  | 'supported-mirror'
  | 'unverified';

export type ResultLevel =
  | 'verified_full'
  | 'verified_partial'
  | 'verified_closed'
  | 'access_limited'
  | 'unrecovered';

export interface IdentityRecord {
  platform: string;
  primaryIdentity: string | null;
  secondaryIdentity: Record<string, string>;
  fingerprint: string;
  status: 'locked' | 'partial' | 'unknown';
}

export interface JDRecord {
  platform: string;
  input_url: string;
  canonical_url: string;
  posting_id: string | null;
  original_employer_url: string | null;
  company: string | null;
  affiliate_business_unit: string | null;
  team_organization: string | null;
  title: string | null;
  responsibilities: string | null;
  required_qualifications: string | null;
  preferred_qualifications: string | null;
  tools_systems_methods: string | null;
  experience_seniority: string | null;
  education: string | null;
  employment_type: string | null;
  location: string | null;
  remote_hybrid: string | null;
  compensation: string | null;
  application_period_deadline: string | null;
  posting_status: string | null;
  submission_materials: string | null;
  selection_process: string | null;
  posting_notes: string | null;
  result_level: ResultLevel;
  identity_status: IdentityRecord['status'];
  identity_fingerprint: string;
  evidence: Array<{ class: EvidenceClass; route: string; url: string; fields: string[] }>;
  route_attempts: Array<{ route: string; ok: boolean; status?: number; note?: string }>;
  safety_flags: string[];
  retrieved_at: string;
}

const VERSION = '1.0.0';
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES ?? 3_000_000);
const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS ?? 15_000);
const HOST_DELAY_MS = Number(process.env.HOST_DELAY_MS ?? 650);
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS ?? 10 * 60_000);
const ENABLE_BROWSER = String(process.env.ENABLE_BROWSER ?? 'true').toLowerCase() !== 'false';

const cache = new LRUCache<string, JDRecord>({ max: 300, ttl: CACHE_TTL_MS });
const hostLimiters = new Map<string, ReturnType<typeof pLimit>>();
const hostLastAt = new Map<string, number>();
const dnsSafetyCache = new Map<string, { safe: boolean; expires: number }>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const clean = (value: string | null | undefined) => {
  const v = value?.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return v || null;
};

function stripHtml(value: unknown): string | null {
  if (value == null) return null;
  if (Array.isArray(value)) return clean(value.map((v) => stripHtml(v)).filter(Boolean).join(' / '));
  if (typeof value === 'object') return clean(JSON.stringify(value));
  const s = String(value);
  if (!/[<>]/.test(s)) return clean(s);
  const $ = cheerio.load(`<body>${s}</body>`);
  return clean($('body').text());
}

function normalizeCacheUrl(raw: string): string {
  const u = new URL(raw);
  const drop: string[] = [];
  for (const key of u.searchParams.keys()) {
    if (/^utm_/i.test(key) || ['gclid', 'fbclid', 'mc_cid', 'mc_eid'].includes(key.toLowerCase())) drop.push(key);
  }
  for (const key of drop) u.searchParams.delete(key);
  u.hash = '';
  return u.toString();
}

function hostMatches(host: string, suffix: string) {
  return host === suffix || host.endsWith(`.${suffix}`);
}

export function detectIdentity(rawUrl: string): IdentityRecord {
  const u = new URL(rawUrl);
  const host = u.hostname.toLowerCase();
  const path = u.pathname;
  let platform = 'generic';
  let primary: string | null = null;
  const secondary: Record<string, string> = {};

  if (hostMatches(host, 'career.greetinghr.com')) {
    platform = 'greetinghr';
    primary = path.match(/\/o\/([^/?#]+)/)?.[1] ?? null;
    secondary.tenant = host.split('.')[0] ?? host;
  } else if (hostMatches(host, 'careers.ncsoft.com') || hostMatches(host, 'm-careers.ncsoft.com')) {
    platform = 'ncsoft';
    primary = path.match(/\/apply\/view\/([^/?#]+)/)?.[1] ?? null;
    const companyId = u.searchParams.get('companyId');
    if (companyId) secondary.companyId = companyId;
  } else if (hostMatches(host, 'career.kia.com') && /\/apply\/applyView\.kc$/i.test(path)) {
    platform = 'kia';
    const recuYy = u.searchParams.get('recuYy');
    const recuType = u.searchParams.get('recuType');
    const recuCls = u.searchParams.get('recuCls');
    if (recuYy) secondary.recuYy = recuYy;
    if (recuType) secondary.recuType = recuType;
    if (recuCls) secondary.recuCls = recuCls;
    primary = recuYy && recuType && recuCls ? `${recuYy}:${recuType}:${recuCls}` : recuCls;
  } else if (hostMatches(host, 'jobkorea.co.kr')) {
    platform = 'jobkorea';
    primary = path.match(/\/Recruit\/GI_Read\/(\d+)/i)?.[1] ?? null;
  } else if (hostMatches(host, 'saramin.co.kr') && !hostMatches(host, 'jumpit.saramin.co.kr')) {
    platform = 'saramin';
    primary = u.searchParams.get('rec_idx');
  } else if (hostMatches(host, 'wanted.co.kr')) {
    platform = 'wanted';
    primary = path.match(/\/wd\/(\d+)/i)?.[1] ?? null;
  } else if (hostMatches(host, 'linkedin.com')) {
    platform = 'linkedin';
    primary = path.match(/\/jobs\/view\/(?:.*?-)?(\d+)(?:\/|$)/i)?.[1] ?? null;
  } else if (hostMatches(host, 'career.rememberapp.co.kr')) {
    platform = 'remember';
    primary = path.match(/\/job\/posting\/(\d+)/i)?.[1] ?? null;
  } else if (hostMatches(host, 'jumpit.saramin.co.kr')) {
    platform = 'jumpit';
    primary = path.match(/\/position\/(\d+)/i)?.[1] ?? null;
  } else if (hostMatches(host, 'job.incruit.com')) {
    platform = 'incruit';
    primary = u.searchParams.get('job');
  } else if (hostMatches(host, 'catch.co.kr')) {
    platform = 'catch';
    primary = path.match(/\/NCS\/RecruitInfoDetails\/(\d+)/i)?.[1] ?? null;
  } else if (hostMatches(host, 'work24.go.kr')) {
    platform = 'work24';
    primary = u.searchParams.get('wantedAuthNo');
    for (const key of ['infoTypeCd', 'infoTypeGroup']) {
      const v = u.searchParams.get(key);
      if (v) secondary[key] = v;
    }
  } else if (hostMatches(host, 'careers.team') || hostMatches(host, 'flex.team')) {
    platform = 'flex-recruiting';
    primary = path.split('/').filter(Boolean).at(-1) ?? null;
  }

  const secondaryPart = Object.entries(secondary)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  const root = getDomain(host) ?? host;
  const fingerprint = primary
    ? `${platform}|${root}|${primary}|${secondaryPart}`
    : `${platform}|${root}|url:${normalizeCacheUrl(rawUrl)}`;

  return {
    platform,
    primaryIdentity: primary,
    secondaryIdentity: secondary,
    fingerprint,
    status: primary ? 'locked' : 'partial',
  };
}

function parseV4(ip: string): number[] | null {
  const p = ip.split('.').map(Number);
  return p.length === 4 && p.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) ? p : null;
}

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const p = parseV4(ip)!;
    const [a, b] = p;
    if (a === 0 || a === 10 || a === 127 || a >= 224) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 192 && b === 0) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    return false;
  }
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb') || v.startsWith('ff') || v.startsWith('2001:db8:')) return true;
    if (v.startsWith('::ffff:')) return isPrivateIp(v.slice('::ffff:'.length));
  }
  return false;
}

async function assertPublicUrl(raw: string): Promise<URL> {
  const u = new URL(raw);
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Only public http(s) URLs are allowed');
  if (u.username || u.password) throw new Error('Credential-bearing URLs are not allowed');
  if (u.port && !['80', '443'].includes(u.port)) throw new Error('Non-standard ports are not allowed');
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || ['localhost', 'localhost.localdomain'].includes(host) || /\.(local|internal|lan|home)$/.test(host)) throw new Error('Local/private hosts are not allowed');
  if (isIP(host) && isPrivateIp(host)) throw new Error('Private IP targets are not allowed');

  const cached = dnsSafetyCache.get(host);
  if (cached && cached.expires > Date.now()) {
    if (!cached.safe) throw new Error('Host resolves to a private/reserved IP');
    return u;
  }
  if (!isIP(host)) {
    const records = await lookup(host, { all: true, verbatim: true });
    const safe = records.length > 0 && records.every((r) => !isPrivateIp(r.address));
    dnsSafetyCache.set(host, { safe, expires: Date.now() + 5 * 60_000 });
    if (!safe) throw new Error('Host resolves to a private/reserved IP');
  }
  return u;
}

function sameSite(a: URL, b: URL) {
  const da = getDomain(a.hostname) ?? a.hostname;
  const db = getDomain(b.hostname) ?? b.hostname;
  return da === db;
}

function limiterFor(host: string) {
  let limiter = hostLimiters.get(host);
  if (!limiter) {
    limiter = pLimit(1);
    hostLimiters.set(host, limiter);
  }
  return limiter;
}

async function rateLimited<T>(host: string, fn: () => Promise<T>): Promise<T> {
  return limiterFor(host)(async () => {
    const last = hostLastAt.get(host) ?? 0;
    const wait = Math.max(0, HOST_DELAY_MS - (Date.now() - last));
    if (wait) await sleep(wait);
    try {
      return await fn();
    } finally {
      hostLastAt.set(host, Date.now());
    }
  });
}

async function readLimited(response: Response): Promise<Uint8Array> {
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) throw new Error('Response body exceeds configured size limit');
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error('Response body exceeds configured size limit');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

function decodeHtml(bytes: Uint8Array, contentType: string | null): string {
  const headAscii = Buffer.from(bytes.slice(0, Math.min(bytes.length, 4096))).toString('latin1');
  let charset = contentType?.match(/charset\s*=\s*([^;\s]+)/i)?.[1]?.replace(/["']/g, '')
    ?? headAscii.match(/charset\s*=\s*["']?([^"'\s/>;]+)/i)?.[1]
    ?? 'utf-8';
  charset = charset.toLowerCase();
  if (['ks_c_5601-1987', 'euc-kr', 'x-windows-949'].includes(charset)) charset = 'cp949';
  if (!iconv.encodingExists(charset)) charset = 'utf-8';
  return iconv.decode(Buffer.from(bytes), charset);
}

function retryDelay(response: Response, attempt: number) {
  const retry = response.headers.get('retry-after');
  if (retry) {
    const seconds = Number(retry);
    if (Number.isFinite(seconds)) return Math.min(5000, Math.max(500, seconds * 1000));
    const at = Date.parse(retry);
    if (!Number.isNaN(at)) return Math.min(5000, Math.max(500, at - Date.now()));
  }
  return 700 * (attempt + 1);
}

interface PageFetch {
  html: string;
  finalUrl: string;
  status: number;
  redirects: string[];
}

async function fetchHtml(rawUrl: string): Promise<PageFetch> {
  let current = await assertPublicUrl(rawUrl);
  const origin = current;
  const redirects: string[] = [];

  for (let hop = 0; hop < 5; hop++) {
    let response: Response | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      response = await rateLimited(current.hostname, () => fetch(current, {
        redirect: 'manual',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: {
          'user-agent': 'Portfolio-Writer-JDRetriever/1.0 (+public-job-retrieval)',
          'accept': 'text/html,application/xhtml+xml,application/json;q=0.8,*/*;q=0.5',
          'accept-language': 'ko-KR,ko;q=0.9,en;q=0.7',
        },
      }));
      if ((response.status === 429 || response.status >= 500) && attempt === 0) {
        await sleep(retryDelay(response, attempt));
        continue;
      }
      break;
    }
    if (!response) throw new Error('No HTTP response');

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error(`Redirect ${response.status} without Location`);
      const next = await assertPublicUrl(new URL(location, current).toString());
      if (!sameSite(origin, next)) throw new Error(`Cross-site redirect blocked: ${next.hostname}`);
      redirects.push(next.toString());
      current = next;
      continue;
    }

    const bytes = await readLimited(response);
    const html = decodeHtml(bytes, response.headers.get('content-type'));
    return { html, finalUrl: current.toString(), status: response.status, redirects };
  }
  throw new Error('Too many redirects');
}

function jsonLdNodes(value: unknown, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    for (const item of value) jsonLdNodes(item, out);
    return out;
  }
  if (!value || typeof value !== 'object') return out;
  const obj = value as Record<string, unknown>;
  const t = obj['@type'];
  if ((typeof t === 'string' && t.toLowerCase() === 'jobposting') || (Array.isArray(t) && t.some((x) => String(x).toLowerCase() === 'jobposting'))) out.push(obj);
  for (const child of Object.values(obj)) {
    if (child && typeof child === 'object') jsonLdNodes(child, out);
  }
  return out;
}

function pageLines($: cheerio.CheerioAPI): string[] {
  const clone = cheerio.load($.html());
  clone('script,style,noscript,svg,canvas,template').remove();
  clone('br').replaceWith('\n');
  clone('p,li,h1,h2,h3,h4,h5,h6,section,article,dt,dd,tr').each((_, el) => { clone(el).append('\n'); });
  const text = clone.root().text().replace(/\r/g, '');
  return text.split(/\n+/).map((s) => s.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).slice(0, 6000);
}

const sectionMatchers: Array<{ key: string; re: RegExp }> = [
  { key: 'responsibilities', re: /^(주요\s*업무|담당\s*업무|업무\s*내용|직무\s*내용|role|responsibilit|what\s+you.*do|you\s+will)/i },
  { key: 'required', re: /^(자격\s*요건|지원\s*자격|필수\s*요건|requirements?|qualifications?|what\s+you.*need|must\s+have)/i },
  { key: 'preferred', re: /^(우대\s*사항|preferred|nice\s+to\s+have|plus)/i },
  { key: 'tools', re: /^(기술\s*스택|tech\s*stack|tools?|skills?)/i },
  { key: 'location', re: /^(근무\s*지|근무\s*장소|location)/i },
  { key: 'process', re: /^(채용\s*절차|전형\s*절차|hiring\s*process|process)/i },
  { key: 'submission', re: /^(제출\s*서류|지원\s*서류|required\s*documents?|submission)/i },
];

function extractSections(lines: string[]) {
  const out: Record<string, string> = {};
  let current: string | null = null;
  const buckets = new Map<string, string[]>();
  for (const line of lines) {
    const normalized = line.replace(/^[•·\-–—▶▷▪■□\s]+/, '').replace(/[:：]$/, '').trim();
    const matched = normalized.length <= 80 ? sectionMatchers.find((m) => m.re.test(normalized)) : undefined;
    if (matched) {
      current = matched.key;
      if (!buckets.has(current)) buckets.set(current, []);
      continue;
    }
    if (current) {
      const bucket = buckets.get(current)!;
      if (bucket.length < 80) bucket.push(line);
    }
  }
  for (const [key, values] of buckets) {
    const unique = [...new Set(values.map((v) => v.trim()).filter(Boolean))];
    const value = clean(unique.join(' • '));
    if (value) out[key] = value.slice(0, 12000);
  }
  return out;
}

function addressText(value: unknown): string | null {
  if (!value) return null;
  const items = Array.isArray(value) ? value : [value];
  const result: string[] = [];
  for (const item of items) {
    const obj = item as Record<string, unknown>;
    const addr = (obj?.address ?? obj) as Record<string, unknown>;
    if (typeof addr === 'string') result.push(addr);
    else if (addr && typeof addr === 'object') {
      const parts = ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry']
        .map((k) => stripHtml(addr[k]))
        .filter(Boolean) as string[];
      if (parts.length) result.push(parts.join(', '));
    }
  }
  return clean(result.join(' / '));
}

function salaryText(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string' || typeof value === 'number') return clean(String(value));
  try {
    const obj = value as Record<string, unknown>;
    const currency = stripHtml(obj.currency);
    const val = obj.value as Record<string, unknown> | undefined;
    const min = val ? stripHtml(val.minValue) : null;
    const max = val ? stripHtml(val.maxValue) : null;
    const unit = val ? stripHtml(val.unitText) : null;
    return clean([currency, min && max ? `${min}-${max}` : (min ?? max), unit].filter(Boolean).join(' '));
  } catch {
    return null;
  }
}

function possibleInjection(text: string): string[] {
  const flags: string[] = [];
  const patterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /system\s+prompt/i,
    /reveal\s+(the\s+)?(prompt|secret|token|credential)/i,
    /이전\s*(지시|명령).*무시/,
    /(시스템|개발자)\s*(프롬프트|지시).*공개/,
  ];
  if (patterns.some((p) => p.test(text))) flags.push('possible_prompt_injection_text');
  return flags;
}

interface ParsedPage {
  canonicalUrl: string;
  title: string | null;
  company: string | null;
  responsibilities: string | null;
  required: string | null;
  preferred: string | null;
  tools: string | null;
  experience: string | null;
  education: string | null;
  employmentType: string | null;
  location: string | null;
  remoteHybrid: string | null;
  compensation: string | null;
  deadline: string | null;
  postingStatus: string | null;
  submission: string | null;
  process: string | null;
  notes: string | null;
  structuredFields: string[];
  directFields: string[];
  textLength: number;
  safetyFlags: string[];
}

function parseHtml(html: string, pageUrl: string): ParsedPage {
  const $ = cheerio.load(html);
  const lines = pageLines($);
  const bodyText = lines.join('\n').slice(0, 500_000);
  const sections = extractSections(lines);
  const jobs: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text().trim();
    if (!raw || raw.length > 1_500_000) return;
    try { jsonLdNodes(JSON.parse(raw), jobs); } catch { /* malformed third-party data */ }
  });
  const job = jobs[0] ?? {};

  const canonicalHref = $('link[rel="canonical"]').attr('href');
  let canonicalUrl = pageUrl;
  if (canonicalHref) {
    try {
      const candidate = new URL(canonicalHref, pageUrl);
      const current = new URL(pageUrl);
      const a = detectIdentity(current.toString());
      const b = detectIdentity(candidate.toString());
      if (sameSite(current, candidate) && (!a.primaryIdentity || !b.primaryIdentity || a.fingerprint === b.fingerprint)) canonicalUrl = candidate.toString();
    } catch { /* keep page URL */ }
  }

  const org = job.hiringOrganization as Record<string, unknown> | undefined;
  const structuredDescription = stripHtml(job.description);
  const descriptionSections = structuredDescription ? extractSections(structuredDescription.split(/\n+/).map((s) => s.trim()).filter(Boolean)) : {};
  const title = stripHtml(job.title) ?? clean($('h1').first().text()) ?? clean($('meta[property="og:title"]').attr('content')) ?? clean($('title').text());
  const company = stripHtml(org?.name) ?? clean($('[itemprop="hiringOrganization"], .company-name, .companyName').first().text());
  const responsibilities = stripHtml(job.responsibilities) ?? sections.responsibilities ?? descriptionSections.responsibilities ?? null;
  const required = stripHtml(job.qualifications) ?? sections.required ?? descriptionSections.required ?? null;
  const preferred = sections.preferred ?? descriptionSections.preferred ?? null;
  const tools = stripHtml(job.skills) ?? sections.tools ?? descriptionSections.tools ?? null;
  const experience = stripHtml(job.experienceRequirements);
  const education = stripHtml(job.educationRequirements);
  const employmentType = stripHtml(job.employmentType);
  const location = addressText(job.jobLocation) ?? sections.location ?? null;
  const remoteHybrid = stripHtml(job.jobLocationType) ?? (bodyText.match(/(원격\s*근무|재택\s*근무|하이브리드|remote|hybrid)/i)?.[1] ?? null);
  const compensation = salaryText(job.baseSalary);
  const validThrough = stripHtml(job.validThrough);
  const datePosted = stripHtml(job.datePosted);

  let postingStatus: string | null = null;
  if (/(채용\s*마감|공고\s*마감|모집\s*마감|채용이\s*종료|no longer accepting|job closed|position closed|expired)/i.test(bodyText)) postingStatus = 'closed';
  if (!postingStatus && validThrough) {
    const t = Date.parse(validThrough);
    if (!Number.isNaN(t)) postingStatus = t < Date.now() ? 'expired' : 'open';
  }

  const directFields: string[] = [];
  for (const [k, v] of Object.entries({ title, company, responsibilities, required, preferred, tools, experience, education, employmentType, location, remoteHybrid, compensation, validThrough })) if (v) directFields.push(k);
  const structuredFields: string[] = [];
  if (jobs.length) {
    for (const [k, v] of Object.entries({ title: job.title, company: org?.name, responsibilities: job.responsibilities, required: job.qualifications, tools: job.skills, experience: job.experienceRequirements, education: job.educationRequirements, employmentType: job.employmentType, location: job.jobLocation, compensation: job.baseSalary, validThrough: job.validThrough })) if (v) structuredFields.push(k);
  }

  return {
    canonicalUrl,
    title,
    company,
    responsibilities,
    required,
    preferred,
    tools,
    experience,
    education,
    employmentType,
    location,
    remoteHybrid: clean(remoteHybrid),
    compensation,
    deadline: validThrough,
    postingStatus,
    submission: sections.submission ?? descriptionSections.submission ?? null,
    process: sections.process ?? descriptionSections.process ?? null,
    notes: datePosted ? `datePosted: ${datePosted}` : null,
    structuredFields,
    directFields,
    textLength: bodyText.length,
    safetyFlags: possibleInjection(bodyText),
  };
}

function hasUsefulBody(p: ParsedPage | null) {
  if (!p) return false;
  const substantive = [p.responsibilities, p.required, p.preferred].filter((x) => x && x.length >= 20).length;
  return Boolean(p.title && (substantive >= 1 || p.textLength > 2500));
}

async function renderHtml(rawUrl: string): Promise<PageFetch> {
  if (!ENABLE_BROWSER) throw new Error('Browser rendering disabled');
  const target = await assertPublicUrl(rawUrl);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const context = await browser.newContext({
      userAgent: 'Portfolio-Writer-JDRetriever/1.0 (+public-job-retrieval)',
      locale: 'ko-KR',
      javaScriptEnabled: true,
      acceptDownloads: false,
    });
    const page = await context.newPage();
    page.on('dialog', (d) => void d.dismiss());
    await page.route('**/*', async (route) => {
      const req = route.request();
      const resourceType = req.resourceType();
      if (['image', 'media', 'font'].includes(resourceType)) return route.abort();
      const url = req.url();
      if (/^(data:|blob:|about:)/i.test(url)) return route.continue();
      try {
        const candidate = await assertPublicUrl(url);
        if (!sameSite(target, candidate)) return route.abort();
        return route.continue();
      } catch {
        return route.abort();
      }
    });
    const response = await page.goto(target.toString(), { waitUntil: 'domcontentloaded', timeout: FETCH_TIMEOUT_MS });
    await page.waitForTimeout(1200);
    const final = new URL(page.url());
    if (!sameSite(target, final)) throw new Error(`Rendered cross-site redirect blocked: ${final.hostname}`);
    const html = await page.content();
    if (Buffer.byteLength(html, 'utf8') > MAX_BODY_BYTES) throw new Error('Rendered page exceeds configured size limit');
    return { html, finalUrl: final.toString(), status: response?.status() ?? 200, redirects: [] };
  } finally {
    await browser.close();
  }
}

function mergeParsed(a: ParsedPage | null, b: ParsedPage | null): ParsedPage | null {
  if (!a) return b;
  if (!b) return a;
  const pick = <K extends keyof ParsedPage>(key: K): ParsedPage[K] => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'string' && typeof bv === 'string') return (bv.length > av.length ? bv : av) as ParsedPage[K];
    return (av ?? bv) as ParsedPage[K];
  };
  return {
    canonicalUrl: b.canonicalUrl || a.canonicalUrl,
    title: pick('title'),
    company: pick('company'),
    responsibilities: pick('responsibilities'),
    required: pick('required'),
    preferred: pick('preferred'),
    tools: pick('tools'),
    experience: pick('experience'),
    education: pick('education'),
    employmentType: pick('employmentType'),
    location: pick('location'),
    remoteHybrid: pick('remoteHybrid'),
    compensation: pick('compensation'),
    deadline: pick('deadline'),
    postingStatus: pick('postingStatus'),
    submission: pick('submission'),
    process: pick('process'),
    notes: pick('notes'),
    structuredFields: [...new Set([...a.structuredFields, ...b.structuredFields])],
    directFields: [...new Set([...a.directFields, ...b.directFields])],
    textLength: Math.max(a.textLength, b.textLength),
    safetyFlags: [...new Set([...a.safetyFlags, ...b.safetyFlags])],
  };
}

export async function retrieveJD(input: { url: string; render?: boolean }): Promise<JDRecord> {
  const inputUrl = (await assertPublicUrl(input.url)).toString();
  const inputIdentity = detectIdentity(inputUrl);
  const cacheKey = `${normalizeCacheUrl(inputUrl)}|render=${input.render ?? 'auto'}`;
  const cached = cache.get(cacheKey);
  if (cached) return { ...cached, route_attempts: [...cached.route_attempts, { route: 'cache', ok: true }] };

  const attempts: JDRecord['route_attempts'] = [];
  const evidence: JDRecord['evidence'] = [];
  let direct: ParsedPage | null = null;
  let rendered: ParsedPage | null = null;
  let directStatus: number | undefined;
  let finalUrl = inputUrl;

  try {
    const fetched = await fetchHtml(inputUrl);
    directStatus = fetched.status;
    finalUrl = fetched.finalUrl;
    attempts.push({ route: 'direct', ok: fetched.status >= 200 && fetched.status < 400, status: fetched.status });
    if (fetched.status >= 200 && fetched.status < 400 && fetched.html) {
      direct = parseHtml(fetched.html, fetched.finalUrl);
      if (direct.directFields.length) evidence.push({ class: 'verified-direct', route: 'direct', url: fetched.finalUrl, fields: direct.directFields });
      if (direct.structuredFields.length) evidence.push({ class: 'verified-structured', route: 'json-ld', url: fetched.finalUrl, fields: direct.structuredFields });
    }
  } catch (error) {
    attempts.push({ route: 'direct', ok: false, note: error instanceof Error ? error.message : String(error) });
  }

  const shouldRender = input.render === true || (input.render !== false && !hasUsefulBody(direct));
  if (shouldRender && ENABLE_BROWSER) {
    try {
      const fetched = await renderHtml(finalUrl);
      attempts.push({ route: 'rendered-browser', ok: fetched.status >= 200 && fetched.status < 400, status: fetched.status });
      if (fetched.status >= 200 && fetched.status < 400 && fetched.html) {
        rendered = parseHtml(fetched.html, fetched.finalUrl);
        if (rendered.directFields.length) evidence.push({ class: 'verified-direct', route: 'rendered-browser', url: fetched.finalUrl, fields: rendered.directFields });
        if (rendered.structuredFields.length) evidence.push({ class: 'verified-structured', route: 'rendered-json-ld', url: fetched.finalUrl, fields: rendered.structuredFields });
      }
    } catch (error) {
      attempts.push({ route: 'rendered-browser', ok: false, note: error instanceof Error ? error.message : String(error) });
    }
  }

  const parsed = mergeParsed(direct, rendered);
  const canonical = parsed?.canonicalUrl || finalUrl;
  const finalIdentity = detectIdentity(canonical);
  const identity = finalIdentity.primaryIdentity ? finalIdentity : inputIdentity;
  const identityConsistent = !inputIdentity.primaryIdentity || !finalIdentity.primaryIdentity || inputIdentity.fingerprint === finalIdentity.fingerprint;

  if (!identityConsistent) attempts.push({ route: 'identity-check', ok: false, note: 'Canonical/final identity differs from input posting identity' });
  else attempts.push({ route: 'identity-check', ok: true });

  const hasBody = Boolean(parsed && [parsed.responsibilities, parsed.required, parsed.preferred].some((v) => v && v.length >= 20));
  const closed = parsed?.postingStatus === 'closed' || parsed?.postingStatus === 'expired';
  let level: ResultLevel;
  if (!identityConsistent) level = 'unrecovered';
  else if (closed && (parsed?.title || identity.primaryIdentity)) level = 'verified_closed';
  else if (parsed?.title && hasBody && identity.status === 'locked') level = 'verified_full';
  else if (parsed?.title && (hasBody || parsed.textLength > 800)) level = 'verified_partial';
  else if ([401, 403, 429].includes(directStatus ?? 0) || attempts.some((a) => /blocked|access|timeout/i.test(a.note ?? ''))) level = 'access_limited';
  else level = 'unrecovered';

  const result: JDRecord = {
    platform: identity.platform,
    input_url: inputUrl,
    canonical_url: canonical,
    posting_id: identity.primaryIdentity,
    original_employer_url: null,
    company: parsed?.company ?? null,
    affiliate_business_unit: null,
    team_organization: null,
    title: identityConsistent ? parsed?.title ?? null : null,
    responsibilities: identityConsistent ? parsed?.responsibilities ?? null : null,
    required_qualifications: identityConsistent ? parsed?.required ?? null : null,
    preferred_qualifications: identityConsistent ? parsed?.preferred ?? null : null,
    tools_systems_methods: identityConsistent ? parsed?.tools ?? null : null,
    experience_seniority: identityConsistent ? parsed?.experience ?? null : null,
    education: identityConsistent ? parsed?.education ?? null : null,
    employment_type: identityConsistent ? parsed?.employmentType ?? null : null,
    location: identityConsistent ? parsed?.location ?? null : null,
    remote_hybrid: identityConsistent ? parsed?.remoteHybrid ?? null : null,
    compensation: identityConsistent ? parsed?.compensation ?? null : null,
    application_period_deadline: identityConsistent ? parsed?.deadline ?? null : null,
    posting_status: identityConsistent ? parsed?.postingStatus ?? null : null,
    submission_materials: identityConsistent ? parsed?.submission ?? null : null,
    selection_process: identityConsistent ? parsed?.process ?? null : null,
    posting_notes: identityConsistent ? parsed?.notes ?? null : null,
    result_level: level,
    identity_status: identity.status,
    identity_fingerprint: identity.fingerprint,
    evidence: identityConsistent ? evidence : [],
    route_attempts: attempts,
    safety_flags: parsed?.safetyFlags ?? [],
    retrieved_at: new Date().toISOString(),
  };
  cache.set(cacheKey, result);
  return result;
}

export async function retrieveJDBatch(input: { urls: string[]; render?: boolean; maxConcurrency?: number }) {
  const urls = input.urls.slice(0, 20);
  const concurrency = Math.min(5, Math.max(1, Math.floor(input.maxConcurrency ?? 3)));
  const limit = pLimit(concurrency);
  return Promise.all(urls.map((url) => limit(async () => {
    try {
      return await retrieveJD({ url, render: input.render });
    } catch (error) {
      const identity = (() => { try { return detectIdentity(url); } catch { return { platform: 'unknown', primaryIdentity: null, secondaryIdentity: {}, fingerprint: `invalid|${url}`, status: 'unknown' as const }; } })();
      return {
        platform: identity.platform,
        input_url: url,
        canonical_url: url,
        posting_id: identity.primaryIdentity,
        result_level: 'unrecovered' as ResultLevel,
        identity_status: identity.status,
        identity_fingerprint: identity.fingerprint,
        evidence: [],
        route_attempts: [{ route: 'validation', ok: false, note: error instanceof Error ? error.message : String(error) }],
        safety_flags: [],
        retrieved_at: new Date().toISOString(),
      };
    }
  })));
}

export function healthInfo() {
  return {
    ok: true,
    service: 'jd-retriever-mcp',
    version: VERSION,
    browser_enabled: ENABLE_BROWSER,
    cache_entries: cache.size,
    supported_platforms: ['greetinghr', 'ncsoft', 'kia', 'jobkorea', 'saramin', 'wanted', 'linkedin', 'remember', 'jumpit', 'incruit', 'catch', 'work24', 'flex-recruiting', 'generic'],
    time: new Date().toISOString(),
  };
}
