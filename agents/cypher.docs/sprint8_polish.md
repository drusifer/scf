# Sprint 8: Context and Polish

**Sprint Goal:** Tighten the user-visible polish left after Sprint 7 so active context, hierarchy labels, navigation controls, and legends remain understandable even in compact or collapsed UI states.

**Status:** Ready for Smith Gate 1 Review  
**Date:** 2026-04-27  
**Source:** Sprint 7 closeout, Morpheus backlog, Smith screenshot review, Oracle consult

---

## Scope

This is a polish sprint, not a new feature sprint. It focuses on small, high-signal improvements that make the existing visualization feel coherent and trustworthy.

Included:
- SCF hierarchy label/data polish.
- Unified active-context badge behavior.
- Accessible labels/tooltips for navigation controls.
- Regime legend viewport containment.

Deferred:
- SCRM Tier Tag Filtering. This is a new filtering capability, not polish.
- Broad visual redesign. Current UX reviews found the visual system generally strong.

---

## Sprint Stories

### S8-1: SCF Hierarchy Shows Meaningful PPTDF Groups

**Story:** As a GRC practitioner opening SCF, I want the first hierarchy level to show meaningful PPTDF groups instead of a single Uncategorized grouping, so that the default SCF visualization communicates structure immediately.

**Background:** Morpheus backlog B-PPTDF identifies a column mismatch: `framework_configs.js` references `"PPTDF Applicability"`, while the SCF CSV header is `"PPTDF\nApplicability"`. When the lookup fails, SCF controls collapse into an Uncategorized hierarchy.

**Acceptance Criteria:**
- [ ] AC1: `framework_configs.js` references the actual SCF CSV header for PPTDF Applicability, including the newline.
- [ ] AC2: SCF default hierarchy renders distinct depth-1 PPTDF groups: Data, Facility, N/A, People, Process, and Technology.
- [ ] AC3: Breadcrumbs no longer expose duplicated or avoidable `Uncategorized` levels caused by the PPTDF lookup failure.
- [ ] AC4: Existing hierarchy customization still works for SCF after the raw column fix.
- [ ] AC5: Add or update a unit/E2E check proving SCF depth-1 groups are not collapsed into a single Uncategorized node.

**Heuristic:** #2 Match Between System and Real World

---

### S8-2: Unified Sidebar Activity Badge

**Story:** As a user who collapses the sidebar, I want a compact badge to tell me that filters or regime selections are active, so that I do not lose track of the context shaping the visualization.

**Background:** Sprint 7 closeout flagged that `updateFilterBadge()` counts only tag filters, not Mapping Quality filters. Smith's prior review also found that collapsed sidebar state hides active regime context.

**Acceptance Criteria:**
- [ ] AC1: The sidebar activity badge appears when any of these are active: selected regimes, tag filters, or Mapping Quality filters.
- [ ] AC2: The badge count includes all active context items: selected regime count + active tag filter count + active Mapping Quality filter count.
- [ ] AC3: Badge title/aria-label explains the count with a breakdown, e.g. `"3 active context items: 1 regime, 1 tag filter, 1 mapping quality filter"` — use "items" because selected regimes are included alongside filters.
- [ ] AC4: The badge hides only when there are no selected regimes, no active tag filters, and no active Mapping Quality filters.
- [ ] AC5: Clearing filters or clearing all regimes updates the badge immediately without requiring a page refresh.
- [ ] AC6: Existing tag-filter badge tests are updated so Mapping Quality and regime selection are covered.

**Heuristic:** #1 Visibility of System Status

---

### S8-3: Navigation Controls Have Clear Labels

**Story:** As a keyboard or screen-reader user, or as a user discovering the interface visually, I want the sidebar and navigation arrow controls to have clear labels and tooltips, so that their purpose is understandable before I click them.

**Background:** Smith's screenshot review identified unlabeled arrow controls as a minor usability issue. The left sidebar handle currently has a generic `"Toggle Sidebar"` title; directional icon changes are visual-only.

**Acceptance Criteria:**
- [ ] AC1: Left sidebar toggle button has an `aria-label` and `title` that update between `"Collapse filters sidebar"` and `"Expand filters sidebar"`.
- [ ] AC2: Right detail/sidebar toggle button, if present, has an `aria-label` and `title` that update between `"Collapse details panel"` and `"Expand details panel"`.
- [ ] AC3: Any previous/next navigation arrow controls in the visualization have specific `aria-label` and `title` values such as `"Previous sibling"` and `"Next sibling"`.
- [ ] AC4: Labels update when the control state changes, not only on initial page load.
- [ ] AC5: Add a DOM assertion in E2E or unit coverage for the labels.

**Heuristic:** #4 Consistency and Standards, #6 Recognition Rather Than Recall

---

### S8-4: Regime Legend Stays In View

**Story:** As a user viewing selected regimes, I want the regime legend to remain visible and readable at common desktop viewport sizes, so that I can interpret color coding without hunting for the legend.

**Background:** Smith's screenshot review flagged that the dark-mode regime legend may clip or render off-screen at 1440x900.

**Acceptance Criteria:**
- [ ] AC1: With one selected regime at 1440x900 in light and dark mode, the regime legend is visible within the viewport.
- [ ] AC2: With multiple selected regimes, the legend uses a bounded height and scroll/wrap behavior rather than clipping off-screen.
- [ ] AC3: Legend styling remains readable in light and dark modes.
- [ ] AC4: Existing screenshots or E2E tests cover at least one selected-regime legend state.
- [ ] AC5: The legend remains pointer-events-none unless implementation requires interaction; it must not block chart navigation.

**Heuristic:** #1 Visibility of System Status

---

## Definition of Done

- [ ] S8-1 through S8-4 acceptance criteria satisfied.
- [ ] Unit tests pass.
- [ ] Lint passes.
- [ ] E2E/screenshot coverage updated for affected UI states.
- [ ] Smith Gate 1 and Gate 2 approvals received.
- [ ] Mouse phase plan contains small phases with no more than 1-3 tasks each.

---

## Open Questions for Morpheus

1. Should S8-2 keep the existing `#tag-filter-badge` id for compatibility and simply broaden its meaning, or rename/add a new `#activity-badge` element?
2. For S8-4, should legend overflow prefer vertical scroll, multi-column wrapping, or compact chips at small heights?
3. Does S8-1 require a data migration/test fixture update, or is the raw column config fix sufficient?

---

## Known Deferred Work

- SCRM Tier Tag Filtering remains deferred as a low-priority capability.
- Broader responsive redesign is out of scope unless S8-4 uncovers a concrete viewport defect.
