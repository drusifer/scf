# Current Task

**Status:** Sprint 8 implementation complete — handing off to Trin for UAT
**Assigned to:** Neo
**Sprint:** 8

## Progress
- [x] Phase A — S8-1: fixed SCF PPTDF raw column config and added real CSV-backed depth-1 PPTDF group unit test
- [x] Phase B — S8-2: expanded activity badge count to selected regimes + tag filters + Mapping Quality filters; added accessible breakdown
- [x] Phase B — S8-3: added dynamic sidebar toggle `title`/`aria-label`
- [x] Phase C — S8-4: bounded/wrapped regime legend and added viewport E2E coverage

## Validation
- make test: 38/38 pass
- make lint: PASS
- make test-e2e: 17/17 pass

## Sprint 7 Historical Progress
- [x] Phase A — S7-1: `tag_filter.js:19` `every()` → `some()` (OR/ANY predicate); updated 2 tests; added 3 new AC9 tests (31→37 total tests)
- [x] Phase A — S7-2: `index.html:592` removed `white-space: nowrap` from `#node-tooltip` inline style
- [x] Phase B — S7-3: extracted `buildRegimeTreeOptions()` to `regime_grouping.js`; modified `initTreeselect()` to branch on `mapping_tag_suffix`; extended `inputCallback` + `_initialRegimeValue` to handle `grp-` prefix; added `regime_grouping.js` script tag to index.html; 6 unit tests added
- [x] Phase C — S7-4: `showDetails()` — replaced single-line quality badge in header with multi-chip "Mapping Quality" section after idWrap block (split by `\n`, per-entry chips)
- [x] Phase C — S7-5: added `activeMappingQualityFilters` + `mappingQualityRegimeId` state; added `initMappingQualityFilter()` function; rewrote `applyTagFilter()` to combine tag + mapping predicates; added `#mapping-quality-section` HTML to index.html; wired `initMappingQualityFilter()` into `inputCallback` + `switchFramework()`

---
*Last updated: 2026-04-27*
