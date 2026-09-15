# v12 Experience Evolution — Candidate Scope

## Status

This branch is a v12 candidate only. Production remains v11.0.0 until the full verification and release contract are explicitly promoted.

## Goal

Improve task comprehension, decision speed, and action continuity without changing the existing P6 business flow.

## Preserved contracts

- Login baseline and virtual Google SSO flow
- P6 request → review/approval → fulfillment flow
- Role isolation and per-role state
- Existing R1-R8 resilience scenarios
- Existing S1-S8 security scenarios
- Existing U1-U8 interaction UX scenarios
- Existing V1-V8 visual-system scenarios
- Existing D1-D8 design-polish scenarios
- Existing E1-E8 experience-refinement scenarios
- Production provenance and integrity model

## v12 changes

1. **Next Action brief**
   - Adds a live task summary below the current progress surface.
   - Shows current experience step, open request count, and current role.
   - Routes the user to the next relevant action without modifying state transitions.

2. **Navigation and focus hierarchy**
   - Keeps Request Status as the primary product action.
   - Keeps admin/reset/more controls visually secondary.
   - Strengthens keyboard focus visibility.

3. **Overview and role preview**
   - Reduces identity-card visual weight.
   - Treats role preview as a segmented control.
   - Preserves the existing two-zone desktop composition.

4. **Progress Tracking refinement**
   - Makes the current step more legible.
   - Converts the hint into a task-oriented command surface.

5. **License card hierarchy**
   - Adds a semantic state rail.
   - Keeps status meaning readable without relying on color alone.
   - Strengthens role-license CTAs while preserving status behavior.

6. **Request/admin workbench**
   - Improves drawer width, sticky header, request evidence grouping, and action separation.

7. **Mobile action economy**
   - Preserves two-column common licenses and single-column role licenses.
   - Makes the next action full-width and keeps role preview horizontally scrollable without page overflow.

8. **Motion/accessibility**
   - Preserves reduced-motion behavior.
   - Adds a consistent focus ring for high-value controls.

## Verification contract — X1-X8

- **X1** Next Action brief + five-step preservation
- **X2** Next Action focus routing
- **X3** Request-state-aware admin routing
- **X4** Semantic card rail + primary action target
- **X5** Desktop/mobile role chooser behavior
- **X6** Request drawer workbench hierarchy
- **X7** Mobile action economy + overflow prevention
- **X8** Login-scope preservation + reduced motion

## Release rule

Do not change `release.json`, `version.txt`, or the package semantic version to 12.0.0 until the v12 branch has passed baseline CI plus X1-X8 and is explicitly approved for release promotion.
