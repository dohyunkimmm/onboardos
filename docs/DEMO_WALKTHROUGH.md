# ONBOARD·OS Demo Walkthrough

채용 담당자·리뷰어가 약 2–3분 안에 핵심 설계와 검증 포인트를 확인할 수 있는 데모 루트입니다.

## 36초 Production Demo Video

[**ONBOARD·OS v1.7.0 P6 Production Demo 보기 →**](https://github.com/dohyunkimmm/onboardos/releases/download/v1.7.0/ONBOARD_OS_v1.7.0_P6_production_demo.mp4)

GitHub Actions가 실제 Vercel Production URL을 Playwright Chromium으로 조작해 녹화하고, `v1.7.0` GitHub Release asset으로 게시합니다. 녹화 중 Vercel Analytics·Speed Insights endpoint는 intercept하여 synthetic 데모 트래픽이 실제 사용 지표에 섞이지 않도록 합니다. Release asset은 FFmpeg로 **정확히 36초**까지만 유지하며, 제품 Flow 이후의 Verification Evidence 화면은 영상에서 제외합니다.

## 1. 로그인과 직무 개인화 — 20초
1. 가상 Google SSO로 로그인합니다.
2. 경영지원·총무 직무를 선택합니다.
3. 전사 공통 / 직무별 추가 라이선스와 자동 지급·신청·승인 필요 구분을 확인합니다.

## 2. 신청 → 관리자 처리 → 지급 완료 — 50초
1. Microsoft Office 같은 신청 대상 도구에서 신청 사유를 입력합니다.
2. 사용자 신청현황에서 ITSM 요청번호·예상 지급일·SLA·처리 이력을 확인합니다.
3. 관리자 체험으로 이동해 같은 티켓을 찾습니다.
4. IT 검토/승인을 처리하고 지급 완료로 전환합니다.
5. 사용자 화면에서 동일 티켓이 지급 완료로 동기화되는지 확인합니다.

## 3. 예외 흐름 — 40초
1. 반려 사유를 확인하고 보완 후 동일 티켓으로 재신청합니다.
2. 직무 미매핑 또는 목록 외 라이선스 요청이 Fallback ITSM으로 생성되는지 확인합니다.
3. 직무를 전환했다가 돌아와 요청 상태가 직무별로 격리·복원되는지 확인합니다.

## 4. 검증 Evidence — 30초
1. GitHub README 상단의 E2E Verification badge와 Latest main verification runs를 엽니다.
2. Verification Matrix에서 Recovery, Mobile Performance, Production, Deployment Integrity를 확인합니다.
3. 최신 main run에서 Desktop/Mobile Lighthouse, Chromium 54개 회귀, Firefox/WebKit, Production Desktop Chromium+iPhone WebKit smoke, SHA-256 integrity가 green인지 확인합니다.

## 36초 화면 녹화용 Shot List
- 0–5초: 로그인 화면 → Google SSO
- 5–15초: 직무 선택 → 라이선스 카드 분류
- 15–28초: 신청 Modal → 신청현황 ITSM/SLA
- 28–36초: 관리자 검토·지급 완료 → 사용자 지급 완료 상태

실제 Google SSO·JSM·SaaS API와 연결된 운영 서비스가 아니라, 운영 정책과 사용자/관리자 Flow를 검증하는 가상 데이터 기반 인터랙티브 프로토타입이라는 점을 영상 설명이나 캡션에 명시합니다.
