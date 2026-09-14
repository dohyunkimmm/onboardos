'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { validateReleaseContract } = require('./release-contract');
const { collectPublicAssets } = require('./public-assets');

const read = p => fs.readFileSync(p, 'utf8');
const fail = message => { console.error(`QUALITY GATE FAILED: ${message}`); process.exit(1); };

const runtimeFiles = ['index.html','app.js','js/a11y.js','js/analytics.js','js/events.js'];
for(const file of runtimeFiles){
  const text = read(file);
  if(/\son[a-z]+\s*=/i.test(text)) fail(`${file} still contains an inline event handler`);
  if(/\sstyle\s*=/i.test(text)) fail(`${file} still contains an inline style attribute`);
  if(/\.style\s*[.=]/.test(text)) fail(`${file} still mutates inline style`);
  if(/javascript\s*:/i.test(text)) fail(`${file} contains a javascript: URL`);
}

const html = read('index.html');
if(/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) fail('index.html contains an inline script block');
if(/cdn\.jsdelivr\.net/i.test(html)) fail('index.html still has a jsDelivr runtime dependency');
if(!/href="fonts\/pretendard\.css"/.test(html)) fail('self-hosted Pretendard stylesheet is not linked');

let release;
let publicAssets;
try{
  release = validateReleaseContract();
  publicAssets = collectPublicAssets();
}catch(error){
  fail(error.message);
}

const fontCssPath = path.join('fonts','pretendard.css');
if(!fs.existsSync(fontCssPath)) fail('self-hosted Pretendard CSS is missing');
if(!fs.existsSync(path.join('fonts','PRETENDARD-LICENSE.txt'))) fail('Pretendard license file is missing');
const fontCss = read(fontCssPath);
const fontRefs = [...fontCss.matchAll(/url\(([^)]+)\)/g)].map(match => match[1].trim().replace(/^['"]|['"]$/g,''));
if(!fontRefs.length) fail('Pretendard CSS has no font files');
for(const ref of fontRefs){
  if(/^https?:/i.test(ref)) fail(`Pretendard CSS still uses remote font URL: ${ref}`);
  const resolved = path.resolve(path.dirname(fontCssPath), ref);
  if(!fs.existsSync(resolved)) fail(`Pretendard font file missing: ${ref}`);
}

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(read('data.js') + '\n;globalThis.__catalog={commonLicenses,roles};', sandbox);
const { commonLicenses, roles } = sandbox.__catalog;
const cards = [...commonLicenses, ...Object.values(roles).flatMap(role => role.cards || [])];
if(cards.length !== 21) fail(`expected 21 tools, found ${cards.length}`);
const names = new Set();
for(const item of cards){
  for(const key of ['name','cat','owner','audience','status','url']) if(!item[key]) fail(`${item.name || 'unknown'} missing ${key}`);
  if(names.has(item.name)) fail(`duplicate tool name: ${item.name}`);
  names.add(item.name);
  if(!['auto','request','approval'].includes(item.status)) fail(`${item.name} has invalid base status ${item.status}`);
  if(!/^https:\/\//.test(item.url)) fail(`${item.name} URL must use https`);
  if(item.icon && !fs.existsSync(path.join('.', item.icon))) fail(`${item.name} icon missing: ${item.icon}`);
}
for(const roleName of ['design','dev','data','office','unmapped']) if(!roles[roleName]) fail(`missing role ${roleName}`);

const stateSource = read('js/state.js');
for(const token of ['requestStateByRole','cancelledHistoryByRole','cancelledTicketsByRole','activateRoleState','onboard-os:v4']){
  if(!stateSource.includes(token)) fail(`role-isolated state contract missing ${token}`);
}
const analyticsSource = read('js/analytics.js');
for(const token of ['ANALYTICS_FIELD_ALLOWLIST','sanitizeAnalyticsData','isSafeAnalyticsValue']){
  if(!analyticsSource.includes(token)) fail(`analytics privacy boundary missing ${token}`);
}

const config = JSON.parse(read('vercel.json'));
const allHeaders = (config.headers || []).flatMap(rule => rule.headers || []);
const headerMap = new Map(allHeaders.map(h => [h.key.toLowerCase(),h.value]));
const csp = headerMap.get('content-security-policy') || '';
for(const directive of ["default-src 'self'", "script-src-attr 'none'", "style-src-attr 'none'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self'", 'upgrade-insecure-requests']){
  if(!csp.includes(directive)) fail(`CSP missing ${directive}`);
}
if(csp.includes("'unsafe-eval'")) fail('CSP must not allow unsafe-eval');
if(/cdn\.jsdelivr\.net/i.test(csp)) fail('CSP still allows the removed font CDN');
if(headerMap.get('x-content-type-options') !== 'nosniff') fail('X-Content-Type-Options must be nosniff');
if(headerMap.get('x-frame-options') !== 'DENY') fail('X-Frame-Options must be DENY');
if(headerMap.get('referrer-policy') !== 'strict-origin-when-cross-origin') fail('Referrer-Policy mismatch');
const permissionsPolicy = headerMap.get('permissions-policy') || '';
for(const feature of ['camera=()','microphone=()','geolocation=()']) if(!permissionsPolicy.includes(feature)) fail(`Permissions-Policy missing ${feature}`);

const workflowDir = path.join('.github','workflows');
for(const name of fs.readdirSync(workflowDir).filter(name => /\.ya?ml$/i.test(name))){
  const workflow = read(path.join(workflowDir,name));
  for(const match of workflow.matchAll(/^\s*(?:-\s*)?uses:\s*([^\s#]+)/gm)){
    const target = match[1];
    if(target.startsWith('./')) continue;
    const at = target.lastIndexOf('@');
    const ref = at >= 0 ? target.slice(at+1) : '';
    if(!/^[0-9a-f]{40}$/.test(ref)) fail(`${name} uses mutable action ref: ${target}`);
  }
}

const dependabot = read(path.join('.github','dependabot.yml'));
if(!/package-ecosystem:\s*npm/.test(dependabot) || !/package-ecosystem:\s*github-actions/.test(dependabot)) fail('Dependabot must cover npm and GitHub Actions');
const e2eWorkflow = read(path.join('.github','workflows','e2e.yml'));
if(!/npm audit --audit-level=high/.test(e2eWorkflow)) fail('high+ npm audit gate missing');
if(!/scripts\/dependency-review\.js/.test(e2eWorkflow)) fail('PR dependency delta gate missing');
if(!/Security \/ failure-containment gate/.test(e2eWorkflow)) fail('v7 security CI gate missing');
if(!/npm run test:security/.test(e2eWorkflow)) fail('v7 security scenario command missing');
if(!fs.existsSync(path.join('scripts','dependency-review.js'))) fail('dependency-review.js is missing');
if(!fs.existsSync(path.join('scripts','security-summary.js'))) fail('security-summary.js is missing');
if(!fs.existsSync(path.join('tests','security.spec.js'))) fail('security.spec.js is missing');

console.log(`Quality gate PASS: ${cards.length} tools, ${names.size} unique names, ${fontRefs.length} self-hosted font subsets, ${publicAssets.length} manifest assets, release ${release.version} canonical contract, role isolation, security headers + analytics privacy boundary + SHA-pinned workflows`);
