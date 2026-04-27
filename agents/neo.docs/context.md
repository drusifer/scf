# Neo Context

## Sprint 8 — Context and Polish Implementation (2026-04-27)

- S8-1: `framework_configs.js` SCF `PPTDF_Applicability.raw` now uses real CSV header `PPTDF\nApplicability`.
- S8-1 test: `tests/unit/test_framework_processor.js` loads the real SCF CSV and asserts Data, Facility, N/A, People, Process, Technology at depth 1.
- S8-2: `updateFilterBadge()` now counts selected regimes + tag filters + Mapping Quality filters, with a title/aria-label breakdown and correct singular/plural wording.
- S8-2: `tag-clear-btn` visibility remains based only on active tag/mapping filters, not selected regimes.
- S8-3: left/right sidebar handles now have dynamic `title` and `aria-label` values.
- S8-4: `#regime-legend` is bounded/wrapping; legend chips are compact and truncate long names.
- E2E tests added: activity badge, sidebar labels, legend viewport containment.

## Sprint 7 — CRI UX Remediation Complete (2026-04-25)

### S7-1 — Tag Filter OR/ANY Predicate (tag_filter.js)
- `buildTagFilterPredicate` line 19: `every()` → `some()`
- Old: ALL tags on control must be in active set (subset logic)
- New: at least ONE tag on control must be in active set (OR/ANY)
- Cross-group AND preserved: control must pass every group with active filters
- Updated 2 failing tests; added 3 new AC9 tests (total: 37)

### S7-2 — Tooltip Wrapping (index.html)
- Removed `white-space: nowrap` from `#node-tooltip` inline style
- `max-w-xs` Tailwind class now controls width; long paths wrap naturally
- `positionNodeTooltip()` reads `offsetHeight` after display:block — handles taller wrapped tooltips correctly

### S7-3 — Regime Grouping (regime_grouping.js + app.js)
- Extracted `buildRegimeTreeOptions()` to standalone `regime_grouping.js` (testable)
- Groups regimes by `name.split(" ")[0]`; groups with count≥2 get parent node (`grp-{prefix}`)
- `initTreeselect()` branches: CRI (has `mapping_tag_suffix`) → `buildRegimeTreeOptions`; SCF → existing `regimeCatalog` path
- `inputCallback` + `_initialRegimeValue` both handle `grp-` prefix expansion
- `regime_grouping.js` added as script tag before `app.js` in index.html

### S7-4 — Detail Panel Quality Tags (app.js showDetails())
- Removed single-line quality badge from regime header (was cramped/unreadable for multi-entry values)
- Added "Mapping Quality" section after idWrap block: splits `regimeQualityTags[rid]` by `\n`, renders each trimmed entry as a chip
- Section hidden if no quality tag; multi-regime loop handles multiple regimes automatically

### S7-5 — Mapping Quality Filter (app.js + index.html)
- State: `activeMappingQualityFilters = new Set()`, `mappingQualityRegimeId = null`
- `initMappingQualityFilter()`: shows section only when `selectedRegimeIds.size === 1`; parses Type values via `/Type:\s*([^;]+)/`; renders checkboxes; clears state + hides on 0 or 2+ regimes
- `applyTagFilter()` rewritten: combines tag + mapping predicates in single pass (AND between them); zero-result overlay covers both
- `#mapping-quality-section` div added to index.html after Tag Filter accordion
- `initMappingQualityFilter()` called in `inputCallback` (after updateVisualization) and `switchFramework()` (after initTagFilterPanel)
- Mapping quality filter state NOT persisted to localStorage (context-dependent, resets on page load)

### Sprint 5 notes still relevant
- SCRM Focus CSV columns: `PPTDF\nApplicability` has multi-line header — Cypher backlog
- Binary SCRM flag columns — Cypher backlog

---
*Last updated: 2026-04-27*
