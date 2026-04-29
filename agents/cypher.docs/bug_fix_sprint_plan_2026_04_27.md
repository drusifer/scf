# Bug Fix Sprint Plan - 2026-04-27

**Request:** `$bloop plan bug fix sprint`  
**Planner:** Cypher  
**Outcome:** No new bug-fix sprint recommended.

## Scope Reviewed

The requested bug-fix sprint was evaluated against the three bugs Smith listed as open:

| ID | Prior status | Current product status |
|----|--------------|------------------------|
| BUG-1 | Subject Tag filter always returns 0 results | Fixed in Sprint 7 |
| BUG-2 | Tier Tag filter broken for Tier 2/3/4 | Fixed in Sprint 7 |
| BUG-3 | Tooltip does not wrap | Fixed in Sprint 7 |

## Evidence

- `tag_filter.js` now uses group-aware OR/ANY matching via `some()`.
- `index.html` node tooltip style no longer includes `white-space: nowrap`.
- Neo state says Sprint 7 Phase A implemented S7-1 and S7-2.
- Trin state says Sprint 7 UAT verified S7-1 and S7-2.
- Morpheus state says Sprint 7 code review passed.
- `make test` passed: 37/37 tests.
- `make lint` passed after network access was allowed for ESLint resolution.

## Decision

Do not create a new implementation sprint for BUG-1, BUG-2, or BUG-3. The open-bug list in Smith's state was stale. Treat this as a closure/status-sync task, not new product scope.

## Closure Acceptance Criteria

- [ ] Smith state no longer lists BUG-1, BUG-2, and BUG-3 as pending open bugs.
- [ ] Team chat records that the bug-fix sprint request was reviewed and no new sprint is needed.
- [ ] If a live user can still reproduce any of the three behaviors, open a fresh bug with exact reproduction steps and current build details.

## Follow-On Backlog

The following are feature/backlog items, not bugs for this sprint:

- FEATURE-1: Regime selector grouping by regulator.
- FEATURE-2: Relationship tags display and filtering.
- Morpheus backlog: mapping quality active filters are not counted in the filter badge.
