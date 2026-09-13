# Changelog

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
