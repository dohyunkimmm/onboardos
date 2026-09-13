'use strict';

const fs = require('fs');
const { validateIntegrityManifest, MANIFEST_PATH } = require('./public-assets');

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
  const versionText = fs.readFileSync('version.txt', 'utf8');

  if(release.schemaVersion !== 3) fail(`schemaVersion must be 3, found ${release.schemaVersion}`);
  if(release.product !== 'ONBOARD·OS') fail(`product mismatch: ${release.product}`);
  if(!/^\d+\.\d+\.\d+$/.test(release.version || '')) fail(`invalid semantic version: ${release.version}`);
  if(release.freeze !== 'P6') fail(`freeze must remain P6, found ${release.freeze}`);
  if(release.canonicalVersionSource !== 'release.json') fail('canonicalVersionSource must be release.json');
  if(release.integrityManifest !== MANIFEST_PATH) fail(`integrityManifest must be ${MANIFEST_PATH}`);
  if(release.businessFlowChanged !== false) fail('P6 release must keep businessFlowChanged=false');

  const expectedArtifacts = ['version.txt', 'package.json'];
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
    'iphone-webkit-smoke'
  ];
  for(const contract of contracts){
    if(!Array.isArray(release.verificationContract) || !release.verificationContract.includes(contract)){
      fail(`verificationContract missing ${contract}`);
    }
  }

  const versionMatch = versionText.match(/^ONBOARD·OS v(\d+\.\d+\.\d+)$/m);
  if(!versionMatch) fail('version.txt must declare ONBOARD·OS semantic version');
  if(versionMatch[1] !== release.version) fail(`version.txt=${versionMatch[1]} release.json=${release.version}`);
  if(packageJson.version !== release.version) fail(`package.json=${packageJson.version} release.json=${release.version}`);

  let manifestResult;
  try {
    manifestResult = validateIntegrityManifest();
  } catch (error) {
    fail(error.message);
  }
  for(const critical of ['release.json', 'version.txt', 'integrity-assets.json', 'scripts/release-contract.js', 'scripts/public-assets.js']){
    if(!manifestResult.assets.includes(critical)) fail(`integrity manifest missing critical asset ${critical}`);
  }

  return release;
}

if(require.main === module){
  try {
    const release = validateReleaseContract();
    console.log(`Release contract PASS: ${release.product} v${release.version} · ${release.freeze} · canonical=${release.canonicalVersionSource} · integrity=${release.integrityManifest}`);
  } catch (error) {
    console.error(`RELEASE CONTRACT FAILED: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { validateReleaseContract };
