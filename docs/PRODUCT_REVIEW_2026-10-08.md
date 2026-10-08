# Product review 1–7

Implemented on 2026-10-08.

Required role tools in the demo: Figma (design), GitHub (development), Snowflake and DBeaver (data), HWP (office). Other role tools are optional. Common entitlements are tracked separately. Production policy must be supplied by the organization.

Approval-only tools require purpose, scope and period; budget is optional and explicitly routed to the department for verification if omitted. Stored fields are sanitized and escaped before display.

Start guides describe installation, activation and organization invitation without presenting public vendor URLs as a company deployment portal. Contact buttons prefill an IT support request; users submit it themselves. No actual provisioning, SSO, live seat inventory or cost API is introduced.

Validation: seven Node regression checks plus connected Chrome checks for request/approval/provision, completed filter, required readiness, structured field restoration, rejection/resubmission, common guides and responsive viewport. Existing release video is retained as historical v18.0.0 evidence. Full historical screenshot baselines are not claimed as updated.

## Candidate verification follow-up (2026-10-08)

- Restored direct access to role selection while leaving optional employee details collapsed; refreshed existing layout regression expectations without weakening functional/keyboard checks.
- Deferred nonessential post-login presentation CSS during initial login paint. Mobile Lighthouse passed the original performance budget without increasing its threshold.
- Resolved the `basic-ftp` high-severity audit chain and the `ip-address` advisory through pinned patched dependency overrides and a regenerated npm lock; the supply-chain CI gate passed.
- Updated approval request E2E tests to supply the newly required product/permission scope and usage period.
- Addressed a reduced-motion rendering defect where animation-dependent cards could remain transparent; added visual assertions for card presence and opacity and regenerated desktop/mobile candidate screenshot baselines. Existing release media remain historical and are not promoted by these candidate screenshots.
- Keep `releaseStatus=candidate` pending a full passing branch E2E matrix and post-merge Production verification. No test coverage, security threshold, or Lighthouse budget is intentionally lowered.
