# Next Steps

## Immediate Next Action

Sprint 8 is complete. Next product action is Cypher/Mouse prioritization for the next sprint.

## Sprint 8 Closeout (2026-04-27)

- Implementation review: PASS
- Validation: `make test` 38/38, `make lint` pass, `make test-e2e` 17/17
- Completed backlog: B-4, B-5, B-6, B-PPTDF
- Still open: B-SCRM binary-flag filter story

## Sprint 5 Complete (2026-04-25)

All 5 sprints shipped:
- Sprint 1: CSV loading + initial viz
- Sprint 2: Relative Control Weighting bubble sizing
- Sprint 3: Predictable label reading mode
- Sprint 4: Framework switcher + tag filtering + CRI integration
- Sprint 5: UX Polish — breadcrumb dedup, empty states, onboarding hint, tooltips

## Cypher Backlog Items (from Sprint 5 investigation)

**B-PPTDF**: SCF PPTDF column name mismatch
- CSV column: `"PPTDF\nApplicability"` (multi-line)
- Config references: `"PPTDF Applicability"` (space-separated)
- Effect: all SCF controls default to "Uncategorized" at depth-1 in the hierarchy
- Visible: large "Uncategorized" circle in all SCF screenshots
- Fix: update `hierarchy_cols[0].raw` in `framework_configs.js` to match actual CSV header

**B-SCRM**: SCRM binary-flag filter type
- SCRM Focus columns (TIER 1/2/3) contain only binary 'x' markers
- Current tag filter UI expects categorical string values, not flags
- If SCRM tier filtering is desired, a dedicated binary-flag filter component is needed

## Ready for
- Cypher to select the next product increment.
- Mouse to coordinate the next sprint once scope is chosen.

---
*Last updated: 2026-04-27*
