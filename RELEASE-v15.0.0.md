# ONBOARD·OS v15.0.0 — Visual Polish & Density Refinement

v15.0.0은 기능 확장 릴리스가 아니라 P6 Business Flow를 그대로 유지한 visual polish / density refinement 릴리스입니다.

## What changed
- SSO 이후 첫 viewport의 정보 밀도와 section spacing rhythm 정리
- 공통 라이선스를 compact density system으로 전환해 과도한 여백 축소
- role-specific license card의 CTA/action hierarchy와 status scanability 유지·정교화
- request modal/drawer spacing 및 desktop/tablet/mobile responsive hierarchy 보정
- 검수된 visual regression baseline 3개만 갱신

## What did not change
- JavaScript business logic
- SaaS catalog data
- request-state machine 및 SLA semantics
- role-isolated scenario state
- P6 feature scope

## Verification contract
R1–R8, S1–S8, U1–U8, V1–V8, D1–D8, E1–E8, Chromium functional/WCAG/keyboard/ARIA/domain/role isolation/visual regression, Firefox/WebKit smoke, Desktop/Mobile Lighthouse, supply-chain, Production source integrity, Desktop Chromium + iPhone WebKit smoke를 모두 release evidence로 요구합니다.

## Production close-out
- Production target: `c04bc09687794cee6eee00b0140adce0fe2c27cf`
- Vercel Production: `dpl_7tMAWRrUQDqFcXnxBNExCqyUPXei` — READY · verified commit · canonical alias 연결
- Main E2E: #270 / `35158846438` — success
- Production source integrity: PASS
- Desktop Chromium + iPhone WebKit smoke: PASS
- R/S/U/V/D/E, Chromium regression, Firefox/WebKit, Desktop/Mobile Lighthouse, supply-chain: PASS
- Release workflow: #18 / `35159640394` — success
- Production Demo: `ONBOARD_OS_v15.0.0_P6_production_demo.mp4` — 정확히 36초
- Immutable GitHub Release: `v15.0.0` — target `c04bc09687794cee6eee00b0140adce0fe2c27cf` · `immutable: true`

## Release synchronization
Canonical runtime metadata, Production verified SHA, `version.txt`, Production Demo의 v15 MP4/Release 링크, README/CHANGELOG/release note, GitHub Release를 v15.0.0 기준으로 정합화했습니다. 이전 standalone release note는 CHANGELOG의 역사 기록과 immutable GitHub Releases로 통합 관리합니다.

## Production evidence
GitHub Release workflow가 Production-verified target SHA의 verification evidence를 검증하고 canonical Production을 Playwright Chromium으로 녹화한 정확히 36초 `ONBOARD_OS_v15.0.0_P6_production_demo.mp4`를 같은 immutable release에 포함합니다.
