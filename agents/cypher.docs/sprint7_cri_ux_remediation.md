# Sprint 7: CRI UX Remediation

**Epic:** CRI Visualization — Bug Fixes + Relationship Tag Visibility  
**Status:** Complete  
**Date:** 2026-04-25  
**Source:** Smith UX feedback (agents/smith.docs/ux_feedback_cri_2026_04_25.md)
**Closed:** 2026-04-27

---

## Background

Post-implementation review of the Framework Switcher + Tag Filtering sprint identified 2 critical bugs and 3 gaps in the CRI visualization. Tag filtering is entirely non-functional due to a predicate logic mismatch with real CRI data. Two new features (regime grouping, relationship tag visibility) fill gaps in the CRI user experience.

Phase structure:
- **Phase A** — critical bug fixes (BUG-1 + BUG-2 + BUG-3)
- **Phase B** — regime grouping by regulator (FEATURE-1)
- **Phase C** — relationship tag display + filter (FEATURE-2)

---

## Sprint Stories

### S7-1: Tag Filter — OR/ANY Predicate Logic (BUG-1 + BUG-2)

**Story:** As a CRI analyst, I want to select a subject tag or tier tag and see controls that contain that tag highlighted, so that I can focus on relevant controls without the filter always showing "no results."

**Root cause:** `buildTagFilterPredicate` (tag_filter.js) uses subset logic — control passes only if ALL its tags in a group are within the selected set. CRI subject tags: controls have 5–8 tags each; selecting one always returns 0 results. CRI tier tags: cumulative data (all combinations start with "Tier: 1"); selecting "Tier: 2" alone returns 0 because controls also carry "Tier: 1" which is unchecked.

**Acceptance Criteria:**
- [ ] AC1: Selecting a subject tag (e.g. `#governance`) dims all controls that do NOT have `#governance` in their subject tags; controls with `#governance` remain at full opacity — non-zero match set for any real CRI tag
- [ ] AC2: Selecting "Tier: 2" shows all controls whose tier tags INCLUDE "Tier: 2" — controls with `["Tier: 1", "Tier: 2"]` and `["Tier: 1", "Tier: 2", "Tier: 3"]` and `["Tier: 1", "Tier: 2", "Tier: 3", "Tier: 4"]` all pass; controls with only `["Tier: 1"]` are dimmed
- [ ] AC3: Selecting "Tier: 4" shows controls whose tier tags include "Tier: 4" (i.e., `["Tier: 1", "Tier: 2", "Tier: 3", "Tier: 4"]`) — previously always 0, now non-zero
- [ ] AC4: Selecting multiple tags across groups uses AND logic between groups (control must match at least one tag in EACH group that has active filters)
- [ ] AC5: Selecting multiple tags within a group uses OR logic — control passes group if it has ANY of the selected tags in that group
- [ ] AC6: Zero-result overlay only appears when no controls genuinely match (not as default behavior)
- [ ] AC7: SCF SCRM tier filter continues to work correctly (SCF controls have a single tier tag; OR logic produces same results as before for single-value groups)
- [ ] AC8: Existing unit tests in `tests/unit/test_tag_filter.js` updated to reflect OR semantics; all pass
- [ ] AC9: New unit tests added: (a) single subject tag selection matches multi-tag controls; (b) Tier 2 selection matches cumulative tier controls; (c) cross-group AND with Tier + Subject

**Implementation note for Neo:** The predicate change is `every()` → `some()` in tag_filter.js:19. Update both the predicate function and the unit tests. The `every()` predicate was designed for subset-exclusive behavior; `some()` gives intersection/OR behavior. The change is isolated to `tag_filter.js`.

---

### S7-2: Tooltip Text Wrapping (BUG-3)

**Story:** As a user, I want the node hover tooltip to wrap long ancestor paths so that the full path is readable without extending beyond the viewport.

**Root cause:** `index.html:592` inline style `white-space: nowrap` overrides the `max-w-xs` Tailwind class, preventing word wrap.

**Acceptance Criteria:**
- [ ] AC1: Hovering over a deep node (Category or Subcategory level) with a long path (e.g. "GOVERN › Org Context › Mission and Strategy") shows the full text wrapped within the tooltip box
- [ ] AC2: Tooltip width stays within `max-w-xs` (~20rem); long paths wrap to 2+ lines rather than extending
- [ ] AC3: Tooltip viewport edge clamping (positionNodeTooltip) continues to work correctly with wrapped (taller) tooltips — tooltip does not clip off the bottom of the screen

**Implementation note for Neo:** Remove `white-space: nowrap` from the `style` attribute on `#node-tooltip` in index.html:592. `max-w-xs` is already present in the class list and handles width constraint. Also verify `positionNodeTooltip` reads `el.offsetHeight` AFTER `display: block` (already done at line 404–405) to correctly clamp the now-taller wrapped tooltip.

---

### S7-3: Regime Selector — Group Frameworks by Regulator (FEATURE-1)

**Story:** As a compliance manager viewing CRI, I want frameworks from the same regulator to be grouped under an expandable parent in the regime selector so that the 22-item flat list is organized into meaningful families.

**Acceptance Criteria:**
- [ ] AC1: Regulators with 2 or more frameworks in the active regime list are rendered as an expandable group node with a parent label (e.g. "FFIEC" containing CAT, DAM, AIO, BCM)
- [ ] AC2: Regulators with only 1 framework in the list appear as flat (non-grouped) items — no unnecessary nesting
- [ ] AC3: The grouping rule is: group regimes that share the same first word, when that first word appears 2+ times. Expected groups for CRI: FFIEC (4), APRA (2), NIST (2), OSFI (2); all others remain flat
- [ ] AC4: Selecting the parent group node selects all children (existing Treeselect behavior for parent nodes)
- [ ] AC5: Previously saved regime selections (localStorage) are restored correctly after this change — saved regime names are unchanged, only the tree structure changes
- [ ] AC6: Grouping applies only in CRI mode; SCF regime list (which has no natural first-word groupings) remains flat and unchanged
- [ ] AC7: The flat/grouped rendering logic is applied in `buildRegimeOptions()` (or equivalent) at render time — NOT encoded in the YAML config

**Implementation note for Neo:** Build a `groupRegimes(regimeList)` helper that:
1. Groups regimes by `name.split(" ")[0]`
2. For groups with `count ≥ 2`, emits a parent node + children
3. For groups with `count = 1`, emits a flat leaf

Pass the result to `initTreeselect()` instead of the flat list. Edge case: "HONG KONG SFC" — first word "HONG" appears only once, so it stays flat. No special handling needed — the `count ≥ 2` threshold covers it.

---

### S7-4: Relationship Tags — Display in Detail Panel (FEATURE-2a)

**Story:** As a compliance manager, I want to see the mapping relationship type (Full, Partial, etc.) for a selected regime when I click a CRI control, so that I can understand the quality and depth of the CRI-to-framework mapping.

**Background:** Each CRI regime has a companion `*_TAGS` column (e.g. `FFIEC CAT TAGS`) with values like `"Level: Evolving; Type: Full"`. The processor already reads `rInfo.tagsCol` (framework_processor.js:202) but the detail panel does not display it.

**Acceptance Criteria:**
- [ ] AC1: When a regime is selected and a control is clicked, the detail panel shows the relationship tag(s) for that regime under a "Mapping Quality" label
- [ ] AC2: If a control maps to multiple controls within the selected regime (multiple TAGS entries, newline-separated), each entry is shown as a separate badge or line item
- [ ] AC3: The label uses "Mapping Quality" (not the internal column name) — friendly label, not `FFIEC CAT TAGS`
- [ ] AC4: If no regime is selected, the "Mapping Quality" section is hidden — not shown as empty
- [ ] AC5: If the regime has no TAGS column (`rInfo.tagsCol` undefined), the section is hidden — no error
- [ ] AC6: Displayed relationship tags adapt to the active regime — switching regime selection updates the values without a full detail panel reload
- [ ] AC7 (added by Smith Gate 1): When multiple regimes are selected, the detail panel shows relationship tags for ALL active regimes, each labeled with the regime name — the user can see quality for each selected framework side-by-side

---

### S7-5: Relationship Tags — Mapping Quality Filter (FEATURE-2b)

**Story:** As a compliance manager, I want to filter the CRI visualization by mapping quality type (Full, Partial) for a selected regime, so that I can focus only on controls with strong coverage.

**Background:** `*_TAGS` column values encode two dimensions — Level (Baseline/Evolving/Intermediate/Advanced/Innovative) and Type (Full / Full Summarily / Partial). With a regime selected, these can drive a contextual filter.

**Acceptance Criteria:**
- [ ] AC1: When exactly one regime is selected, a "Mapping Quality" filter section appears in the sidebar below the Tag Filter panel, showing unique Type values from that regime's TAGS column (Full, Full Summarily, Partial)
- [ ] AC2: When no regime or multiple regimes are selected, the Mapping Quality filter section is hidden
- [ ] AC3: Checking "Type: Full" dims all controls that do NOT have at least one TAGS entry with `Type: Full` for the active regime; controls with at least one Full entry remain at full opacity
- [ ] AC4: Multiple Type selections use OR logic — control passes if it has ANY of the selected types
- [ ] AC5: Mapping Quality filter state clears automatically when the active regime changes (selecting a different regime resets the filter)
- [ ] AC6: Mapping Quality filter state clears when all regime selections are cleared
- [ ] AC7: If the active regime has no TAGS column, the Mapping Quality filter section is hidden
- [ ] AC8: The "No controls match" zero-result overlay applies if the Mapping Quality filter results in zero matches, same as the tag filter zero-result behavior

**Scope note:** Level dimension (Baseline/Evolving/etc.) is NOT included in this story — only Type (Full/Partial) to keep the UI focused. Level can be a follow-on story if users need it.

---

## Definition of Done (Sprint 7)

- [x] S7-1: Selecting any real CRI subject tag returns non-zero matching controls; Tier filter works for all tier levels
- [x] S7-2: Tooltip wraps correctly; no viewport overflow
- [x] S7-3: CRI regime list shows FFIEC/APRA/NIST/OSFI as expandable groups; all others flat
- [x] S7-4: Relationship tags visible in detail panel when regime is active
- [x] S7-5: Mapping Quality filter appears when 1 regime selected; filters by Type correctly
- [x] All existing tests pass; new tests added for S7-1 changes
- [x] Both frameworks render without console errors
- [x] Smith Gate 1 + Gate 2 approvals received

---

## Open Questions for Morpheus — Resolved

1. **S7-1 predicate change:** Resolved by Morpheus. OR/ANY logic is correct for all current tag groups; no YAML `filter_mode` abstraction needed now.
2. **S7-3 Treeselect nested data:** Resolved by implementation and QA. Mixed grouped/flat CRI regime options work; URL state stores numeric regime IDs only.
3. **S7-5 filter state:** Resolved by implementation and review. Mapping Quality filter state resets when regime context changes.

## Closeout Notes

- Neo completed all Sprint 7 implementation work.
- Trin verified Sprint 7 with 37/37 unit tests and 14/14 E2E tests.
- Morpheus review passed and fixed one additional issue: `clearTagFilters()` now clears mapping quality filter state.
- 2026-04-27 re-verification passed: `make test` 37/37, `make lint`, and `make test-e2e` 14/14.
- Non-blocking backlog: `updateFilterBadge()` counts active tag filters but not active mapping quality filters.
