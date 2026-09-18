'use strict';

const fs = require('fs');

const readJson = path => JSON.parse(fs.readFileSync(path, 'utf8'));
const writeJson = (path, value) => fs.writeFileSync(path, JSON.stringify(value, null, 2) + '\n');

const release = readJson('release.json');
release.version = '18.0.0';
release.releaseClass = 'task-clarity-product-experience';
release.scope = 'design-only-task-clarity-execution-hierarchy';
release.businessFlowChanged = false;
release.releaseStatus = 'verified';
release.evidenceContract.releaseAssets = release.evidenceContract.releaseAssets.map(item =>
  /^ONBOARD_OS_v\d+\.\d+\.\d+_P6_production_demo\.mp4$/.test(item)
    ? 'ONBOARD_OS_v18.0.0_P6_production_demo.mp4'
    : item
);
writeJson('release.json', release);

for (const path of ['package.json', 'package-lock.json']) {
  const data = readJson(path);
  data.version = '18.0.0';
  if (path === 'package-lock.json' && data.packages?.['']) data.packages[''].version = '18.0.0';
  writeJson(path, data);
}

let versionText = fs.readFileSync('version.txt', 'utf8');
versionText = versionText
  .replace(/^ONBOARD·OS v\d+\.\d+\.\d+$/m, 'ONBOARD·OS v18.0.0')
  .replace(/^releaseClass=.*$/m, 'releaseClass=task-clarity-product-experience')
  .replace(/^scope=.*$/m, 'scope=design-only-task-clarity-execution-hierarchy')
  .replace(/^releaseStatus=.*$/m, 'releaseStatus=verified');
fs.writeFileSync('version.txt', versionText);

let demo = fs.readFileSync('production-demo.html', 'utf8');
demo = demo.replaceAll('v17.0.0', 'v18.0.0');
fs.writeFileSync('production-demo.html', demo);

let readme = fs.readFileSync('README.md', 'utf8');
const releaseBlock = '> **Portfolio release — v18.0.0 / P6 Production verified.** P6에서 동결한 제품 기능과 사용자·관리자 Business Flow는 그대로 유지하면서, 첫 viewport를 Current Task / Next Action 중심으로 재정렬하고 공통 라이선스를 compact entitlement로 낮춰 직무별 의사결정과 다음 행동이 더 빠르게 보이도록 개선했습니다. Role card의 status·SLA·CTA scan hierarchy를 정렬하고, 신청 Modal은 SLA·예상 지급일을 우선 노출하며, 사용자 신청현황과 관리자 queue는 요청번호 → 상태/SLA → 처리 Action → History 순으로 execution hierarchy를 강화했습니다. Desktop/Tablet/Mobile, focus, reduced-motion, forced-colors와 기존 P6 state/SLA/role-isolation 계약은 유지했으며 JavaScript business logic, catalog data, request-state machine은 변경하지 않았습니다. 정식 기준은 [GitHub Release v18.0.0](https://github.com/dohyunkimmm/onboardos/releases/tag/v18.0.0)과 공개 Verification Evidence로 고정합니다.';
const releasePattern = /^> \*\*Portfolio release — v\d+\.\d+\.\d+ \/ P6 Production verified\.\*\*.*$/m;
if (!releasePattern.test(readme)) throw new Error('README release block contract changed');
readme = readme.replace(releasePattern, releaseBlock);
readme = readme.replace(/영상 원본은 v\d+\.\d+\.\d+ GitHub Release asset으로 유지합니다\./, '영상 원본은 v18.0.0 GitHub Release asset으로 유지합니다.');
fs.writeFileSync('README.md', readme);

let changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
const marker = '# Changelog\n\n';
if (!changelog.startsWith(marker)) throw new Error('CHANGELOG header contract changed');
const section = `## v18.0.0 — Task Clarity & Product Experience — 2026-09-18

P6에서 동결한 Business Flow와 상태 모델을 유지하면서, v17의 Product Identity 위에 task-first information hierarchy와 execution clarity를 적용했습니다. 기능 추가 없이 Overview → Common/Role Licenses → Request Modal → User/Admin Drawer 전 구간에서 현재 할 일, 상태·SLA, 처리 Action과 History의 우선순위를 더 빠르게 파악하도록 정리했습니다. JavaScript business logic, catalog data, request-state machine, SLA semantics, role isolation은 변경하지 않았습니다.

### Task clarity & execution hierarchy
- 첫 viewport를 Current Task / Next Action 중심으로 재정렬하고 5-step P6 progress contract 유지
- 전사 공통 라이선스를 compact entitlement presentation으로 낮춰 직무별 decision surface를 우선 노출
- Role card의 status / SLA / CTA scan lane과 action hierarchy 정렬
- 신청 Modal에서 SLA·예상 지급일을 secondary metadata보다 먼저 읽도록 information hierarchy 강화
- 사용자 신청현황과 관리자 queue를 ticket → status/SLA → action → history 순으로 재구성
- 390px mobile에서도 critical facts/action이 viewport와 touch target contract를 유지하도록 보정
- T1–T8 task-clarity 및 X1–X6 execution-hierarchy regression contract 추가
- 별도 execution hierarchy stylesheet는 initial mobile FCP 예산을 지키기 위해 post-login deferred layer로 유지

### Preserved contracts
- P6 feature freeze / \`businessFlowChanged: false\`
- R1–R8 / S1–S8 / U1–U8 / V1–V8 / D1–D8 / E1–E8
- Desktop/Mobile Lighthouse budget, Firefox/WebKit smoke, Production smoke, SHA-256 integrity

`;
if (!changelog.includes('## v18.0.0 — Task Clarity & Product Experience')) {
  changelog = marker + section + changelog.slice(marker.length);
}
fs.writeFileSync('CHANGELOG.md', changelog);

let walkthrough = fs.readFileSync('docs/DEMO_WALKTHROUGH.md', 'utf8');
walkthrough = walkthrough.replaceAll('v17.0.0', 'v18.0.0');
fs.writeFileSync('docs/DEMO_WALKTHROUGH.md', walkthrough);
