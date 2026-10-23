'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { validateIntegrityManifest } = require('./public-assets');

const baseUrl = process.argv[2] || process.env.PRODUCTION_URL;
if(!baseUrl){
  console.error('Usage: node scripts/asset-integrity.js <production-url>');
  process.exit(2);
}

const {assets, sourceOnlyFiles} = validateIntegrityManifest();
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

async function verifyApiContract(){
  const target = new URL('/api/recommend', baseUrl);
  const response = await fetch(target, {
    headers: {'cache-control':'no-cache'},
    signal: AbortSignal.timeout(15000)
  });
  const allow = response.headers.get('allow') || '';
  const body = await response.json().catch(() => null);
  return {
    route: '/api/recommend',
    method: 'GET',
    status: response.status,
    allow,
    error: body?.error || null,
    passed: response.status === 405 && allow.split(',').map(s => s.trim().toUpperCase()).includes('POST') && body?.error === 'method_not_allowed'
  };
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
  const apiContract = await verifyApiContract();
  const report = {
    schemaVersion:2,
    manifest:'integrity-assets.json',
    generatedAt:new Date().toISOString(),
    commit:process.env.GITHUB_SHA || null,
    productionUrl:baseUrl,
    assetCount:results.length,
    sourceOnlyFileCount:sourceOnlyFiles.length,
    apiContract,
    allMatch:results.every(row => row.match) && apiContract.passed,
    assets:results
  };
  fs.writeFileSync(path.join(verificationDir,'asset-integrity.json'), JSON.stringify(report,null,2) + '\n');
  const mismatches = results.filter(row => !row.match);
  if(mismatches.length){
    for(const row of mismatches) console.error(`HASH MISMATCH ${row.asset}\n  local  ${row.localSha256}\n  remote ${row.remoteSha256}`);
  }
  if(!apiContract.passed) console.error(`API CONTRACT MISMATCH: GET ${apiContract.route} returned ${apiContract.status}, Allow=${apiContract.allow}, error=${apiContract.error}`);
  if(!report.allMatch) process.exit(1);
  console.log(`Production integrity PASS: ${results.length}/${results.length} public assets match SHA-256; POST-only API contract verified`);
})().catch(error => {
  console.error(`Production source integrity FAILED: ${error.message}`);
  process.exit(1);
});
