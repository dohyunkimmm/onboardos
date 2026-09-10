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

const config = JSON.parse(read('vercel.json'));
const allHeaders = (config.headers || []).flatMap(rule => rule.headers || []);
const csp = allHeaders.find(h => h.key.toLowerCase() === 'content-security-policy')?.value || '';
for(const directive of ["script-src-attr 'none'", "style-src-attr 'none'", "object-src 'none'", "frame-ancestors 'none'"]){
  if(!csp.includes(directive)) fail(`CSP missing ${directive}`);
}
console.log(`Quality gate PASS: ${cards.length} tools, ${names.size} unique names, CSP + runtime source checks`);
