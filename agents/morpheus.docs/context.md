# Agent Local Context

## Sprint 6 — Architecture (2026-04-25)

- S6-1: `initTreeselect()` needs `container.innerHTML = ""` before `new Treeselect()`. Add `regime_label` to framework_configs.js + `updateRegimeLabel()` helper + `id="regime-label"` on the accordion span.
- S6-2: `index.html:489` `#regime-selector` max-height: 40vh → 30vh (outer div already has overflow-y: auto).
- S6-3: New module-level `tagGroupMap: Map<tag, col>`. Populated in `buildTagGroup()`, cleared in `initTagFilterPanel()`. `applyTagFilter()` rewrites `.some()` to per-group subset check via `activeFiltersByGroup`.
- S6-4: `#node-tooltip` HTML div (position: fixed, z-50). Three helpers: `getNodeTooltipPath()`, `showNodeTooltip()`, `positionNodeTooltip()`, `hideNodeTooltip()`. Wired into existing D3 mouseover/mouseout + new mousemove.
- OQ-1: regime emoji (🛡️) — awaiting Smith decision (per-config vs hardcoded).
- Full arch: `agents/morpheus.docs/sprint6_ux_feedback_arch.md`

## Sprint 7 — CRI UX Remediation (2026-04-25) — REVIEW PASS

- S7-1: `tag_filter.js:19` `every()` → `some()` ✅
- S7-2: `index.html:592` remove `white-space: nowrap` ✅
- S7-3: `buildRegimeTreeOptions` extracted to standalone `regime_grouping.js` module (better than arch spec; pure + testable) ✅
- S7-4: Quality chips section below idWrap; multi-regime AC7 handled by existing forEach ✅
- S7-5: `activeMappingQualityFilters` + `mappingQualityRegimeId` state; `initMappingQualityFilter()` + `applyTagFilter()` rewrite ✅
- Bug fix: `clearTagFilters()` now clears `activeMappingQualityFilters` + calls `initMappingQualityFilter()` ✅
- URL state safe: `updateURL()` serializes numeric regime IDs only, never `grp-` prefixes ✅
- Non-blocking: `updateFilterBadge()` doesn't count mapping quality filters — Cypher backlog
- Full arch: `agents/morpheus.docs/sprint7_cri_ux_arch.md`

## Sprint 8 — Context and Polish (2026-04-27) — REVIEW PASS

- Keep Sprint 8 in render/config layer: `framework_configs.js`, `app.js`, `index.html`, tests.
- S8-1: PPTDF raw config fixed; real-data regression proves SCF depth-1 groups are not a single Uncategorized node.
- S8-2: `#tag-filter-badge` now counts active context items and preserves clear-filter semantics for filters only.
- S8-3: sidebar handles have dynamic `title`/`aria-label` values for collapse/expand state.
- S8-4: legend uses bounded wrapping and compact chips to remain inside the viewport.
- S8-5: Trin UAT PASS.
- Final validation: `make test` 38/38, `make lint` pass, `make test-e2e` 17/17.
- Full arch: `agents/morpheus.docs/sprint8_polish_arch.md`
- Review: `agents/morpheus.docs/review_sprint8_implementation_2026_04_27.md`

## Sprint 6 — Architecture (2026-04-25)

### Review: PASS

All 6 architectural decisions correctly implemented. Deviations are all improvements:
- `breadcrumb reduce()`: DRY label extraction (cleaner than arch pseudocode)
- Empty state: `.tag-checkbox` count check (Trin QA fix; correct where `buildTagGroup` always emits a div)
- Session var: module-level `let _regimeWasActiveThisSession` (not `window._var`, per Smith Gate 2)
- Hint opacity: `opacity-80` (per Smith OQ-1 correction, not `opacity-60`)
- `switchFramework()` implicitly covered — `updateVisualization()` already calls `updateOnboardingHint()`; no redundant call needed

### Two Cypher backlog items (not sprint blockers)
1. PPTDF column name mismatch: CSV uses `PPTDF\nApplicability`, config uses `PPTDF Applicability` → all SCF controls default to "Uncategorized" at depth-1. Separate story needed.
2. SCRM binary-flag filter type: SCRM Focus columns (TIER 1/2/3) contain only 'x' markers; tag filter UI expects categorical values. Separate story if SCRM tier filtering is desired.

## UX Polish Sprint Architecture (2026-04-24)
- 6 stories, all render-layer or config-layer. No data model changes.
- Key decisions: breadcrumb reduce() collapse, depth-0 label guard, tag_cols config bug (SCRM TAGS column name wrong), onboarding hint follows #tag-zero-result pattern, framework tooltip via config.description field.
- Full arch: `agents/morpheus.docs/sprint_ux_polish_arch.md`
- Phases: P1 (app.js only) → P2 (tag_cols fix) → P3 (hint + empty state + tooltip)

## Sprint 4 — Final Review (2026-04-24)
- Sprint 4 complete: all 11 tasks done. Tag filter, framework switcher, regime migration all clean.

---
*Last updated: 2026-04-27*
