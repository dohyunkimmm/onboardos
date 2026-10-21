# ONBOARD·OS — 저장소 운영·보호·서명 현황

> 점검 기준일: **2026-10-22 (KST)**. 제품 기능·릴리스 이력은 [README](../README.md)·[CHANGELOG](../CHANGELOG.md)를 우선합니다. 이 문서는 운영 보호 상태와 남은 검증의 사실 기록입니다.

## 완료 / 검증됨

| 항목 | 현재 상태 | 근거 |
| --- | --- | --- |
| 기준 코드 | `main` SHA `81bb7c7ebdca9656109bb7e0d9368797e822998e` | [main](https://github.com/dohyunkimmm/onboardos/commits/main) |
| 의존성·QA | Playwright 1.64.1, `actions/upload-artifact` 7.0.2, axe-core 4.14 및 setup-node 7.1.0. 버튼 accessible name·focus-within 회귀 복원 | [#111](https://github.com/dohyunkimmm/onboardos/pull/111), [#108](https://github.com/dohyunkimmm/onboardos/pull/108), [#115](https://github.com/dohyunkimmm/onboardos/pull/115) |
| 기본 브랜치 보호 | [`protect-main` #24772212](https://github.com/dohyunkimmm/onboardos/settings/rules/24772212) **active**: PR 필수, 삭제/강제 푸시 금지, 최신 브랜치 strict 필수 CI, **Require linear history 활성** | GitHub ruleset 조회 |
| 중복 보호 정리 | 오래된 [`main` #22980900](https://github.com/dohyunkimmm/onboardos/settings/rules/22980900)은 **disabled**, 삭제하지 않아 되돌리기 가능 | [#114](https://github.com/dohyunkimmm/onboardos/issues/114) |
| 보호 정책 실증 | 고의 Chromium 실패 PR [#116](https://github.com/dohyunkimmm/onboardos/pull/116)의 `mergeable_state=blocked` 확인. PR은 병합 없이 종료했고 테스트 브랜치 삭제 확인 | [CI 실행](https://github.com/dohyunkimmm/onboardos/actions/runs/39687510645) |
| 커밋 서명 준비 | 미서명 커밋을 **경고만** 하는 `Commit signatures (informational)` 워크플로 및 [서명 설정 가이드](../.github/COMMIT_SIGNING.md) 병합 | [#117](https://github.com/dohyunkimmm/onboardos/pull/117) |
| 서명 결과 | PR #117의 API 생성 커밋 **0/4 verified**, 병합 후 GitHub가 만든 squash 커밋 `81bb7c7`은 **Verified** | [감사 CI](https://github.com/dohyunkimmm/onboardos/actions/runs/39690135981) |
| 최신 main CI | 기준 SHA에서 필수 Chromium·Security·Resilience 검사와 Production desktop/mobile Smoke + deployment integrity 모두 **성공** | [main 워크플로](https://github.com/dohyunkimmm/onboardos/actions/runs/39690507044) |

### 필수 상태 검사 (정확한 이름)

- `Chromium quality / functional / a11y / visual / domain`
- `Security / failure-containment gate`
- `Resilience / recovery fault-injection gate`

이 세 검사와 `strict_required_status_checks_policy=true`를 유지하며, 배포 뒤 수행되는 Production Smoke는 PR 필수 검사로 지정하지 않습니다.

## 미완료 — 서명 **강제** 전환

**`Require signed commits`는 아직 활성화하지 않았습니다.** 로컬/웹에서 서명되는 커밋과 달리 현재 GitHub Contents API로 만든 일부 자동 변경 커밋은 `unsigned`이므로, 강제 규칙을 먼저 켜면 정상 PR이 병합되지 않을 수 있습니다.

1. [서명 설정 가이드](../.github/COMMIT_SIGNING.md)에 따라 개발자 SSH/GPG 서명을 설정하고 **Verified** 커밋으로 일반 테스트 PR 검증.
2. Dependabot뿐 아니라 **모든 실제 사용 중인 AI/API 자동 변경 경로**에서 signed commit 제출 방식 확립.
3. 각 경로의 PR에 대해 `Verified`와 기존 필수 CI를 확인하고, 그다음 `protect-main`의 `Require signed commits` 켜기.
4. 미서명 테스트 PR의 병합 차단 검증 후 PR 종료·테스트 브랜치 삭제.

서명 감사 Job의 `success`는 **서명 준수 또는 강제 보호 완료를 의미하지 않습니다**. 단지 감사 작업이 정상 실행됐다는 뜻입니다.

## 관련 저장소

[footmate 운영 현황](https://github.com/dohyunkimmm/footmate/blob/main/docs/REPO-OPERATIONS.md) · [mosigo 운영 현황](https://github.com/dohyunkimmm/mosigo/blob/main/docs/REPO-OPERATIONS.md)
