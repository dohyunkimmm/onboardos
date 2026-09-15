# ONBOARD·OS v12.0.0

## Scope

v12.0.0 formalizes the action-first post-login UI/UX refinement already validated against the P6 business-flow freeze. No JavaScript business logic, catalog data, request-state machine, or role-isolation behavior is changed by the v12 experience layer.

## Experience changes

- Stronger current-step and next-action hierarchy
- Compact sticky filter command surface
- Faster license-card scanning with semantic state cues
- Clearer primary/secondary CTA hierarchy
- Mobile density and touch-target refinement
- WCAG AA text contrast, focus-visible, and reduced-motion preservation

## Release integrity

The release is created only for an exact Production-verified commit with a successful main E2E run. Required evidence assets and the version-aligned 36-second Production Demo are attached to the same immutable GitHub Release. Production source integrity and Desktop Chromium + iPhone WebKit smoke remain mandatory release gates.

## Canonical links

- Live Production: https://onboardos-rho.vercel.app/
- Production Demo: https://onboardos-rho.vercel.app/production-demo
- GitHub Release: https://github.com/dohyunkimmm/onboardos/releases/tag/v12.0.0
