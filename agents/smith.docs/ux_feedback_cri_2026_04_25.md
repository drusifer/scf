# Smith UX Feedback — CRI Live Session (2026-04-25)

**Source:** Drew live-session feedback, post-Sprint 6 / Framework Tags sprint implementation  
**Surface:** CRI Profile v2.1 visualization (app.js + index.html)  
**Status:** 2 critical bugs, 1 minor bug, 2 feature gaps — filed for Trin triage / Neo implementation

---

## BUG-1 (CRITICAL): Tag filter always returns "no controls match" — Subject Tags

**HEURISTIC:** #9 Help Users Recognize, Diagnose, and Recover from Errors  
**SURFACE:** CRI Subject Tags filter panel (CRI SUBJECT TAGS column)  
**COMMAND:** Select any single subject tag (e.g. `#governance`) in the Tag Filter sidebar  
**EXPECTED:** Visualization dims controls that do NOT have `#governance`; controls tagged with `#governance` remain at full opacity  
**ACTUAL:** Zero-result overlay always appears: "No controls match the selected tags."  

**ROOT CAUSE (confirmed via code inspection):**  
`buildTagFilterPredicate` (tag_filter.js:14) uses a **subset** predicate: a control passes only if ALL of its tags within a group are present in the selected set. CRI controls carry 5–8 subject tags each (e.g. `["#business_impact_analysis", "#critical_infrastructure", "#mission_and_strategy", "#risk_management", "#roles_and_responsibilities"]`). Selecting any single tag requires the control to have ONLY that tag — impossible in practice, so every control fails.

**EXPECTED FIX:** Change the Subject Tags group predicate to **OR/ANY logic**: a control passes if it has AT LEAST ONE of the selected subject tags. The existing group-aware logic in `buildTagFilterPredicate` can support this — the per-group logic simply needs to use `some()` (intersect) not `every()` (subset) for subject tag groups.

---

## BUG-2 (CRITICAL): Tier Tag filter — "Tier: 2/3/4" selections always return 0 results

**HEURISTIC:** #9 + #5 Error Prevention  
**SURFACE:** CRI Tier Tags filter (CRI TIER TAGS column)  
**COMMAND:** Select "Tier: 2", "Tier: 3", or "Tier: 4" alone  
**EXPECTED:** Controls applicable at the selected tier level are highlighted  
**ACTUAL:** Zero-result overlay always appears  

**ROOT CAUSE (confirmed via CSV inspection):**  
CRI tier tags are **always cumulative starting from Tier: 1**. The only tier combinations present in the data are:
- `["Tier: 1"]`
- `["Tier: 1", "Tier: 2"]`
- `["Tier: 1", "Tier: 2", "Tier: 3"]`
- `["Tier: 1", "Tier: 2", "Tier: 3", "Tier: 4"]`

No control exists with only `["Tier: 2"]`, `["Tier: 3"]`, or `["Tier: 4"]`. The subset predicate requires that ALL of a control's tier tags be within the selected set. Selecting only "Tier: 2" means a control with `["Tier: 1", "Tier: 2"]` fails because "Tier: 1" is unchecked.

**EXPECTED FIX:** For Tier Tags, the correct semantic is: "show controls whose tier range INCLUDES my selected tier(s)." Fix: a control passes if its tier tags INTERSECT the selected set (same OR/ANY logic as BUG-1). Neo should evaluate whether this means unifying all tag groups to OR logic, or making the predicate type configurable per `tag_cols` entry in the YAML.

**NOTE FOR MORPHEUS:** The original Sprint 6 Issue 3 design ("per-group subset matching") was based on the belief that exclusive matching was needed. The real CRI data invalidates this assumption. OR logic is correct for both tag groups. This is a design correction, not scope creep.

---

## BUG-3 (MINOR): Tooltip text does not wrap — overflows viewport

**HEURISTIC:** #8 Aesthetic and Minimalist Design  
**SURFACE:** `#node-tooltip` div (index.html:591–592)  
**COMMAND:** Hover over a deep hierarchy node (e.g. Category or Subcategory level)  
**EXPECTED:** Long ancestor paths (e.g. "GOVERN › Org Context › Mission and Strategy") wrap within the tooltip box  
**ACTUAL:** Tooltip extends as a single long horizontal line, potentially clipping outside the viewport  

**ROOT CAUSE (confirmed in code):**  
`index.html:592` has `style="display: none; white-space: nowrap;"`. The `max-w-xs` Tailwind class is already applied but is overridden by the `white-space: nowrap` inline style.  

**FIX:** Remove `white-space: nowrap` from the inline style (or change to `white-space: normal`). The `max-w-xs` class already constrains width; wrapping will happen automatically. One-line change.

---

## FEATURE-1 (MAJOR): Regime selector — group frameworks by regulator prefix

**HEURISTIC:** #4 Consistency and Standards + #8 Aesthetic and Minimalist Design  
**SURFACE:** CRI regime selector (Treeselect widget)  
**CURRENT:** 22 regimes listed flat  
**DESIRED:** Regulators with multiple frameworks shown as expandable groups; single-framework regulators shown as flat items  

**Grouping rule:** Use the first word of the regime name as the group key.

Groups needed (from CRI CSV headers):

| Group | Members | Expander? |
|-------|---------|-----------|
| FFIEC | FFIEC CAT, FFIEC DAM, FFIEC AIO, FFIEC BCM | Yes (4) |
| APRA  | APRA CPS 234, APRA CPG 234 | Yes (2) |
| NIST  | NIST 800-53R5, NIST 800-61R3 | Yes (2) |
| OSFI  | OSFI B-13, OSFI CSSA | Yes (2) |
| NYDFS PART 500 | — | No (1) |
| CIS V8 1 | — | No (1) |
| HONG KONG SFC | — | No (1, first word "HONG" but needs full match or display name) |
| NAIC IDSML | — | No (1) |
| DORA LEVEL 1 | — | No (1) |
| MAS CHN AND TRMG | — | No (1) |
| ASIC | — | No (1) |
| JFSA | — | No (1) |
| SEC AUG 2023 | — | No (1) |
| ECB CROE | — | No (1) |
| OCC CSWP | — | No (1) |
| EBA | — | No (1) |

**Implementation note:** Grouping logic should be applied at regime list render time (not in the YAML config). Key edge case: "HONG KONG SFC" — first word is "HONG" which is not a meaningful regulator prefix. Safest rule: group only when 2+ regimes share the same first word AND that first word alone is a recognizable abbreviation (FFIEC, APRA, NIST, OSFI). A simple `groupBy(firstName)` with a `count ≥ 2` threshold handles this correctly.

---

## FEATURE-2 (MAJOR): Relationship tags not displayed or filterable

**HEURISTIC:** #1 Visibility of System Status + #6 Recognition Rather Than Recall  
**SURFACE:** CRI regime mapping display; Tag Filter panel  
**CURRENT:** When a regime is selected (e.g. FFIEC CAT), the visualization shows which controls map to that regime, but the mapping QUALITY (relationship type) is invisible  
**DESIRED:** Relationship types shown AND filterable  

**Data:** Each regime in the CRI CSV has a companion `*_TAGS` column (e.g. `FFIEC CAT TAGS`, `APRA CPS 234 TAGS`). Values are structured strings like:
- `"Level: Evolving; Type: Full"`
- `"Level: Advanced; Type: Full Summarily"`
- `"Level: Baseline; Type: Partial"`
- `"Level: Innovative; Type: Partial"`

These encode TWO dimensions:
- **Level**: Baseline, Evolving, Intermediate, Advanced, Innovative — the maturity level of the mapped framework control
- **Type**: Full, Full Summarily, Partial — quality of the mapping coverage

**User mental model:** "I've selected FFIEC CAT. Which CRI controls have a Full mapping vs a Partial one?"

**Comparison to Tier Tags (as the user noted):**
- Tier Tags → filter CRI controls by their tier (control-side attribute)
- Relationship Tags → filter by the quality of the mapping to a SELECTED regime (regime-side attribute)

**Proposed behavior:**
1. **Display:** When a regime is selected and a CRI control node is hovered or clicked, show the relationship tag(s) for that regime in the detail panel
2. **Filter:** When a regime is selected, expose a "Mapping Quality" filter section showing unique Level and Type values from that regime's TAGS column — user can filter to show only "Type: Full" controls, for example

**Scope note:** This is a **new feature**, not a fix. Should be planned as a new sprint story. Relationship tag display in detail panel (item 1) is lower effort and higher value; the filter (item 2) is larger scope.

---

## Summary Table

| ID | Severity | Type | One-liner |
|----|---------|------|-----------|
| BUG-1 | Critical | Bug | Subject Tag filter always returns 0 results (subset predicate vs. multi-tag controls) |
| BUG-2 | Critical | Bug | Tier Tag filter broken for Tier 2/3/4 (no control has those tiers without Tier 1) |
| BUG-3 | Minor | Bug | Tooltip `white-space: nowrap` prevents wrapping (1-line fix) |
| FEATURE-1 | Major | Feature | Regime selector: group by regulator prefix with expanders |
| FEATURE-2 | Major | Feature | Relationship tags (`*_TAGS` cols): display + filter by mapping quality |

---

*Smith — 2026-04-25*
