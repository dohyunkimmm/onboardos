'use strict';

const fs = require('fs');

const fail = message => {
  throw new Error(`release evidence: ${message}`);
};

const readJson = file => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`${file} is invalid JSON: ${error.message}`);
  }
};

function validateEvidenceContract(release){
  const contract = release.evidenceContract;
  if(!contract || typeof contract !== 'object') fail('evidenceContract is required');
  if(contract.schemaVersion !== 3) fail(`evidenceContract.schemaVersion must be 3, found ${contract.schemaVersion}`);
  if(contract.requireSuccessfulTargetRun !== true) fail('requireSuccessfulTargetRun must be true');

  const assets = ['verification-summary.json', 'verification-summary.md', 'asset-integrity.json'];
  for(const asset of assets){
    if(!Array.isArray(contract.releaseAssets) || !contract.releaseAssets.includes(asset)){
      fail(`releaseAssets missing ${asset}`);
    }
  }

  const gates = [
    'Chromium regression',
    'Cross-browser',
    'Desktop performance',
    'Mobile performance',
    'Supply chain',
    'Production smoke',
    'Deployment integrity'
  ];
  for(const gate of gates){
    if(!Array.isArray(contract.requiredGates) || !contract.requiredGates.includes(gate)){
      fail(`requiredGates missing ${gate}`);
    }
  }
  return contract;
}

function verifyReleaseEvidence({target, tag, summaryPath, integrityPath}){
  if(!/^[0-9a-f]{40}$/.test(target || '')) fail('target must be an exact 40-character commit SHA');

  const release = readJson('release.json');
  const contract = validateEvidenceContract(release);
  if(tag !== `v${release.version}`) fail(`tag=${tag} release.json=v${release.version}`);

  const summary = readJson(summaryPath);
  if(summary.schemaVersion !== contract.schemaVersion){
    fail(`verification summary schema=${summary.schemaVersion} expected=${contract.schemaVersion}`);
  }
  if(summary.commit !== target) fail(`verification summary commit=${summary.commit} target=${target}`);
  if(summary.event !== 'push') fail(`verification summary event must be push, found ${summary.event}`);
  if(!summary.release || summary.release.version !== release.version){
    fail(`verification summary release version does not match ${release.version}`);
  }
  if(summary.release.freeze !== release.freeze) fail(`verification summary freeze=${summary.release.freeze} release=${release.freeze}`);
  if(summary.release.businessFlowChanged !== false) fail('verification summary must preserve businessFlowChanged=false');
  if(summary.release.integrityManifest !== release.integrityManifest){
    fail(`verification summary integrity manifest=${summary.release.integrityManifest} release=${release.integrityManifest}`);
  }

  const byArea = new Map((summary.gates || []).map(row => [row.area, row]));
  for(const area of contract.requiredGates){
    const row = byArea.get(area);
    if(!row) fail(`verification summary missing gate ${area}`);
    if(row.result !== 'success') fail(`${area} result=${row.result}, expected success`);
  }

  const integrity = readJson(integrityPath);
  if(integrity.schemaVersion !== 2) fail(`asset integrity schema=${integrity.schemaVersion}, expected 2`);
  if(integrity.commit !== target) fail(`asset integrity commit=${integrity.commit} target=${target}`);
  if(integrity.manifest !== release.integrityManifest){
    fail(`asset integrity manifest=${integrity.manifest} release=${release.integrityManifest}`);
  }
  if(integrity.allMatch !== true) fail('asset integrity must report allMatch=true');
  if(!Number.isInteger(integrity.assetCount) || integrity.assetCount < 1) fail('asset integrity assetCount must be positive');
  if(!Array.isArray(integrity.assets) || integrity.assets.length !== integrity.assetCount){
    fail('asset integrity assets length must match assetCount');
  }
  for(const row of integrity.assets){
    if(row.match !== true || row.localSha256 !== row.remoteSha256){
      fail(`asset integrity mismatch for ${row.asset || 'unknown asset'}`);
    }
  }

  return {release, contract, summary, integrity};
}

if(require.main === module){
  try {
    if(process.argv.includes('--contract-only')){
      const release = readJson('release.json');
      validateEvidenceContract(release);
      console.log(`Release evidence contract PASS: v${release.version} · schema 3 · ${release.evidenceContract.releaseAssets.length} release assets`);
      process.exit(0);
    }

    const [target, tag, summaryPath, integrityPath] = process.argv.slice(2);
    if(!target || !tag || !summaryPath || !integrityPath){
      console.error('Usage: node scripts/release-evidence.js <target-sha> <tag> <verification-summary.json> <asset-integrity.json>');
      process.exit(2);
    }
    const result = verifyReleaseEvidence({target, tag, summaryPath, integrityPath});
    console.log(`Release evidence PASS: ${tag} · ${target} · ${result.integrity.assetCount}/${result.integrity.assetCount} assets · ${result.contract.requiredGates.length}/${result.contract.requiredGates.length} gates`);
  } catch (error) {
    console.error(`RELEASE EVIDENCE FAILED: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { validateEvidenceContract, verifyReleaseEvidence };
