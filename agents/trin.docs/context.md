# Agent Local Context

## Sprint 8 — UAT Complete (2026-04-27)

### New Coverage
- Unit: `S8-1: SCF default hierarchy uses real PPTDF groups from CSV` verifies Data, Facility, N/A, People, Process, Technology and rejects single Uncategorized collapse.
- E2E test 15: S8-2 activity badge counts selected regimes + Mapping Quality filters and exposes an accessible breakdown.
- E2E test 16: S8-3 sidebar toggle labels and titles update with state.
- E2E test 17: S8-4 regime legend stays within 1440x900 viewport in light and dark mode.

### Verification
- `make test`: 38/38 pass.
- `make lint`: PASS.
- `make test-e2e`: 17/17 pass.

### Test Notes
- For S8-2 Mapping Quality, selected known singleton regime `MAS CHN AND TRMG` because it has `Type:` mapping tags.
- Clear-filter verification invokes `window.clearTagFilters()` to avoid Treeselect's always-open static list intercepting sidebar clicks, a known testing hazard from Sprint 7.

## Sprint 7 — UAT Complete (2026-04-25)

### New E2E Tests
- Test 11 extended: S7-2 tooltip `white-space` assertion — `getAttribute('style')` must not contain 'white-space'
- Test 12 (S7-3): CRI regime grouping — looks for FFIEC group in `.treeselect-list__item` text
- Test 13 (S7-5): Mapping Quality section — uses `[group="false"][level="0"]` selector for flat CRI leaves at root level
- Test 14 (S7-1): Tag filter OR — `scrollIntoViewIfNeeded` then label click with `force:true` bypasses treeselect overlap

### Key Treeselect Learnings
- `alwaysOpen: true, staticList: true` → list is always in DOM, can intercept clicks on elements below it
- Item attributes: `group="false"` = leaf/selectable item; `group="true"` = expandable group node
- Item attribute: `level="0"` = root-level; `level="1"` = child inside a group
- Flat leaves (not part of any group) have `group="false"` AND `level="0"`
- Children of collapsed groups have `treeselect-list__item--hidden` class → not clickable/visible

### Sprint 5 Context
- `initTagFilterPanel` empty-state fix: `querySelectorAll(".tag-checkbox").length === 0` not `children.length === 0`
- `#onboarding-hint` safe from D3 SVG clear
- SCF `tag_cols: []` hides entire Tag Filters accordion
- `_regimeWasActiveThisSession` is module-level let

### Infrastructure
- Playwright 1.59.1, headless Chromium, arm64
- Port 8001, Python HTTP server auto-start
- CommonJS (no `"type": "module"` in package.json)
- `force: true` needed for clicks overlapped by static treeselect list

---
*Last updated: 2026-04-27*
