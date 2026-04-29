# UX Feedback Analysis — Sprint 6 Candidates

**Smith — HCI Expert**
**Date:** 2026-04-25
**Source:** Drew's live session feedback (4 issues)

---

## Issue 1 — Framework Switch Does Not Properly Reinitialize Regime Selector

**Heuristic:** #1 Visibility of System Status, #4 Consistency and Standards
**Severity:** Critical (broken core feature)

**Observed:** When switching SCF → CRI, the regime selector does not visibly update to show CRI's mapped frameworks. The old SCF regime list appears to persist alongside or underneath the new one.

**Root Cause (confirmed in code):** `initTreeselect()` at `app.js:1194` creates a `new Treeselect({parentHtmlContainer: container})` without first clearing `treeselect-container`. Contrast with `initHierarchyFieldsTreeselect()` at `app.js:1263` which calls `container.innerHTML = ""` before reinit. The Treeselect library appends to the container — old widget remains in the DOM on every `switchFramework()` call.

**Fix:** `document.getElementById("treeselect-container").innerHTML = ""` before `new Treeselect(...)` in `initTreeselect()`.

**Secondary fix:** The section label "Compliance Regimes" is SCF-specific terminology. CRI calls these "Mapped Frameworks" or "Assessment Standards." The accordion header should be framework-aware (driven by `processor.config`, e.g., a `regime_label` field).

---

## Issue 2 — Regime Selector Visually Overlaps Tag Filter Section

**Heuristic:** #8 Aesthetic and Minimalist Design
**Severity:** Major (layout corruption)

**Observed:** The regime selector (treeselect with `alwaysOpen: true, staticList: true`) and the tag filter accordion below it visually collide. On SCF with 50+ regimes, the always-visible list saturates the sidebar's `40vh` budget and pushes tag content into an obscured position.

**Root Cause:** Two compounding factors:
1. The orphaned old treeselect from the framework-switch bug (Issue 1) doubles the regime widget height
2. Even without the bug: `alwaysOpen: true` + `staticList: true` means the full regime list is always rendered; 50+ SCF regimes fill the sidebar at any viewport height

**Fix:** Issue 1's `innerHTML = ""` fix removes the doubling. The remaining layout risk is the 40vh + 40vh budget: with hierarchy fields also open, three 40vh blocks compete. Consider making the regime accordion's `max-height` dynamically calculated or defaulting to a slightly smaller value (e.g., `30vh`) so the sidebar remains navigable without scroll.

---

## Issue 3 — Tier Tag Filter Uses Inclusive (OR) Logic; User Expects Exclusive (ONLY) Filtering

**Heuristic:** #5 Error Prevention, #7 Flexibility and Efficiency
**Severity:** Major (misleading filter behavior for CRI use case)

**Observed:** Drew checks only "Tier 4" in the CRI tier filter and expects to see ONLY controls that are exclusively Tier 4. Instead, the filter shows all controls tagged with "Tier 4" including those that are also tagged Tier 1, Tier 2, or Tier 3 (since CRI tier tags are cumulative — a Tier 4 control also carries Tier 1/2/3 tags).

**Current behavior (app.js:192):**
```js
controlMatchMap.set(d, d.data.tags.some(t => activeTagFilters.has(t)));
```
This is a union/OR: control matches if ANY of its tags is in the active set. With cumulative tier tagging, this makes tier filtering meaningless — every lower-tier control matches a higher-tier selection.

**Desired behavior:** Within a tag group (e.g., "CRI TIER TAGS"), when some tags are checked and others aren't, the filter should match controls where ALL their tags in that group are within the checked set — i.e., a control with tags [Tier 1, Tier 2, Tier 3, Tier 4] should only match when ALL four tiers are checked.

**Fix:** Per-group exclusive logic: for each tag group, a control matches iff its tags in that group are a subset of the active tags in that group. Requires tracking which tags belong to which group (already available via the `buildTagGroup(col, ...)` structure). The filter predicate becomes:

```
control matches IF:
  for each tag-group with any active filter:
    control.tags ∩ group_tags ⊆ active_tags ∩ group_tags
```

This means: "if you've checked some tags from group X, a control must not have any UNCHECKED tags from group X." Controls with no tags from group X are unaffected.

**Note:** This only affects groups where >1 tag exists and they're cumulative. Behavior for non-cumulative tag groups (subject tags, etc.) is unchanged.

---

## Issue 4 — D3 Node Labels Overlap in Dense Views; Hover Needs Parent Context

**Heuristic:** #8 Aesthetic and Minimalist Design, #6 Recognition Rather Than Recall
**Severity:** Major (affects primary viz readability)

**Observed:** In the D3 circle-packing, text labels for adjacent nodes overlap when circles are small. Drew's suggestion: on hover, show the node's full parent path using nested context rather than just the node name — so users can understand which domain/category a control belongs to without deciphering overlapping static text.

**Current behavior:** Static SVG `<text>` elements are rendered at node centers. The reading mode hides labels for nodes below a size threshold, but visible labels at adjacent levels still collide in dense areas.

**Fix direction:** Two-part improvement:
1. **Hover tooltip with parent breadcrumb:** On `mouseover`, show a small floating tooltip (HTML div, not SVG) that displays the full path from root to node — e.g., "GOVERN > Organizational Context > Organizational Mission". This gives positional context without adding to SVG label density.
2. **Tooltip structure:** Use a clean multi-line text tooltip (or compact `<ul><li>` path breadcrumb), positioned relative to cursor, clipped to viewport. Not SVG — HTML tooltips are easier to style and don't interfere with D3 layout.

**Implementation pattern:** Follow the `#tag-zero-result` / `#onboarding-hint` HTML-overlay-over-SVG pattern. A single `#node-tooltip` div, `position: fixed`, shown on `d3.on("mouseover")`, hidden on `"mouseout"`.

**Note:** The reading mode already suppresses labels for small nodes. The tooltip replaces the need to read overlapping labels — users hover to get full context for any node.

---

## Priority Order for Sprint 6

| # | Issue | Severity | Fix Complexity |
|---|-------|----------|----------------|
| 1 | Regime selector stacking on switch | Critical | Low (1-line fix + label field) |
| 2 | Layout overlap (partially fixed by #1) | Major | Low-medium |
| 3 | Tier filter exclusive logic | Major | Medium |
| 4 | Hover tooltip with parent context | Major | Medium |

**Recommendation:** All 4 belong in Sprint 6. Issue 1 is a 1-line bug fix that unblocks issue 2. Issues 3 and 4 are independent UX improvements.

---

*Analysis by Smith — 2026-04-25*
