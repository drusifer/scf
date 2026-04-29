# Smith Gate 1 Review — Sprint 6: Framework UX Fixes & Interaction Depth

**Reviewer:** Smith (HCI Expert)
**Date:** 2026-04-25
**Stories reviewed:** `agents/cypher.docs/sprint6_ux_feedback.md`
**Verdict:** ✅ APPROVED WITH NOTES

---

## Overall Assessment

All 4 stories are correctly motivated by observed behavior, root causes are confirmed in code, and acceptance criteria are specific and testable. Two minor AC additions applied below — neither is blocking.

---

## US-S6-1 — Regime Selector Properly Reinitialized on Framework Switch

**HCI Assessment:** Correctly addresses #1 Visibility of System Status and #4 Consistency and Standards. Root cause (`innerHTML` not cleared) confirmed in `app.js:1194` vs correct pattern at `app.js:1263`. Stories are clear.

**Verdict:** ✅ APPROVED

**One note (non-blocking):** AC5 tests two switches. Consider also testing that the label text in the accordion header updates on each switch — AC6 covers the label assertion but only for the Playwright test. Suggest Neo also write a unit test or inline assertion that confirms label text changes on `switchFramework()` call. Cypher does not need to revise the story for this — it's an implementation note for Neo.

---

## US-S6-2 — Sidebar Regime List Does Not Overflow into Tag Filter Area

**HCI Assessment:** Correctly addresses #8 Aesthetic and Minimalist Design. The `30vh` cap is a reasonable starting point — at 768px height, `30vh ≈ 230px`, leaving room for hierarchy fields and tag filters. AC3's explicit 768px test condition is good. AC4's framework-neutrality clause prevents regressions on CRI.

**Verdict:** ✅ APPROVED

**One note (non-blocking):** AC2 says the regime list is "scrollable within its `30vh` container." Confirm that the Treeselect library supports `overflow-y: auto` inside its static list when `max-height` is constrained via CSS — if the library manages height internally, Neo may need to apply the constraint on a wrapper div instead of the Treeselect option. This is an implementation concern for Morpheus/Neo, not a story revision.

---

## US-S6-3 — Tag Group Filter Uses Exclusive (Subset) Logic for Cumulative Tags

**HCI Assessment:** Correctly addresses #5 Error Prevention and #7 Flexibility and Efficiency. The per-group subset predicate is mathematically sound and the CRI tier scenario is well-specified.

**Verdict:** ✅ APPROVED WITH AC ADDITION

**AC addition — apply before implementation:**
- [ ] **AC7 (new):** Controls with a completely empty `tags` array (no tags at all, not just no tags in a filtered group) always pass all group filters. The subset check on an empty set is vacuously true — Neo must confirm the implementation does not treat `undefined` or `[]` tags as a filter failure.

*Rationale:* AC5 covers "no tags in a filtered group" for controls that do have tags in OTHER groups. AC7 closes the gap for controls with no tags at all, which is a real data state in both frameworks.

---

## US-S6-4 — Hover Tooltip Shows Full Parent Breadcrumb Path

**HCI Assessment:** Correctly addresses #8 Aesthetic and Minimalist Design and #6 Recognition Rather Than Recall. The HTML-over-SVG overlay pattern is the right approach — consistent with `#onboarding-hint` and `#tag-zero-result`.

**Verdict:** ✅ APPROVED WITH AC ADDITION

**AC addition — apply before implementation:**
- [ ] **AC9 (new):** When hovering over the root node (depth === 0), the tooltip shows only the framework name (`processor.config.name`) with no path separator — e.g., `"Secure Controls Framework 2026.1"`. The root node has no ancestors to path-from, so the tooltip must handle this edge case explicitly without showing a leading `" › "` or blank segment.

*Rationale:* AC2 says "excluding the root label itself (depth 0)" from the ancestor path — correct for all non-root nodes. But the root node itself is still hoverable (AC6 says ALL nodes are hoverable), so its tooltip content must be defined. Without AC9, Neo would either show an empty tooltip (confusing) or hit an undefined ancestor traversal (silent error).

---

## Summary of AC Additions Applied to `sprint6_ux_feedback.md`

| Story | Addition | Type |
|-------|----------|------|
| US-S6-3 | AC7: empty-tags array always passes all group filters | Bug prevention |
| US-S6-4 | AC9: root-node tooltip shows framework name only | Edge case coverage |

Cypher should apply these additions to `sprint6_ux_feedback.md` before Morpheus architecture.

---

## Sprint Sizing Concurrence

Smith agrees with Cypher's complexity estimates:
- S6-1: Low — 1-line fix + config field addition. Highest priority.
- S6-2: Low — CSS + possible wrapper div. Unblock after S6-1 validation.
- S6-3: Medium — logic rewrite + tests. Independent.
- S6-4: Medium — new DOM element + D3 events. Independent.
- Phasing A(S6-1+S6-2) → B(S6-3) → C(S6-4) is correct.

---

*Review by Smith — 2026-04-25*
