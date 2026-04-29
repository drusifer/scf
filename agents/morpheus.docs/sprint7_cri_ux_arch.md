# Sprint 7 Architecture — CRI UX Remediation

**Architect:** Morpheus  
**Date:** 2026-04-25  
**Sprint doc:** agents/cypher.docs/sprint7_cri_ux_remediation.md  

---

## Open Question Resolutions

### OQ-1: Should `filter_mode` be YAML-configurable per `tag_cols` entry?

**RESOLVED: No.** OR logic is correct for all current tag groups across both CRI and SCF. The original Sprint 6 subset design was a logic error invalidated by real CRI data (cumulative tiers starting from "Tier: 1"; multi-tag subject tags). There is no scenario where subset behavior was intentionally correct. Adding a `filter_mode` YAML field for a hypothetical future third framework is premature abstraction. If that need arises, add it then. Change `every()` → `some()` unconditionally.

### OQ-2: Does Treeselect support mixed flat+nested trees?

**RESOLVED: Yes.** Confirmed by examining `initHierarchyNavigatorTreeselect()` (app.js:1386) which passes a tree built by `buildOptions()` — nodes without `children` become selectable leaves; nodes with `children` become expandable groups. The `inputCallback` for the regime selector already handles group-level selection via `cat-` prefix. CRI grouping will use `grp-` prefix with the same pattern.

### OQ-3: Should Mapping Quality filter state persist to localStorage?

**RESOLVED: No.** Mapping Quality filter is contextually tied to a single active regime selection. Persisting this state creates confusing page-load behavior (filter restored but active regime might be different). Always reset on page load and on regime change. No localStorage for this filter.

---

## Phase A — S7-1 + S7-2 (Bug Fixes)

### S7-1: `tag_filter.js` — `every()` → `some()`

**Single-line change:** `tag_filter.js:19`

```js
// BEFORE:
if (!controlTagsInGroup.every(t => activeForGroup.has(t))) return false;

// AFTER:
if (!controlTagsInGroup.some(t => activeForGroup.has(t))) return false;
```

**Semantics change:** Control passes a group if it has ANY of the selected tags in that group (intersection/OR), not ALL (subset). Cross-group AND is preserved: control must pass every group that has active filters.

**Unit test updates required (2 tests now assert wrong behavior):**

```
test "AC6 cumulative tier: Tier 4 filter excludes controls with lower tiers"
  BEFORE: pred(["Tier 1", "Tier 2", "Tier 3", "Tier 4"]) → false  (subset)
  AFTER:  pred(["Tier 1", "Tier 2", "Tier 3", "Tier 4"]) → true   (has "Tier 4")
  NEW assertion: pred(["Tier 1"]) when only "Tier 4" checked → false (no intersection)

test "non-cumulative subject tags behave correctly"
  BEFORE: pred(["#governance", "#strategy"]) when "#governance" checked → false  (subset)
  AFTER:  pred(["#governance", "#strategy"]) when "#governance" checked → true   (has "#governance")
```

**New tests to add (AC9):**
1. Single subject tag selection matches multi-tag controls (5-tag control, select 1 → passes)
2. Tier 2 selection matches cumulative tier controls (["Tier: 1", "Tier: 2"] passes "Tier: 2" filter)
3. Cross-group AND: Tier 2 + `#governance` → control must have both

**Isolation:** No changes to `app.js` or `index.html`. Pure `tag_filter.js` + test changes.

---

### S7-2: `index.html:592` — Remove `white-space: nowrap`

**Single-attribute change:**

```html
<!-- BEFORE -->
<div id="node-tooltip"
     class="fixed z-50 pointer-events-none text-xs text-white bg-gray-900/90 rounded border border-white/10 shadow-lg px-3 py-1.5 max-w-xs"
     style="display: none; white-space: nowrap;"></div>

<!-- AFTER -->
<div id="node-tooltip"
     class="fixed z-50 pointer-events-none text-xs text-white bg-gray-900/90 rounded border border-white/10 shadow-lg px-3 py-1.5 max-w-xs"
     style="display: none;"></div>
```

**Why this is safe:** `positionNodeTooltip()` reads `el.offsetHeight` AFTER `el.style.display = "block"` (app.js:404–405 sequence: textContent set, then display block, then positionNodeTooltip called). With wrapping, the tooltip will be taller; `offsetHeight` will reflect the wrapped height, and the bottom-edge clamping already handles this correctly.

**Isolation:** No JS changes needed.

---

## Phase B — S7-3 (Regime Grouping)

### New function: `buildRegimeTreeOptions(regimeList)` in `app.js`

```js
function buildRegimeTreeOptions(regimeList) {
    const groups = new Map();
    regimeList.forEach(r => {
        const prefix = r.name.split(" ")[0];
        if (!groups.has(prefix)) groups.set(prefix, []);
        groups.get(prefix).push(r);
    });

    const options = [];
    groups.forEach((regimes, prefix) => {
        if (regimes.length >= 2) {
            options.push({
                name: prefix,
                value: `grp-${prefix}`,
                children: regimes.map(r => ({ name: r.name, value: r.id }))
            });
        } else {
            options.push({ name: regimes[0].name, value: regimes[0].id });
        }
    });
    return options.sort((a, b) => a.name.localeCompare(b.name));
}
```

**Expected CRI output:** 4 group nodes (FFIEC×4, APRA×2, NIST×2, OSFI×2) + 14 flat leaves. "HONG KONG SFC" → prefix "HONG" appears once → flat leaf. ✓

### Modify `initTreeselect()`

Detect CRI vs SCF by checking `processor.config.schema.controls.mapping_tag_suffix`:

```js
function initTreeselect() {
    let options;
    if (processor.config.schema.controls.mapping_tag_suffix) {
        // CRI-style: group by first-word prefix
        options = buildRegimeTreeOptions(scfData.regimeList);
    } else {
        // SCF-style: use regimeCatalog category groupings (existing behavior)
        options = Object.keys(scfData.regimeCatalog).sort().map((category) => ({
            name: category,
            value: `cat-${category}`,
            children: scfData.regimeCatalog[category].map((regime) => ({
                name: regime.name,
                value: regime.id
            }))
        }));
    }
    // ... rest of initTreeselect unchanged
```

### Extend `inputCallback` for `grp-` prefixes

The `inputCallback` already handles `cat-` prefixes (SCF categories). Extend to also handle `grp-` prefixes (CRI groups):

```js
inputCallback: (value) => {
    const selectedIds = value.reduce((acc, v) => {
        if (typeof v === "number") {
            acc.push(v);
        } else if (typeof v === "string" && v.startsWith("cat-")) {
            // SCF category selection — expand all children
            const categoryName = v.replace("cat-", "");
            scfData.regimeCatalog[categoryName]?.forEach(r => acc.push(r.id));
        } else if (typeof v === "string" && v.startsWith("grp-")) {
            // CRI group selection — expand all children
            const prefix = v.replace("grp-", "");
            scfData.regimeList.filter(r => r.name.startsWith(prefix + " ") || r.name === prefix)
                              .forEach(r => acc.push(r.id));
        }
        return acc;
    }, []);
    // ... rest of inputCallback unchanged
```

**localStorage compatibility:** Saved regime names are stored as `regime.id` (numeric) — tree structure change does not affect saved values. ✓

**SCF regression:** SCF does not have `mapping_tag_suffix` → uses `regimeCatalog` path → unchanged. ✓

---

## Phase C — S7-4 + S7-5 (Relationship Tags)

### S7-4: Detail Panel — Quality Tag Display (Refinement)

**Current state (already partially implemented):** `app.js:1547–1553` shows `regimeQualityTags[rid]` as a single text badge in the regime header. 

**Needed changes:**
1. Split the raw qualityTag value by `\n` into individual entries
2. Parse each entry into display-friendly form
3. Show as stacked chips below the regime mapping IDs (not in the header — too cramped for multi-line values)
4. Add "Mapping Quality" sub-label

**Replacement for lines 1547–1553:**

```js
// REMOVE existing quality badge from header (lines 1547-1553)

// ADD after idWrap block:
const qualityTagRaw = data.regimeQualityTags?.[rid];
if (qualityTagRaw) {
    const qtSection = document.createElement("div");
    qtSection.className = "mt-2 pt-2 border-t border-white/5";
    const qtLabel = document.createElement("div");
    qtLabel.className = "text-[9px] text-gray-500 uppercase tracking-widest mb-1";
    qtLabel.textContent = "Mapping Quality";
    qtSection.appendChild(qtLabel);
    const qtChips = document.createElement("div");
    qtChips.className = "flex flex-wrap gap-1";
    qualityTagRaw.split("\n").forEach(entry => {
        const trimmed = entry.trim();
        if (!trimmed) return;
        const chip = document.createElement("span");
        chip.className = "text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300";
        chip.textContent = trimmed;
        qtChips.appendChild(chip);
    });
    qtSection.appendChild(qtChips);
    element.appendChild(qtSection);
}
```

**Multi-regime (AC7 from Smith Gate 1):** The existing `Object.entries(mappings).forEach()` loop already iterates over all active regimes. Each regime block in the detail panel gets its own "Mapping Quality" sub-section. No architectural change needed — the loop handles it.

**HTML changes:** None. All within `showDetail()`.

---

### S7-5: Mapping Quality Filter

#### New state variables

```js
let activeMappingQualityFilters = new Set(); // selected Type values: "Full", "Full Summarily", "Partial"
let mappingQualityRegimeId = null;           // regime ID when filter is active (null if not single-regime)
```

#### New HTML section in `index.html`

Add below the Tag Filter accordion (after `#tag-filter-container`):

```html
<!-- Mapping Quality Filter — shown only when exactly 1 regime selected -->
<div id="mapping-quality-section" class="hidden accordion-item border-t border-[var(--border-muted)]">
    <div class="px-4 py-3">
        <div class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
            Mapping Quality
        </div>
        <div id="mapping-quality-groups" class="flex flex-col gap-0.5"></div>
        <p class="hidden text-[10px] text-[var(--text-muted)] italic mt-1" id="mapping-quality-hint">
            Select a single framework to filter by mapping quality.
        </p>
    </div>
</div>
```

#### New function `initMappingQualityFilter()`

Called from `updateVisualization()` + `inputCallback` after regime selection changes.

```js
function initMappingQualityFilter() {
    const section = document.getElementById("mapping-quality-section");
    if (!section) return;

    if (selectedRegimeIds.size !== 1) {
        section.classList.add("hidden");
        activeMappingQualityFilters.clear();
        mappingQualityRegimeId = null;
        return;
    }

    const regimeId = [...selectedRegimeIds][0];
    mappingQualityRegimeId = regimeId;
    section.classList.remove("hidden");

    // Collect unique Type values from all controls for this regime
    const typeValues = new Set();
    root && root.descendants().forEach(d => {
        if (!d.data.regimeQualityTags) return;
        const raw = d.data.regimeQualityTags[regimeId];
        if (!raw) return;
        raw.split("\n").forEach(entry => {
            const typeMatch = entry.match(/Type:\s*([^;]+)/);
            if (typeMatch) typeValues.add(typeMatch[1].trim());
        });
    });

    const container = document.getElementById("mapping-quality-groups");
    if (!container) return;
    container.innerHTML = "";
    Array.from(typeValues).sort().forEach(typeVal => {
        const label = document.createElement("label");
        label.className = "flex items-center gap-2 cursor-pointer hover:bg-white/5 rounded px-1 py-0.5";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "w-3 h-3 accent-[var(--accent-blue)]";
        cb.dataset.type = typeVal;
        cb.checked = activeMappingQualityFilters.has(typeVal);
        cb.addEventListener("change", () => {
            if (cb.checked) activeMappingQualityFilters.add(typeVal);
            else activeMappingQualityFilters.delete(typeVal);
            applyTagFilter(); // reuse existing filter application
        });
        const span = document.createElement("span");
        span.className = "text-[11px] text-[var(--text-primary)]";
        span.textContent = typeVal;
        label.appendChild(cb);
        label.appendChild(span);
        container.appendChild(label);
    });
}
```

#### Extend `applyTagFilter()` to include Mapping Quality

Add a second predicate check inside `applyTagFilter()`:

```js
function applyTagFilter() {
    if (!root || !node) return;

    const noTagFilter = activeTagFilters.size === 0;
    const noMappingFilter = activeMappingQualityFilters.size === 0 || mappingQualityRegimeId === null;

    if (noTagFilter && noMappingFilter) {
        node.style("opacity", null);
        hideTagZeroResultOverlay();
        updateFilterBadge();
        return;
    }

    const controlPassesTagFilter = noTagFilter
        ? () => true
        : buildTagFilterPredicate(tagGroupMap, activeTagFilters);

    const controlPassesMappingFilter = noMappingFilter
        ? () => true
        : (data) => {
            const raw = data.regimeQualityTags?.[mappingQualityRegimeId];
            if (!raw) return false; // no mapping to this regime — dim it
            return raw.split("\n").some(entry => {
                const typeMatch = entry.match(/Type:\s*([^;]+)/);
                return typeMatch && activeMappingQualityFilters.has(typeMatch[1].trim());
            });
        };

    const controlMatchMap = new Map();
    root.descendants().forEach(d => {
        if (d.data.tags !== undefined) {
            const passTag = controlPassesTagFilter(d.data.tags);
            const passMapping = controlPassesMappingFilter(d.data);
            controlMatchMap.set(d, passTag && passMapping);
        }
    });

    let matchCount = 0;
    node.style("opacity", d => {
        if (d.data.tags) {
            const matches = controlMatchMap.get(d) || false;
            if (matches) matchCount++;
            return matches ? 1.0 : 0.2;
        }
        if (d.depth <= 3) {
            const controlDescendants = d.descendants().filter(desc => desc.data.tags);
            if (controlDescendants.length === 0) return 1.0;
            const allDimmed = controlDescendants.every(desc => !controlMatchMap.get(desc));
            return allDimmed ? 0.5 : 1.0;
        }
        return 1.0;
    });

    if (matchCount === 0) showTagZeroResultOverlay();
    else hideTagZeroResultOverlay();

    updateFilterBadge();
}
```

**Note:** `applyTagFilter()` is already called when checkboxes change. `initMappingQualityFilter()` calls `applyTagFilter()` on checkbox change. Both filter states are combined in a single opacity pass. Zero-result overlay covers both cases.

**Call sites for `initMappingQualityFilter()`:**
- `inputCallback` after `updateVisualization()` call
- `switchFramework()` after `initTagFilterPanel()` (clears mapping quality filter on framework switch)

---

## Implementation Order

| Phase | Story | Files changed | Risk |
|-------|-------|--------------|------|
| A | S7-1 | tag_filter.js, test_tag_filter.js | Low — isolated module |
| A | S7-2 | index.html (1 attr) | Low — display-only |
| B | S7-3 | app.js (new function + initTreeselect + inputCallback) | Medium — Treeselect behavior confirmed |
| C | S7-4 | app.js (showDetail refinement) | Low — existing data, UI-only |
| C | S7-5 | app.js (new functions + applyTagFilter extension), index.html (new HTML section) | Medium — new state + filter logic |

**Risk: S7-5 `applyTagFilter()` extension**
The existing `applyTagFilter()` will be substantially rewritten to handle both filters. Neo should write the new body alongside the old one, run all existing tests green, then replace. The core logic (opacity assignment, zero-result overlay, badge update) is unchanged — only the predicate evaluation is extended.

---

## Test Coverage

| Story | New tests needed |
|-------|-----------------|
| S7-1 | Update 2 existing; add 3 new OR-semantics tests |
| S7-2 | No unit test (visual); E2E hover test verifies wrap |
| S7-3 | Unit test `buildRegimeTreeOptions()`: group detection, flat leaves, sort |
| S7-4 | No new unit test; E2E click-to-detail on a CRI regime-mapped control |
| S7-5 | Unit test `initMappingQualityFilter()` type parsing; integration test filter-then-opacity |

---

*Morpheus — 2026-04-25*
