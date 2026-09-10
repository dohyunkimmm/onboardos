'use strict';
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const config = require('../lighthouserc.cjs');

const collect = config.ci.collect;
const assertions = config.ci.assert.assertions;
const target = collect.url[0];
const numberOfRuns = collect.numberOfRuns || 3;
const reportDir = '.lighthouseci';
fs.rmSync(reportDir, {recursive:true, force:true});
fs.mkdirSync(reportDir, {recursive:true});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitForServer(){
  const deadline = Date.now() + (collect.startServerReadyTimeout || 15000);
  while(Date.now() < deadline){
    try{
      const response = await fetch(target);
      if(response.ok) return;
    }catch(_e){}
    await sleep(250);
  }
  throw new Error(`Lighthouse server did not become ready: ${target}`);
}

function metric(report, id){
  if(id.startsWith('categories:')) return report.categories[id.split(':')[1]]?.score;
  return report.audits[id]?.numericValue;
}

function checkReport(report, runNumber){
  const failures = [];
  for(const [id, definition] of Object.entries(assertions)){
    const [, rule] = definition;
    const value = metric(report, id);
    if(typeof value !== 'number'){
      failures.push(`run ${runNumber}: ${id} missing numeric value`);
      continue;
    }
    if(rule.minScore != null && value < rule.minScore) failures.push(`run ${runNumber}: ${id} ${value} < ${rule.minScore}`);
    if(rule.maxNumericValue != null && value > rule.maxNumericValue) failures.push(`run ${runNumber}: ${id} ${value} > ${rule.maxNumericValue}`);
  }
  return failures;
}

function printRun(report, runNumber){
  const score = name => (report.categories[name]?.score ?? 0).toFixed(2);
  const audit = name => report.audits[name]?.numericValue ?? 0;
  console.log([
    `Lighthouse run ${runNumber}/${numberOfRuns}`,
    `Performance ${score('performance')}`,
    `Accessibility ${score('accessibility')}`,
    `Best Practices ${score('best-practices')}`,
    `SEO ${score('seo')}`,
    `FCP ${Math.round(audit('first-contentful-paint'))}ms`,
    `LCP ${Math.round(audit('largest-contentful-paint'))}ms`,
    `TBT ${Math.round(audit('total-blocking-time'))}ms`,
    `CLS ${audit('cumulative-layout-shift').toFixed(3)}`,
    `Bytes ${Math.round(audit('total-byte-weight'))}`
  ].join(' · '));
}

(async()=>{
  const server = spawn(process.execPath, ['scripts/serve.js'], {stdio:['ignore','pipe','pipe']});
  server.stdout.on('data', chunk => process.stdout.write(chunk));
  server.stderr.on('data', chunk => process.stderr.write(chunk));
  try{
    await waitForServer();
    const failures = [];
    for(let i=1; i<=numberOfRuns; i++){
      const outputPath = path.join(reportDir, `lhr-${i}.json`);
      const args = [
        '--no-install', 'lighthouse', target,
        '--output=json',
        `--output-path=${outputPath}`,
        `--preset=${collect.settings?.preset || 'desktop'}`,
        `--chrome-flags=${collect.settings?.chromeFlags || '--headless --no-sandbox'}`,
        '--quiet'
      ];
      const result = spawnSync('npx', args, {stdio:'inherit'});
      if(result.status !== 0) throw new Error(`Lighthouse CLI failed on run ${i} with status ${result.status}`);
      const report = JSON.parse(fs.readFileSync(outputPath,'utf8'));
      printRun(report, i);
      failures.push(...checkReport(report, i));
    }
    if(failures.length){
      console.error('Lighthouse budget FAILED:');
      failures.forEach(failure => console.error(`- ${failure}`));
      process.exitCode = 1;
    }else{
      console.log(`Lighthouse budget PASS: ${numberOfRuns}/${numberOfRuns} runs satisfy every configured threshold`);
    }
  } finally {
    server.kill('SIGTERM');
  }
})().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
