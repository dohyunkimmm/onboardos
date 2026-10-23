# ONBOARD·OS Demo Walkthrough

채용 담당자·리뷰어가 **보는 시간에 맞춰 바로 진입할 수 있도록** 데모 경로를 나눴습니다. 제품 기능을 더 보여주기보다, 동일한 핵심 Flow를 짧게 확인하거나 직접 검증하는 데 초점을 둡니다.

36초 영상은 **2026-09-18 v18.0.0 정식 릴리스 당시의 기록**입니다. 현재 Live Production은 이후 제품 검토와 UI·AI 추천 개선을 포함하므로 영상과 화면이 다를 수 있습니다. 현행 작업은 [제품 검토 후보 문서](./PRODUCT_REVIEW_2026-10-08.md)와 최신 CI를 기준으로 확인합니다.

## 먼저 고르기

| 시간이 있다면 | 추천 경로 | 확인할 것 |
| --- | --- | --- |
| **약 36초** | [v18.0.0 당시 영상 파일 →](https://github.com/dohyunkimmm/onboardos/releases/download/v18.0.0/ONBOARD_OS_v18.0.0_P6_production_demo.mp4) | 이전 릴리스 흐름 기록(최신 화면과 다를 수 있음) |
| **약 2–3분** | [Live Production 직접 체험 →](https://onboardos-rho.vercel.app/) | 사용자/관리자 상태 일관성, 반려·재신청, 예외 Flow |
| **설계·검증 근거** | [Case Study 보기 →](https://dohyunkimm.notion.site/SaaS-38521460c93481498afce73336d4a17a) | 문제 정의, 운영 정책, QA·Production evidence |

> 추천 순서: **Live Production 직접 체험 → Case Study → 필요할 때 이전 릴리스 영상**. `/production-demo` 주소는 영상을 재생하지 않고 메인 화면으로 이동합니다.

## 36초 Production Demo

영상은 실제 Vercel Production URL을 Playwright Chromium으로 조작해 녹화한 결과입니다. 원본은 `v18.0.0` GitHub Release asset `ONBOARD_OS_v18.0.0_P6_production_demo.mp4`로 유지하며 FFmpeg/ffprobe로 **정확히 36초**인지 검증합니다. 녹화 중 Analytics·Speed Insights endpoint는 intercept해 synthetic 데모 트래픽이 실제 사용 지표에 섞이지 않도록 합니다.

### Shot List

- **0–5초** — 로그인 화면 → 가상 Google SSO
- **5–15초** — 직무 선택 → 자동 지급 / 신청 필요 / 승인 필요 구분
- **15–28초** — 신청 Modal → 신청현황의 ITSM 요청번호·SLA
- **28–36초** — 관리자 검토 → 지급 완료 → 사용자 상태 동기화

## 2–3분 Live Production Route

### 1. 로그인과 직무 개인화 — 약 20초

1. 가상 Google SSO로 로그인합니다.
2. 상단 직무 선택 메뉴에서 경영지원·총무를 고른 뒤 전사 공통 / 직무별 추가 라이선스를 확인합니다.
3. 자동 지급·신청 필요·승인 필요의 구분을 확인합니다. 필요하면 직무 선택 옆 AI 추천에서 가상의 담당 역할을 입력합니다(서버 설정이 없으면 비활성 안내).

### 2. 신청 → 관리자 처리 → 지급 완료 — 약 50초

1. Microsoft Office 같은 신청 대상 도구에서 신청 Flow를 시작합니다.
2. 담당 부서·예상 지급일·SLA·JSM 요청번호를 확인합니다.
3. 상단 **신청현황**에서 동일 요청의 처리 이력을 확인합니다.
4. 같은 탭에서 [리뷰어 모드 `?review=1`](https://onboardos-rho.vercel.app/?review=1)를 열어 관리자 기능으로 동일 티켓을 검토하고 지급 완료까지 처리합니다.
5. 사용자 화면에서 동일 티켓이 지급 완료로 동기화되는지 확인합니다.

### 3. 예외 Flow — 약 40초

1. 요청을 반려해 사용자에게 반려 사유가 전달되는지 확인합니다.
2. 보완 내용을 입력해 **동일 티켓으로 재신청**합니다.
3. 직무 미매핑 또는 목록 외 라이선스 요청이 Fallback ITSM 요청으로 생성되는지 확인합니다.
4. 직무를 전환했다가 돌아와 요청 상태가 직무별로 격리·복원되는지 확인합니다.

## 제품 검토 후보 기능 · 2026-10-08

위 36초 영상은 **기존 v18.0.0 정식 릴리스의 역사적 자료**이며, PR #102에서 구현한 다음 후보 기능이나 최신 Production 반영을 보증하지 않습니다. [제품 검토 1~7](PRODUCT_REVIEW_2026-10-08.md)과 `release.json`의 `releaseStatus: candidate`를 별도로 확인합니다.

- 직무별 필수·선택 도구, 준비 상태와 공통 도구 구분, 완료 필터를 확인합니다.
- 승인 요청에 목적·제품/권한 범위·사용 기간이 요구되는지, 관리자 판단 정보가 제공되는지 확인합니다.
- 설치·계정 시작 가이드는 참고 안내이며 실제 회사 배포·초대 시스템과 연결되지 않습니다.
- 코드 차원의 제품 검토 회귀는 `npm run test:review`로 실행합니다. 이 검사만으로 전체 E2E·시각 회귀·Production 검증을 완료한 것으로 간주하지 않습니다.

## 검증 Evidence — 필요할 때만

제품 Flow를 먼저 본 뒤 검증 근거가 필요할 때 확인합니다.

1. [README](../README.md)의 **구현·검증** 안내에서 [최신 `main` E2E Actions](https://github.com/dohyunkimmm/onboardos/actions/workflows/e2e.yml?query=branch%3Amain)와 [Production 수동 검증](https://github.com/dohyunkimmm/onboardos/actions/workflows/production-verify.yml)을 확인합니다. 간소화된 README에는 기존 `Verification Matrix` 목차가 없습니다.
2. Chromium 회귀, Firefox/WebKit, Desktop/Mobile Lighthouse, Production Desktop Chromium+iPhone WebKit smoke를 확인합니다.
3. Production integrity artifact에서 `production-demo.html`·`login-font-lock.css` 등 공개 정적 파일의 SHA-256 일치 및 `/api/recommend`의 POST 전용 응답 계약을 확인합니다. 서버 소스의 HTTP 다운로드 SHA 검증을 수행했다고 해석하지 않습니다.
4. 배포 후 Production만 다시 확인해야 할 때는 `Production Verify` workflow로 새 commit 없이 integrity/smoke를 재검증할 수 있습니다.
5. 정식 Release 기준은 immutable GitHub Release `v18.0.0`이며, Release target이 검증된 Production SHA와 일치하는지 확인합니다.

## Prototype Scope

실제 Google SSO·Jira Service Management·SaaS 라이선스 발급 API와 연결되지 않은 **가상 데이터 기반 인터랙티브 프로토타입**입니다. 선택형 Gemini 추천은 서버에서 활성화한 경우 외부 API를 호출하지만, 실제 직원 인증이나 자동 발급을 제공하지 않습니다.
