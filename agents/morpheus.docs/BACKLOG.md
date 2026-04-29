# Backlog

## Active Items

### B-PPTDF — Fix SCF PPTDF Column Name Mismatch
**Status:** Planned in Sprint 8
**Priority:** High (affects all SCF hierarchy rendering)
**Source:** Sprint 5 investigation (Neo/Trin)

The SCF CSV column for PPTDF Applicability has a multi-line header: `"PPTDF\nApplicability"`. The `framework_configs.js` `hierarchy_cols` entry references `"PPTDF Applicability"` (space, not newline). Because the lookup fails, all 1,468 SCF controls fall into a single "Uncategorized" depth-1 node — the default hierarchy (PPTDF → NIST CSF → SCF Domain) produces one large bubble instead of 6 distinct PPTDF groupings.

**Fix:** In `framework_configs.js`, update SCF `hierarchy_cols[0].raw`:
```js
{ id: "PPTDF_Applicability", raw: "PPTDF\nApplicability", name: "PPTDF Applicability" }
```
**AC:** SCF depth-1 nodes show Data / Facility / N/A / People / Process / Technology (6 distinct groups).

---

### B-SCRM — SCRM Tier Tag Filtering
**Priority:** Low (nice to have)
**Source:** Sprint 5 investigation (Neo)

The SCF CSV has three binary-flag SCRM tier columns: `"SCRM Focus\n\nTIER 1\nSTRATEGIC"`, `"SCRM Focus\n\nTIER 2\nOPERATIONAL"`, `"SCRM Focus\n\nTIER 3\nTACTICAL"`. Values are 'x' (applicable) or empty. The current tag filter UI expects categorical string values; binary columns produce only 'x' as a tag which is meaningless to users.

**Options:**
1. New "flag filter" UI component: show tier checkboxes derived from column names (not values)
2. Leave `tag_cols: []` for SCF; SCRM filtering deferred

**AC (if pursued):** SCF sidebar shows "SCRM Tier" filter group with TIER 1 / TIER 2 / TIER 3 checkboxes; selecting one highlights only controls marked 'x' in that column.

---

## Completed Sprints

| Sprint | Theme | Status |
|--------|-------|--------|
| 1 | CSV loading + initial viz | ✅ Done |
| 2 | Relative Control Weighting bubble sizing | ✅ Done |
| 3 | Predictable label reading mode | ✅ Done |
| 4 | Framework switcher + tag filtering + CRI | ✅ Done |
| 5 | UX Polish — breadcrumb, empty states, onboarding, tooltips | ✅ Done |

---
*Last updated: 2026-04-27*
