# v8.0.0 verification plan — Interaction-state UX & accessibility hardening

v8.0.0 keeps the P6 product/business flow frozen and adds a dedicated interaction-state UX validation axis. It does not add SaaS, roles, request states, approval paths, or change the existing R1–R8 resilience and S1–S8 security contracts.

## U1–U8 contract

- U1 — Google SSO loading keeps login-card geometry stable and captures visual evidence.
- U2 — `prefers-reduced-motion: reduce` removes nonessential animation while retaining clear loading feedback.
- U3 — Request modal opens with correct focus, remains inside the viewport, and captures visual evidence.
- U4 — Admin drawer opens with actionable focus, preserves touch targets, remains inside the viewport, and captures visual evidence.
- U5 — Login/request completion messages remain available through the polite live status region.
- U6 — Closing request modal and drawer returns focus to their initiating controls.
- U7 — 320/340/359/360/390/768px boundaries avoid horizontal overflow and preserve the ultra-narrow one-column rule.
- U8 — Rejection → remediation → resubmission preserves the original ITSM ticket and captures the remediation modal state.

## Evidence

`playwright.ux.config.js` runs the eight scenarios as an independent CI gate. `scripts/ux-summary.js` converts the Playwright JSON report and required interaction screenshots into machine-readable `ux-summary.json` evidence with SHA-256 visual-evidence hashes.

The v8 release evidence contract requires `ux-summary.json` in addition to the existing verification, integrity, resilience, and security evidence. Production deployment/integrity/browser smoke remain mandatory after merge; this branch is intentionally stopped before that deployment step.
