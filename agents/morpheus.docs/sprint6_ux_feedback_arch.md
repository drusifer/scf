# Sprint 6 Architecture — Framework UX Fixes & Interaction Depth

**Author:** Morpheus (Tech Lead)
**Date:** 2026-04-25
**Stories:** `agents/cypher.docs/sprint6_ux_feedback.md`
**Source code ref:** `app.js`, `index.html`, `framework_configs.js`

---

## Overview

4 stories, 3 phases. All changes are in the render/event layer — no data model changes, no CSV pipeline changes. Phases A and B are independent; Phase C is independent of both.

```
Phase A: S6-1 (initTreeselect clear + regime_label) + S6-2 (CSS max-height)
Phase B: S6-3 (per-group exclusive filter logic)
Phase C: S6-4 (hover tooltip)
```

---

## Phase A — S6-1: Regime Selector Reinit + S6-2: Sidebar Layout

### S6-1: Primary fix

**File:** `app.js:1194` (`initTreeselect()`)

Add `container.innerHTML = ""` before `new Treeselect(...)`:

```js
function initTreeselect() {
    // ... options build ...
    const container = document.getElementById("treeselect-container");
    container.innerHTML = "";                    // ← ADD THIS LINE
    regimeTreeselect = new Treeselect({ ... });
    // ... rest unchanged ...
}
```

This matches the existing pattern at `app.js:1263` (`initHierarchyFieldsTreeselect()`). No other changes to the Treeselect init logic.

### S6-1: Secondary — framework-aware regime label

**New field in `framework_configs.js`:** Add `regime_label` to each framework config entry:
```js
// SCF entry:
regime_label: "Compliance Regimes",

// CRI entry:
regime_label: "Mapped Frameworks",
```

**New function in `app.js`:** `updateRegimeLabel()`
```js
function updateRegimeLabel() {
    const el = document.getElementById("regime-label");
    if (el) el.textContent = processor.config.regime_label || "Compliance Regimes";
}
```

**Call site:** Add `updateRegimeLabel()` to `switchFramework()` alongside `updateFrameworkBadge()`. Also call once on initial load (after processor is ready).

**HTML change (`index.html:486`):** Add `id="regime-label"` to the accordion header span:
```html
<span id="regime-label" class="text-sm font-semibold flex items-center gap-2">
    🛡️ Compliance Regimes
</span>
```

### S6-2: CSS max-height reduction

**File:** `index.html:489` — change regime-selector max-height:
```html
<!-- BEFORE -->
<div id="regime-selector" class="accordion-content p-4 overflow-y-auto" style="max-height: 40vh;">

<!-- AFTER -->
<div id="regime-selector" class="accordion-content p-4 overflow-y-auto" style="max-height: 30vh;">
```

The outer `#regime-selector` div already has `overflow-y: auto`. The Treeselect widget renders inside `#treeselect-container` (its child), so constraining the outer container's height is sufficient — no Treeselect option changes needed.

**Verification target:** At 768px viewport, with all three accordions open, the tag filter accordion header must be reachable without scrolling the overall sidebar.

---

## Phase B — S6-3: Per-Group Exclusive Filter Logic

### Architecture: tagGroupMap

Add one new module-level variable:
```js
let tagGroupMap = new Map(); // tag string → column name (group key)
```

This is populated lazily in `buildTagGroup()` — one entry per unique tag for each group:

```js
function buildTagGroup(col, tags, isSearchable) {
    // ... existing group/label/search creation ...
    tags.forEach(tag => {
        tagGroupMap.set(tag, col);    // ← ADD: record group membership
        // ... existing item/checkbox/span creation ...
    });
    // ...
}
```

**Clear on reset:** `tagGroupMap.clear()` must be called at the top of `initTagFilterPanel()` — before the `groupsContainer.innerHTML = ""` line — so stale group memberships from a previous framework don't linger.

### Architecture: rewrite applyTagFilter()

Replace the flat `.some()` predicate with a per-group subset check:

```js
function applyTagFilter() {
    if (!root || !node) return;

    if (activeTagFilters.size === 0) {
        node.style("opacity", null);
        hideTagZeroResultOverlay();
        updateFilterBadge();
        return;
    }

    // Build per-group active filter sets from the flat activeTagFilters
    const activeFiltersByGroup = new Map();
    activeTagFilters.forEach(tag => {
        const col = tagGroupMap.get(tag);
        if (!col) return;
        if (!activeFiltersByGroup.has(col)) activeFiltersByGroup.set(col, new Set());
        activeFiltersByGroup.get(col).add(tag);
    });

    function controlPassesFilter(tags) {
        if (!tags || tags.length === 0) return true;   // AC7: empty tags pass all groups
        for (const [col, activeForGroup] of activeFiltersByGroup) {
            const controlTagsInGroup = tags.filter(t => tagGroupMap.get(t) === col);
            if (controlTagsInGroup.length === 0) continue;  // AC5: no tags in this group → pass
            if (!controlTagsInGroup.every(t => activeForGroup.has(t))) return false;
        }
        return true;
    }

    const controlMatchMap = new Map();
    root.descendants().forEach(d => {
        if (d.data.tags !== undefined) {
            controlMatchMap.set(d, controlPassesFilter(d.data.tags));
        }
    });

    // ... rest of opacity application unchanged ...
}
```

**Key invariants preserved:**
- `activeTagFilters` (flat Set) is unchanged — all existing callers (chip list, checkbox state, save/load, badge count, clear) continue working without modification.
- `tagGroupMap` is the only new state. It is framework-scoped and reset on `initTagFilterPanel()`.
- Non-cumulative groups produce identical results: if a control has exactly one tag per group (`[Subject A]`) and `activeForGroup = {Subject A, Subject B}`, then `{Subject A}.every(t => {Subject A, Subject B}.has(t))` → true. Correct.
- Cumulative groups produce the new exclusive behavior: control with `[Tier 1, Tier 2, Tier 3, Tier 4]` tags only matches when `activeForGroup ⊇ {Tier 1, Tier 2, Tier 3, Tier 4}`.

---

## Phase C — S6-4: Hover Tooltip with Parent Breadcrumb

### HTML: new tooltip div

Add `#node-tooltip` to `index.html` immediately after `#onboarding-hint` (follow the same pattern):

```html
<div id="node-tooltip"
     class="hidden fixed z-50 pointer-events-none text-xs text-white bg-gray-900/90 rounded px-3 py-1.5 shadow-lg border border-white/10 max-w-xs"
     style="display: none; white-space: nowrap;"></div>
```

Use `display: none` (inline style) as the initial hidden state — the D3 handlers toggle this directly (same pattern as `#tag-zero-result`).

### JS: tooltip helper functions in `app.js`

```js
function getNodeTooltipPath(d) {
    if (d.depth === 0) return processor.config.name;          // AC9: root → framework name
    return d.ancestors()
        .reverse()
        .filter(a => a.depth > 0)                              // AC2: exclude root
        .map(a => a.data.name)
        .join(" › ");
}

function showNodeTooltip(event, d) {
    const el = document.getElementById("node-tooltip");
    if (!el) return;
    el.textContent = getNodeTooltipPath(d);
    el.style.display = "block";
    positionNodeTooltip(event, el);
}

function positionNodeTooltip(event, el) {
    const pad = 16;
    const tw = el.offsetWidth;
    const th = el.offsetHeight;
    let x = event.clientX + 12;
    let y = event.clientY + 8;
    if (x + tw > window.innerWidth - pad) x = event.clientX - tw - 12;
    if (y + th > window.innerHeight - pad) y = event.clientY - th - 8;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
}

function hideNodeTooltip() {
    const el = document.getElementById("node-tooltip");
    if (el) el.style.display = "none";
}
```

### JS: wire into existing D3 handlers (`app.js:697`)

Extend the existing `mouseover`, `mouseout`, and add `mousemove`:

```js
.on("mouseover", function handleMouseOver(event, d) {
    // ... existing stroke highlight + label logic unchanged ...
    showNodeTooltip(event, d);                               // ← ADD
})
.on("mousemove", function handleMouseMove(event, _d) {      // ← ADD NEW HANDLER
    const el = document.getElementById("node-tooltip");
    if (el && el.style.display !== "none") positionNodeTooltip(event, el);
})
.on("mouseout", function handleMouseOut(event, d) {
    // ... existing stroke restore + label logic unchanged ...
    hideNodeTooltip();                                        // ← ADD
})
```

**No SVG changes.** The tooltip is a pure HTML overlay. D3 layout is not affected.

---

## Risk Register

| Risk | Severity | Mitigation |
|------|----------|------------|
| Treeselect library re-appends header elements on reinit | Low | `innerHTML = ""` nukes all child nodes; library rebuilds cleanly (same as hierarchy fields pattern) |
| `30vh` regime max-height clips on very small viewports | Low | Users can scroll the accordion content; the constraint is a soft max |
| `tagGroupMap` tag collision across groups | None | Tags are group-scoped per framework; two groups sharing a tag string would be a data authoring error, not a code error |
| Tooltip `offsetWidth` = 0 before first render | Low | `display: block` must be set before reading `offsetWidth` — set display first, then measure |
| Tooltip clips behind D3 SVG z-index | Low | Use `z-50` class (Tailwind) on tooltip div; SVG has no explicit z-index |

---

## Open Questions for Smith (Gate 2)

**OQ-1:** Should the `🛡️` emoji in the regime accordion header follow the `regime_label` or remain hardcoded? Options: (a) hardcode `🛡️` for both frameworks (simpler), (b) add `regime_icon` field to config. Smith's preference on whether CRI "Mapped Frameworks" should use a different icon or retain `🛡️`.

---

## Phasing Summary

| Phase | Stories | Files Changed | Risk |
|-------|---------|---------------|------|
| A | S6-1 + S6-2 | `app.js`, `index.html`, `framework_configs.js` | Low |
| B | S6-3 | `app.js` | Medium |
| C | S6-4 | `app.js`, `index.html` | Medium |

All phases are independently testable. Phase A should be implemented and validated before Phase B/C begin, as it is the highest-priority fix.

---

*Architecture by Morpheus — 2026-04-25*
*Awaiting Smith Gate 2 approval.*
