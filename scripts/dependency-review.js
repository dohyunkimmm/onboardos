'use strict';
const fs = require('fs');
const { execFileSync } = require('child_process');

const baseSha = process.argv[2] || process.env.BASE_SHA;
if(!baseSha){
  console.error('Usage: node scripts/dependency-review.js <base-sha>');
  process.exit(2);
}

function parseLock(text, label){
  let lock;
  try { lock = JSON.parse(text); }
  catch(error){ throw new Error(`${label}: invalid package-lock.json (${error.message})`); }
  const packages = lock.packages || {};
  const result = new Map();
  for(const [key, pkg] of Object.entries(packages)){
    if(!key || !key.startsWith('node_modules/')) continue;
    const name = key.slice('node_modules/'.length);
    result.set(name, {
      version: pkg.version || null,
      resolved: pkg.resolved || null,
      integrity: pkg.integrity || null,
      dev: pkg.dev === true
    });
  }
  return result;
}

function readBaseLock(){
  try {
    return execFileSync('git', ['show', `${baseSha}:package-lock.json`], {encoding:'utf8'});
  } catch(error){
    throw new Error(`unable to read base package-lock.json at ${baseSha}: ${error.message}`);
  }
}

function classify(base, head){
  const added = [];
  const removed = [];
  const changed = [];
  for(const [name, pkg] of head){
    if(!base.has(name)) added.push({name, ...pkg});
    else if(JSON.stringify(base.get(name)) !== JSON.stringify(pkg)) changed.push({name, from:base.get(name), to:pkg});
  }
  for(const [name, pkg] of base){ if(!head.has(name)) removed.push({name, ...pkg}); }
  return {added, removed, changed};
}

function validateSources(head){
  const failures = [];
  for(const [name, pkg] of head){
    if(pkg.resolved && !pkg.resolved.startsWith('https://')) failures.push(`${name}@${pkg.version}: non-HTTPS resolved source ${pkg.resolved}`);
    if(pkg.resolved && pkg.resolved.startsWith('https://') && !pkg.integrity) failures.push(`${name}@${pkg.version}: remote package is missing integrity metadata`);
  }
  return failures;
}

function compact(row){
  if(row.from) return `${row.name}: ${row.from.version || '?'} → ${row.to.version || '?'}`;
  return `${row.name}@${row.version || '?'}`;
}

try {
  const base = parseLock(readBaseLock(), 'base');
  const head = parseLock(fs.readFileSync('package-lock.json','utf8'), 'head');
  const delta = classify(base, head);
  const failures = validateSources(head);
  const summary = [
    '## PR Dependency Delta Review',
    '',
    `- Base: \`${baseSha}\``,
    `- Added: **${delta.added.length}**`,
    `- Changed: **${delta.changed.length}**`,
    `- Removed: **${delta.removed.length}**`,
    `- Current lock packages: **${head.size}**`,
    `- Source/integrity policy: **${failures.length ? 'FAIL' : 'PASS'}**`,
    '',
    delta.added.length ? `**Added**: ${delta.added.slice(0,30).map(compact).join(', ')}` : null,
    delta.changed.length ? `**Changed**: ${delta.changed.slice(0,30).map(compact).join(', ')}` : null,
    delta.removed.length ? `**Removed**: ${delta.removed.slice(0,30).map(compact).join(', ')}` : null,
    ''
  ].filter(Boolean).join('\n');
  console.log(summary);
  if(process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  if(failures.length){
    console.error('Dependency source policy FAILED:');
    failures.forEach(item => console.error(`- ${item}`));
    process.exit(1);
  }
  console.log('PR dependency delta PASS: lockfile sources are HTTPS and carry integrity metadata');
} catch(error){
  console.error(`PR dependency delta FAILED: ${error.message}`);
  process.exit(1);
}
