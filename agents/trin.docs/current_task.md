# Current Task

**Status:** Sprint 8 UAT complete — handing off to Morpheus for code review
**Assigned to:** Trin
**Sprint:** 8

## Sprint 8 UAT Results
- [x] Oracle consulted for expected behavior from Sprint 8 stories/architecture
- [x] make test: 38/38 pass (unit)
- [x] make lint: PASS
- [x] make test-e2e: 17/17 pass (E2E)
- [x] S8-1 verified: SCF real CSV-backed PPTDF depth-1 groups
- [x] S8-2 verified: activity badge count and accessible breakdown
- [x] S8-3 verified: sidebar toggle labels/titles update with state
- [x] S8-4 verified: regime legend inside viewport in light and dark mode

## Sprint 7 Historical UAT Results
- [x] make test: 37/37 pass (unit)
- [x] make lint: PASS
- [x] make test-e2e: 14/14 pass (E2E)
- [x] S7-1 verified: CRI tag filter OR — zero-result overlay absent when tag selected (test 14)
- [x] S7-2 verified: #node-tooltip inline style does NOT contain white-space (assertion in test 11)
- [x] S7-3 verified: FFIEC group expander visible in CRI treeselect (test 12)
- [x] S7-4/S7-5 verified: Mapping Quality section appears on single-regime CRI select (test 13)

## New Tests Added (Sprint 7)
- test 11 extended: added `white-space` assertion to S7-2 tooltip fix
- test 12: CRI regime grouping — FFIEC group item in treeselect
- test 13: Mapping Quality section visible on single-regime CRI select
- test 14: CRI tag filter OR — zero-result overlay absent

## Fix Notes
- Test 13: needed `[group="false"][level="0"]` selector — child leaf items are inside collapsed groups, invisible; flat leaves at level=0 are the correct targets
- Test 14: treeselect static list overlaps sidebar; used `scrollIntoViewIfNeeded` + click-parent-label with `force: true`

---
*Last updated: 2026-04-27*
