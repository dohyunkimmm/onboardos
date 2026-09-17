# ONBOARD·OS v16.0.0 — Visual System Consolidation & Product Finish

v16.0.0은 기능 확장 릴리스가 아니라 P6 Business Flow를 그대로 유지한 design-only visual system consolidation 릴리스입니다.

## What changed
- 로그인과 post-login workspace의 surface/radius/elevation/typography grammar 통합
- Primary action / Selected state / Status state의 시각적 역할 분리
- Overview·role selector·progress·filter·license card의 공통 design token 체계 적용
- Common compact cards와 role execution cards의 정보 hierarchy 통일
- Modal·Drawer·Empty state 및 Desktop/Tablet/Mobile composition 정교화
- Production integrity 대상에 v16-visual-system.css 포함

## What did not change
- JavaScript business logic
- SaaS catalog data
- request-state machine 및 SLA semantics
- role-isolated scenario state
- P6 feature scope

## Verification contract
R1–R8, S1–S8, U1–U8, V1–V8, D1–D8, E1–E8, Chromium functional/WCAG/keyboard/ARIA/domain/role isolation/visual regression, Firefox/WebKit smoke, Desktop/Mobile Lighthouse, supply-chain, Production source integrity, Desktop Chromium + iPhone WebKit smoke를 모두 release evidence로 요구합니다.

## Production close-out
Production target SHA, Vercel deployment, Main E2E run, Release workflow run, 36초 Production Demo와 immutable GitHub Release 결과는 Production 검증 완료 후 이 문서에 고정합니다.
