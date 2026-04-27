# Task Board

## Sprint 1: Core Visualization & Data

- [ ] [S1-1] Verify client-side CSV loading in `scf_processor.js`
- [ ] [S1-2] Ensure `index.html` correctly triggers `SCFDataProcessor.init()`
- [ ] [S1-3] Implement/Verify Zoomable Circle Packing logic in `index.html`
- [ ] [S1-4] Implement Regime Selection Sidebar
- [ ] [S1-5] Implement Hierarchy Adjustment Sidebar
- [ ] [S1-6] Implement Search & Navigation
- [ ] [S1-7] Detail Panel for Control Info
- [ ] [S1-8] Dark/Light Mode toggle and persistence

## Sprint 2: Relative Control Weighting

- [x] [S2-1] Add `currentSizeBy` global state and local storage logic
- [x] [S2-2] Update `d3.pack().sum()` and `.sort()` to use `d.weight` or `1`
- [x] [S2-3] Add UI selector for Size By (Weight/Uniform) near Theme toggle
- [x] [S2-4] Test sizing toggle animations and label rendering

## Sprint 3: Predictable Label Reading

- [x] [S3-1] Define branch reading mode for selected node plus two levels below
- [x] [S3-2] Replace depth-only label rules with readable font floor and projected-radius thresholds
- [x] [S3-3] Add reset-to-reading-view control and clear recovery from free zoom/pan
- [x] [S3-4] Verify label readability across click navigation, breadcrumbs, navigator, and manual zoom

## Sprint 4: Framework Switcher + Tag Filtering

### Phase 4A — Data Foundation (S-FT-1) [BLOCKER: must land before all other phases]
- [x] [S4-1] Create `framework_configs.js` with SCF + CRI config objects matching arch spec
- [x] [S4-2] Refactor `scf_processor.js` → `framework_processor.js`: `FrameworkDataProcessor(config)` with config-driven column lookups, `tags[]` on control nodes, CRI regime detection via `_TAGS` suffix
- [x] [S4-3] Update `index.html` to load `framework_processor.js`; verify both frameworks init cleanly and build full tree with no console errors

### Phase 4B — Framework Switch UI (S-FT-2 + S-FT-3)
- [x] [S4-4] Add framework switch state to `app.js`: `currentFrameworkKey`, `switchFramework()`, loading overlay show/hide, framework badge text, `localStorage` persist + restore
- [x] [S4-5] Add segmented framework toggle to `index.html` left sidebar; wire to `switchFramework()`; active/inactive visual states (bg fill + text contrast); badge theme-aware contrast (light + dark mode)
- [x] [S4-6] Migrate regime ID storage from index-based to name-based; reconcile regimes on switch (keep name matches, drop others); one-time migration toast; rebuild regime treeselect on switch

### Phase 4C — Tag Filtering (S-FT-4 + S-FT-5)
- [x] [S4-7] Implement `applyTagFilter()` in `app.js`: leaf opacity (1.0 match / 0.2 no-match), container propagation (0.5 if all descendants dimmed), zero-result overlay message, filter badge count on sidebar handle
- [x] [S4-8] Add tag filter panel to `index.html` sidebar; implement `initTagFilterPanel(config)` in `app.js`; per-framework `localStorage` namespace; "Clear Filters" button; badge hides when no filters active
- [x] [S4-9] Add subject tag search input with real-time filter; selected-tag chip list above search (always visible with × remove); empty-search "No tags match" message; Tier Tags list (no search needed)

### Phase 4D — Detail Panel + Integration (S-FT-6)
- [x] [S4-10] Update detail panel to use active framework's field labels and `tag_cols` display from config; CRI panels show regime quality tags
- [x] [S4-11] End-to-end integration: SCF→CRI→SCF switch, tag filter + clear, badge, regime repopulate, localStorage persist across hard reload; verify DoD: switch <2s, filter <200ms

## Sprint 5: UX Polish — Breadcrumb, Empty States & Discoverability

**Goal:** Eliminate internal taxonomy from the UI, add contextual empty states, and improve first-run discoverability for GRC practitioners.
**Gates:** Smith approved Gate 1 (stories) + Gate 2 (arch) on 2026-04-24.
**Sequence constraint:** Phase P2 must complete before Phase P3 (US-UX-5 AC0 result informs AC1 empty state copy).

### Phase P1 — Critical Copy & Label Fixes (app.js only)
- [x] [S5-1] `updateBreadcrumbs()`: collapse consecutive identical ancestor labels using `reduce()`; shallowest node is click target for each collapsed group (US-UX-1)
- [x] [S5-2] `app.js:1409`: change description fallback from `"No description provided."` → `"No description available for this control in the current framework."` (US-UX-2)
- [x] [S5-3] `getLabelDisplay()`: add `if (d.depth === 0) return "none"` guard; investigate source of "Uncategorized Level" label (depth-1 child vs root); apply AC4 case-by-case fix (US-UX-3)

### Phase P2 — Config Bug Investigation [BLOCKER for P3 S5-6]
- [x] [S5-4] Inspect SCF CSV column headers; fix `tag_cols: ["SCRM TAGS"]` mismatch in `framework_configs.js` (actual header is multi-line); document whether SCRM tag data exists after fix; report to Cypher if data is absent (US-UX-5 AC0)

### Phase P3 — Discoverability & Empty States
- [x] [S5-5] Onboarding hint: add `#onboarding-hint` div to `index.html` (bottom-anchored, `opacity-80`, `pointer-events-none`); add `updateOnboardingHint()` to `app.js` using module-level `let regimeWasActiveThisSession`; wire into `updateVisualization()`, treeselect `inputCallback`, and `switchFramework()`; fix treeselect `placeholder` to `"Search or select a compliance regime…"` (US-UX-4)
- [x] [S5-6] `initTagFilterPanel()`: add empty state `<p>` when `groupsContainer.children.length === 0` (`"No tag filters are available for this framework."`); hide Tag Filters accordion when `tag_cols.length === 0`; depends on S5-4 result (US-UX-5 AC1-4)
- [x] [S5-7] `framework_configs.js`: add `description` field to SCF and CRI configs; `updateFrameworkToggle()`: set `btn.title = FRAMEWORK_CONFIGS[btn.dataset.fw]?.description`; Playwright test 03: add DOM assertion that `title` attr is present (US-UX-6)

### Phase P4 — UAT & Screenshot Regeneration
- [x] [S5-8] Trin: fix screenshot 06 Playwright timing (add `waitForSelector('.treeselect-list')` before capture); run `make test` + `make lint`; run `make screenshots` to regenerate all 10 screenshots; verify Smith's C1/C2/M3 issues are resolved in new screenshots

## Sprint 6: Framework UX Fixes & Interaction Depth

**Goal:** Fix regime selector stacking regression, correct sidebar overflow, ship exclusive tier filter logic, and add hover tooltip for node context.
**Gates:** Smith approved Gate 1 (stories) + Gate 2 (arch) on 2026-04-25.
**Sequence constraint:** Phase A must land before Phase A validation; Phases B and C are independent of each other.

### Phase A — Regime Reinit + Layout Fix (Critical blocker first)
- [x] [S6-1] `initTreeselect()` (`app.js:1194`): add `container.innerHTML = ""` before `new Treeselect()`; add `regime_label` field to both configs in `framework_configs.js`; add `updateRegimeLabel()` helper in `app.js`; add `id="regime-label"` to regime accordion header span in `index.html`; call `updateRegimeLabel()` from `switchFramework()` and on init (US-S6-1)
- [x] [S6-2] `index.html:489`: change `#regime-selector` `max-height` from `40vh` → `30vh`; verify tag filter accordion header reachable at 768px viewport (US-S6-2)

### Phase B — Exclusive Tag Filter Logic
- [x] [S6-3] `tag_filter.js` (new module): `buildTagFilterPredicate(tagGroupMap, activeTagFilters)` — pure per-group subset predicate; `app.js`: `tagGroupMap = new Map()`, populated in `buildTagGroup()`, cleared in `initTagFilterPanel()`; `applyTagFilter()` delegates to predicate; 8 unit tests (AC6+AC7); `tag_filter.js` added to Makefile lint-js (US-S6-3)

### Phase C — Hover Tooltip
- [x] [S6-4] `index.html`: `#node-tooltip` div (`position: fixed`, `z-50`, `pointer-events-none`); `app.js`: `getNodeTooltipPath()` (AC9: depth-0→config.name, others→ancestor path ` › `), `showNodeTooltip()`, `positionNodeTooltip()` (viewport-clamped), `hideNodeTooltip()`; D3 `mouseover`+`mousemove`+`mouseout` wired (US-S6-4)

### Phase D — UAT & Screenshot Regeneration
- [x] [S6-5] Trin: 28 unit + 11 E2E (11/11) pass; lint clean; test 11 added for tooltip hover (force:true for packed SVG circles)

## Sprint 7: CRI UX Remediation

Stories: agents/cypher.docs/sprint7_cri_ux_remediation.md  
Architecture: agents/morpheus.docs/sprint7_cri_ux_arch.md

### Phase A — Critical Bug Fixes [UNBLOCKS Phase B + C]

- [x] [S7-1] `tag_filter.js:19`: change `every()` → `some()` in `buildTagFilterPredicate` predicate (OR/ANY logic for all tag groups); update 2 failing existing tests (`AC6 cumulative tier`, `non-cumulative subject tags`); add 3 new tests: (a) multi-tag control passes single-tag selection, (b) cumulative tier OR match, (c) cross-group AND with Tier + Subject (US-S7-1)
- [x] [S7-2] `index.html:592`: remove `white-space: nowrap` from `#node-tooltip` inline style (keep `style="display: none;"`); verify `positionNodeTooltip()` clamps correctly with wrapped/taller tooltip (US-S7-2)

### Phase B — Regime Grouping [depends on Phase A passing]

- [x] [S7-3] `app.js`: new `buildRegimeTreeOptions(regimeList)` function — groups by `name.split(" ")[0]`, count ≥ 2 → parent node (`value: "grp-{prefix}"`), count = 1 → flat leaf; `initTreeselect()` branches on `processor.config.schema.controls.mapping_tag_suffix` (CRI → `buildRegimeTreeOptions`, SCF → existing `regimeCatalog`); extend `inputCallback` to handle `grp-` prefix expansion (same pattern as `cat-`); unit test `buildRegimeTreeOptions()`: FFIEC×4 group, HONG KONG SFC flat, sort order (US-S7-3)

### Phase C — Relationship Tags [depends on Phase A passing; Phase B independent]

- [x] [S7-4] `app.js showDetail()`: remove existing quality badge from regime header (lines 1547–1553); add "Mapping Quality" sub-section after idWrap block — split `regimeQualityTags[rid]` by `\n`, render each trimmed entry as a chip; section hidden if no quality tag; multi-regime loop handles AC7 automatically (US-S7-4)
- [x] [S7-5] `app.js`: add `activeMappingQualityFilters = new Set()` + `mappingQualityRegimeId = null` state; new `initMappingQualityFilter()` — shows/hides section based on `selectedRegimeIds.size === 1`, parses Type values via `/Type:\s*([^;]+)/`, renders checkboxes; rewrite `applyTagFilter()` to combine tag + mapping predicates in single pass (AND between them); `index.html`: add `#mapping-quality-section` div (hidden by default) below tag filter accordion; call `initMappingQualityFilter()` from `inputCallback` + `switchFramework()`; unit test type parsing + filter logic (US-S7-5)
- [x] [S7-6] **Smith note:** `initMappingQualityFilter()` MUST be called inside `inputCallback` after `updateVisualization()` — verify this wiring is present (critical path check)

### Phase D — UAT

- [x] [S7-7] Trin: run `make test` + `make lint`; verify (a) CRI subject tag selection → non-zero results, (b) tooltip wraps at max-w-xs, (c) FFIEC group expander in CRI regime list, (d) Mapping Quality section appears on single-regime select; add E2E tests for tag filter OR and regime grouping if not covered

## Sprint 8: Context and Polish

Stories: agents/cypher.docs/sprint8_polish.md  
Architecture: agents/morpheus.docs/sprint8_polish_arch.md

### Phase A — Data/Hierarchy Polish [independent]

- [x] [S8-1] `framework_configs.js`: change SCF `PPTDF_Applicability.raw` to `PPTDF\nApplicability`; add processor test proving SCF depth-1 groups include Data, Facility, N/A, People, Process, Technology and are not a single Uncategorized node (S8-1)

### Phase B — Sidebar Context Polish [independent after Phase A starts]

- [x] [S8-2] `app.js updateFilterBadge()`: broaden `#tag-filter-badge` to active context count = selected regimes + active tag filters + active Mapping Quality filters; keep `tag-clear-btn` based only on tag/mapping filters; update badge `title`/`aria-label` with breakdown; call after regime selection changes (S8-2)
- [x] [S8-3] `index.html` + `app.js`: add dynamic `title`/`aria-label` to left/right sidebar handles via `updateSidebarToggleA11y(side)`; verify labels update after toggle (S8-3)

### Phase C — Legend Containment [independent]

- [x] [S8-4] `index.html` + `app.js updateLegend()`: bound `#regime-legend` inside viewport using wrap/containment, compact/truncated chips, and no pointer interaction; add 1440x900 light/dark selected-regime E2E coverage (S8-4)

### Phase D — UAT

- [x] [S8-5] Trin: run `make test`, `make lint`, and affected E2E/screenshot tests; verify PPTDF groups, activity badge count/breakdown, sidebar control labels, and legend viewport bounds

## Backlog

- [ ] [B-1] Export visualization to PDF/PNG
- [ ] [B-2] Shareable links (state in URL)
- [ ] [B-3] Offline support (PWA)
- [x] [B-4] Breadcrumb nav arrows (◀ ▶) `aria-label` and `title` attributes (Smith N1) — completed in Sprint 8 S8-3
- [x] [B-5] Regime-active indicator badge on collapsed sidebar toggle (Smith N2) — completed in Sprint 8 S8-2
- [x] [B-6] Regime legend viewport clipping check at 1440×900 (Smith N4) — completed in Sprint 8 S8-4
- [x] [B-PPTDF] SCF PPTDF column name mismatch: CSV uses `PPTDF\nApplicability`, config uses `PPTDF Applicability` → all SCF controls default to "Uncategorized" at depth-1 (Morpheus flagged 2026-04-25) — completed in Sprint 8 S8-1
- [ ] [B-SCRM] SCRM binary-flag filter: SCRM Focus columns contain only 'x' markers; separate story needed for SCRM tier filtering (Morpheus flagged 2026-04-25)
