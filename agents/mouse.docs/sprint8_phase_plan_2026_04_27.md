# Sprint 8 Phase Plan - Context and Polish

**Date:** 2026-04-27  
**Owner:** Mouse  
**Status:** Ready for Morpheus review

## Source

- Stories: `agents/cypher.docs/sprint8_polish.md`
- Architecture: `agents/morpheus.docs/sprint8_polish_arch.md`
- Task board: `task.md`

## Phase Plan

### Phase A — Data/Hierarchy Polish

**Tasks:** S8-1  
**Owner:** Neo  
**Files:** `framework_configs.js`, `tests/unit/test_framework_processor.js`  
**Validation:** `make test`

This is independent and should be first because it fixes the visible SCF hierarchy artifact.

### Phase B — Sidebar Context Polish

**Tasks:** S8-2, S8-3  
**Owner:** Neo  
**Files:** `app.js`, `index.html`, `tests/e2e/ux_screenshots.spec.js`  
**Validation:** `make test`, targeted E2E for badge and labels

This phase groups the collapsed-sidebar/context affordance work. It is independent of Phase A's implementation, but should wait for Phase A to start so the sprint keeps one clear critical path.

### Phase C — Legend Containment

**Tasks:** S8-4  
**Owner:** Neo  
**Files:** `index.html`, `app.js`, `tests/e2e/ux_screenshots.spec.js`  
**Validation:** targeted E2E at 1440x900 in selected-regime light/dark states

This is independent and can follow Phase B or be implemented separately if Phase B needs review time.

### Phase D — UAT

**Tasks:** S8-5  
**Owner:** Trin  
**Validation:** `make test`, `make lint`, affected E2E/screenshot tests

Trin verifies:
- SCF PPTDF groups are meaningful.
- Activity badge count and accessible breakdown are correct.
- Sidebar controls update labels dynamically.
- Regime legend remains inside viewport.

## Dependencies

- Phase A: no blocker.
- Phase B: no technical blocker, but should not start before Phase A is underway.
- Phase C: no blocker.
- Phase D: depends on A/B/C completion.

## Risk Notes

- S8-2 has the highest wiring risk because badge count and clear-filter button visibility intentionally use different counts.
- S8-4 may need E2E selector care if regime selection is affected by Treeselect static-list overlap.
- S8-1 should not weaken acceptance criteria if the unit fixture lacks real data; use real CSV-backed coverage instead.

## Recommended First Handoff

`@Neo *swe impl Sprint 8 Phase A: S8-1 PPTDF hierarchy polish`
