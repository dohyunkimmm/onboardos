'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const baseUrl = process.argv[2] || process.env.PRODUCTION_URL;
if(!baseUrl){
  console.error('Usage: node scripts/asset-integrity.js <production-url>');
  process.exit(2);
}

const critical = [
  'index.html',
  'styles.css',
  'data.js',
  'app.js',
  'js/state.js',
  'js/analytics.js',
  'js/a11y.js',
  'js/events.js',
  'fonts/pretendard.css'
];
const fontDir = path.join('fonts','pretendard');
const fontAssets = fs.existsSync(fontDir)
  ? fs.readdirSync(fontDir).filter(name => name.endsWith('.woff2')).sort().map(name => `fonts/pretendard/${name}`)
  : [];
const assets = [...critical, ...fontAssets];
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const verificationDir = 'verification';
fs.mkdirSync(verificationDir, {recursive:true});

async function fetchAsset(asset){
  const target = new URL('/' + asset, baseUrl.replace(/\/$/,'') + '/');
  target.searchParams.set('integrity', process.env.GITHUB_SHA || String(Date.now()));
  let lastError;
  for(let attempt=1; attempt<=3; attempt++){
    try{
      const response = await fetch(target, {headers:{'cache-control':'no-cache'}});
      if(!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return Buffer.from(await response.arrayBuffer());
    }catch(error){
      lastError = error;
      if(attempt < 3) await new Promise(resolve => setTimeout(resolve, 1200 * attempt));
    }
  }
  throw new Error(`${asset}: ${lastError?.message || 'fetch failed'}`);
}

(async()=>{
  const results = [];
  const concurrency = 8;
  for(let i=0; i<assets.length; i+=concurrency){
    const batch = assets.slice(i, i+concurrency);
    const rows = await Promise.all(batch.map(async asset => {
      if(!fs.existsSync(asset)) throw new Error(`local asset missing: ${asset}`);
      const local = fs.readFileSync(asset);
      const remote = await fetchAsset(asset);
      const localSha256 = hash(local);
      const remoteSha256 = hash(remote);
      return {asset, bytes:local.length, localSha256, remoteSha256, match:localSha256 === remoteSha256};
    }));
    results.push(...rows);
  }
  const report = {
    schemaVersion:1,
    generatedAt:new Date().toISOString(),
    commit:process.env.GITHUB_SHA || null,
    productionUrl:baseUrl,
    assetCount:results.length,
    allMatch:results.every(row => row.match),
    assets:results
  };
  fs.writeFileSync(path.join(verificationDir,'asset-integrity.json'), JSON.stringify(report,null,2) + '\n');
  const mismatches = results.filter(row => !row.match);
  if(mismatches.length){
    for(const row of mismatches) console.error(`HASH MISMATCH ${row.asset}\n  local  ${row.localSha256}\n  remote ${row.remoteSha256}`);
    process.exit(1);
  }
  console.log(`Production source integrity PASS: ${results.length}/${results.length} assets match SHA-256`);
})().catch(error => {
  console.error(`Production source integrity FAILED: ${error.message}`);
  process.exit(1);
});
