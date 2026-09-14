'use strict';
const fs = require('fs');
const path = require('path');

const release = JSON.parse(fs.readFileSync('release.json', 'utf8'));
const event = process.env.GITHUB_EVENT_NAME || 'local';
const isProductionRun = event === 'push' && process.env.GITHUB_REF === 'refs/heads/main';
const productionResult = process.env.PRODUCTION_RESULT || (isProductionRun ? 'unknown' : 'not_applicable');
const resilienceResult = process.env.RESILIENCE_RESULT || 'unknown';
const securityResult = process.env.SECURITY_RESULT || 'unknown';
const uxResult = process.env.UX_RESULT || 'unknown';
const visualSystemResult = process.env.VISUAL_SYSTEM_RESULT || 'unknown';
const gates = [
  {area:'Chromium regression', gate:'Playwright', result:process.env.CHROMIUM_RESULT || 'unknown', scope:'Quality + Functional + WCAG/Keyboard/ARIA + Domain/SLA + Role Isolation + Visual'},
  {area:'Resilience & recovery', gate:'Playwright fault injection + recovery evidence', result:resilienceResult, scope:'session schema guard + corrupt-state sanitization + migration + storage outage + analytics isolation + refresh continuity'},
  {area:'Security & containment', gate:'Playwright security contract + security evidence', result:securityResult, scope:'security headers + CSP + analytics allowlist + URL/storage/console privacy boundary + telemetry containment + unsafe DOM sinks'},
  {area:'Interaction UX', gate:'Playwright U1-U8 + visual state evidence', result:uxResult, scope:'SSO loading geometry + reduced motion + modal/drawer focus + live status + responsive boundaries + rejection/resubmission continuity'},
  {area:'Visual system & usability', gate:'Playwright V1-V8 + visual state evidence', result:visualSystemResult, scope:'focus ring + press feedback + card focus parity + selection clarity + modal/drawer hierarchy + forced-colors + mobile touch halo'},
  {area:'Cross-browser', gate:'Playwright', result:process.env.CROSS_BROWSER_RESULT || 'unknown', scope:'Firefox + WebKit core flow'},
  {area:'Desktop performance', gate:'Lighthouse 13.4.1', result:process.env.LIGHTHOUSE_RESULT || 'unknown', scope:'desktop 3-run budget; every run must pass'},
  {area:'Mobile performance', gate:'Lighthouse 13.4.1', result:process.env.MOBILE_LIGHTHOUSE_RESULT || 'unknown', scope:'mobile profile 3-run budget; every run must pass'},
  {area:'Supply chain', gate:'npm audit + PR lockfile delta', result:process.env.SUPPLY_CHAIN_RESULT || 'unknown', scope:'high+ advisories + HTTPS/integrity metadata + SHA-pinned Actions'},
  {area:'Production smoke', gate:'Playwright + Vercel status', result:isProductionRun ? productionResult : 'not_applicable', scope:'Desktop Chromium + iPhone WebKit live flow + CSP + assets + page/console errors'},
  {area:'Deployment integrity', gate:'SHA-256 + canonical manifest', result:isProductionRun ? productionResult : 'not_applicable', scope:'canonical public asset manifest · GitHub checkout ↔ Production'}
];
const repository = process.env.GITHUB_REPOSITORY || null;
const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
const report = {
  schemaVersion:7,
  generatedAt:new Date().toISOString(),
  repository,
  commit:process.env.GITHUB_SHA || null,
  event,
  runId:process.env.GITHUB_RUN_ID || null,
  runUrl:repository && process.env.GITHUB_RUN_ID ? `${serverUrl}/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}` : null,
  workflowUrl:repository ? `${serverUrl}/${repository}/actions/workflows/e2e.yml?query=branch%3Amain` : null,
  verificationMatrixUrl:repository ? `${serverUrl}/${repository}#verification-matrix` : null,
  productionUrl:'https://onboardos-rho.vercel.app/',
  release:{
    product:release.product,
    version:release.version,
    freeze:release.freeze,
    releaseClass:release.releaseClass,
    releaseChannel:release.releaseChannel,
    businessFlowChanged:release.businessFlowChanged,
    integrityManifest:release.integrityManifest,
    verificationContract:release.verificationContract,
    resilienceContract:release.resilienceContract,
    securityContract:release.securityContract,
    uxContract:release.uxContract,
    designSystemContract:release.designSystemContract,
    evidenceContract:release.evidenceContract
  },
  gates
};
const dir = 'verification';
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'verification-summary.json'), JSON.stringify(report,null,2) + '\n');
const status = value => value === 'success' ? 'PASS' : (value === 'not_applicable' || value === 'skipped') ? 'N/A' : String(value).toUpperCase();
const lines = [
  '# Verification Evidence',
  '',
  `- Release: **${report.release.product} v${report.release.version} / ${report.release.freeze}**`,
  `- Release channel: \`${report.release.releaseChannel}\``,
  `- Business flow changed: \`${report.release.businessFlowChanged}\``,
  `- Commit: \`${report.commit || 'local'}\``,
  `- Event: \`${event}\``,
  report.runUrl ? `- Run: ${report.runUrl}` : null,
  report.workflowUrl ? `- Public workflow: ${report.workflowUrl}` : null,
  report.verificationMatrixUrl ? `- Verification Matrix: ${report.verificationMatrixUrl}` : null,
  `- Production: ${report.productionUrl}`,
  '',
  '| Area | Gate | Result | Scope |',
  '| --- | --- | --- | --- |',
  ...gates.map(row => `| ${row.area} | ${row.gate} | **${status(row.result)}** | ${row.scope} |`),
  ''
].filter(line => line !== null);
const markdown = lines.join('\n');
fs.writeFileSync(path.join(dir,'verification-summary.md'), markdown + '\n');
if(process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + '\n');
console.log(markdown);
