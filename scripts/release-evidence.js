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
  if(contract.schemaVersion !== 6) fail(`evidenceContract.schemaVersion must be 6, found ${contract.schemaVersion}`);
  if(contract.requireSuccessfulTargetRun !== true) fail('requireSuccessfulTargetRun must be true');

  const assets = ['verification-summary.json', 'verification-summary.md', 'asset-integrity.json', 'resilience-summary.json', 'security-summary.json', 'ux-summary.json'];
  for(const asset of assets){
    if(!Array.isArray(contract.releaseAssets) || !contract.releaseAssets.includes(asset)){
      fail(`releaseAssets missing ${asset}`);
    }
  }

  const gates = [
    'Chromium regression',
    'Resilience & recovery',
    'Security & containment',
    'Interaction UX',
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

function verifyReleaseEvidence({target, tag, summaryPath, integrityPath, resiliencePath, securityPath, uxPath}){
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

  const resilience = readJson(resiliencePath);
  const resilienceContract = release.resilienceContract;
  if(resilience.schemaVersion !== 1) fail(`resilience evidence schema=${resilience.schemaVersion}, expected 1`);
  if(resilience.commit !== target) fail(`resilience evidence commit=${resilience.commit} target=${target}`);
  if(resilience.release?.version !== release.version) fail(`resilience evidence release=${resilience.release?.version} expected=${release.version}`);
  if(resilience.release?.freeze !== release.freeze) fail(`resilience evidence freeze=${resilience.release?.freeze} expected=${release.freeze}`);
  if(resilience.release?.businessFlowChanged !== false) fail('resilience evidence must preserve businessFlowChanged=false');
  if(resilience.sessionSchemaVersion !== resilienceContract.sessionSchemaVersion){
    fail(`resilience session schema=${resilience.sessionSchemaVersion} expected=${resilienceContract.sessionSchemaVersion}`);
  }
  if(resilience.allPassed !== true) fail('resilience evidence must report allPassed=true');
  if(!Array.isArray(resilience.scenarios) || resilience.scenarios.length !== resilience.scenarioCount){
    fail('resilience scenarios length must match scenarioCount');
  }
  const resilienceById = new Map(resilience.scenarios.map(row => [row.id,row]));
  for(const id of resilienceContract.requiredScenarios){
    const row = resilienceById.get(id);
    if(!row) fail(`resilience evidence missing scenario ${id}`);
    if(row.result !== 'success') fail(`resilience scenario ${id} result=${row.result}, expected success`);
  }

  const security = readJson(securityPath);
  const securityContract = release.securityContract;
  if(!securityContract || securityContract.schemaVersion !== 1) fail('securityContract.schemaVersion must be 1');
  if(security.schemaVersion !== 1) fail(`security evidence schema=${security.schemaVersion}, expected 1`);
  if(security.commit !== target) fail(`security evidence commit=${security.commit} target=${target}`);
  if(security.release?.version !== release.version) fail(`security evidence release=${security.release?.version} expected=${release.version}`);
  if(security.release?.freeze !== release.freeze) fail(`security evidence freeze=${security.release?.freeze} expected=${release.freeze}`);
  if(security.release?.businessFlowChanged !== false) fail('security evidence must preserve businessFlowChanged=false');
  if(security.allPassed !== true) fail('security evidence must report allPassed=true');
  if(!Array.isArray(security.scenarios) || security.scenarios.length !== security.scenarioCount){
    fail('security scenarios length must match scenarioCount');
  }
  const securityById = new Map(security.scenarios.map(row => [row.id,row]));
  for(const id of securityContract.requiredScenarios){
    const row = securityById.get(id);
    if(!row) fail(`security evidence missing scenario ${id}`);
    if(row.result !== 'success') fail(`security scenario ${id} result=${row.result}, expected success`);
  }

  const ux = readJson(uxPath);
  const uxContract = release.uxContract;
  if(!uxContract || uxContract.schemaVersion !== 1) fail('uxContract.schemaVersion must be 1');
  if(ux.schemaVersion !== 1) fail(`UX evidence schema=${ux.schemaVersion}, expected 1`);
  if(ux.commit !== target) fail(`UX evidence commit=${ux.commit} target=${target}`);
  if(ux.release?.version !== release.version) fail(`UX evidence release=${ux.release?.version} expected=${release.version}`);
  if(ux.release?.freeze !== release.freeze) fail(`UX evidence freeze=${ux.release?.freeze} expected=${release.freeze}`);
  if(ux.release?.businessFlowChanged !== false) fail('UX evidence must preserve businessFlowChanged=false');
  if(ux.allPassed !== true) fail('UX evidence must report allPassed=true');
  if(!Array.isArray(ux.scenarios) || ux.scenarios.length !== ux.scenarioCount){
    fail('UX scenarios length must match scenarioCount');
  }
  const uxById = new Map(ux.scenarios.map(row => [row.id,row]));
  for(const id of uxContract.requiredScenarios){
    const row = uxById.get(id);
    if(!row) fail(`UX evidence missing scenario ${id}`);
    if(row.result !== 'success') fail(`UX scenario ${id} result=${row.result}, expected success`);
  }
  for(const file of uxContract.requiredVisualEvidence || []){
    const row = (ux.visualEvidence || []).find(item => item.file === file);
    if(!row || !/^[0-9a-f]{64}$/.test(row.sha256 || '') || !(row.bytes > 0)){
      fail(`UX visual evidence missing or invalid: ${file}`);
    }
  }

  return {release, contract, summary, integrity, resilience, security, ux};
}

if(require.main === module){
  try {
    if(process.argv.includes('--contract-only')){
      const release = readJson('release.json');
      validateEvidenceContract(release);
      console.log(`Release evidence contract PASS: v${release.version} · schema 6 · ${release.evidenceContract.releaseAssets.length} release assets`);
      process.exit(0);
    }

    const [target, tag, summaryPath, integrityPath, resiliencePath, securityPath, uxPath] = process.argv.slice(2);
    if(!target || !tag || !summaryPath || !integrityPath || !resiliencePath || !securityPath || !uxPath){
      console.error('Usage: node scripts/release-evidence.js <target-sha> <tag> <verification-summary.json> <asset-integrity.json> <resilience-summary.json> <security-summary.json> <ux-summary.json>');
      process.exit(2);
    }
    const result = verifyReleaseEvidence({target, tag, summaryPath, integrityPath, resiliencePath, securityPath, uxPath});
    console.log(`Release evidence PASS: ${tag} · ${target} · ${result.integrity.assetCount}/${result.integrity.assetCount} assets · ${result.contract.requiredGates.length}/${result.contract.requiredGates.length} gates · ${result.resilience.passedCount}/${result.resilience.scenarioCount} resilience · ${result.security.passedCount}/${result.security.scenarioCount} security · ${result.ux.passedCount}/${result.ux.scenarioCount} UX scenarios`);
  } catch (error) {
    console.error(`RELEASE EVIDENCE FAILED: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { validateEvidenceContract, verifyReleaseEvidence };
