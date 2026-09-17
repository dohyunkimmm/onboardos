# ONBOARD·OS v16.0.0 — Visual System Consolidation & Product Finish

v16.0.0은 기능 확장 릴리스가 아니라 P6 Business Flow를 그대로 유지한 design-only visual system consolidation 릴리스입니다.

## What changed
- 로그인과 post-login workspace의 surface/radius/elevation/typography grammar 통합
- Primary action / Selected state / Status state의 시각적 역할 분리
- Overview·role selector·progress·filter·license card의 공통 design token 체계 적용
- Common compact cards와 role execution cards의 정보 hierarchy 통일
- Modal·Drawer·Empty state 및 Desktop/Tablet/Mobile composition 정교화
- Production integrity 대상에 `v16-visual-system.css` 포함

## What did not change
- JavaScript business logic
- SaaS catalog data
- request-state machine 및 SLA semantics
- role-isolated scenario state
- P6 feature scope

## Verification contract
R1–R8, S1–S8, U1–U8, V1–V8, D1–D8, E1–E8, Chromium functional/WCAG/keyboard/ARIA/domain/role isolation/visual regression, Firefox/WebKit smoke, Desktop/Mobile Lighthouse, supply-chain, Production source integrity, Desktop Chromium + iPhone WebKit smoke를 모두 release evidence로 요구합니다.

## Production close-out
- Production target SHA: `9a38b1dde2b68bff9a3a4427736ee0983ed9c92a` (GitHub verified signature)
- Vercel Production: `dpl_9NoxR5aGGx2NUFfLMUvaqPKmR5d9` · READY · canonical alias connected
- Main E2E: #304 / `35178638129` · success
- Production source integrity: PASS · 138/138 manifest assets SHA-256 match
- Production browser smoke: Desktop Chromium + iPhone WebKit · 4/4 passed
- R1–R8 / S1–S8 / U1–U8 / V1–V8 / D1–D8 / E1–E8: PASS
- Chromium functional / WCAG / keyboard / ARIA / domain / role isolation / visual regression: PASS
- Firefox / WebKit functional smoke: PASS
- Desktop / Mobile Lighthouse 13.4.1 budgets: PASS
- Supply-chain security gate: PASS
- Release workflow: #19 / `35180957072` · success
- Production Demo: `ONBOARD_OS_v16.0.0_P6_production_demo.mp4` · Production 기준 정확히 36초로 생성·검증
- GitHub Release: `v16.0.0` · target `9a38b1dde2b68bff9a3a4427736ee0983ed9c92a` · immutable `true`
- Business Flow / catalog / request state / SLA / role isolation: P6 frozen, `businessFlowChanged=false`

Canonical runtime metadata, verified Production SHA, `version.txt`, README/CHANGELOG/release note, Production Demo links와 immutable GitHub Release는 v16.0.0을 기준으로 동기화했습니다. 이전 standalone release note는 CHANGELOG와 immutable GitHub Release history로 통합합니다.
