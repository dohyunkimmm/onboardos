# Changelog

## v2.0.0 — Canonical release contract & version source-of-truth unification — 2026-09-14

P6에서 동결한 제품 기능과 사용자·관리자 Business Flow는 그대로 유지하면서, 릴리스 버전과 검증 계약을 하나의 canonical source에서 관리하도록 구조를 정리합니다.

### Canonical release contract
- `release.json` schema를 v2로 올리고 `canonicalVersionSource: release.json`을 명시
- `version.txt`와 `package.json`을 `release.json`의 동기화 대상(`syncedArtifacts`)으로 고정
- 이전까지 `package.json`에 남아 있던 1.7.0 버전 drift를 제거하고 v2.0.0으로 정렬
- `scripts/release-contract.js`를 추가해 semantic version·P6 freeze·`businessFlowChanged=false`·verification contract·동기화 artifact 일치를 한 곳에서 검증

### Verification hardening
- Fast Quality Gate가 별도 중복 로직 대신 canonical release contract validator를 호출하도록 통합
- Production smoke에서 1.9.0을 하드코딩하지 않고 checkout의 `release.json` 전체와 Production `/release.json`을 직접 비교
- `package.json`과 `scripts/release-contract.js`를 SHA-256 Production source integrity 대상에 추가
- 기존 Desktop Chromium + iPhone WebKit Production smoke, CSP, login font metric, 36초 Demo, Business Flow 검증은 유지

### Scope
- 새 SaaS·직무·상태·승인 Flow 추가 없음
- 신청·반려·보완 재신청·Fallback·SLA·상태 격리 로직 변경 없음
- P6 feature freeze와 `businessFlowChanged: false` 유지

### Verification
- PR CI 및 새 Production 배포 검증 진행 중
- GitHub Release/Tag는 새 Production deployment의 integrity/browser smoke 통과 후 발행

### Release status
v2.0.0은 제품 기능 확장이 아닌 **release contract unification / source-of-truth hardening** 릴리스이며, Production 검증 완료 전까지 release candidate로 관리합니다.

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
