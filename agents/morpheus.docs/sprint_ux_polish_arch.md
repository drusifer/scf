# Sprint Architecture — UX Polish

**Architect:** Morpheus
**Sprint:** UX Polish — Breadcrumb, Empty States & Discoverability
**Stories:** `agents/cypher.docs/sprint_ux_polish.md`
**Date:** 2026-04-24

---

## Architectural Principles for This Sprint

All 6 stories are **render-layer or config-layer** changes. No data model changes, no new abstractions needed. The guiding constraint is: touch the minimum surface area, let the existing patterns lead.

**Existing patterns to follow:**
- `#tag-zero-result` overlay — shows/hides a positioned div inside `#viz-container` based on filter state. US-UX-4 follows this exact pattern.
- `updateFrameworkToggle()` — iterates `.framework-btn` elements and applies state from `FRAMEWORK_CONFIGS`. US-UX-6 extends this.
- `getLabelDisplay()` guard pattern — `d.depth` gates already exist in node fill styling. US-UX-3 adds one depth gate in the label layer.

---

## Decision Log

### D1 — US-UX-1: Breadcrumb Deduplication Strategy

**Decision:** Collapse consecutive identical segments in the `updateBreadcrumbs()` render pass using `reduce()`. Store the shallowest D3 node for each collapsed group as the click target.

**Implementation:**
```
updateBreadcrumbs(d):
  ancestors = d.ancestors().reverse()
  collapsed = ancestors.reduce((acc, node) => {
    last = acc[acc.length - 1]
    if (last && last.node.data.name.split(":")[0] === node.data.name.split(":")[0]):
      // skip duplicate — last.node already holds the shallowest
    else:
      acc.push({ node, label: node.data.name.split(":")[0] })
    return acc
  }, [])
  // render collapsed array instead of ancestors
```

**Constraint:** Render-layer only — `root.descendants()` and D3 hierarchy are untouched.

**Risk:** Low. Isolated to one function. CRI framework has distinct label names at each level so collapsing will be a no-op there.

---

### D2 — US-UX-2: Description Empty State Copy

**Decision:** One-line change at `app.js:1409`.

`safeSetText("detail-desc", data.description || "No description provided.")`
→
`safeSetText("detail-desc", data.description || "No description available for this control in the current framework.")`

**AC3 (source_url link) investigation result:** Neither `framework_configs.js` entry has a `source_url` or `docs_url` field. AC3 is **deferred** — Neo confirms this finding and Cypher creates a separate story if the team wants to add source links.

**Risk:** Trivial. One string literal.

---

### D3 — US-UX-3: Root Node Label Suppression

**Decision:** Suppress depth-0 label via guard in `getLabelDisplay()`. AC1 (suppress) is the chosen path — AC2 (replace with framework name) is NOT implemented. Rationale: the framework name already appears in `#framework-badge` (bottom-left) and the framework selector toggle. Rendering it again as a D3 label would be redundant.

**Implementation:** In `getLabelDisplay(d, currentFocus, targetView)`:
```js
const getLabelDisplay = (d, currentFocus, targetView) => {
    if (d.depth === 0) return "none";  // suppress root node label
    return SCFReadingMode.getLabelEligibility(...) ? "inline" : "none";
};
```

**Additional investigation required (US-UX-3 AC4):** Neo must determine the source of the "SCF Uncategorized Level" text seen in Smith's screenshot. Likely sources:
- A depth-1 node whose name is assembled from hierarchy column values (e.g., `"Uncategorized"` from PPTDF_Applicability fallback)
- OR the root's label rendering before the D3 label offset (`-radius * 0.9`) places it partially off-screen

If the visible text is a depth-1 child node named "Uncategorized" (not the root), the depth-0 guard alone won't fix it. Neo investigates and applies the AC4 case-by-case rule. **Do not add a blanket "Uncategorized" string filter** — "Uncategorized" may be a legitimate visible domain name for controls that are genuinely uncategorized.

**Risk:** Low. Single guard condition. `refreshLabelContent` will still compute text for depth-0 nodes, but `getLabelDisplay` returning "none" means D3 will hide the element — harmless.

---

### D4 — US-UX-4: Onboarding Hint Architecture

**Decision:** Follow the `#tag-zero-result` overlay pattern exactly — a positioned `div` inside `#viz-container`, not an SVG text element.

**Rationale:** SVG text requires D3 data binding and transform coordination. A positioned div is simpler, works with CSS transitions for show/hide, and matches the established `#tag-zero-result` pattern.

**Element to add to `index.html`:**
```html
<div id="onboarding-hint"
     class="absolute inset-0 flex items-end justify-center pb-12 pointer-events-none z-10 transition-opacity duration-300">
    <p class="text-sm text-[var(--text-muted)] opacity-60">
        Select a compliance regime from the left panel to see coverage.
    </p>
</div>
```

**Show/hide logic — new function `updateOnboardingHint()` in `app.js`:**
```
updateOnboardingHint():
  hint = document.getElementById("onboarding-hint")
  if (!hint) return
  noRegimes = selectedRegimeIds.size === 0
  isSCF = currentFrameworkKey === "scf"
  
  # First-run suppression (AC3)
  hasEverSelected = localStorage.getItem("scf_hint_dismissed") === "true"
  
  # Show if: no regimes, is SCF, and (hasn't ever selected OR hint already shown in this session due to deselect)
  # The hint ALWAYS re-appears on deselect-to-empty regardless of localStorage (Smith AC2 revision)
  # localStorage only suppresses hint on PAGE LOAD, not on interaction
  shouldShow = noRegimes && isSCF && (!hasEverSelected || window._regimeWasActiveThisSession)
  
  hint.classList.toggle("hidden", !shouldShow)
```

**Wire-up points:**
- End of `updateVisualization()` — call `updateOnboardingHint()`
- In the treeselect `inputCallback`, after updating `selectedRegimeIds`:
  - If `selectedRegimeIds.size > 0`: set `localStorage.setItem("scf_hint_dismissed", "true")` and `window._regimeWasActiveThisSession = true`
  - Then call `updateOnboardingHint()`
- In `switchFramework()` — call `updateOnboardingHint()` after viz init

**Treeselect placeholder (AC1):**
In `initTreeselect()`, change:
```js
placeholder: "Search frameworks...",
```
to:
```js
placeholder: "Search or select a compliance regime…",
```

**Risk:** Low-medium. New element + new function. Session variable `window._regimeWasActiveThisSession` is intentionally ephemeral — it resets on page reload, which is correct (localStorage suppresses first-load hint only).

---

### D5 — US-UX-5: Tag Filter — Config Bug First, Then Empty State

**Decision:** Two sequential sub-tasks. Neo must complete AC0 before AC1-4.

**AC0 — Config bug investigation:**
Neo opens `data/scf_controls_2026_1.csv`, reads actual column headers, and finds the correct column name(s) for SCF SCRM tags. Current config says `"SCRM TAGS"` — Smith's investigation confirmed this column does not exist in the CSV. The actual SCRM-related columns appear to be `"SCRM Focus\n\nTIER 1\nSTRATEGIC"` (and related multi-line names).

Neo must:
1. Identify which columns contain usable SCRM tag data
2. Update `framework_configs.js` `tag_cols` for SCF to use the correct column name(s)
3. Verify that `initTagFilterPanel` now produces non-empty tag groups

**AC1-3 — Empty state implementation (after AC0 fix):**

Add to end of `initTagFilterPanel(config)`, after the `tagCols.forEach()` loop:

```js
// Show empty state if no tag groups were rendered
if (groupsContainer.children.length === 0) {
    const empty = document.createElement("p");
    empty.className = "text-xs text-[var(--text-muted)] italic mt-1";
    empty.textContent = "No tag filters are available for this framework.";
    groupsContainer.appendChild(empty);
}
```

**Hide accordion (AC3 revised):** If `tagCols.length === 0`, hide the Tag Filters accordion item:
```js
const tagAccordion = document.getElementById("tag-filter-container")?.closest(".accordion-item");
if (tagAccordion) tagAccordion.classList.toggle("hidden", tagCols.length === 0);
```

**Risk for AC0:** Medium — column name mismatch in CSV may mean SCRM tag data doesn't exist at all in the current export. If SCRM tag data is absent, the config fix is a no-op and AC1 empty state is the only visible change. Neo flags this finding to Cypher before closing the story.

---

### D6 — US-UX-6: Framework Tooltip via Config

**Decision:** Add `description` field to each framework config, wire it into `updateFrameworkToggle()` rather than hardcoding `title` in HTML. Single source of truth.

**`framework_configs.js` addition:**
```js
scf: {
    key: "scf",
    name: "SCF 2026.1",
    description: "Secure Controls Framework — comprehensive security and privacy controls",
    ...
}
cri: {
    key: "cri",
    name: "CRI Profile v2.1",
    description: "CISA Cyber Resilience Review Profile — incident response-focused controls",
    ...
}
```

**`updateFrameworkToggle()` addition:**
```js
document.querySelectorAll(".framework-btn").forEach(btn => {
    const isActive = btn.dataset.fw === currentFrameworkKey;
    // ... existing class toggles ...
    const cfg = FRAMEWORK_CONFIGS[btn.dataset.fw];
    if (cfg?.description) btn.title = cfg.description;
});
```

**Playwright AC5:** The test for screenshot 03 should add a DOM assertion:
```js
const btn = page.locator('#framework-selector .framework-btn').first();
await expect(btn).toHaveAttribute('title', /.+/);
```

**Risk:** Trivial.

---

## Phase Breakdown (for Mouse)

| Phase | Stories | Files Touched | Risk |
|-------|---------|---------------|------|
| P1 | US-UX-1, US-UX-2, US-UX-3 | `app.js` only | Low |
| P2 | US-UX-5 AC0 | `framework_configs.js` only | Medium (investigation) |
| P3 | US-UX-4, US-UX-5 AC1-4, US-UX-6 | `app.js`, `index.html`, `framework_configs.js` | Low-medium |

**Sequencing constraint:** P2 must complete before P3 for US-UX-5 (AC0 result informs AC1 empty state copy). All other stories are independent.

---

## Open Question for Smith (Gate 2)

**OQ-1:** US-UX-4 onboarding hint visibility threshold — the proposed hint uses `opacity-60` and bottom-anchored positioning inside the viz. Does Smith want a higher-contrast treatment, or is subtle/muted the right choice for a hint (as opposed to a warning)?

---

*Architecture by Morpheus — 2026-04-24*
*Awaiting Smith Gate 2 approval before Mouse planning.*
