# Sprint 8 Architecture - Context and Polish

**Sprint:** Sprint 8: Context and Polish  
**Stories:** `agents/cypher.docs/sprint8_polish.md`  
**Date:** 2026-04-27  
**Status:** Ready for Smith Gate 2 Review

---

## Architecture Summary

Sprint 8 stays in the existing render/config layer. Do not introduce a new UI state framework or broad refactor.

Primary files:
- `framework_configs.js`
- `app.js`
- `index.html`
- `tests/unit/test_framework_processor.js`
- `tests/e2e/ux_screenshots.spec.js`

Oracle guidance: existing docs favor small render-layer/config-layer changes, with pure helpers only when they make behavior independently testable.

---

## Decisions

### D1: Keep `#tag-filter-badge`, Broaden Meaning to Activity Badge

Keep the existing element id for compatibility with CSS and tests. Broaden the implementation semantics from "tag filters only" to "active context items."

Implementation detail:
- Badge count = selected regimes + active tag filters + active Mapping Quality filters.
- Clear button visibility must NOT use that full count.
- Clear button visibility = active tag filters + active Mapping Quality filters.

This prevents a selected regime from making a "Clear Filters" button appear when no filters are active.

### D2: Legend Uses Bounded Wrapping, Not Scroll

Use CSS containment and wrapping for the legend. Avoid scroll because the legend is currently `pointer-events-none`; making it scrollable would require pointer interaction and could block chart navigation.

Target behavior:
- Bottom-right anchored.
- Max height around `40vh`.
- Multi-column wrapping toward the left when many regimes are selected.
- Bounded max width so chips remain inside viewport.

### D3: PPTDF Fix Is Config + Test, No Data Migration

The SCF CSV already has the required header. The fix is to update the `raw` value in `framework_configs.js` and add coverage that proves the default SCF hierarchy is no longer a single Uncategorized depth-1 group.

---

## S8-1: SCF Hierarchy Shows Meaningful PPTDF Groups

### Files

- `framework_configs.js`
- `tests/unit/test_framework_processor.js`

### Implementation

Change SCF hierarchy config:

```js
{ id: "PPTDF_Applicability", raw: "PPTDF\nApplicability", name: "PPTDF Applicability" }
```

Do not change `id`, `name`, `hierarchy_aliases`, or `default_hierarchy`.

### Tests

Extend framework processor tests:
- Initialize SCF using default hierarchy.
- Assert root children include the expected PPTDF groups: Data, Facility, N/A, People, Process, Technology.
- Assert root children are not exactly one `Uncategorized` node.

If the fixture is too small to include every real group, add an integration/E2E assertion against the real SCF CSV instead of weakening AC2.

---

## S8-2: Unified Sidebar Activity Badge

### Files

- `app.js`
- `index.html`
- `tests/e2e/ux_screenshots.spec.js`

### Implementation

Keep `#tag-filter-badge`; update `updateFilterBadge()`:

```js
function updateFilterBadge() {
    const filterCount = activeTagFilters.size + activeMappingQualityFilters.size;
    const activityCount = selectedRegimeIds.size + filterCount;
    const badge = document.getElementById("tag-filter-badge");
    if (badge) {
        badge.textContent = activityCount > 0 ? `${activityCount}` : "";
        badge.classList.toggle("hidden", activityCount === 0);
        const label = `${activityCount} active context ${activityCount === 1 ? "item" : "items"}: ${selectedRegimeIds.size} regime(s), ${activeTagFilters.size} tag filter(s), ${activeMappingQualityFilters.size} mapping quality filter(s)`;
        badge.setAttribute("title", label);
        badge.setAttribute("aria-label", label);
    }
    document.getElementById("tag-clear-btn")?.classList.toggle("hidden", filterCount === 0);
}
```

Call `updateFilterBadge()` after regime selection changes:
- In `initTreeselect()` `inputCallback`, after `selectedRegimeIds = new Set(selectedIds)`.
- After `_initialRegimeValue` is applied.
- Existing tag/mapping quality call sites remain.

### Tests

Add E2E assertions:
- Select one regime; badge appears with count `1`.
- Select a Mapping Quality filter; badge count increases.
- Badge `aria-label` includes the breakdown of regimes, tag filters, and mapping quality filters.
- Clear filters; badge remains if regime is still selected.
- Clear/deselect regimes; badge hides when no context remains.

---

## S8-3: Navigation Controls Have Clear Labels

### Files

- `index.html`
- `app.js`
- `tests/e2e/ux_screenshots.spec.js`

### Implementation

Add stable labels to sidebar handle buttons in `index.html`:

```html
<button class="sidebar-handle" onclick="toggleSidebar('left')" title="Collapse filters sidebar" aria-label="Collapse filters sidebar">
```

```html
<button onclick="toggleSidebar('right')" class="sidebar-handle" title="Collapse details panel" aria-label="Collapse details panel">
```

Add helper in `app.js`:

```js
function updateSidebarToggleA11y(side) {
    const isLeft = side === "left";
    const sidebar = document.getElementById(isLeft ? "left-sidebar" : "right-sidebar");
    const button = sidebar?.querySelector(".sidebar-handle");
    if (!button) return;
    const collapsed = isLeft
        ? sidebar.classList.contains("collapsed")
        : !sidebar.classList.contains("open");
    const label = isLeft
        ? (collapsed ? "Expand filters sidebar" : "Collapse filters sidebar")
        : (collapsed ? "Expand details panel" : "Collapse details panel");
    button.setAttribute("title", label);
    button.setAttribute("aria-label", label);
}
```

Call helper:
- At the end of `toggleSidebar(side)`.
- Once after initial app setup for both sides.

If previous/next sibling controls exist in implementation, add explicit labels there. Current code search found sidebar handles as the concrete arrow controls.

### Tests

Add DOM assertions:
- Initial left handle has `"Collapse filters sidebar"`.
- After click, it has `"Expand filters sidebar"`.
- Initial right handle has appropriate details-panel label and updates after click.

---

## S8-4: Regime Legend Stays In View

### Files

- `index.html`
- `app.js`
- `tests/e2e/ux_screenshots.spec.js`

### Implementation

Update legend container classes:

```html
<div id="regime-legend"
     class="absolute bottom-8 right-8 flex flex-col flex-wrap content-end gap-2 pointer-events-none max-h-[40vh] max-w-[min(28rem,calc(100vw-3rem))]">
```

Update item classes in `updateLegend()`:
- Keep compact chip style.
- Add max width and truncation for long regime names:

```js
item.className = "bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-xl max-w-48";
```

```html
<span class="text-[9px] font-bold text-white uppercase tracking-wider truncate">${regime.name}</span>
```

### Tests

Add/extend E2E:
- Select one SCF regime in light mode at 1440x900 and assert legend bounding box is inside viewport.
- Repeat dark mode or reuse existing dark selected-regime screenshot if it reliably selects a regime.
- If test setup can select multiple regimes reliably, assert multiple legend items remain inside viewport.

Bounding box assertion should check:
- `x >= 0`
- `y >= 0`
- `x + width <= viewport.width`
- `y + height <= viewport.height`

---

## Phase Recommendation for Mouse

### Phase A: Data/Hierarchy Polish
- S8-1 only.
- Files: `framework_configs.js`, processor tests.

### Phase B: Sidebar Context Polish
- S8-2 + S8-3.
- Files: `app.js`, `index.html`, E2E tests.

### Phase C: Legend Containment
- S8-4 only.
- Files: `index.html`, `app.js`, E2E tests/screenshots.

Each phase is independently testable and small enough for a short implementation loop.

---

## Gate 2 Notes for Smith

- S8-2 intentionally reuses `#tag-filter-badge` to avoid UI churn, but the visible behavior changes from tag-filter-only to active-context count.
- S8-4 uses wrapping rather than scrolling so the legend remains non-interactive and does not block chart navigation.
- No broad redesign or SCRM filtering is included.
