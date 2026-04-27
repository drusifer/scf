# Sprint: Framework Switcher + Tag Filtering

**Epic:** Multi-Framework Visualization with Tag-Driven Filtering  
**Status:** Ready for Smith Gate 1 Review  
**Date:** 2026-04-24

---

## Background

The visualizer currently renders only SCF 2026.1 data. The repo now contains:
- `configs/scf.yaml` and `configs/cri.yaml` — YAML configs that abstract each framework's column schema
- `data/cri_controls_framework_mapping_catalog.csv` — CRI Profile v2.1 controls with 24+ regime mappings
- `data/cri_domains.csv` — CRI domain/function definitions
- `data/scf_controls_consolidated.csv` — SCF 2026.1 controls

Tag columns per framework:
- **CRI:** `CRI SUBJECT TAGS` (107 unique hashtag-style tags) + `CRI TIER TAGS` (Tier 1–4)
- **SCF:** `SCRM TAGS` (TIER 1 STRATEGIC / TIER 2 OPERATIONAL / TIER 3 TACTICAL)

---

## Sprint Stories

### S-FT-1: Config-Driven Data Loader
**Story:** As a developer, I want the data loader to be driven by YAML config schema mappings so that swapping frameworks requires only loading a different config, not changing business logic.

**Acceptance Criteria:**
- [ ] A `loadFramework(configPath)` function reads the YAML config and returns a dataset normalized to a standard internal shape (id, domain, category, subcategory, weight, description, tags, regimeMappings)
- [ ] Both `configs/scf.yaml` and `configs/cri.yaml` load without errors; all schema fields resolve to the correct CSV columns
- [ ] If a YAML field maps to a column that doesn't exist in the CSV, a console warning is emitted (not a hard error)
- [ ] If `loadFramework()` fails (missing file, parse error), an inline error message is displayed where the viz would appear, citing which framework failed to load — no blank chart
- [ ] Unit tests cover both configs loading correctly

---

### S-FT-2: Framework Selector UI
**Story:** As a user, I want a segmented toggle in the left sidebar to switch between SCF 2026.1 and CRI Profile v2.1 so that I can compare controls from both frameworks using the same visualization.

**Acceptance Criteria:**
- [ ] A segmented control (two options: "SCF 2026.1" and "CRI Profile v2.1") appears at the top of the left sidebar
- [ ] Selecting a framework triggers a re-render of the full visualization using the new dataset
- [ ] During framework switch re-render, a loading indicator (spinner or progress bar) appears immediately on the chart area and disappears when the viz is ready
- [ ] A framework badge showing the active framework's YAML `name` value is visible in the chart area at all times
- [ ] The active framework selection persists to `localStorage` and is restored on page load
- [ ] Tag filter `localStorage` state is namespaced per framework (`scf_tag_filters` / `cri_tag_filters`); on page load, only the active framework's tag filter state is restored
- [ ] Switching frameworks clears active tag filters and repopulates the tag panel (see S-FT-4)
- [ ] Regime selections that exist in both frameworks are preserved on switch; others are dropped

---

### S-FT-3: Regime Selector Repopulation on Switch
**Story:** As a compliance manager, I want the regime selector list to automatically update to show only regimes available in the active framework so that I'm never confused by greyed-out or missing options.

**Acceptance Criteria:**
- [ ] After framework switch, the regime selector list is rebuilt from the new dataset's available mapping columns (columns with the `mapping_tag_suffix` pattern from YAML, or explicit listing for SCF)
- [ ] CRI mode exposes: NYDFS PART 500, FFIEC CAT, FFIEC DAM, CIS V8 1, HONG KONG SFC, NAIC IDSML, DORA LEVEL 1, MAS CHN AND TRMG, NIST 800-53R5, ASIC, NIST 800-61R3, APRA CPS 234, OSFI B-13, FFIEC AIO, JFSA, OSFI CSSA, SEC AUG 2023, APRA CPG 234, ECB CROE, FFIEC BCM, OCC CSWP, EBA (all from CRI CSV)
- [ ] SCF mode exposes the existing regime set
- [ ] Previously selected regimes that exist in the new framework are pre-checked; others are deselected silently

---

### S-FT-4: Tag Filter Panel
**Story:** As a risk officer, I want to filter the visualization by one or more tags from the active framework so that I can focus on a specific risk tier or subject area without losing hierarchy context.

**Acceptance Criteria:**
- [ ] A **Tag Filter** section appears in the left sidebar below the regime selector
- [ ] Tag groups are rendered from the YAML `tag_cols` array:
  - CRI: two groups — "Subject Tags" and "Tier Tags" — rendered as labelled checkboxes
  - SCF: one group — "SCRM Tier" — rendered as labelled checkboxes
- [ ] Selecting one or more tags dims all controls that do not contain any of the selected tags (opacity 0.15–0.25); matching controls remain at full opacity
- [ ] Dimmed controls are not removed — parent containers remain visible to preserve hierarchy
- [ ] If active tag filter(s) match zero controls, display a message overlay on the chart: "No controls match the selected tags. [Clear Filters]" — same visual pattern as the existing "No regimes selected" message
- [ ] When one or more tags are active, a badge showing count of active tag filters (e.g. "3 tags") appears on the sidebar header and collapse/expand handle; badge disappears when filters are cleared
- [ ] A "Clear Filters" button resets all tag checkboxes and restores full opacity to all nodes
- [ ] Framework switch clears all tag filters
- [ ] Active tag filter state (selected tags per group) persists to `localStorage` namespaced per framework

---

### S-FT-5: Tag Search Input
**Story:** As a CRI analyst, I want to search within the tag filter panel to quickly find specific subject tags (e.g., `#authentication`) without scrolling through all 107 options.

**Acceptance Criteria:**
- [ ] A text input above the Subject Tags checklist filters the visible tag list in real time (case-insensitive substring match)
- [ ] Tier Tags (small, fixed list) do not require a search input
- [ ] Searching does not affect currently selected tags — selected tags remain checked even if filtered out of view by the search
- [ ] A compact chip list showing selected tag names appears above the search input at all times when tags are selected — visible regardless of search query; each chip has an ×/remove affordance
- [ ] If the search input yields no matching tags, display "No tags match '…'" in the list area
- [ ] Clearing the search input restores the full tag list

---

### S-FT-6: Detail Panel Framework Awareness
**Story:** As a user, I want the control detail panel to show the correct field labels and tag information for the active framework so that the details are never confusingly labeled with the wrong framework's terminology.

**Acceptance Criteria:**
- [ ] The detail panel uses field labels from the active YAML config (e.g., "CRI Profile v2.1 Diagnostic Statement" vs "SCF Control Description")
- [ ] The detail panel shows the control's tags (all `tag_cols` values) for the active framework
- [ ] CRI detail panels show regime mapping quality tags (e.g., `FFIEC CAT TAGS`) alongside the mapped controls

---

## Definition of Done (Epic)

- [ ] S-FT-1 through S-FT-6 acceptance criteria all pass
- [ ] Both frameworks render without console errors
- [ ] Switching frameworks completes in < 2 seconds (including re-render)
- [ ] Tag filtering updates viz in < 200ms for either dataset size
- [ ] localStorage persists: framework, regimes, tag filters across hard reload
- [ ] Smith Gate 1 approval received before implementation begins

---

## Open Questions for Morpheus

1. Should YAML configs be loaded at runtime (fetch from `/configs/*.yaml`) or bundled at build time?
2. The SCF CSV currently uses hard-coded column names in `scf_processor.js` — the refactor to config-driven loading (S-FT-1) may require a significant processor rewrite. Flag as architecture risk.
3. Should "dimming" non-matching tag nodes also reduce their effective radius, or strictly visual opacity?
