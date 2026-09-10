'use strict';
const fs = require('fs');
const path = require('path');

const event = process.env.GITHUB_EVENT_NAME || 'local';
const isProductionRun = event === 'push' && process.env.GITHUB_REF === 'refs/heads/main';
const productionResult = process.env.PRODUCTION_RESULT || (isProductionRun ? 'unknown' : 'not_applicable');
const gates = [
  {area:'Chromium regression', gate:'Playwright', result:process.env.CHROMIUM_RESULT || 'unknown', scope:'Quality + Functional + WCAG/Keyboard/ARIA + Domain/SLA + Role Isolation + Visual'},
  {area:'Cross-browser', gate:'Playwright', result:process.env.CROSS_BROWSER_RESULT || 'unknown', scope:'Firefox + WebKit core flow'},
  {area:'Performance', gate:'Lighthouse CI', result:process.env.LIGHTHOUSE_RESULT || 'unknown', scope:'3-run budget'},
  {area:'Supply chain', gate:'npm audit + Dependency Review', result:process.env.SUPPLY_CHAIN_RESULT || 'unknown', scope:'high+ advisories + SHA-pinned Actions'},
  {area:'Production smoke', gate:'Playwright + Vercel status', result:isProductionRun ? productionResult : 'not_applicable', scope:'live flow + CSP + assets + page/console errors'},
  {area:'Deployment integrity', gate:'SHA-256', result:isProductionRun ? productionResult : 'not_applicable', scope:'deployed core assets + vendored font assets'}
];
const report = {
  schemaVersion:1,
  generatedAt:new Date().toISOString(),
  repository:process.env.GITHUB_REPOSITORY || null,
  commit:process.env.GITHUB_SHA || null,
  event,
  runId:process.env.GITHUB_RUN_ID || null,
  runUrl:process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null,
  gates
};
const dir = 'verification';
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'verification-summary.json'), JSON.stringify(report,null,2) + '\n');
const status = value => value === 'success' ? 'PASS' : (value === 'not_applicable' || value === 'skipped') ? 'N/A' : String(value).toUpperCase();
const lines = [
  '# Verification Evidence',
  '',
  `- Commit: \`${report.commit || 'local'}\``,
  `- Event: \`${event}\``,
  report.runUrl ? `- Run: ${report.runUrl}` : null,
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
