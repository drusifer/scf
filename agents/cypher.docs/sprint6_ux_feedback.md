# Sprint 6: Framework UX Fixes & Interaction Depth

**Sprint Goal:** Resolve two regression-class defects introduced in Sprint 4 (regime selector stacking, sidebar overflow) and ship two medium-complexity UX improvements (exclusive tier filtering, hover tooltip) — so the framework switching flow is trustworthy and the visualization gives users full context on demand.

**Source:** Smith UX analysis 2026-04-25 (`agents/smith.docs/ux_feedback_sprint6.md`)
**Priority order:** S6-1 → S6-2 → S6-3 → S6-4

---

## US-S6-1 — Regime Selector Properly Reinitialized on Framework Switch (Critical)

**As a** GRC practitioner switching between SCF and CRI,
**I want** the regime selector to fully reset and show only the current framework's regimes,
**So that** I can trust that the filters I apply correspond to the framework I'm viewing.

**Background:** `initTreeselect()` at `app.js:1194` creates a `new Treeselect()` without first clearing `#treeselect-container`. The Treeselect library appends to the container, so old SCF regime widgets stack under the new CRI ones (or vice versa) on every `switchFramework()` call. This means the regime selector shows stale data and doubles in DOM height. Contrast with `initHierarchyFieldsTreeselect()` at `app.js:1263` which correctly calls `container.innerHTML = ""` before reinit.

**Secondary issue:** The section header reads "Compliance Regimes" — SCF-specific terminology. CRI users see "Compliance Regimes" when their mapped items are "Assessment Standards" or "Mapped Frameworks."

**Acceptance Criteria:**
- [ ] AC1: `document.getElementById("treeselect-container").innerHTML = ""` is called before `new Treeselect(...)` in `initTreeselect()`. After a SCF→CRI switch, only CRI regime options appear in the selector.
- [ ] AC2: After a CRI→SCF switch, only SCF regime options appear. No stale entries from the previous framework remain in the DOM.
- [ ] AC3: The regime accordion section label is driven by `processor.config.regime_label` (a new field in `framework_configs.js`). Default value: `"Compliance Regimes"` for SCF, `"Mapped Frameworks"` for CRI.
- [ ] AC4: `regime_label` is added to both config entries in `framework_configs.js`. If the field is absent, the label falls back to `"Compliance Regimes"`.
- [ ] AC5: After the fix, switching frameworks twice (SCF→CRI→SCF) leaves exactly one regime selector widget in the DOM each time.
- [ ] AC6: Playwright test 03 (framework switch) is updated to assert the regime section label matches the active framework's `regime_label`.

**Heuristic:** #1 Visibility of System Status, #4 Consistency and Standards

---

## US-S6-2 — Sidebar Regime List Does Not Overflow into Tag Filter Area (Major)

**As a** GRC practitioner using the sidebar filters,
**I want** the regime selector and tag filter sections to be independently scrollable without visually colliding,
**So that** I can reach the tag filters without the regime list consuming all available sidebar space.

**Background:** The regime selector uses `alwaysOpen: true` + `staticList: true`, making the full regime list always rendered. SCF's 50+ regimes at `40vh` fill the sidebar and push the tag filter accordion into an obscured or inaccessible position. Issue 1's fix (removing duplicate widgets) reduces the worst case, but even a single regime list at 50+ items can saturate the available viewport height.

**Acceptance Criteria:**
- [ ] AC1: The regime treeselect list's `max-height` is set to `30vh` (reduced from `40vh`) so that the tag filter accordion below remains reachable without the regime list consuming all sidebar space.
- [ ] AC2: The regime list is scrollable within its `30vh` container — no overflow outside the accordion boundary.
- [ ] AC3: The tag filter accordion header is always visible without scrolling when the regime list and hierarchy fields accordions are both open, at a viewport height of 768px.
- [ ] AC4: This change applies in both SCF and CRI — there is no per-framework hardcoded height.
- [ ] AC5: At least one Playwright screenshot is regenerated showing the full sidebar with both regime selector and tag filters visible without overlap.

**Heuristic:** #8 Aesthetic and Minimalist Design

---

## US-S6-3 — Tag Group Filter Uses Exclusive (Subset) Logic for Cumulative Tags (Major)

**As a** GRC practitioner using CRI tier filters,
**I want** selecting only "Tier 4" to show ONLY controls that are exclusively Tier 4,
**So that** I can filter to specific maturity levels without seeing every lower-tier control.

**Background:** CRI tags tiers cumulatively — a Tier 4 control also carries Tier 1, Tier 2, and Tier 3 tags. The current filter at `app.js:192` uses `.some()` (OR logic): a control matches if ANY of its tags is in the active set. With cumulative tagging, filtering for "Tier 4" matches everything tagged Tier 1, 2, or 3 as well — making tier filtering useless for CRI.

**Current code (app.js:192):**
```js
controlMatchMap.set(d, d.data.tags.some(t => activeTagFilters.has(t)));
```

**Desired per-group subset logic:**
```
control matches IF:
  for each tag-group with any active filter:
    control.tags ∩ group_tags ⊆ active_tags ∩ group_tags
```
Meaning: "if you've checked some tags from group X, a control must not have any UNCHECKED tags from group X." Controls with no tags from a filtered group are unaffected.

**Acceptance Criteria:**
- [ ] AC1: The filter predicate is changed from a flat `.some()` across all tags to a per-group subset check. The tag group membership structure (from `buildTagGroup()`) is used to determine which tags belong to which group.
- [ ] AC2: Filtering for "Tier 4" in CRI shows only controls whose tier tags are exclusively `{Tier 4}` — i.e., controls that carry Tier 1, Tier 2, or Tier 3 tags do NOT appear.
- [ ] AC3: Selecting "Tier 1" + "Tier 2" shows controls whose tier tag set is a subset of `{Tier 1, Tier 2}` — controls tagged only Tier 1, or only Tier 2, or both, but NOT those additionally tagged Tier 3 or Tier 4.
- [ ] AC4: For non-cumulative tag groups (e.g., CRI subject tags where controls carry exactly one subject tag), the behavior is unchanged from the current OR logic — a control matches if its tag is in the active set.
- [ ] AC5: Controls with no tags in a filtered group always pass that group's filter (they are not hidden by a group they don't participate in).
- [ ] AC6: Existing unit tests for `applyTagFilter()` are updated to cover the new per-group logic. At least 2 new test cases cover: (a) cumulative tier scenario, (b) controls with no tier tags passing through.
- [ ] AC7 *(Smith Gate 1 addition)*: Controls with a completely empty `tags` array (no tags at all) always pass all group filters. The subset check on an empty set is vacuously true — implementation must not treat `undefined` or `[]` as a filter failure.

**Heuristic:** #5 Error Prevention, #7 Flexibility and Efficiency

---

## US-S6-4 — Hover Tooltip Shows Full Parent Breadcrumb Path (Major)

**As a** GRC practitioner exploring the circle-packing visualization,
**I want** hovering over a node to show a tooltip with the full path from root to that node,
**So that** I can understand a control's domain context without needing to click into it or decipher overlapping labels.

**Background:** Static SVG text labels overlap in dense areas of the visualization. The reading mode suppresses labels below a size threshold, but this leaves adjacent visible labels colliding in dense regions. Users lose positional context when labels are hidden. A hover tooltip with the full parent path (e.g., "GOVERN > Organizational Context > Organizational Mission") gives full context on demand without adding to SVG label density.

**Acceptance Criteria:**
- [ ] AC1: A single `#node-tooltip` `<div>` is added to `index.html`, `position: fixed`, initially hidden (`display: none`). It follows the existing `#tag-zero-result` / `#onboarding-hint` HTML-overlay-over-SVG pattern.
- [ ] AC2: On D3 `mouseover` of any node, the tooltip is populated with the full ancestor path from the root to the hovered node, excluding the root label itself (depth 0). Path segments are separated by `" › "`.
- [ ] AC3: The tooltip is positioned near the cursor (offset by ~12px right and ~8px below) and clipped to the viewport — it does not overflow the right or bottom edge.
- [ ] AC4: On D3 `mouseout`, the tooltip is hidden.
- [ ] AC5: On D3 `mousemove`, the tooltip position updates to follow the cursor.
- [ ] AC6: The tooltip is visible for ALL nodes regardless of reading mode label suppression — nodes whose labels are hidden by reading mode are still hoverable.
- [ ] AC7: The tooltip is styled consistently with the existing panel aesthetic: dark background, small sans-serif text, `border-radius: 4px`, `padding: 6px 10px`. No custom tooltip library is used.
- [ ] AC8: Playwright test — a `mouseover` is triggered on a leaf node; the test asserts that `#node-tooltip` has `display` other than `none` and that its text content contains the node's name.
- [ ] AC9 *(Smith Gate 1 addition)*: When hovering over the root node (depth === 0), the tooltip shows only `processor.config.name` (e.g., `"Secure Controls Framework 2026.1"`) with no path separator. The root has no ancestors — implementation must not render a leading `" › "` or blank segment.

**Heuristic:** #8 Aesthetic and Minimalist Design, #6 Recognition Rather Than Recall

---

## Deferred to Backlog (not in Sprint 6)

Items from prior backlog that remain deferred:
- **B-PPTDF:** Hierarchy column name mismatch in CRI processor (Morpheus flagged 2026-04-25)
- **B-SCRM:** SCRM binary-flag type handling in SCF tag filter (Morpheus flagged 2026-04-25)
- **N1:** Breadcrumb nav arrows `aria-label`/`title` attributes
- **N2:** Regime-active indicator badge on collapsed sidebar toggle
- **N3:** Playwright test 06 timing fix (`waitForSelector('.treeselect-list')`)
- **N4:** Regime legend viewport clipping at 1440×900

---

## Sprint Sizing Notes for Morpheus

- **S6-1** is a 1-line primary fix (`innerHTML = ""`), plus a `regime_label` field addition — Low complexity. Unblocks S6-2.
- **S6-2** is a CSS `max-height` change — Low complexity. Depends on S6-1 to fully validate.
- **S6-3** is a logic rewrite of `applyTagFilter()` plus test updates — Medium complexity. Independent of S6-1/S6-2.
- **S6-4** is a new DOM element + D3 event handlers — Medium complexity. Independent of other tasks.
- Suggested phasing: Phase A (S6-1 + S6-2), Phase B (S6-3), Phase C (S6-4).

---

*Written by Cypher — 2026-04-25*
*Awaiting Smith Gate 1 approval before Morpheus architecture.*
