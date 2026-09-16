# Changelog

## v15.0.0 — Visual Polish & Density Refinement — 2026-09-17

P6에서 동결한 Business Flow와 상태 모델은 유지하면서, v14 Operational Command Center 위에 visual polish와 density refinement를 적용했습니다. SSO 이후 첫 viewport의 정보 밀도를 재조정하고 공통 라이선스 영역을 compact system으로 정리해 직무별 다음 행동이 더 빨리 보이도록 개선했습니다. JavaScript business logic, catalog data, request-state machine, role isolation은 변경하지 않았습니다.

### Visual polish / density refinement
- 공통 라이선스의 과도한 vertical whitespace를 줄이고 compact card/section density로 정리
- overview → filter → common licenses → role licenses의 spacing rhythm과 scan hierarchy 정교화
- role card의 CTA/action depth와 status/SLA hierarchy는 유지하면서 주변 여백을 다듬음
- request modal/drawer의 action-zone spacing과 desktop/tablet/mobile responsive density 보정
- desktop dashboard 전체 높이와 mobile scroll depth를 줄여 첫 viewport에서 다음 업무가 더 빨리 드러나도록 개선
- 승인된 visual regression baseline은 desktop dashboard, mobile dashboard, desktop request modal 3개만 갱신

### Preserved contracts
- P6 feature freeze / `businessFlowChanged: false`
- R1–R8 Resilience/Recovery
- S1–S8 Security/Failure-containment
- U1–U8 Interaction UX/Accessibility
- V1–V8 Visual System/Usability
- D1–D8 Design Polish/Responsive Hierarchy
- E1–E8 Experience Refinement

## v14.0.0 — Operational Command Center — 2026-09-16

P6에서 동결한 Business Flow와 상태 모델은 유지하면서, Production에서 검증한 v14 post-login design layer를 정식 릴리즈 계약으로 승격했습니다. 기존 product workspace를 Operational Command Center로 정리해 identity/role/progress hierarchy, filter command shelf, work-zone sections, card state rail과 CTA lane, modal·drawer execution surface, mobile task prioritization을 강화했습니다. JavaScript business logic, catalog data, request-state machine, role isolation과 login baseline은 변경하지 않았습니다.

### Release/link synchronization
- `release.json`, `version.txt`, `package.json`, `package-lock.json`을 v14.0.0으로 동기화
- `README.md`, `production-demo.html`, release notes와 GitHub Release 링크를 v14.0.0으로 동기화
- release evidence의 36초 Production Demo asset 이름을 `ONBOARD_OS_v14.0.0_P6_production_demo.mp4`로 동기화
- canonical release contract와 Production provenance가 일치하지 않으면 release workflow가 발행을 차단하는 규칙 유지

### Preserved contracts
- P6 feature freeze / `businessFlowChanged: false`
- R1–R8 Resilience/Recovery
- S1–S8 Security/Failure-containment
- U1–U8 Interaction UX/Accessibility
- V1–V8 Visual System/Usability
- D1–D8 Design Polish/Responsive Hierarchy
- E1–E8 Experience Refinement

## v13.0.0 — Product-grade visual system — 2026-09-16

P6에서 동결한 Business Flow와 상태 모델은 유지하면서, Production에서 검증한 v13 post-login visual layer를 정식 릴리즈 계약으로 승격했습니다. 화면을 하나의 product workspace로 재구성하고 identity/role selection, operational progress rail, filter command surface, license section/card hierarchy, modal·admin drawer execution surface, responsive ergonomics를 정교화했습니다. JavaScript business logic, catalog data, request-state machine, role isolation은 변경하지 않았습니다.

### Release/link synchronization
- `release.json`, `version.txt`, `package.json`, `package-lock.json`을 v13.0.0으로 동기화
- `README.md`, `production-demo.html`, release notes와 GitHub Release 링크를 v13.0.0으로 동기화
- release evidence의 36초 Production Demo asset 이름을 `ONBOARD_OS_v13.0.0_P6_production_demo.mp4`로 동기화
- canonical `release.json`과 Production provenance가 일치하지 않으면 release contract가 차단하도록 기존 규칙 유지

### Preserved contracts
- P6 feature freeze / `businessFlowChanged: false`
- R1–R8 Resilience/Recovery
- S1–S8 Security/Failure-containment
- U1–U8 Interaction UX/Accessibility
- V1–V8 Visual System/Usability
- D1–D8 Design Polish/Responsive Hierarchy
- E1–E8 Experience Refinement

## v12.0.0 — Action-first UI/UX refinement — 2026-09-16

P6에서 동결한 Business Flow와 상태 모델은 유지하면서, v11 후보로 Production 검증한 action-first UI/UX 레이어를 정식 v12 릴리즈 계약으로 승격했습니다. 현재 단계와 다음 행동의 우선순위, 카드 스캔성, semantic 상태 단서, CTA 계층, 모바일 조작성, focus-visible/reduced-motion/WCAG AA 대비를 정리했으며 JavaScript·data·request-state·role logic은 변경하지 않았습니다.

### Release/link synchronization
- `release.json`, `version.txt`, `package.json`, `package-lock.json`을 v12.0.0으로 동기화
- `production-demo.html`의 설명·ARIA·MP4 asset·GitHub Release 링크를 v12.0.0으로 동기화
- Release workflow가 canonical tag에서 36초 Production Demo를 녹화해 동일 immutable GitHub Release에 evidence와 함께 발행하도록 통합
- 기존 v1.7.0 전용 demo workflow/request 파일 제거
- release contract가 Production Demo와 README의 canonical 버전 링크 불일치를 자동으로 차단

### Preserved contracts
- P6 feature freeze / `businessFlowChanged: false`
- R1–R8 Resilience/Recovery
- S1–S8 Security/Failure-containment
- U1–U8 Interaction UX/Accessibility
- V1–V8 Visual System/Usability
- D1–D8 Design Polish/Responsive Hierarchy
- E1–E8 Experience Refinement

## v10.0.0 — Visual hierarchy & responsive polish — 2026-09-15

P6에서 동결한 제품 기능과 사용자·관리자 Business Flow는 그대로 유지하면서, 로그인 이후 화면의 정보 위계·타이포그래피·간격·카드·상태·CTA·Modal/Drawer·반응형 밀도를 리파인하고 D1–D8 Design Polish / Responsive Hierarchy gate로 검증했습니다. 새 SaaS·직무·상태·승인 Flow는 추가하지 않았습니다.

### Visual hierarchy & responsive polish
- 승인된 로그인 surface는 유지하고 v10 polish를 post-login 화면에 한정
- typography와 spacing rhythm을 정리해 제목·설명·상태·액션의 우선순위를 선명하게 조정
- 카드 surface, status pill, CTA hierarchy, request modal과 admin drawer의 시각 위계를 정교화
- Desktop/Tablet/Mobile에서 dashboard 밀도와 grid를 조정하고 작은 화면의 정보 스캔성과 조작성을 개선
- v9의 V1–V8 focus/pressed/selected-state contract를 유지하면서 D1–D8 전용 Playwright gate와 새 visual baseline을 추가

### Preserved contracts
- R1–R8 Resilience/Recovery contract 유지
- S1–S8 Security/Failure-containment contract 유지
- U1–U8 Interaction UX/Accessibility contract 유지
- V1–V8 Visual System/Usability contract 유지
- P6 feature freeze와 `businessFlowChanged: false` 유지

### Release evidence
- `release.json` schema v9 / `evidenceContract` schema v8로 올려 Design polish를 필수 release gate에 포함
- D1–D8 raw screenshot evidence는 target E2E design-polish artifact에 보존하고, 결과는 `verification-summary`에 포함
- immutable GitHub Release asset 7종 요구는 유지: `verification-summary.json`, `verification-summary.md`, `asset-integrity.json`, `resilience-summary.json`, `security-summary.json`, `ux-summary.json`, `visual-system-summary.json`

### Verification
- PR #62: v10 visual hierarchy/responsive polish와 D1–D8 gate 도입, 최종 PR E2E #179 전체 gate 통과
- Production runtime commit `35dfc0d36e0269936301d07f418535224914ccf1` / Vercel deployment `dpl_AHfPmXt1FEd9BBXBXFnRZM92qZVS`: READY, GitHub verified commit 기준 배포
- Main E2E run #180 (`34939680319`): 전체 workflow `completed / success`
- Resilience scenarios: **R1–R8 8/8 PASS**
- Security scenarios: **S1–S8 8/8 PASS**
- Interaction UX scenarios: **U1–U8 8/8 PASS**
- Visual System / Usability scenarios: **V1–V8 8/8 PASS**
- Design Polish / Responsive Hierarchy scenarios: **D1–D8 8/8 PASS**
- Firefox/WebKit functional smoke, Desktop/Mobile Lighthouse, Supply-chain gate: PASS
- Production source integrity: PASS
- Production Desktop Chromium + iPhone WebKit browser smoke: PASS
- Production integrity artifact `10384594716` / `sha256:a269d9f297a14a6d1ff64cc732b3623559c0d758e44b18c3a2819d3ac8f28940`
- Verification evidence artifact `10385051188` / `sha256:2f9cdac087a21a4828c99eb5b497ccbca62eb1025bd578ad3a2e880ee5a03b6f`
- Resilience evidence artifact `10385020834` / `sha256:924c0cc74f253ea9272e3f32c7f76f57d0f5bfb1e66ee7f3f96621c453131202`
- Security evidence artifact `10384463222` / `sha256:2f0891f48420b1972144e9306f054a02ba5a2a3e147a8a44b83de4a618513c56`
- UX evidence artifact `10384559558` / `sha256:9c75416ab79e62b4b3fb17ded9f0de8ff1b244ac6f8921a2abf30d2863baf5a3`
- Visual-system evidence artifact `10385005852` / `sha256:045b542f499f22cccf739a1d18892ab33325ddcd0554f040410e34df6aa7b2ab`
- Design-polish evidence artifact `10384318377` / `sha256:79f9ba570d9e185fdc4ca35dd7148b456722a5369f5388782c3ffa1c3d930762`
- PR #63: Production-verified SHA를 고정한 evidence-backed v10 release request closeout
- Release workflow #13 (`34940510998`): target evidence 검증 및 immutable GitHub Release 생성 PASS
- Immutable GitHub Release: `v10.0.0`, target `35dfc0d36e0269936301d07f418535224914ccf1`, required evidence assets 7종 포함

### Release status
v10.0.0은 기능 확장이 아닌 **Visual hierarchy / responsive polish / design-system refinement** 릴리스이며, P6 Business Flow를 유지한 상태로 Production 검증과 immutable Release 발행을 완료했습니다.

---

## v9.0.0 — Visual system & usability hardening — 2026-09-15

P6에서 동결한 제품 기능과 사용자·관리자 Business Flow는 그대로 유지하면서, 기존 화면의 keyboard focus·pressed·selected state·modal/drawer hierarchy·forced-colors·mobile touch affordance를 V1–V8 Visual System / Usability gate로 별도 검증하도록 강화했습니다. 새 SaaS·직무·상태·승인 Flow는 추가하지 않았습니다.

### Visual system & usability hardening
- 기존 승인된 visual baseline을 유지하면서 keyboard focus와 focus-within 상태의 식별성을 강화
- 버튼 pressed feedback, 역할/필터 selected-state signaling, 카드 focus parity를 interaction-state contract로 고정
- request modal과 admin drawer의 action hierarchy 및 모바일 touch affordance를 보강
- forced-colors 환경과 hover-none 환경에서 상태 신호가 유지되도록 보완
- 전용 Playwright Visual System profile로 V1–V8 scenario와 필수 screenshot evidence를 자동 검증

### Preserved contracts
- R1–R8 Resilience/Recovery contract 유지
- S1–S8 Security/Failure-containment contract 유지
- U1–U8 Interaction UX/Accessibility contract 유지
- P6 feature freeze와 `businessFlowChanged: false` 유지

### Release evidence
- `visual-system-summary.json`을 machine-readable evidence로 추가
- `release.json` schema v8 / `evidenceContract` schema v7로 올려 Visual system & usability를 필수 release gate에 포함
- immutable GitHub Release asset에 `verification-summary.json`, `verification-summary.md`, `asset-integrity.json`, `resilience-summary.json`, `security-summary.json`, `ux-summary.json`, `visual-system-summary.json` 7종을 요구

### Verification
- PR #58: v9 visual-system/usability hardening과 V1–V8 gate 도입, 최종 PR E2E #167 전체 통과
- PR #59: Vercel Hobby quota reset 이후 semantic no-op 재배포 trigger를 검증 후 merge
- Production runtime commit `5412930f98d7c33fcdc1c2c3289c8e179d7f394a` / Vercel deployment `dpl_BCLBcWdYaGYZJEyDBRFN67oRV1je`: READY, GitHub verified commit 기준 배포
- Main E2E run #170 (`34927827432`): 전체 workflow `completed / success`
- Resilience scenarios: **R1–R8 8/8 PASS**
- Security scenarios: **S1–S8 8/8 PASS**
- Interaction UX scenarios: **U1–U8 8/8 PASS**
- Visual System / Usability scenarios: **V1–V8 8/8 PASS**
- Firefox/WebKit functional smoke, Desktop/Mobile Lighthouse, Supply-chain gate: PASS
- Production source integrity: PASS
- Production Desktop Chromium + iPhone WebKit browser smoke: PASS
- Production integrity artifact `10381190248` / `sha256:a3cb2349122ebadac5869cd5e53f0b91d2bef6ae99b65b64cb3c703c4a739d20`
- Verification evidence artifact `10381100473` / `sha256:84d82a0649c4c00871ef74d39bbc8f1536b619148da1e49f6a8f1e4cb3898c4b`
- Resilience evidence artifact `10380690921` / `sha256:f40e9a3f433a9131530287baf3597c8df9cb306505a39a47af7b9ca3261cf698`
- Security evidence artifact `10380442125` / `sha256:8def9262778f32e69f6d13991e8963bd3aebd5f1252fc25010adf9e8076a0405`
- UX evidence artifact `10381005311` / `sha256:361b788bf188ae99aef763fbf93732d1e06de86ca589cf25a8f50fc6ca36cbcb`
- Visual-system evidence artifact `10379639314` / `sha256:ac1e471d332b7c5749537dccd753096e50ec8b2ae5f745b13f04477696336ef7`
- PR #60: Production-verified SHA를 고정한 evidence-backed v9 release request closeout
- Release workflow #12 (`34928474036`): evidence 검증 및 immutable GitHub Release 생성 PASS
- Immutable GitHub Release: `v9.0.0`, target `5412930f98d7c33fcdc1c2c3289c8e179d7f394a`, required evidence assets 7종 포함

### Release status
v9.0.0은 기능 확장이 아닌 **Visual System / Usability / interaction-state hardening** 릴리스이며, P6 Business Flow를 유지한 상태로 Production 검증과 immutable Release 발행을 완료했습니다.

---

## v7.0.0 — Security & failure-containment hardening — 2026-09-15

P6에서 동결한 제품 기능과 사용자·관리자 Business Flow는 그대로 유지하면서, 브라우저 보안 경계와 장애 격리를 S1–S8 전용 gate로 검증하고 machine-readable security evidence까지 immutable Release에 연결하도록 강화했습니다. 로그인 SSO 전환과 모바일 반응형 UX의 회귀도 별도 자동 검증으로 고정했습니다.

### Security & failure containment
- 전용 Playwright Security profile로 S1–S8 security/failure-containment scenario를 기존 Chromium·R1–R8 gate와 독립적으로 운영
- Analytics event/field allowlist와 identifier-like value rejection을 적용해 telemetry payload 경계를 강화
- CSP/security headers, URL·Storage·Console·Telemetry·unsafe DOM boundary의 실패 격리를 검증
- 기존 R1–R8 Resilience/Recovery contract와 P6 Business Flow는 변경하지 않음

### UI/UX regression hardening
- Google SSO 인증 피드백을 기존 note 영역에 overlay해 로그인 카드가 로딩 중 resize/recenter되지 않도록 고정
- 5단계 tracker를 주 진행 모델로 유지하고 별도 숫자 mini-counter를 `다음 행동` / `완료` 안내로 정리
- 모바일 reviewer safe-area, 중복 reset 노출 제거, 360px 미만 공통 라이선스 1열, Drawer 44px touch target을 회귀 테스트로 고정

### Release evidence
- `security-summary.json`을 machine-readable evidence로 추가하고 S1–S8 결과를 기록
- `release.json` schema v6 / `evidenceContract` schema v5로 올려 Security & containment를 필수 release gate에 포함
- immutable GitHub Release asset에 `verification-summary.json`, `verification-summary.md`, `asset-integrity.json`, `resilience-summary.json`, `security-summary.json` 5종을 요구

### Scope
- 새 SaaS·직무·상태·승인 Flow 추가 없음
- 신청·반려·보완 재신청·Fallback·SLA·상태 격리 정책 변경 없음
- P6 feature freeze와 `businessFlowChanged: false` 유지

### Verification
- PR #49: v7 security/failure-containment contract와 S1–S8 gate 도입
- PR #52: SSO geometry·font stability·responsive UI/UX 회귀 보강, PR E2E 전체 통과
- PR #53 / Production target `6732047aed507e7d1f40c9635f7c4b7de3495472` / Vercel deployment `dpl_89ZLDRTJX1qPbpgV6QdoFNigoHvn`: READY, GitHub verified commit 기준 배포
- Main E2E run #149 (`34903477287`): 전체 workflow `completed / success`
- Chromium 기능·WCAG/Keyboard/ARIA·Domain·Visual Regression: PASS
- Resilience scenarios: **R1–R8 8/8 PASS**
- Security scenarios: **S1–S8 8/8 PASS**
- Firefox/WebKit functional smoke, Desktop/Mobile Lighthouse, Supply-chain gate: PASS
- Production source integrity: PASS
- Production Desktop Chromium + iPhone WebKit browser smoke: PASS
- Production integrity artifact `10372385230` / `sha256:f1447d540324c455d179da74b4f07b00c7ae8bb08109bb0610f6866e2b964ae9`
- Verification evidence artifact `10371796562` / `sha256:2d29ba74a5672a946309c6943a1f909abfe7d116df0f33d0b5d032acf29d55ea`
- Resilience evidence artifact `10371394270` / `sha256:05b6b1bc4ad807b162598445ccc1920655b52136acf34762911af0709edf308c`
- Security evidence artifact `10371434392` / `sha256:fcd5c6bf52994d1f98a44965d93c5c64df8f404225296334245339f685459b3a`
- PR #54: evidence-backed release request closeout
- Immutable GitHub Release: `v7.0.0`, target `6732047aed507e7d1f40c9635f7c4b7de3495472`, required evidence assets 5종 포함

### Release status
v7.0.0은 기능 확장이 아닌 **Security / Failure-containment / evidence gating + UI/UX regression hardening** 릴리스이며, P6 Business Flow를 유지한 상태로 Production 검증과 immutable Release 발행을 완료했습니다.

---

## v6.0.0 — Resilience & recovery hardening — 2026-09-14

P6에서 동결한 제품 기능과 사용자·관리자 Business Flow는 그대로 유지하면서, 손상·구버전·저장장애·새로고침·stale client 상황에서 상태를 안전하게 복구할 수 있는지 별도 Resilience gate와 machine-readable evidence로 검증하도록 강화했습니다.

### Resilience & recovery
- `SESSION_SCHEMA_VERSION=4`를 명시하고 저장 payload에 schema marker를 기록해 future schema를 구버전 client가 잘못 읽지 않도록 safe reset 처리
- malformed current/legacy payload에서 유효 request만 보존하고 손상 record는 선택적으로 폐기
- Storage read/write/remove 장애와 Analytics/Speed Insights 장애를 핵심 신청 Flow에서 격리
- 신청 직후 reload에서도 로그인·request·ticket 연속성을 보존
- 전용 Playwright profile로 R1–R8 fault-injection scenario를 일반 Chromium 회귀와 독립된 CI gate로 운영

### Release evidence
- `resilience-summary.json`을 machine-readable evidence로 생성
- `release.json` schema v5 / `evidenceContract` schema v4로 올리고 `Resilience & recovery`를 필수 release gate에 추가
- Release workflow가 target run의 verification/integrity/resilience evidence를 함께 다운로드하고 commit/version/schema/scenario 결과를 교차 검증
- immutable GitHub Release asset에 `verification-summary.json`, `verification-summary.md`, `asset-integrity.json`, `resilience-summary.json` 4종을 요구

### Scope
- 새 SaaS·직무·상태·승인 Flow 추가 없음
- 신청·반려·보완 재신청·Fallback·SLA·상태 격리 정책 변경 없음
- P6 feature freeze와 `businessFlowChanged: false` 유지

### Verification
- PR #46 / E2E run #120 (`34812233707`): Chromium·R1–R8 Resilience·Firefox/WebKit·Desktop/Mobile Lighthouse·Supply-chain·verification evidence 모두 통과
- PR #47 / E2E run #122 (`34812727820`): public resilience provenance 정렬 후 전체 gate 재통과
- Production runtime commit `6185baa82aa7a1a6b11a6d067886b69f47248f31` / Vercel deployment `dpl_6W2VSgXmCiDchPpC9SQeFuMc9pM9`: READY, GitHub verified commit 기준 배포
- Main E2E run #123 (`34812936803`): 전체 workflow `completed / success`
- Resilience scenarios: **R1–R8 8/8 PASS**
- Production source integrity: **133/133 canonical manifest assets** SHA-256 일치
- Production Desktop Chromium + iPhone WebKit browser smoke: **2/2 PASS**
- Production integrity artifact `10336140089` / `sha256:20a38325c8dfc77928a86c20e9f8e2187a72be41e5b93dc6ad0f5096121a42c6`
- Verification evidence artifact `10335716195` / `sha256:a8e712a2c7ea6b9f74686426492d365818defb69f74a64fe1ea9c16d807fbc82`
- Resilience evidence artifact `10335054487` / `sha256:d11c70367e284c2beb791df9314f68eac8dafbb47785432502942276247565e9`

### Release status
v6.0.0은 기능 확장이 아닌 **Resilience & Recovery / fault-injection / recovery evidence gating** 릴리스이며, P6 Business Flow를 유지한 상태로 Production 검증을 완료했습니다.

---

## v5.0.0 — Production observability & release evidence automation — 2026-09-14

P6에서 동결한 제품 기능과 사용자·관리자 Business Flow는 그대로 유지하면서, Production 검증 evidence를 사람이 수동으로 옮기지 않아도 Release가 성공한 target run과 검증 artifact를 직접 확인하고 함께 발행하도록 릴리스 파이프라인을 강화했습니다.

### Release evidence automation
- `release.json`을 schema v4 / v5.0.0으로 올리고 `evidenceContract`를 canonical release contract에 추가
- Release workflow가 지정 target SHA의 성공한 `main` E2E run을 자동 탐색하고, 해당 run의 `verification-evidence-*`와 `production-integrity-*` artifact를 다운로드
- `scripts/release-evidence.js`가 verification summary schema/version/commit/run/gate 결과와 Production asset integrity의 commit/allMatch를 교차 검증
- 검증을 통과한 `verification-summary.json`, `verification-summary.md`, `asset-integrity.json` 3개 파일을 GitHub Release asset으로 자동 첨부
- 성공한 target evidence가 없거나 stale/mismatch면 tag/Release 생성 전에 실패하도록 release gate 강화

### Canonical version consistency
- `package-lock.json`의 오래된 1.7.0 프로젝트 metadata를 v5.0.0으로 재생성
- `release.json`의 `syncedArtifacts`에 `package-lock.json`을 추가하고 Fast Quality Gate에서 `release.json` ↔ `version.txt` ↔ `package.json` ↔ `package-lock.json` 일치를 강제
- `scripts/release-evidence.js` 자체도 canonical Production integrity manifest에 포함

### Scope
- 새 SaaS·직무·상태·승인 Flow 추가 없음
- 신청·반려·보완 재신청·Fallback·SLA·상태 격리 로직 변경 없음
- P6 feature freeze와 `businessFlowChanged: false` 유지

### Verification
- PR #44 / E2E run #116 (`34806249888`): v5 release/evidence contract, Chromium 기능·WCAG/Keyboard/ARIA·Domain·Recovery·Visual Regression, Firefox/WebKit smoke, Desktop/Mobile Lighthouse, Supply-chain gate 모두 통과
- Production runtime commit `f595811cf0453ca4525d24924fa5d1dcaa36eaf7` / Vercel deployment `dpl_4tm1iiRxbfz2crW4CTe9yrJWFL2w`: `READY`, GitHub verified commit 기준 배포
- Main E2E run #117 (`34806397415`): 전체 workflow `completed / success`
- Production source integrity: **132/132 canonical manifest assets** SHA-256 일치
- Production Desktop Chromium + iPhone WebKit browser smoke: **2/2 passed**
- Production `/release.json`·`/version.txt`: HTTP 200, v5.0.0 / P6 / `releaseChannel=production` / `businessFlowChanged=false` / evidence contract 확인
- Production integrity artifact `10333261437` / `sha256:b1e61b1accaabbf990d610535d65186f85f68a96960c079f3dc573bcc2285155`
- Verification evidence artifact `10333490774` / `sha256:0cd2434324a2c751606a6184bc0cbc357016b8b79045270fb3fb17e66ed5a73c`

### Release status
v5.0.0은 제품 기능 확장이 아닌 **Production observability / release evidence automation / stale-evidence release gating** 릴리스이며, 새 Production 배포와 132/132 integrity·2-browser smoke까지 통과한 **Production verified** 상태입니다.

---

## v4.0.0 — Operational UX & reviewer experience polish — 2026-09-14

P6에서 동결한 제품 기능과 사용자·관리자 Business Flow는 그대로 유지하면서, 관리자 운영 화면의 scanability·SLA 위험 인지·모바일 처리 ergonomics와 reviewer-facing 완성도를 강화했습니다. 새 SaaS·직무·상태·승인 Flow는 추가하지 않았습니다.

### Operational UX polish
- 관리자 Drawer의 KPI/요약 영역을 스크롤 중에도 빠르게 확인할 수 있도록 정리
- SLA 위험도가 높은 요청을 카드 수준에서 더 빠르게 식별할 수 있도록 시각적 강조를 추가
- 모바일 관리자 처리 버튼과 touch layout을 안정화해 승인·반려·지급 액션의 조작성을 개선
- 기존 로그인/Dashboard/신청 Modal visual regression baseline은 유지

### Accessibility & reviewer experience
- 관리자 Drawer 접근성 트리 변경에 맞춰 ARIA snapshot contract를 갱신하고 기존 axe/keyboard/focus 기준은 유지
- `version.txt`에 `releaseChannel=production`을 명시해 사람이 읽는 provenance와 canonical `release.json` contract를 일치시킴
- 기존 36초 Demo → 2–3분 Live Production → Case Study reviewer route는 유지

### Delivery hardening
- Vercel 자동 배포를 `main` 중심으로 제한해 feature/PR Preview가 Hobby deployment quota를 소모하지 않도록 정리
- build-rate-limit 이후 새 verified `main` commit으로 Production 재배포를 성공시키고 동일 runtime에 대해 integrity/browser smoke를 재검증

### Scope
- 새 SaaS·직무·상태·승인 Flow 추가 없음
- 신청·반려·보완 재신청·Fallback·SLA·상태 격리 로직 변경 없음
- P6 feature freeze와 `businessFlowChanged: false` 유지

### Verification
- PR #39: v4 운영 UX polish, ARIA contract, Chromium 기능·WCAG/Keyboard/ARIA·Domain·Recovery·Visual Regression, Firefox/WebKit smoke, Desktop/Mobile Lighthouse, Supply-chain gate 통과
- PR #40: non-main Vercel auto-deploy quota guard 검증 후 merge
- PR #41: `version.txt`의 `release.json`·`integrity-assets.json` provenance marker 복구 후 전체 PR quality gate 통과
- PR #42 / E2E run #112 (`34804713037`): `releaseChannel=production` marker 정렬 후 Chromium 회귀·Firefox/WebKit·Desktop/Mobile Lighthouse·Supply-chain gate 모두 통과
- Production runtime commit `492d66ed751af559d7d407951a7359a010e71b52` / Vercel deployment `dpl_FSGMTfETJLyfC7rDrgvk5SEH5npe`: `READY`, GitHub verified commit 기준 배포
- Main E2E run #113 (`34804837886`): 전체 workflow `completed / success`
- Production source integrity: **131/131 canonical manifest assets** SHA-256 일치
- Production Desktop Chromium + iPhone WebKit browser smoke: **2/2 passed**
- Production integrity artifact `10332134155` / `sha256:3f2dd8edfb7dba700e5843cf421355682eb7a751f0a442b71a643b24266c17a7`
- Verification evidence artifact `10333121933` / `sha256:14fff56a150752336158e4f94cdcb4fd5d0d6a97c3ba78c259908d1c2e19b381`

### Release status
v4.0.0은 P6 기능 동결을 유지하면서 **운영 UX·reviewer experience·deployment quota hygiene**를 강화한 major polish 릴리스이며, 새 Production 배포와 131/131 integrity·2-browser smoke까지 통과한 **Production verified** 상태입니다.

---

## v3.0.0 — Canonical Production integrity manifest — 2026-09-14

P6에서 동결한 제품 기능과 사용자·관리자 Business Flow는 그대로 유지하면서, Production SHA-256 검증 대상을 코드의 수동 목록이 아니라 하나의 canonical manifest에서 자동 발견하도록 구조를 강화했습니다.

### Canonical integrity manifest
- `release.json`을 schema v3 / v3.0.0으로 올리고 `integrityManifest: integrity-assets.json`을 canonical release contract에 연결
- `integrity-assets.json`에 필수 공개 asset과 재귀 탐색 규칙을 선언해 Production integrity surface를 데이터로 관리
- `scripts/public-assets.js`가 `js/**/*.js`, `icons/**/*.svg`, `fonts/pretendard/**/*.woff2`를 재귀 탐색하고 unsafe path·symlink·중복·필수 coverage를 차단
- `scripts/asset-integrity.js`의 hand-maintained asset 배열을 제거하고 canonical manifest에서 검증 대상을 생성
- Fast Quality Gate와 `scripts/release-contract.js`가 manifest 자체와 critical asset coverage를 함께 검증

### Contract-driven Production verification
- Production smoke가 사람용 버전 설명 문구에 의존하지 않고 checkout의 `release.json`·`integrity-assets.json`과 실제 Production 응답을 직접 비교
- `version.txt`·`package.json`은 `release.json` v3.0.0과 일치하도록 유지하고, P6 `businessFlowChanged=false` contract를 그대로 보존
- 기존 CSP, login font metric, 36초 Demo, 사용자/관리자 핵심 Business Flow, Desktop Chromium + iPhone WebKit smoke를 그대로 유지

### Scope
- 새 SaaS·직무·상태·승인 Flow 추가 없음
- 신청·반려·보완 재신청·Fallback·SLA·상태 격리 로직 변경 없음
- P6 feature freeze와 `businessFlowChanged: false` 유지

### Verification
- PR #36 / E2E run #99 (`34783933711`): v3 release contract·integrity manifest, Chromium 기능·WCAG/Keyboard/ARIA·Domain·Recovery·Visual Regression, Firefox/WebKit smoke, Desktop/Mobile Lighthouse, Supply-chain gate 모두 통과
- Production runtime commit `b684b8b33d53e40a7f533f7c1134e7788db61efa` / Vercel deployment `dpl_36518CCTM9ZhBg9fjTcoXrZpSFvK`: `READY`, GitHub verified commit 기준 배포
- Verification-only main commit `1673b7e1f06911bc46b135e7fbc5c1a503bbc272` / E2E run #102 (`34784373623`): 전체 workflow `completed / success`
- Production source integrity: **131/131 canonical manifest assets** SHA-256 일치
- Production Desktop Chromium + iPhone WebKit browser smoke: **2/2 passed**
- Production `/release.json`·`/integrity-assets.json`: HTTP 200, v3.0.0 / P6 / `releaseChannel=production` / `businessFlowChanged=false` / canonical manifest 확인
- Production integrity artifact `10326162286` / `sha256:435d8801c642927fbfeea85934112aacb7e619eb4b78a611f5a9f34b28f5e7ca`
- Verification evidence artifact `10326600262` / `sha256:f0d614daa71d75f4f80b64c7e2fcc9104db38d661a7fe2589241a6e5bf1391a8`

### Release status
v3.0.0은 제품 기능 확장이 아닌 **canonical Production integrity manifest / deployable asset source-of-truth hardening** 릴리스이며, 새 Production 배포와 131/131 integrity·2-browser smoke까지 통과한 **Production verified** 상태입니다.

---

## v2.0.0 — Canonical release contract & version source-of-truth unification — 2026-09-14

P6에서 동결한 제품 기능과 사용자·관리자 Business Flow는 그대로 유지하면서, 릴리스 버전과 검증 계약을 하나의 canonical source에서 관리하도록 구조를 정리했습니다.

### Canonical release contract
- `release.json` schema를 v2로 올리고 `canonicalVersionSource: release.json`을 명시
- `version.txt`와 `package.json`을 `release.json`의 동기화 대상(`syncedArtifacts`)으로 고정
- 이전까지 `package.json`에 남아 있던 1.7.0 버전 drift를 제거하고 v2.0.0으로 정렬
- `scripts/release-contract.js`를 추가해 semantic version·P6 freeze·`businessFlowChanged=false`·verification contract·동기화 artifact 일치를 한 곳에서 검증
- `releaseChannel: production`을 canonical contract에 포함해 Production release 상태를 machine-readable 형태로 노출

### Verification hardening
- Fast Quality Gate가 별도 중복 로직 대신 canonical release contract validator를 호출하도록 통합
- Production smoke에서 특정 버전을 하드코딩하지 않고 checkout의 `release.json` 전체와 Production `/release.json`을 직접 비교
- 공개되는 `release.json`·`version.txt`·`scripts/release-contract.js`를 Production SHA-256 integrity로 검증하고, 공개되지 않는 `package.json`은 CI release-contract consistency gate에서 검증
- 기존 Desktop Chromium + iPhone WebKit Production smoke, CSP, login font metric, 36초 Demo, Business Flow 검증은 유지

### Scope
- 새 SaaS·직무·상태·승인 Flow 추가 없음
- 신청·반려·보완 재신청·Fallback·SLA·상태 격리 로직 변경 없음
- P6 feature freeze와 `businessFlowChanged: false` 유지

### Verification
- PR #32 / E2E run #91 (`34765803300`): canonical release contract, Chromium 기능·WCAG/Keyboard/ARIA·Domain·Recovery·Visual Regression, Firefox/WebKit smoke, Desktop/Mobile Lighthouse, Supply-chain gate 모두 통과
- Production runtime commit `aacd7fb9811d16f86b9bd4cd490019b4de1bf532` / Vercel deployment `dpl_4z8Jwvgf5aMJRqpSYuX242Q3scRr`: `READY`, GitHub verified commit 기준 배포
- Verification-only main commit `edd8a5d6872006169c70cbc54b08b25019592b74` / E2E run #96 (`34782666105`): 전체 workflow `completed / success`
- Production source integrity: **106/106 publicly served static/font/provenance assets** SHA-256 일치
- Production Desktop Chromium + iPhone WebKit browser smoke: **2/2 passed**
- Production `/version.txt`·`/release.json`: HTTP 200, `v2.0.0` / P6 / `releaseChannel=production` / `businessFlowChanged=false` 확인
- Production integrity artifact `10325750830` / `sha256:0f8c7256eebf6491149ed0665765c088738423a06f77aa5fb708e52330e69edd`
- Verification evidence artifact `10324933483` / `sha256:867510a06864e007d60e7dc5101b7d21b265d74fe1d10806115d7f54f120ee34`

### Release status
v2.0.0은 제품 기능 확장이 아닌 **release contract unification / source-of-truth hardening** 릴리스이며, 새 Production 배포와 integrity/browser smoke까지 통과한 **Production verified** 상태입니다.

---

## v1.9.0 — Release provenance & Production verification hardening — 2026-09-13

P6에서 동결한 제품 기능 범위와 사용자·관리자 Business Flow는 그대로 유지하면서, 배포된 버전과 검증 근거를 Production에서 직접 확인할 수 있도록 release provenance를 강화합니다.

### Release provenance
- `version.txt`를 `v1.9.0`으로 갱신하고 동적 검증 상태 문구 대신 릴리스 성격만 기록해 stale-state 가능성을 제거
- `release.json`을 추가해 version·P6 freeze·release class·Business Flow 변경 여부·Production verification contract를 machine-readable 형태로 제공
- Fast Quality Gate에서 `version.txt`와 `release.json`의 버전 일치, P6 freeze, `businessFlowChanged=false`, verification contract를 정적 검증

### Production verification
- SHA-256 Production source integrity 대상에 `version.txt`와 `release.json`을 추가
- Production Desktop Chromium + iPhone WebKit smoke에서 `/version.txt`와 `/release.json` HTTP 200 및 v1.9.0 provenance contract를 실제 Production 기준으로 검증한 뒤 기존 핵심 신청·관리자 Flow를 확인
- 기존 36초 Production Demo, login font metric, CSP, 핵심 static/font asset 검증은 유지

### Scope
- 새 SaaS·직무·상태·승인 Flow 추가 없음
- 신청·반려·보완 재신청·Fallback·SLA·상태 격리 로직 변경 없음
- `release.json`에 `businessFlowChanged: false`를 명시해 P6 freeze contract를 자동 Gate에 포함

### Verification
- PR #31 / E2E run #86 (`34764447191`): Fast Quality Gate의 release provenance contract, Chromium 기능·WCAG/Keyboard/ARIA·Domain·Recovery·Visual Regression, Firefox/WebKit smoke, Desktop/Mobile Lighthouse, Supply-chain gate 모두 통과
- Production commit `5eede6a3985a6a0b51ffadd97b9bfe644104032e` / E2E run #87 (`34764568032`): 전체 workflow `completed / success`
- Vercel Production deployment `dpl_D8XKCyy4QUhynqscG57zZqwy4vER`: `READY`, GitHub verified commit 기준 배포
- Production source integrity: `version.txt`와 `release.json`을 포함한 **105/105 deployable asset** SHA-256 일치
- Production Desktop Chromium + iPhone WebKit browser smoke: success
- Production `/version.txt`와 `/release.json`: HTTP 200, v1.9.0 / P6 / `businessFlowChanged=false` / verification contract 확인
- Production integrity artifact `10320320598` / `sha256:730fc856c4488ff6bcf51750e4df4ce5ed94f36487c4ac2ad8199f5b1530b794`
- Verification evidence artifact `10320200393` / `sha256:5357d767dced34fd84aed60e2432bb4d1f1ee9ee3c305fa218c7e1066eebaa9e`

### Release status
v1.9.0은 제품 기능 확장이 아닌 **release provenance & verification hardening** 릴리스이며, 새 Production 배포와 integrity/browser smoke까지 통과한 **Production verified** 상태입니다.

---

## v1.8.0 — Reviewer experience & quality polish — 2026-09-13

P6에서 동결한 제품 기능 범위는 그대로 유지하면서, v1.7.0 이후 채용 리뷰어의 진입 경험과 UX·접근성·코드 품질을 고도화했습니다. 새 SaaS·직무·상태·승인 Flow는 추가하지 않았습니다.

### Reviewer experience
- README 진입 동선을 **36초 Production Demo → 2–3분 Live Production → Case Study** 순으로 재구성
- 로그인 화면 바깥에 36초 Demo와 Case Study 빠른 진입 링크를 추가해 기존 로그인 카드 visual baseline은 유지
- `docs/DEMO_WALKTHROUGH.md`를 리뷰어의 사용 가능 시간과 확인 목적 기준으로 재구성

### UX & accessibility
- 로그인·신청 dialog에 설명 컨텍스트를 연결해 screen reader 문맥을 강화
- 관리자 Drawer의 scanability, focus state, 모바일 touch target을 정리
- 기존 사용자/관리자 상태 동기화, 신청·반려·재신청·Fallback Flow는 변경하지 않음

### Code quality
- overlay 접근성 helper의 중복 조건을 정리해 동작은 유지하면서 책임을 단순화
- 기존 login/dashboard/request modal visual regression baseline을 그대로 유지

### Verification
- PR #28 / E2E run #75: Chromium 기능·WCAG/Keyboard/ARIA·Domain·Recovery·Visual Regression, Firefox/WebKit smoke, Desktop/Mobile Lighthouse, Supply-chain gate 모두 통과
- Production commit `43aa4d2ed812ccc7c1319f8055255434784fd5d6` / E2E run #82: 전체 workflow `completed / success`
- Vercel Production deployment `dpl_7jjnogGW7voYYhabhnqTULfa8F3W`: `READY`
- Production source integrity: success
- Production Desktop Chromium + iPhone WebKit browser smoke: success
- Verification evidence artifact: `verification-evidence-43aa4d2ed812ccc7c1319f8055255434784fd5d6`
- Production integrity artifact: `production-integrity-43aa4d2ed812ccc7c1319f8055255434784fd5d6`

### Release status
v1.8.0은 P6 기능 동결을 유지한 polish release이며, 새 Production 배포와 integrity/browser smoke까지 통과한 **Production verified** 상태입니다.

---

## v1.7.0 — P6 verified portfolio freeze — 2026-09-11

ONBOARD·OS의 포트폴리오용 기술 범위를 P6에서 동결합니다. 이 시점 이후에는 기능 확장보다 실제 사용 피드백·버그 수정·문서 정확성 유지를 우선합니다.

### Product & domain
- 4개 직무·21개 도구 온보딩 시나리오
- 신청 → IT 검토/관리자 승인 → 지급 완료
- 반려 → 보완 → 동일 ITSM 티켓 기반 재신청
- 직무 미매핑·목록 외 라이선스 Fallback
- 직무별 요청/취소/처리 이력 상태 격리와 v3→v4 세션 migration
- 주말 기준 SLA와 상태/처리 이력

### Verification
- Chromium 기능·WCAG/Keyboard/ARIA·Domain/SLA·Scenario Isolation·Recovery·Visual Regression 54개 회귀 테스트
- Firefox/WebKit 핵심 Flow smoke
- Lighthouse 13.4.1 Desktop 3-run + Mobile 3-run performance budgets
- corrupt/malformed session, sessionStorage 장애, Analytics/Speed Insights 장애 Fault Injection/Recovery
- npm high+ audit, PR dependency delta/source integrity, GitHub Actions full-SHA pinning, Dependabot
- Production Desktop Chromium + iPhone WebKit smoke
- GitHub checkout ↔ Vercel Production 핵심 static/font asset SHA-256 integrity
- GitHub Actions Summary + 30일 verification/integrity evidence artifact

### Runtime & delivery
- Pretendard Dynamic Subset self-hosting 및 OFL 라이선스 포함
- CSP 및 보안 헤더 적용
- GitHub `main` → Vercel Production 배포
- Markdown 및 `docs/` 변경은 Vercel Ignored Build Step으로 애플리케이션 재배포 제외

### Measurement policy
실제 사용 데이터가 생긴 뒤에만 `Demo Login → License Request → Admin Review → License Complete` 퍼널을 확인합니다. Synthetic smoke/QA 트래픽은 Analytics endpoint를 intercept하며, 이름·이메일·EMP ID·자유 입력 신청 사유는 Custom Event data에 포함하지 않습니다.

### Published release
- GitHub Release: [v1.7.0 — P6 verified portfolio freeze](https://github.com/dohyunkimmm/onboardos/releases/tag/v1.7.0)
- Tag: `v1.7.0`
- Freeze commit: `b70537ef507443f0962b7d03a8f335ac7b6157f9`

이 문서는 GitHub Release와 함께 release note의 canonical source입니다.