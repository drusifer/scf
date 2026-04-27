# Architecture: Framework Switcher + Tag Filtering

**Sprint:** sprint_framework_tags.md  
**Date:** 2026-04-24  
**Status:** Ready for Smith Gate 2 Review

---

## Open Questions — Resolved

### Q1: Runtime YAML loading vs. build-time bundling?
**Decision: JS config objects in `framework_configs.js`, not runtime YAML parsing.**

The project has no build step (all scripts loaded from CDN/static files). Adding js-yaml as a runtime dependency just to parse two small config objects is unnecessary complexity. The YAML files in `configs/` remain the human-readable source of truth; `framework_configs.js` mirrors their structure as plain JS objects. A developer updating `configs/scf.yaml` also updates `framework_configs.js` — this is a two-file update but avoids a build pipeline and a parser dependency.

### Q2: scf_processor.js refactor scope?
**Decision: Single config-driven `FrameworkDataProcessor` class replaces `SCFDataProcessor`.**

`scf_processor.js` is renamed to `framework_processor.js`. The class is renamed `FrameworkDataProcessor` and its constructor takes a config object. All hard-coded column references (`'SCF #'`, `'SCF Domain'`, `regimeStartIdx = 30`, etc.) are replaced by config-driven lookups. The tree-building algorithm is unchanged — only column name lookups are parameterized. This is the minimal refactor that unlocks both frameworks without duplicating logic.

### Q3: Tag filtering — opacity only or also radius?
**Decision: Opacity only. No radius change.**

Changing radius requires re-running D3 pack (expensive, visually jarring, loses layout stability). Opacity is a pure SVG attribute change — instantaneous, reversible, and meets the requirement of preserving hierarchy context. Dimmed nodes stay at their packed positions.

---

## Component Design

### New File: `framework_configs.js`

```javascript
const FRAMEWORK_CONFIGS = {
  scf: {
    key: "scf",
    name: "SCF 2026.1",
    files: { controls: "data/scf_controls_consolidated.csv", domains: "data/scf_domains_2026_1.csv" },
    schema: {
      controls: {
        domain_col: "SCF Domain",
        category_col: "Base ID",
        subcategory_col: "SCF Control",
        weight_col: "Relative Control Weighting",
        control_id_col: "SCF #",
        description_col: "Secure Controls Framework (SCF) Control Description",
        tag_cols: ["SCRM TAGS"],
        mapping_tag_suffix: null,  // SCF uses positional offset (col 30+)
        regime_start_col: 30       // SCF-specific: regimes start at column index 30 in CSV
      },
      domains: { name_col: "SCF Domain", id_col: "SCF Identifier", intent_col: "Principle Intent" }
    },
    hierarchy_cols: [
      { id: "PPTDF_Applicability", raw: "PPTDF Applicability", name: "PPTDF Applicability" },
      { id: "NIST_CSF_Function_Grouping", raw: "NIST CSF Function Grouping", name: "NIST CSF Function Grouping" },
      { id: "SCF_Domain", raw: "SCF Domain", name: "SCF Domain" },
      { id: "Conformity_Validation_Cadence", raw: "Conformity Validation Cadence", name: "Cadence" }
    ],
    default_hierarchy: ["PPTDF_Applicability", "NIST_CSF_Function_Grouping", "SCF_Domain"],
    default_regimes: []  // No pre-selected regimes — user must choose explicitly
  },
  cri: {
    key: "cri",
    name: "CRI Profile v2.1",
    files: { controls: "data/cri_controls_framework_mapping_catalog.csv", domains: "data/cri_domains.csv" },
    schema: {
      controls: {
        domain_col: "Function",
        category_col: "Category",
        subcategory_col: "Subcategory",
        weight_col: "Weighting",
        control_id_col: "Profile Id",
        description_col: "CRI Profile v2.1 Diagnostic Statement",
        tag_cols: ["CRI SUBJECT TAGS", "CRI TIER TAGS"],
        mapping_tag_suffix: " TAGS",  // CRI: detect regime cols by this suffix
        regime_start_col: null        // CRI: discovered dynamically via suffix
      },
      domains: { name_col: "Function", id_col: "Profile Id", intent_col: "Diagnostic Statement" }
    },
    hierarchy_cols: [
      { id: "Function", raw: "Function", name: "Function" },
      { id: "Category", raw: "Category", name: "Category" },
      { id: "Subcategory", raw: "Subcategory", name: "Subcategory" }
    ],
    default_hierarchy: ["Function", "Category"],
    default_regimes: []  // No pre-selected regimes — user must choose explicitly
  }
};
```

**Key design note:** `hierarchy_cols` moves out of the processor class and into the config. The CRI hierarchy is fixed at 3 levels; the adjustable hierarchy UI is disabled when `hierarchy_cols.length <= default_hierarchy.length`. This avoids exposing a "customize hierarchy" affordance with no meaningful choices.

---

### Modified File: `framework_processor.js` (was `scf_processor.js`)

```
FrameworkDataProcessor
  constructor(config)        — stores config, initializes state
  loadCSV(url)               — unchanged
  init()                     — uses config.files.controls / .domains; no url args
  _detectRegimes(headers)    — replaces hardcoded regimeStartIdx=30:
                               if config.schema.controls.mapping_tag_suffix:
                                 find all headers ending in suffix, exclude them from regime list
                               else:
                                 slice from config.schema.controls.regime_start_col
  buildTree(hierarchy)       — uses config.schema.controls.* for column lookups
                               adds tags[] to each control node
  _buildTagsForRow(row)      — new helper: collects values from all tag_cols columns → string[]
  hierarchyColumns           — now from config.hierarchy_cols (not hardcoded)
  currentHierarchy           — now from config.default_hierarchy (not hardcoded)
```

**Regime detection for CRI:** CRI CSV has columns like `FFIEC CAT`, `FFIEC CAT TAGS`, `NYDFS PART 500`, `NYDFS PART 500 TAGS`, etc. The regime list is built from columns that do NOT end in ` TAGS` (and are not the other known non-regime columns like Function, Category, etc.). The `_TAGS` columns hold tag/quality metadata for each mapping, not the mapping itself. This is the inverse of SCF's position-based regime detection.

**Tag storage:** Each control node gains a `tags: string[]` field populated by `_buildTagsForRow()`. Tags from all `tag_cols` are merged into a single flat array (e.g. `["Tier: 1", "Tier: 2", "#authentication", "#access_management"]`).

---

### Modified File: `app.js`

**New state variables:**
```javascript
const FRAMEWORK_STORAGE_KEY = "scf_active_framework";  // stores "scf" or "cri"
let currentFrameworkKey = localStorage.getItem(FRAMEWORK_STORAGE_KEY) || "scf";
let processor = new FrameworkDataProcessor(FRAMEWORK_CONFIGS[currentFrameworkKey]);
let activeTagFilters = new Set();  // flat set of selected tag strings

// Per-framework localStorage keys for tag filters
const getTagFilterKey = (fwKey) => `scf_tag_filters_${fwKey}`;
```

**New functions:**
```javascript
switchFramework(key)         — shows loading overlay, awaits processor re-init with new config,
                               calls clearTagFilters(), rebuilds regime selector, updateVisualization(),
                               hides overlay. Saves key to localStorage.
clearTagFilters()            — clears activeTagFilters, persists empty to localStorage, updates badge
applyTagFilter()             — walks all D3 node data, sets circle opacity:
                               full (1.0) if node has no tags field (container) OR tags intersects activeTagFilters OR activeTagFilters is empty
                               dimmed (0.2) if node.data.tags exists AND intersection is empty
updateFilterBadge()          — sets badge count on sidebar handle; hides if count=0
initTagFilterPanel(config)   — builds checklist UI from config.schema.controls.tag_cols
                               reads saved filter state from per-framework localStorage key
                               attaches onChange → activeTagFilters update → applyTagFilter()
```

**Modified functions:**
```javascript
window.addEventListener("load")  — passes FRAMEWORK_CONFIGS[currentFrameworkKey] to processor.init()
updateVisualization()            — after re-render, calls applyTagFilter() to reapply any active filters
initTreeselect()                 — rebuilds from processor.regimeCatalog (unchanged flow, processor is already config-aware)
```

---

### New UI Elements in `index.html`

**Framework Selector** (left sidebar header):
```html
<div id="framework-selector" class="flex rounded-lg overflow-hidden border border-[var(--border-muted)] mb-3">
  <button data-fw="scf" class="framework-btn flex-1 py-1.5 text-xs font-medium transition-colors">SCF 2026.1</button>
  <button data-fw="cri" class="framework-btn flex-1 py-1.5 text-xs font-medium transition-colors">CRI Profile v2.1</button>
</div>
```

**Framework Badge** (chart overlay, bottom-left of SVG container):
```html
<div id="framework-badge" class="absolute bottom-3 left-3 text-xs px-2 py-0.5 rounded-full bg-black/30 text-white/70 backdrop-blur-sm pointer-events-none"></div>
```

**Loading Overlay** (absolute over chart SVG):
```html
<div id="framework-loading" class="hidden absolute inset-0 flex items-center justify-center bg-[var(--bg-deep)]/80 z-20">
  <div class="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin"></div>
</div>
```

**Tag Filter Panel** (left sidebar, below regime selector accordion):
```html
<div id="tag-filter-section" class="mt-3">
  <div class="flex items-center justify-between mb-1.5">
    <span class="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Tag Filters</span>
    <button id="clear-tag-filters" class="text-xs text-[var(--accent-blue)] hidden">Clear</button>
  </div>
  <!-- Tag groups injected by initTagFilterPanel() -->
  <div id="tag-filter-groups"></div>
</div>
```

**Filter Badge** (on sidebar collapse handle):  
The existing `left-toggle-icon` button gets a sibling `<span id="tag-filter-badge">` — shown as a pill with count when filters active.

---

## Data Flow Diagram

```
page load
  │
  ├─ read localStorage(scf_active_framework) → "scf" | "cri"
  ├─ new FrameworkDataProcessor(FRAMEWORK_CONFIGS[key])
  ├─ processor.init() → scfData (normalized tree + regimeCatalog + regimeList)
  ├─ initViz() + initTreeselect() + initHierarchyFieldsTreeselect()
  ├─ initTagFilterPanel(config) → renders tag groups, restores saved filters
  └─ applyTagFilter() → initial pass (no-op if no saved filters)

framework switch
  │
  ├─ show #framework-loading overlay
  ├─ processor = new FrameworkDataProcessor(FRAMEWORK_CONFIGS[newKey])
  ├─ scfData = await processor.init()
  ├─ clearTagFilters()
  ├─ reconcile selectedRegimeIds (keep only IDs valid in new regime list)
  ├─ rebuild regime treeselect
  ├─ updateVisualization()
  ├─ initTagFilterPanel(newConfig)
  ├─ update framework badge text
  └─ hide #framework-loading overlay

tag filter change
  │
  ├─ update activeTagFilters Set
  ├─ persist to localStorage(scf_tag_filters_{fwKey})
  ├─ applyTagFilter()
  │    ├─ if activeTagFilters.size === 0 → all nodes opacity 1.0
  │    ├─ for each leaf node: check node.data.tags ∩ activeTagFilters
  │    │    match → opacity 1.0 | no match → opacity 0.2
  │    └─ container nodes → always opacity 1.0 (no tags field)
  └─ updateFilterBadge()
       ├─ count > 0 → show badge with count
       └─ count = 0 → hide badge
```

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| CRI CSV has newline-embedded tag values (multi-line cells) | High | PapaParse handles multiline cells natively; `_buildTagsForRow` splits on `\n` already |
| Regime ID reconciliation on switch (selectedRegimeIds uses index-based IDs, CRI regime indices differ from SCF) | High | **localStorage regime storage must switch from index-based to name-based.** Current SCF stores `[62, 167, 226]` as indices into `regimeList`. CRI has different indices for same regime names. Reconciliation must match by regime `name`, not `id`. This is a breaking change to the existing localStorage key — must migrate gracefully (fallback to framework defaults if saved IDs don't parse cleanly). |
| Adjustable hierarchy UI crashes for CRI (fewer columns) | Medium | Hide hierarchy customizer when `config.hierarchy_cols.length <= config.default_hierarchy.length` |
| HIERARCHY_ALIASES in app.js are SCF-specific | Medium | Move HIERARCHY_ALIASES into the config object (SCF keeps existing aliases; CRI uses identity aliases) |
| `DEFAULT_REGIMES = [62, 167, 226]` is hardcoded for SCF | Medium | **RESOLVED:** Default regimes = `[]` for both frameworks. Remove `DEFAULT_REGIMES` constant; on first load with no localStorage, regime selector starts with nothing selected. User must choose explicitly. |

---

## Breaking Change: Regime ID Storage

**Current:** `localStorage.setItem("scf_selected_regimes", JSON.stringify([62, 167, 226]))` — index-based.

**Problem:** CRI's regime list has different indices for the same regime names. Index 62 in SCF ≠ index 62 in CRI.

**Fix:** Change storage format to regime **names**: `["NIST CSF v2.0", "EU DORA", "India SEBI CSCRF"]`. On load, resolve names back to indices using the current framework's `regimeList`. Migrate existing saved index arrays on first load by checking if all values are numbers — if so, resolve them through the current (SCF) regimeList to get names, then re-save.

This change is contained to `app.js` regime storage/load logic and is backward-compatible via the migration path.

---

## Files Changed Summary

| File | Change Type | Description |
|------|------------|-------------|
| `scf_processor.js` | Rename + Refactor | → `framework_processor.js`, `FrameworkDataProcessor(config)` |
| `framework_configs.js` | New | Config objects for SCF + CRI |
| `app.js` | Modify | Framework switcher state, tag filter logic, loading overlay, badge, regime name storage |
| `index.html` | Modify | Add `<script>` tags, framework selector, tag panel, badge, loading overlay |

No new external dependencies. No build step changes.
