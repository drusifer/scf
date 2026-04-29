# Smith Gate 1 Review — Sprint 7: CRI UX Remediation

**Reviewer:** Smith (HCI Expert)  
**Date:** 2026-04-25  
**Stories reviewed:** agents/cypher.docs/sprint7_cri_ux_remediation.md  
**Verdict:** ✅ APPROVED WITH NOTES

---

## Story-by-Story Assessment

### S7-1 (Tag Filter OR/ANY Logic) — PASS
Root cause is confirmed. ACs are correct and testable. Cross-group AND / within-group OR is the right semantic. AC7 (SCF backward compat) and AC9 (unit tests) are essential and present. No HCI concerns.

### S7-2 (Tooltip Wrap) — PASS
Minimal, precise. AC3 (viewport clamp with wrapped/taller tooltip) is the right defensive check. One-line fix with clear acceptance test.

### S7-3 (Regime Grouping) — PASS WITH NOTE
Open Question 2 (Treeselect widget nested data support) is the critical blocker risk. Morpheus must verify before Neo starts Phase B. If Treeselect doesn't support mixed flat+nested, the architecture changes significantly (custom HTML list vs. widget upgrade).

**HEURISTIC #6 (Recognition over Recall):** AC4 states "selecting the parent selects all children." This is the expected behavior but must be confirmed as supported. If it's not native, it's a must-have — a group expander that doesn't select children would confuse users who think they're selecting a whole regulator family.

### S7-4 (Relationship Tags Display) — PASS WITH AC ADDITION
**Gap identified:** ACs covered no-regime (hidden) and single-regime but not the multi-regime case. When multiple regimes are selected, the user may want to see mapping quality for each.

**AC7 added:** Multi-regime display — show relationship tags for ALL active regimes, each labeled with regime name.

**HEURISTIC #1 (Visibility of System Status):** The detail panel currently shows regime mapping per-regime. AC7 keeps the detail panel consistent with that existing multi-regime pattern.

### S7-5 (Mapping Quality Filter) — PASS
"Exactly one regime" constraint is pragmatic. AC5+AC6 (auto-clear) are correct — mapping quality is inherently contextual and should never persist across regime changes. The zero-result overlay reuse (AC8) is consistent with existing UX patterns.

---

## Gate Decision

**`*user approve` Gate 1**

AC addition for S7-4 has been applied directly to the sprint doc. Does not require re-review. One note for Morpheus:

> The Treeselect OQ (Open Question 2) must be answered before architecting Phase B. If mixed flat+nested isn't supported, Phase B architecture must use a different approach (custom list or upgraded widget). This is the only risk that could force an architectural pivot.

Proceed to Morpheus architecture.

---

*Smith — 2026-04-25*
