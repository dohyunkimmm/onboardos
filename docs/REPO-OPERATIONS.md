# ONBOARD·OS — 저장소 운영·보호·서명 현황

> 점검 기준일: **2026-10-23 (KST)**. 10월 22일의 정책 검증은 역사적 기록으로 유지하고, 아래에 23일의 최신 통합·배포 검사 결과를 별도로 기록합니다. 제품 기능·릴리스 이력은 [README](../README.md)·[CHANGELOG](../CHANGELOG.md)를 우선합니다. 이 문서는 운영 보호 상태와 남은 검증의 사실 기록입니다.

## 완료 / 검증됨

| 항목 | 현재 상태 | 근거 |
| --- | --- | --- |
| 최근 런타임 기준 | PR #134 병합 후 `main` SHA `9ec650dfe4291334664ed64a31af165e331c1298` | [병합 커밋](https://github.com/dohyunkimmm/onboardos/commit/9ec650dfe4291334664ed64a31af165e331c1298) |
| 의존성·QA | Playwright 1.64.1, `actions/upload-artifact` 7.0.2, axe-core 4.14 및 setup-node 7.1.0. 버튼 accessible name·focus-within 회귀 복원 | [#111](https://github.com/dohyunkimmm/onboardos/pull/111), [#108](https://github.com/dohyunkimmm/onboardos/pull/108), [#115](https://github.com/dohyunkimmm/onboardos/pull/115) |
| 기본 브랜치 보호 | [`protect-main` #24772212](https://github.com/dohyunkimmm/onboardos/settings/rules/24772212) **active**: PR 필수, 삭제/강제 푸시 금지, 최신 브랜치 strict 필수 CI, **Require linear history 활성** | GitHub ruleset 조회 |
| 중복 보호 정리 | 오래된 [`main` #22980900](https://github.com/dohyunkimmm/onboardos/settings/rules/22980900)은 **disabled**, 삭제하지 않아 되돌리기 가능 | [#114](https://github.com/dohyunkimmm/onboardos/issues/114) |
| 보호 정책 실증 | 고의 Chromium 실패 PR [#116](https://github.com/dohyunkimmm/onboardos/pull/116)의 `mergeable_state=blocked` 확인. PR은 병합 없이 종료했고 테스트 브랜치 삭제 확인 | [CI 실행](https://github.com/dohyunkimmm/onboardos/actions/runs/39687510645) |
| 커밋 서명 준비 | 미서명 커밋을 **경고만** 하는 `Commit signatures (informational)` 워크플로 및 [서명 설정 가이드](../.github/COMMIT_SIGNING.md) 병합 | [#117](https://github.com/dohyunkimmm/onboardos/pull/117) |
| 서명 결과 | PR #117의 API 생성 커밋 **0/4 verified**, 병합 후 GitHub가 만든 squash 커밋 `81bb7c7`은 **Verified** | [감사 CI](https://github.com/dohyunkimmm/onboardos/actions/runs/39690135981) |
| 이전 검증 완료 main CI (10/22) | 기준 SHA `a9f0a94`의 필수 검사·Production smoke 등 14개 성공. 10/23 이후 변경의 검증을 대체하지 않음 | [당시 E2E](https://github.com/dohyunkimmm/onboardos/actions/runs/39692702095) |

### 필수 상태 검사 (정확한 이름)

- `Chromium quality / functional / a11y / visual / domain`
- `Security / failure-containment gate`
- `Resilience / recovery fault-injection gate`

이 세 검사와 `strict_required_status_checks_policy=true`를 유지하며, 배포 뒤 수행되는 Production Smoke는 PR 필수 검사로 지정하지 않습니다.

## 2026-10-22 동기화 추가 확인

- [운영 문서 동기화 PR #118](https://github.com/dohyunkimmm/onboardos/pull/118)을 squash merge했고 최신 검증 대상 SHA `a9f0a94`에서 E2E 및 Documentation sync 워크플로가 모두 성공했습니다.
- 활성 [Ruleset `protect-main` #24772212](https://github.com/dohyunkimmm/onboardos/settings/rules/24772212)는 `strict=true`, PR 필수, 삭제·강제 푸시 차단, 선형 이력 필수, Chromium/Security/Resilience 정확한 필수 검사 3개를 유지합니다. 구형 `main` #22980900은 disabled 유지.
- `Commit signatures (informational)` 감사 워크플로는 병합돼 있지만 unsigned 상태에서도 작업을 **성공 처리**하므로 서명 정책 강제와 다릅니다. API 자동 변경 경로의 서명 해결·사용자 SSH/GPG 서명 PR 검증 결과는 아직 없습니다. **`Require signed commits`는 미활성**입니다.
- [P1 보호 검증 이슈 #114](https://github.com/dohyunkimmm/onboardos/issues/114)는 중복 규칙·차단 검증 완료로 closed이며, 서명 강제 적용은 별도 미완료 보안 후속입니다.

## 2026-10-23 최신 통합·검증 및 정리

- **기능 통합:** 직원용 직무 선택·라이선스 카탈로그, AI 추천·신청 초안, 직무별 Power BI/Postman/모두싸인, 추천 API 요청 제한·세션 복구를 포함한 [PR #120–#133](https://github.com/dohyunkimmm/onboardos/pull/133)까지 `main`에 통합됨.
- **검증 오류 보정:** [PR #134](https://github.com/dohyunkimmm/onboardos/pull/134)에서 API `api/recommend.js`의 정상적인 GET 405를 정적 소스 다운로드 실패로 취급하던 검사 오류를 수정. 매니페스트 v2는 HTTP로 SHA-256 비교하는 공개 자산과 로컬 소스 존재/릴리스 계약으로 확인하는 서버·스크립트 파일을 구분하고, API는 POST 전용 응답 계약을 별도 확인.
- **Vercel 배포·잔여 검사:** Production 도메인 [onboardos-rho.vercel.app](https://onboardos-rho.vercel.app/)의 READY 배포가 `9ec650d`와 일치함을 확인. [main E2E #39967159908](https://github.com/dohyunkimmm/onboardos/actions/runs/39967159908)의 11개 선행 게이트 성공 및 **공개 파일 139/139 SHA-256 일치 + POST 전용 API 계약 통과**. 그러나 Production 모바일 WebKit은 기존 native `<select>` CSP 엔진 오류가 3회 재현되어 최종 Smoke 실패(Chromium 및 나머지 Production 테스트는 성공). [PR #135](https://github.com/dohyunkimmm/onboardos/pull/135)에서 테스트 컨텍스트만 분리; 최신 main Production 완료 여부는 후속 CI를 기준으로 확인해야 함.
- **저장소 보호:** `protect-main` active, strict 필수 검사 3개, PR 필수 및 선형 이력 정책을 GitHub에서 재확인함. 구형 중복 규칙은 disabled. `Require signed commits` 규칙은 포함되어 있지 않음.
- **브랜치 정리:** 작업 전 확인한 기존 비기본 브랜치 24개는 모두 `main`과 diverged이며 고유 commit 기준 `ahead_by > 0`. Squash 병합된 이력도 포함될 수 있어 무조건 삭제하거나 강제 동기화하지 않음. 열린 PR·이슈는 작업 착수 시 0개였음.
- **문서 동기화:** README·체험 안내·CHANGELOG에서 현재 직무/AI/리뷰어 흐름을 반영하고, 영상이 아닌 메인 페이지로 이동하던 `/production-demo` 링크를 역사적 v18.0.0 실제 릴리스 영상 링크로 교체하는 문서 PR을 준비함.
- **릴리스 상태:** `release.json`의 v18.0.0/P6 `candidate`는 유지. 기존 불변 릴리스 영상과 새 버전의 운영 검증 증거를 섞지 않음. Gemini 실계정 추천 품질·비용·인증은 별도 미검증.

## 미완료 — 서명 **강제** 전환

**`Require signed commits`는 아직 활성화하지 않았습니다.** 로컬/웹에서 서명되는 커밋과 달리 현재 GitHub Contents API로 만든 일부 자동 변경 커밋은 `unsigned`이므로, 강제 규칙을 먼저 켜면 정상 PR이 병합되지 않을 수 있습니다.

1. [서명 설정 가이드](../.github/COMMIT_SIGNING.md)에 따라 개발자 SSH/GPG 서명을 설정하고 **Verified** 커밋으로 일반 테스트 PR 검증.
2. Dependabot뿐 아니라 **모든 실제 사용 중인 AI/API 자동 변경 경로**에서 signed commit 제출 방식 확립.
3. 각 경로의 PR에 대해 `Verified`와 기존 필수 CI를 확인하고, 그다음 `protect-main`의 `Require signed commits` 켜기.
4. 미서명 테스트 PR의 병합 차단 검증 후 PR 종료·테스트 브랜치 삭제.

서명 감사 Job의 `success`는 **서명 준수 또는 강제 보호 완료를 의미하지 않습니다**. 단지 감사 작업이 정상 실행됐다는 뜻입니다.

## 관련 저장소

[footmate 운영 현황](https://github.com/dohyunkimmm/footmate/blob/main/docs/REPO-OPERATIONS.md) · [mosigo 운영 현황](https://github.com/dohyunkimmm/mosigo/blob/main/docs/REPO-OPERATIONS.md)
