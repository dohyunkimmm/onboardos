# ONBOARD·OS Demo Walkthrough

채용 담당자·리뷰어가 **보는 시간에 맞춰 바로 진입할 수 있도록** 데모 경로를 나눴습니다. 제품 기능을 더 보여주기보다, 동일한 핵심 Flow를 짧게 확인하거나 직접 검증하는 데 초점을 둡니다.

## 먼저 고르기

| 시간이 있다면 | 추천 경로 | 확인할 것 |
| --- | --- | --- |
| **약 36초** | [Production Demo 영상 보기 →](https://onboardos-rho.vercel.app/production-demo) | 직무 선택 → 신청 → ITSM/SLA → 관리자 처리 → 지급 완료 |
| **약 2–3분** | [Live Production 직접 체험 →](https://onboardos-rho.vercel.app/) | 사용자/관리자 상태 일관성, 반려·재신청, 예외 Flow |
| **설계·검증 근거** | [Case Study 보기 →](https://dohyunkimm.notion.site/SaaS-38521460c93481498afce73336d4a17a) | 문제 정의, 운영 정책, QA·Production evidence |

> 추천 순서: **36초 영상 → Live Production → Case Study**. 첫 화면에서도 같은 빠른 보기 링크를 제공합니다.

## 36초 Production Demo

영상은 실제 Vercel Production URL을 Playwright Chromium으로 조작해 녹화한 결과입니다. 원본은 `v17.0.0` GitHub Release asset `ONBOARD_OS_v17.0.0_P6_production_demo.mp4`로 유지하며 FFmpeg/ffprobe로 **정확히 36초**인지 검증합니다. 녹화 중 Analytics·Speed Insights endpoint는 intercept해 synthetic 데모 트래픽이 실제 사용 지표에 섞이지 않도록 합니다.

### Shot List

- **0–5초** — 로그인 화면 → 가상 Google SSO
- **5–15초** — 직무 선택 → 자동 지급 / 신청 필요 / 승인 필요 구분
- **15–28초** — 신청 Modal → 신청현황의 ITSM 요청번호·SLA
- **28–36초** — 관리자 검토 → 지급 완료 → 사용자 상태 동기화

## 2–3분 Live Production Route

### 1. 로그인과 직무 개인화 — 약 20초

1. 가상 Google SSO로 로그인합니다.
2. 경영지원·총무 직무를 기준으로 전사 공통 / 직무별 추가 라이선스를 확인합니다.
3. 자동 지급·신청 필요·승인 필요의 구분과 다음 행동 안내를 확인합니다.

### 2. 신청 → 관리자 처리 → 지급 완료 — 약 50초

1. Microsoft Office 같은 신청 대상 도구에서 신청 Flow를 시작합니다.
2. 담당 부서·예상 지급일·SLA·JSM 요청번호를 확인합니다.
3. 상단 **신청현황**에서 동일 요청의 처리 이력을 확인합니다.
4. **관리자 체험**에서 같은 티켓을 검토하고 지급 완료까지 처리합니다.
5. 사용자 화면에서 동일 티켓이 지급 완료로 동기화되는지 확인합니다.

### 3. 예외 Flow — 약 40초

1. 요청을 반려해 사용자에게 반려 사유가 전달되는지 확인합니다.
2. 보완 내용을 입력해 **동일 티켓으로 재신청**합니다.
3. 직무 미매핑 또는 목록 외 라이선스 요청이 Fallback ITSM 요청으로 생성되는지 확인합니다.
4. 직무를 전환했다가 돌아와 요청 상태가 직무별로 격리·복원되는지 확인합니다.

## 검증 Evidence — 필요할 때만

제품 Flow를 먼저 본 뒤 검증 근거가 필요할 때 확인합니다.

1. GitHub README의 **Verification Matrix**와 최신 `main` Actions run을 엽니다.
2. Chromium 회귀, Firefox/WebKit, Desktop/Mobile Lighthouse, Production Desktop Chromium+iPhone WebKit smoke를 확인합니다.
3. Production integrity artifact에서 `production-demo.html`과 `login-font-lock.css`를 포함한 deployable asset의 SHA-256 일치 여부를 확인합니다.
4. 배포 후 Production만 다시 확인해야 할 때는 `Production Verify` workflow로 새 commit 없이 integrity/smoke를 재검증할 수 있습니다.
5. 정식 Release 기준은 immutable GitHub Release `v17.0.0`이며, Release target이 검증된 Production SHA와 일치하는지 확인합니다.

## Prototype Scope

실제 Google SSO·Jira Service Management·SaaS API에 연결된 운영 서비스가 아니라, **라이선스 온보딩의 운영 정책과 사용자/관리자 Flow를 검증하기 위한 가상 데이터 기반 인터랙티브 프로토타입**입니다.
