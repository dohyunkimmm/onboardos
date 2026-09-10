# ONBOARD·OS

신규입사자가 직무에 맞는 SaaS·업무 도구를 확인하고, 라이선스 **신청 → 검토·승인 → 지급 완료**까지의 흐름을 직접 체험할 수 있도록 설계한 인터랙티브 온보딩 포털 프로토타입입니다.

> 현재 버전은 포트폴리오용 가상 데이터 기반 프로토타입입니다. Google SSO, Google Workspace 조직·직무 정보, Jira Service Management 연동은 실제 운영 환경을 가정해 설계된 데모 Flow이며 실제 계정·티켓 시스템과 연결되어 있지 않습니다.

## Live Demo

https://onboardos-rho.vercel.app/

## 주요 기능

- **가상 Google SSO 로그인** — 신규입사자 인증 시나리오 체험
- **직무별 라이선스 노출** — 디자인 / 개발 / 데이터 / 경영지원·총무 / 직무 미매핑 시나리오 제공
- **전사 공통 + 직무별 추가 라이선스 구분** — 기본 지급 항목과 신청 필요 항목을 분리
- **라이선스 신청 Flow** — 신청 사유 입력, 예상 지급일, 담당 부서, SLA 기준 확인
- **신청현황 Tracking** — 요청번호, 처리 상태, 이력, 반려 사유 확인
- **관리자 Flow** — 검토·승인, 반려, 지급 완료 처리
- **재신청 Flow** — 반려 사유 확인 후 보완 내용을 입력해 재접수
- **SLA 상태 표시** — 정상 / 마감 임박 / 초과 / 완료 상태를 동일 기준으로 표시
- **상태 필터** — 전체 / 해야 할 일 / 처리 중 / 완료
- **Progress Tracking** — 현재 단계와 다음 행동 안내
- **State Consistency** — 사용자 화면과 관리자 화면에서 동일 요청 상태·티켓·이력 유지
- **세션 상태 유지** — `sessionStorage`를 사용해 체험 상태 유지 및 명시적 초기화 지원
- **Responsive UI** — PC / 태블릿 / 모바일 대응
- **Accessibility 보완** — focus trap, `aria-*`, `inert`, ESC 닫기, skip link 등 적용

## Service Flow

```text
Google SSO 인증
    ↓
신규입사자 정보 확인
    ↓
직무별 SaaS·업무 도구 노출
    ↓
라이선스 신청
    ↓
IT 검토 / 관리자 승인
    ↓
라이선스 지급 완료
```

### 예외 Flow

```text
신청 → 반려 → 반려 사유 확인 → 보완 내용 입력 → 재신청
```

직무 정보가 매핑되지 않은 경우에는 전사 공통 라이선스를 우선 제공하고, 직무 정보 확인 요청으로 이어지는 Fallback Flow를 제공합니다.

## 라이선스 상태 모델

| 상태 | 의미 |
| --- | --- |
| 자동 지급 | 별도 신청 없이 자동 지급되는 항목 |
| 신청 필요 | 사용자가 직접 신청해야 하는 항목 |
| 승인 필요 | 담당 부서 또는 관리자 승인이 필요한 항목 |
| 처리 중 | 신청 접수 후 검토·승인 대기 상태 |
| 지급 대기 | 검토·승인 완료 후 라이선스 지급 대기 상태 |
| 반려 | 보완 후 재신청이 필요한 상태 |
| 지급 완료 | 라이선스 지급이 완료된 상태 |

## SLA 기준

- 자동 지급: 계정 생성 후 **1시간 이내**
- 신청 필요: 영업일 기준 **D+1~2**
- 승인 필요: 영업일 기준 **D+2~3**

프로토타입에서는 현재 날짜와 예상 지급일을 기준으로 SLA 상태를 계산해 카드와 신청 상세, 관리자 화면에 동일하게 표시합니다.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- `sessionStorage`
- Vercel
- GitHub

프레임워크 없이 정적 웹 구조로 구현했으며, Vercel Production은 GitHub `main` 브랜치와 연결되어 있습니다.

## Project Structure

```text
.
├── index.html
├── styles.css
├── data.js
├── app.js
├── og-image.png
├── icons/
│   └── *.svg
├── vercel.json
└── README.md
```

### 파일 역할

- `index.html` — 화면 구조, SEO/Open Graph 메타데이터
- `styles.css` — UI, responsive layout, 상태별 스타일
- `data.js` — 라이선스·직무·상태 기준 데이터
- `app.js` — 신청/승인/반려/재신청/세션/Progress Tracking 로직
- `icons/` — SaaS·업무 도구 아이콘
- `vercel.json` — Vercel Git deployment 설정

## Local Run

별도 build 과정이 필요하지 않은 정적 웹 프로젝트입니다.

```bash
python3 -m http.server 8000
```

실행 후 브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:8000
```

## Deployment

GitHub `main` 브랜치가 Vercel Production과 연결되어 있습니다.

```text
GitHub main
    ↓
Vercel Build
    ↓
Production
    ↓
onboardos-rho.vercel.app
```

Preview 브랜치의 변경은 Vercel Preview Deployment에서 먼저 확인할 수 있습니다.

## Prototype Scope

이 프로젝트는 실제 SaaS 라이선스 발급 시스템을 구현한 것이 아니라, 다음 운영 시나리오를 검증하기 위한 Interactive Prototype입니다.

- 신규입사자의 직무 정보 기반 개인화
- 자동 지급 / 신청 / 승인 필요 항목의 구분
- Jira Service Management 요청번호 기반 Tracking 가정
- 사용자와 관리자 사이의 상태 일관성
- 반려·재신청을 포함한 예외 처리
- SLA와 처리 이력의 가시성
- 모바일 환경을 포함한 주요 Service Flow

## 기획 배경 · 운영 정책

프로토타입 화면 하단의 링크에서 설계 배경, 운영 정책, 검증 지표를 확인할 수 있습니다.

---

**기획 · 설계 · 프로토타입 구현: 김도현**
