'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const read = p => fs.readFileSync(p, 'utf8');
const fail = message => { console.error(`QUALITY GATE FAILED: ${message}`); process.exit(1); };

const runtimeFiles = ['index.html','app.js','js/a11y.js','js/analytics.js','js/events.js'];
for(const file of runtimeFiles){
  const text = read(file);
  if(/\son[a-z]+\s*=/i.test(text)) fail(`${file} still contains an inline event handler`);
  if(/\sstyle\s*=/i.test(text)) fail(`${file} still contains an inline style attribute`);
  if(/\.style\s*[.=]/.test(text)) fail(`${file} still mutates inline style`);
}

const html = read('index.html');
if(/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) fail('index.html contains an inline script block');
if(/cdn\.jsdelivr\.net/i.test(html)) fail('index.html still has a jsDelivr runtime dependency');
if(!/href="fonts\/pretendard\.css"/.test(html)) fail('self-hosted Pretendard stylesheet is not linked');

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

const config = JSON.parse(read('vercel.json'));
const allHeaders = (config.headers || []).flatMap(rule => rule.headers || []);
const csp = allHeaders.find(h => h.key.toLowerCase() === 'content-security-policy')?.value || '';
for(const directive of ["script-src-attr 'none'", "style-src-attr 'none'", "object-src 'none'", "frame-ancestors 'none'"]){
  if(!csp.includes(directive)) fail(`CSP missing ${directive}`);
}
if(/cdn\.jsdelivr\.net/i.test(csp)) fail('CSP still allows the removed font CDN');

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
if(!fs.existsSync(path.join('scripts','dependency-review.js'))) fail('dependency-review.js is missing');

console.log(`Quality gate PASS: ${cards.length} tools, ${names.size} unique names, ${fontRefs.length} self-hosted font subsets, role isolation, CSP + SHA-pinned workflows`);
