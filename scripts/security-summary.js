'use strict';

const fs = require('fs');
const path = require('path');

const reportPath = process.argv[2] || 'verification/security-playwright.json';
const release = JSON.parse(fs.readFileSync('release.json','utf8'));
const report = JSON.parse(fs.readFileSync(reportPath,'utf8'));
const contract = release.securityContract;
if(!contract || contract.schemaVersion !== 1) throw new Error('securityContract schemaVersion 1 is required');

const scenarios = [];
function walkSuite(suite){
  for(const spec of suite.specs || []){
    const match = String(spec.title || '').match(/^\[(S\d+)\]\s*(.+)$/);
    if(!match) continue;
    const finals = (spec.tests || []).map(test => {
      const results = test.results || [];
      return results.length ? results[results.length - 1] : null;
    });
    const passed = finals.length > 0 && finals.every(result => result && result.status === 'passed');
    scenarios.push({
      id:match[1],
      title:match[2],
      result:passed ? 'success' : 'failure',
      durationMs:finals.reduce((sum,result) => sum + (Number(result?.duration) || 0),0)
    });
  }
  for(const child of suite.suites || []) walkSuite(child);
}
for(const suite of report.suites || []) walkSuite(suite);

const byId = new Map(scenarios.map(row => [row.id,row]));
for(const id of contract.requiredScenarios){
  const row = byId.get(id);
  if(!row) throw new Error(`missing required security scenario ${id}`);
  if(row.result !== 'success') throw new Error(`security scenario ${id} failed`);
}

const summary = {
  schemaVersion:1,
  generatedAt:new Date().toISOString(),
  repository:process.env.GITHUB_REPOSITORY || null,
  commit:process.env.GITHUB_SHA || null,
  runId:process.env.GITHUB_RUN_ID || null,
  release:{version:release.version,freeze:release.freeze,businessFlowChanged:release.businessFlowChanged},
  requiredScenarios:contract.requiredScenarios,
  scenarioCount:scenarios.length,
  passedCount:scenarios.filter(row => row.result === 'success').length,
  allPassed:scenarios.length >= contract.requiredScenarios.length && scenarios.every(row => row.result === 'success'),
  scenarios
};
if(!summary.allPassed) throw new Error('security suite did not fully pass');

const dir = 'verification';
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'security-summary.json'),JSON.stringify(summary,null,2)+'\n');
const lines = [
  '# Security Evidence','',
  `- Release: **ONBOARD·OS v${release.version} / ${release.freeze}**`,
  `- Scenarios: **${summary.passedCount}/${summary.scenarioCount} PASS**`,'',
  '| ID | Scenario | Result |','| --- | --- | --- |',
  ...scenarios.map(row => `| ${row.id} | ${row.title} | **${row.result === 'success' ? 'PASS' : 'FAIL'}** |`),''
];
const markdown = lines.join('\n');
if(process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,markdown+'\n');
console.log(markdown);
