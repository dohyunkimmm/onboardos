'use strict';

const fs=require('fs');
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s.endsWith('\n')?s:`${s}\n`);
const replace=(src,from,to,label)=>{if(!src.includes(from))throw new Error(`missing ${label}`);return src.replace(from,to);};

const release=JSON.parse(read('release.json'));
release.schemaVersion=10;
release.version='11.0.0';
release.releaseClass='interaction-clarity-product-refinement';
release.scope='post-login-interaction-clarity-product-refinement';
if(!release.verificationContract.includes('experience-refinement')){
  const at=release.verificationContract.indexOf('design-polish');
  release.verificationContract.splice(at+1,0,'experience-refinement');
}
release.experienceRefinementContract={
  schemaVersion:1,
  requiredScenarios:['E1','E2','E3','E4','E5','E6','E7','E8'],
  requiredVisualEvidence:['E1-navigation-hierarchy.png','E2-overview-composition.png','E4-filter-command-surface.png','E5-card-scanability.png','E6-modal-action-zone.png','E7-tablet-density.png','E8-empty-state.png']
};
if(!release.evidenceContract.requiredGates.includes('Experience refinement')){
  const at=release.evidenceContract.requiredGates.indexOf('Design polish');
  release.evidenceContract.requiredGates.splice(at+1,0,'Experience refinement');
}
write('release.json',JSON.stringify(release,null,2));

const pkg=JSON.parse(read('package.json'));pkg.version='11.0.0';write('package.json',JSON.stringify(pkg,null,2));
const lock=JSON.parse(read('package-lock.json'));lock.version='11.0.0';lock.packages[''].version='11.0.0';write('package-lock.json',JSON.stringify(lock,null,2));

write('version.txt',`ONBOARD·OS v11.0.0
releaseChannel=production
releaseClass=interaction-clarity-product-refinement
scope=post-login-interaction-clarity-product-refinement
freeze=P6
businessFlowChanged=false
securityContract=S1-S8
uxContract=U1-U8
designSystemContract=V1-V8
designPolishContract=D1-D8
experienceRefinementContract=E1-E8
integrityManifest=integrity-assets.json
`);

let contract=read('scripts/release-contract.js');
contract=replace(contract,'if(release.schemaVersion !== 9) fail(`schemaVersion must be 9, found ${release.schemaVersion}`);','if(release.schemaVersion !== 10) fail(`schemaVersion must be 10, found ${release.schemaVersion}`);','schema');
contract=replace(contract,"    'design-polish',\n    'release-evidence-consistency'","    'design-polish',\n    'experience-refinement',\n    'release-evidence-consistency'",'verification contract');
contract=replace(contract,"  try {\n    validateEvidenceContract(release);","  const experienceRefinement = release.experienceRefinementContract;\n  if(!experienceRefinement || experienceRefinement.schemaVersion !== 1) fail('experienceRefinementContract.schemaVersion must be 1');\n  for(const scenario of ['E1','E2','E3','E4','E5','E6','E7','E8']){\n    if(!Array.isArray(experienceRefinement.requiredScenarios) || !experienceRefinement.requiredScenarios.includes(scenario)){\n      fail(`experienceRefinementContract.requiredScenarios missing ${scenario}`);\n    }\n  }\n  for(const visual of ['E1-navigation-hierarchy.png','E2-overview-composition.png','E4-filter-command-surface.png','E5-card-scanability.png','E6-modal-action-zone.png','E7-tablet-density.png','E8-empty-state.png']){\n    if(!Array.isArray(experienceRefinement.requiredVisualEvidence) || !experienceRefinement.requiredVisualEvidence.includes(visual)){\n      fail(`experienceRefinementContract.requiredVisualEvidence missing ${visual}`);\n    }\n  }\n\n  try {\n    validateEvidenceContract(release);",'experience contract');
contract=replace(contract,"  if(!/^designPolishContract=D1-D8$/m.test(versionText)) fail('version.txt must declare designPolishContract=D1-D8');","  if(!/^designPolishContract=D1-D8$/m.test(versionText)) fail('version.txt must declare designPolishContract=D1-D8');\n  if(!/^experienceRefinementContract=E1-E8$/m.test(versionText)) fail('version.txt must declare experienceRefinementContract=E1-E8');",'version contract');
contract=replace(contract,"'scripts/visual-system-summary.js','scripts/public-assets.js']","'scripts/visual-system-summary.js','scripts/public-assets.js','experience-refinement.css']",'critical assets');
contract=replace(contract,'· design=${release.designPolishContract.requiredScenarios.length} scenarios`);','· design=${release.designPolishContract.requiredScenarios.length} · experience=${release.experienceRefinementContract.requiredScenarios.length} scenarios`);','contract log');
write('scripts/release-contract.js',contract);

let evidence=read('scripts/release-evidence.js');
evidence=replace(evidence,"    'Design polish',\n    'Cross-browser'","    'Design polish',\n    'Experience refinement',\n    'Cross-browser'",'evidence gate');
write('scripts/release-evidence.js',evidence);

let summary=read('scripts/verification-summary.js');
summary=replace(summary,"const designPolishResult = process.env.DESIGN_POLISH_RESULT || 'unknown';","const designPolishResult = process.env.DESIGN_POLISH_RESULT || 'unknown';\nconst experienceRefinementResult = process.env.EXPERIENCE_REFINEMENT_RESULT || 'unknown';",'summary result');
summary=replace(summary,"  {area:'Design polish', gate:'Playwright D1-D8 + visual evidence', result:designPolishResult, scope:'post-login hierarchy + spacing rhythm + grid density + card surfaces + semantic status + modal polish + tablet/mobile responsiveness + login baseline scope'},","  {area:'Design polish', gate:'Playwright D1-D8 + visual evidence', result:designPolishResult, scope:'post-login hierarchy + spacing rhythm + grid density + card surfaces + semantic status + modal polish + tablet/mobile responsiveness + login baseline scope'},\n  {area:'Experience refinement', gate:'Playwright E1-E8 + responsive visual evidence', result:experienceRefinementResult, scope:'navigation hierarchy + overview composition + progress clarity + filter command surface + card scanability + modal action zone + tablet density + empty/motion states'},",'summary gate');
summary=replace(summary,'    designPolishContract:release.designPolishContract,','    designPolishContract:release.designPolishContract,\n    experienceRefinementContract:release.experienceRefinementContract,','summary release');
write('scripts/verification-summary.js',summary);

let quality=read('scripts/quality-check.js');
quality=replace(quality,"if(!/npm run test:design-polish/.test(e2eWorkflow)) fail('v10 design polish scenario command missing');","if(!/npm run test:design-polish/.test(e2eWorkflow)) fail('v10 design polish scenario command missing');\nif(!/Experience refinement \/ interaction clarity gate/.test(e2eWorkflow)) fail('v11 experience refinement CI gate missing');\nif(!/npm run test:experience/.test(e2eWorkflow)) fail('v11 experience refinement scenario command missing');",'quality workflow');
quality=replace(quality,"if(!fs.existsSync(path.join('tests','design-polish.spec.js'))) fail('design-polish.spec.js is missing');","if(!fs.existsSync(path.join('tests','design-polish.spec.js'))) fail('design-polish.spec.js is missing');\nif(!fs.existsSync(path.join('tests','experience-refinement.spec.js'))) fail('experience-refinement.spec.js is missing');",'quality test');
quality=replace(quality,'V1-V8 visual system, D1-D8 design polish, security headers','V1-V8 visual system, D1-D8 design polish, E1-E8 experience refinement, security headers','quality log');
write('scripts/quality-check.js',quality);

let e2e=read('.github/workflows/e2e.yml');
e2e=replace(e2e,'          node --check playwright.design-polish.config.js\n          node --check playwright.cross-browser.config.js','          node --check playwright.design-polish.config.js\n          node --check playwright.experience-refinement.config.js\n          node --check playwright.cross-browser.config.js','config check');
e2e=replace(e2e,'          node --check tests/design-polish.spec.js\n          node --check tests/production.spec.js','          node --check tests/design-polish.spec.js\n          node --check tests/experience-refinement.spec.js\n          node --check tests/production.spec.js','test check');
const experienceJob=`  experience-refinement:\n    name: Experience refinement / interaction clarity gate\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1\n      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0\n        with:\n          node-version: 22\n          cache: npm\n      - run: npm ci\n      - run: npx playwright install --with-deps chromium\n      - name: Run required experience refinement scenarios E1-E8\n        run: |\n          mkdir -p verification/experience-refinement-screenshots\n          npm run test:experience\n      - name: Upload experience refinement evidence\n        if: always()\n        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1\n        with:\n          name: experience-refinement-evidence-\${{ github.sha }}\n          path: |\n            verification/experience-refinement-playwright.json\n            verification/experience-refinement-screenshots/\n          if-no-files-found: error\n          retention-days: 30\n\n`;
e2e=replace(e2e,'  cross-browser:\n    name: Firefox / WebKit functional smoke',experienceJob+'  cross-browser:\n    name: Firefox / WebKit functional smoke','experience job');
e2e=replace(e2e,'needs: [playwright, resilience, security, ux, visual-system, design-polish, cross-browser, lighthouse, lighthouse-mobile, supply-chain]','needs: [playwright, resilience, security, ux, visual-system, design-polish, experience-refinement, cross-browser, lighthouse, lighthouse-mobile, supply-chain]','production needs');
e2e=replace(e2e,'needs: [playwright, resilience, security, ux, visual-system, design-polish, cross-browser, lighthouse, lighthouse-mobile, supply-chain, production-smoke]','needs: [playwright, resilience, security, ux, visual-system, design-polish, experience-refinement, cross-browser, lighthouse, lighthouse-mobile, supply-chain, production-smoke]','evidence needs');
e2e=replace(e2e,"      needs.design-polish.result == 'success' &&\n      needs.cross-browser.result == 'success' &&","      needs.design-polish.result == 'success' &&\n      needs.experience-refinement.result == 'success' &&\n      needs.cross-browser.result == 'success' &&",'evidence condition');
e2e=replace(e2e,'          DESIGN_POLISH_RESULT: ${{ needs.design-polish.result }}\n          CROSS_BROWSER_RESULT: ${{ needs.cross-browser.result }}','          DESIGN_POLISH_RESULT: ${{ needs.design-polish.result }}\n          EXPERIENCE_REFINEMENT_RESULT: ${{ needs.experience-refinement.result }}\n          CROSS_BROWSER_RESULT: ${{ needs.cross-browser.result }}','summary env');
write('.github/workflows/e2e.yml',e2e);

for(const file of ['.github/workflows/v11-experience.yml','.github/workflows/v11-release-candidate.yml',__filename]){try{fs.unlinkSync(file);}catch{}}
console.log('v11 release candidate contract applied');
