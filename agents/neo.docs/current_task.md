# Current Task

**Status:** Complete
**Assigned to:** Neo
**Started:** 2026-04-23T19:48

## Task Description
Implement Sprint 3 predictable label reading behavior with TDD, covering branch reading mode, readable label thresholds, and reset-to-reading-view recovery.

## Progress
- [x] Consult Oracle and confirm `app.js` is the implementation surface
- [x] Add `reading_mode.js` for testable reading-policy helpers
- [x] Replace depth-only label rules with projected-radius and density-based eligibility
- [x] Add reading-view status and `Return to Reading View` control near breadcrumbs
- [x] Add unit coverage in `tests/unit/test_reading_mode.js`
- [x] Update lint coverage for the new helper
- [x] Validate with `make test`, `make lint`, and `make lint-app-js`
- [x] Address Trin's QA finding so immediate children remain visible in reading mode
- [x] Re-validate with `make test`, `make lint`, and `make lint-app-js`
- [x] Hand off to Trin for QA verification

## Blockers
None

## Oracle Consultations
- Oracle guidance confirmed the label/zoom work belongs in `app.js` and should remain a minimal change around existing navigation behavior.

---
*Last updated: 2026-04-23T20:03*
