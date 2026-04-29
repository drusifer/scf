# Gate 1 Review — UX Polish Sprint Stories
**Reviewer:** Smith
**Stories:** `agents/cypher.docs/sprint_ux_polish.md`
**Date:** 2026-04-24

---

## Verdict: *user approve — with 3 mandatory AC revisions folded in

All 6 stories are well-grounded in the screenshot evidence. User stories are from the correct perspective. ACs are mostly testable. Three issues require revision before Morpheus proceeds.

---

## Story-by-Story Review

### US-UX-1 — Breadcrumb deduplication ✅ Approved
ACs are clear and correctly scoped. AC4 (investigate root cause before implementing workaround) is the right call — appreciated. AC3 click behavior is well-specified. No changes required.

**Note:** If AC4 investigation reveals a genuine data issue (two distinct hierarchy nodes both named "Uncategorized"), the breadcrumb collapse is a mitigation, not a fix. Cypher should create a separate data-layer story if needed.

---

### US-UX-2 — Empty state copy for control descriptions ✅ Approved
AC1 copy improvement is correct. AC3 (source_url deferral) is properly bounded. No changes required.

---

### US-UX-3 — Root node label ✅ Approved with note
ACs are correct. Preference order: **AC1 (suppress root label) is preferred** over AC2 (replace with framework name). The visualization already has the framework name in the badge (`#framework-badge`, bottom-left) and the framework selector. Adding it again as a center label is redundant.

**Mandatory note to Neo/Morpheus:** If suppressing the root label causes any layout issue with the D3 force layout, consult Smith before implementing AC2. The default choice is suppression.

---

### US-UX-4 — Onboarding hint ✅ Approved with AC revision
**Required AC revision — AC2 gap:**

The current AC2 says the hint "disappears as soon as any regime is selected." But it does not specify what happens if the user then *deselects* all regimes (returning to the empty state). The hint must re-appear in that case.

**Revised AC2 (mandatory):** When no regime is selected, a subtle hint is displayed inside the visualization area. The hint disappears when any regime is selected and re-appears if all regimes are subsequently deselected. First-time session behavior applies (AC3 localStorage persistence governs whether the hint shows at all on page load, not on interaction-based re-entry to empty state — the hint ALWAYS re-appears on deselect-to-empty regardless of localStorage state).

**Note on AC4 (CRI exclusion):** Correct. CRI framework's root node structure renders meaningful labeled circles at default zoom — no onboarding nudge needed. Verify this remains true if a third framework is added in future.

---

### US-UX-5 — Tag filter empty state ⚠️ Approved with mandatory AC revision

**Root cause finding (Smith investigation):**

The SCF `framework_configs.js` defines `tag_cols: ["SCRM TAGS"]` but the actual SCF CSV column header is `"SCRM Focus\n\nTIER 1\nSTRATEGIC"` (and related multi-line headers). The column name `"SCRM TAGS"` does not exist in the CSV. This is a **config bug**, not a UI-state issue.

Result: `initTagFilterPanel` for SCF collects zero tags from `rawControls` (column lookup returns `undefined`), renders an empty tag group container, and the section appears blank — but for the wrong reason.

**This changes the story scope:**

The story must address two things:
1. (Bug) Fix the `tag_cols` column name in `framework_configs.js` to match the actual CSV header(s) for SCF SCRM tags. Neo should inspect the CSV headers and update the config. This may result in tag groups rendering for SCF once the name is corrected — or it may reveal the SCRM tag columns have sparse data.
2. (UX) After the config fix, if tag groups still render with zero items, add an empty state message inside `tag-filter-groups`: `"No tags are configured for controls in this framework."` (NOT "select a regime above" — tag filters are not regime-dependent).

**Revised ACs (mandatory):**
- [ ] AC0 (new): Neo inspects the SCF CSV column headers and corrects `tag_cols` in `framework_configs.js` to reference existing column names. If no SCRM tag data exists in the CSV, AC0 is documented and AC1 becomes the visible fallback.
- [ ] AC1 (revised): When `tag-filter-groups` renders with no items (either because `tag_cols` is empty, or because all referenced columns have no data), show: `"No tag filters are available for this framework."` — styled as muted small text. Do NOT reference regime selection — tag filters are framework-scoped, not regime-scoped.
- [ ] AC2: Unchanged.
- [ ] AC3 (revised): If `tag_cols: []` in config, hide the entire Tag Filters accordion. If tag_cols has entries but all return zero unique tags after the config fix, show the AC1 empty state but keep the accordion visible (user can see the section exists).
- [ ] AC4: Unchanged.

---

### US-UX-6 — Framework selector tooltips ✅ Approved with note
ACs are correct and appropriately scoped. Native `title` attribute is the right low-effort approach.

**Note:** `title` tooltips do not render on touch/mobile devices. This is acceptable for a desktop-first GRC tool. Document this limitation in the `description` field comment in `framework_configs.js` so future developers know tooltip copy is there.

---

## Summary of Required Revisions

| Story | Revision |
|-------|----------|
| US-UX-4 | AC2: specify hint re-appears on deselect-to-empty, not just on first load |
| US-UX-5 | Add AC0: fix column name mismatch in framework_configs.js; revise AC1 copy to not mention regimes |
| US-UX-3 | Note: AC1 (suppress) preferred over AC2 (replace) |

---

*Gate 1: `*user approve` — stories proceed to Morpheus architecture after Cypher applies the 2 mandatory AC revisions (US-UX-4, US-UX-5).*
*Date: 2026-04-24*
