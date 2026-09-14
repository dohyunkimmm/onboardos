'use strict';

const fs = require('fs');
const { validateIntegrityManifest, MANIFEST_PATH } = require('./public-assets');
const { validateEvidenceContract } = require('./release-evidence');

const fail = message => {
  throw new Error(`release contract: ${message}`);
};
const readJson = path => {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${path} is invalid JSON: ${error.message}`);
  }
};

function validateReleaseContract(){
  const release = readJson('release.json');
  const packageJson = readJson('package.json');
  const packageLock = readJson('package-lock.json');
  const versionText = fs.readFileSync('version.txt', 'utf8');
  const stateSource = fs.readFileSync('js/state.js', 'utf8');

  if(release.schemaVersion !== 6) fail(`schemaVersion must be 6, found ${release.schemaVersion}`);
  if(release.product !== 'ONBOARD·OS') fail(`product mismatch: ${release.product}`);
  if(!/^\d+\.\d+\.\d+$/.test(release.version || '')) fail(`invalid semantic version: ${release.version}`);
  if(release.freeze !== 'P6') fail(`freeze must remain P6, found ${release.freeze}`);
  if(release.canonicalVersionSource !== 'release.json') fail('canonicalVersionSource must be release.json');
  if(release.integrityManifest !== MANIFEST_PATH) fail(`integrityManifest must be ${MANIFEST_PATH}`);
  if(release.businessFlowChanged !== false) fail('P6 release must keep businessFlowChanged=false');

  const expectedArtifacts = ['version.txt', 'package.json', 'package-lock.json'];
  for(const artifact of expectedArtifacts){
    if(!Array.isArray(release.syncedArtifacts) || !release.syncedArtifacts.includes(artifact)){
      fail(`syncedArtifacts missing ${artifact}`);
    }
  }

  const contracts = [
    'release-contract-consistency',
    'integrity-manifest-consistency',
    'sha256-asset-integrity',
    'desktop-chromium-smoke',
    'iphone-webkit-smoke',
    'resilience-recovery',
    'security-failure-containment',
    'release-evidence-consistency'
  ];
  for(const contract of contracts){
    if(!Array.isArray(release.verificationContract) || !release.verificationContract.includes(contract)){
      fail(`verificationContract missing ${contract}`);
    }
  }

  const resilience = release.resilienceContract;
  if(!resilience || resilience.schemaVersion !== 1) fail('resilienceContract.schemaVersion must be 1');
  if(resilience.sessionSchemaVersion !== 4) fail(`resilienceContract.sessionSchemaVersion must be 4, found ${resilience.sessionSchemaVersion}`);
  if(resilience.evidenceAsset !== 'resilience-summary.json') fail('resilienceContract.evidenceAsset must be resilience-summary.json');
  const resilienceScenarios = ['R1','R2','R3','R4','R5','R6','R7','R8'];
  for(const scenario of resilienceScenarios){
    if(!Array.isArray(resilience.requiredScenarios) || !resilience.requiredScenarios.includes(scenario)){
      fail(`resilienceContract.requiredScenarios missing ${scenario}`);
    }
  }
  const stateSchemaMatch = stateSource.match(/const SESSION_SCHEMA_VERSION = (\d+);/);
  if(!stateSchemaMatch) fail('js/state.js must declare SESSION_SCHEMA_VERSION');
  if(Number(stateSchemaMatch[1]) !== resilience.sessionSchemaVersion){
    fail(`js/state.js session schema=${stateSchemaMatch[1]} release resilience schema=${resilience.sessionSchemaVersion}`);
  }

  const security = release.securityContract;
  if(!security || security.schemaVersion !== 1) fail('securityContract.schemaVersion must be 1');
  if(security.evidenceAsset !== 'security-summary.json') fail('securityContract.evidenceAsset must be security-summary.json');
  for(const scenario of ['S1','S2','S3','S4','S5','S6','S7','S8']){
    if(!Array.isArray(security.requiredScenarios) || !security.requiredScenarios.includes(scenario)){
      fail(`securityContract.requiredScenarios missing ${scenario}`);
    }
  }

  try {
    validateEvidenceContract(release);
  } catch (error) {
    fail(error.message);
  }

  const versionMatch = versionText.match(/^ONBOARD·OS v(\d+\.\d+\.\d+)$/m);
  if(!versionMatch) fail('version.txt must declare ONBOARD·OS semantic version');
  if(versionMatch[1] !== release.version) fail(`version.txt=${versionMatch[1]} release.json=${release.version}`);
  if(!/^releaseChannel=production$/m.test(versionText)) fail('version.txt must declare releaseChannel=production');
  if(!/^securityContract=S1-S8$/m.test(versionText)) fail('version.txt must declare securityContract=S1-S8');
  if(packageJson.version !== release.version) fail(`package.json=${packageJson.version} release.json=${release.version}`);
  if(packageLock.version !== release.version) fail(`package-lock.json=${packageLock.version} release.json=${release.version}`);
  if(packageLock.packages?.['']?.version !== release.version){
    fail(`package-lock root package=${packageLock.packages?.['']?.version} release.json=${release.version}`);
  }

  let manifestResult;
  try {
    manifestResult = validateIntegrityManifest();
  } catch (error) {
    fail(error.message);
  }
  for(const critical of ['release.json','version.txt','integrity-assets.json','scripts/release-contract.js','scripts/release-evidence.js','scripts/resilience-summary.js','scripts/security-summary.js','scripts/public-assets.js']){
    if(!manifestResult.assets.includes(critical)) fail(`integrity manifest missing critical asset ${critical}`);
  }

  return release;
}

if(require.main === module){
  try {
    const release = validateReleaseContract();
    console.log(`Release contract PASS: ${release.product} v${release.version} · ${release.freeze} · canonical=${release.canonicalVersionSource} · integrity=${release.integrityManifest} · evidence=v${release.evidenceContract.schemaVersion} · resilience=${release.resilienceContract.requiredScenarios.length} · security=${release.securityContract.requiredScenarios.length} scenarios`);
  } catch (error) {
    console.error(`RELEASE CONTRACT FAILED: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { validateReleaseContract };
