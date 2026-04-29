# Sprint 7 Closeout - CRI UX Remediation

**Date:** 2026-04-27  
**Owner:** Cypher  
**Status:** Closed

## Product Outcome

Sprint 7 is complete. The sprint addressed CRI UX remediation across three areas:

1. CRI tag filters now use OR/ANY matching inside a tag group and AND matching across groups.
2. Node hover tooltips wrap long paths instead of overflowing.
3. CRI usability improvements shipped for grouped regime selection and mapping quality visibility/filtering.

## Stories Closed

| Story | Outcome |
|-------|---------|
| S7-1 Tag Filter OR/ANY Predicate Logic | Closed |
| S7-2 Tooltip Text Wrapping | Closed |
| S7-3 Regime Selector Grouping | Closed |
| S7-4 Relationship Tags in Detail Panel | Closed |
| S7-5 Mapping Quality Filter | Closed |

## Verification

- Neo implementation: complete.
- Trin UAT: 37/37 unit tests, lint pass, 14/14 E2E tests.
- Morpheus review: pass.
- Smith re-check on 2026-04-27: `make test` 37/37, `make lint` pass, `make test-e2e` 14/14.

## Product Decisions

- No new bug-fix sprint is needed for BUG-1, BUG-2, or BUG-3. Those bugs were already resolved in Sprint 7.
- FEATURE-1 and FEATURE-2 are no longer pending feature requests; they shipped as S7-3, S7-4, and S7-5.
- The remaining item is a backlog polish issue: active Mapping Quality filters are not included in the filter badge count.

## Follow-Up Backlog

### B-S7-1: Include Mapping Quality Filters in Filter Badge Count

**User value:** A user should be able to tell from the collapsed sidebar/header badge that any filter is active, including Mapping Quality filters.

**Acceptance Criteria:**
- [ ] The filter badge count includes active Mapping Quality filters as well as active tag filters.
- [ ] The badge disappears only when no tag filters and no Mapping Quality filters are active.
- [ ] Clearing filters resets both filter sets and removes the badge.

## Closeout Decision

Sprint 7 is closed from product. Future CRI work should be planned as backlog polish or new feature work, not as Sprint 7 carryover.
