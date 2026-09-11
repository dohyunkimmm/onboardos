# Changelog

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

이 문서는 GitHub Release와 함께 v1.7.0 release note의 canonical source입니다.
