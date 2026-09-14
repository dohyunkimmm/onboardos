# v7.0.0 — Security & failure-containment hardening

ONBOARD·OS v7.0.0 preserves the P6 product and business flow while adding a dedicated browser security / failure-containment validation axis and evidence-backed Production release gating.

## Security & failure containment
- Added the dedicated S1–S8 Playwright security/failure-containment gate.
- Added machine-readable `security-summary.json` evidence and required it in immutable Release assets.
- Hardened analytics payload boundaries, identifier-like value rejection, CSP/security headers, URL/storage/console/telemetry boundaries, and unsafe DOM containment.
- Preserved the existing R1–R8 resilience/recovery contract unchanged.

## UI/UX regression hardening
- Stabilized Google SSO loading geometry so the login card does not resize or recenter while authentication feedback is visible.
- Kept the five-step tracker as the primary progress model while replacing the competing numeric mini-counter with `다음 행동` / `완료` guidance.
- Added mobile reviewer safe-area spacing, removed duplicate reset exposure, switched ultra-narrow common-license cards to one column, and maintained 44px drawer touch targets.
- Added focused desktop/mobile interaction and visual-regression coverage without changing SaaS, roles, request states, approval logic, or P6 Business Flow.

## Production verification
- Production target: `6732047aed507e7d1f40c9635f7c4b7de3495472`
- Vercel Production deployment: `dpl_89ZLDRTJX1qPbpgV6QdoFNigoHvn` — READY, GitHub verified commit.
- Main E2E run #149: `34903477287` — completed successfully.
- Chromium functional / WCAG / keyboard / ARIA / domain / visual regression: PASS.
- R1–R8 resilience/recovery: 8/8 PASS.
- S1–S8 security/failure-containment: 8/8 PASS.
- Firefox/WebKit functional smoke: PASS.
- Lighthouse desktop/mobile budgets: PASS.
- Supply-chain security gate: PASS.
- Production source integrity: PASS.
- Production Desktop Chromium + iPhone WebKit browser smoke: PASS.
- Verification evidence: PASS.

## Evidence
- Production integrity artifact `10372385230` — `sha256:f1447d540324c455d179da74b4f07b00c7ae8bb08109bb0610f6866e2b964ae9`
- Verification evidence artifact `10371796562` — `sha256:2d29ba74a5672a946309c6943a1f909abfe7d116df0f33d0b5d032acf29d55ea`
- Security evidence artifact `10371434392` — `sha256:fcd5c6bf52994d1f98a44965d93c5c64df8f404225296334245339f685459b3a`
- Resilience evidence artifact `10371394270` — `sha256:05b6b1bc4ad807b162598445ccc1920655b52136acf34762911af0709edf308c`

## Scope
- No new SaaS, role, request state, or approval flow.
- `businessFlowChanged: false` remains in force.
- This release is security/failure-containment and release-evidence hardening, not a P6 product-flow expansion.
