# ONBOARD·OS v8.0.0 — Interaction-state UX & accessibility hardening

## Production-verified target

- Version: `8.0.0`
- Freeze: `P6`
- Target SHA: `2aaa29596a94a0678dcfd132c006813d64369979`
- Vercel Production deployment: `dpl_CFAqnXC8Ex2FCGaoKWgJkTZ84z75`
- Main E2E run: `34908324906` (`#156`)
- Production URL: `https://onboardos-rho.vercel.app/`
- `businessFlowChanged`: `false`

## v8 scope

v8.0.0 adds interaction-state UX and accessibility hardening without adding SaaS tools, roles, request states, approval logic, or changing the frozen P6 business flow.

The release adds a dedicated U1–U8 Interaction UX contract covering:

- U1 — SSO loading geometry and visual-state stability
- U2 — reduced-motion behavior
- U3 — request modal interaction state
- U4 — admin drawer focus and viewport containment
- U5 — accessible live-status delivery
- U6 — focus return after transient UI
- U7 — responsive boundary behavior across narrow/mobile/tablet widths
- U8 — rejection → remediation → resubmission continuity

It also adds machine-readable `ux-summary.json` evidence and required visual evidence for `U1-sso-loading.png`, `U3-request-modal.png`, `U4-admin-drawer.png`, and `U8-resubmit-modal.png`.

## Preserved contracts

- R1–R8 resilience/recovery contract preserved.
- S1–S8 security/failure-containment contract preserved.
- Existing Production source-integrity and browser-smoke requirements preserved.
- P6 business flow remains frozen.

## Verification

Main E2E run `34908324906` completed successfully for target `2aaa29596a94a0678dcfd132c006813d64369979` with:

- Chromium quality / functional / accessibility / visual / domain regression — PASS
- R1–R8 resilience / recovery — PASS
- S1–S8 security / failure containment — PASS
- U1–U8 Interaction UX / accessibility state gate — PASS
- Firefox / WebKit functional smoke — PASS
- Lighthouse desktop performance budget — PASS
- Lighthouse mobile performance budget — PASS
- Supply-chain security gate — PASS
- Production source integrity — PASS
- Production Desktop Chromium + iPhone WebKit browser smoke — PASS
- Verification evidence generation — PASS

The live Production `release.json` returned `version: 8.0.0`, `schemaVersion: 7`, `releaseClass: interaction-ux-hardening`, `scope: interaction-state-accessibility`, R1–R8, S1–S8, U1–U8, and evidence schema version 6.

## Evidence artifacts

- `verification-evidence-2aaa29596a94a0678dcfd132c006813d64369979` — `sha256:e07082d73c168fa3386842d086a9500c9a6fadf51399dfb540a33f68e3fb23a0`
- `production-integrity-2aaa29596a94a0678dcfd132c006813d64369979` — `sha256:f1c55d5cf1562ca72b2fd98a2ee45dd9bf861373bf8dd5c9deab69158e59f93b`
- `resilience-evidence-2aaa29596a94a0678dcfd132c006813d64369979` — `sha256:26c4175c03cbc28a82258d400d0d2beb3ed0ccd47f0821869226233ed1ac5d13`
- `security-evidence-2aaa29596a94a0678dcfd132c006813d64369979` — `sha256:aa4160aa6ea42c2048b50e28a330d81755b23765bb5f522f49b385cf2bc31c67`
- `ux-evidence-2aaa29596a94a0678dcfd132c006813d64369979` — `sha256:7c63260e5a6002957021113bff13718acab5f04dbb6863548505840495f44c11`

The immutable GitHub Release must attach the six contract assets required by `release.json`: `verification-summary.json`, `verification-summary.md`, `asset-integrity.json`, `resilience-summary.json`, `security-summary.json`, and `ux-summary.json`.
