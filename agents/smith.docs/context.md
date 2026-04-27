# Agent Local Context

## Sprint 6 UX Feedback (2026-04-25)

### Issue 1 — Regime selector stacking bug (Critical)
- Root cause: `initTreeselect()` in app.js does NOT clear `treeselect-container` before creating new Treeselect
- Old widget remains in DOM on every `switchFramework()` call — stacks visually
- Fix: `container.innerHTML = ""` before `new Treeselect(...)` (same pattern as `initHierarchyFieldsTreeselect()`)
- Secondary: "Compliance Regimes" label is SCF-specific; needs framework-aware label from config

### Issue 2 — Sidebar layout overlap (Major)
- Partially caused by issue 1 (doubled widget); partially structural (three 40vh accordions compete)
- Fix: resolve issue 1 first; consider `30vh` for regime accordion or dynamic height

### Issue 3 — Tier filter OR logic doesn't work for cumulative CRI tags (Major)
- Current: `tags.some(t => activeTagFilters.has(t))` — union/OR
- CRI tier tags are cumulative (Tier 4 control also has Tier 1/2/3 tags)
- Desired: per-group exclusive matching — control's tags within a group must be a subset of checked tags
- Fix: track which tags belong to which group; change predicate to subset check per group

### Issue 4 — Hover labels overlap in dense areas (Major)
- Recommendation: HTML `#node-tooltip` div (position: fixed), shown on D3 mouseover
- Show full ancestor path (e.g., "GOVERN > Org Context > Mission") in tooltip
- Follow existing `#tag-zero-result` / `#onboarding-hint` HTML-over-SVG overlay pattern

## Sprint 7 UX Feedback — CRI Live Session (2026-04-25)

Full report: `agents/smith.docs/ux_feedback_cri_2026_04_25.md`

### 2026-04-27 Status Correction
- BUG-1, BUG-2, and BUG-3 are closed as of Sprint 7 verification.
- Closure verified again on 2026-04-27: `make test` 37/37, `make lint` PASS, `make test-e2e` 14/14.
- Bug-fix sprint planning request produced no new implementation sprint; see `agents/cypher.docs/bug_fix_sprint_plan_2026_04_27.md` and `agents/smith.docs/gate_bug_fix_sprint_review_2026_04_27.md`.

### BUG-1 (Critical) — Subject Tag filter always 0 results
- Subset predicate in `buildTagFilterPredicate` requires ALL control tags to be in selected set
- CRI controls have 5–8 subject tags each → no control ever passes a single-tag selection
- Fix: OR/ANY logic for Subject Tags group

### BUG-2 (Critical) — Tier Tag filter broken for Tier 2/3/4
- CRI tier data always cumulative (starts with "Tier: 1"); no control has "Tier: 2" without "Tier: 1"
- Subset logic: selecting "Tier: 2" alone → 0 results (control also has "Tier: 1" which is unchecked)
- Fix: OR/ANY logic for Tier Tags group; original Sprint 6 subset design does not fit the data

### BUG-3 (Minor) — Tooltip does not wrap
- `index.html:592` has `white-space: nowrap` inline style; overrides `max-w-xs` class
- Fix: remove `white-space: nowrap` (1-line change)

### FEATURE-1 (Major) — Regime selector grouping by regulator
- 22 CRI regimes should be grouped by first word: FFIEC (4), APRA (2), NIST (2), OSFI (2)
- Groups with 2+ members get expanders; singles stay flat
- Threshold rule: group only when count ≥ 2 AND first word is a recognizable abbreviation

### FEATURE-2 (Major) — Relationship tags not shown
- Each regime has a companion `*_TAGS` column (e.g. "FFIEC CAT TAGS") with Level/Type mapping quality
- Should show in detail panel when regime selected; filterable by Type (Full/Partial) and Level
- Tiers → CRI control attribute; Relationship Tags → mapping quality attribute (per selected regime)

## Recent Decisions
- Approved Sprint 8 Gate 2 architecture with one refinement: activity badge accessible label must include a breakdown of regimes, tag filters, and mapping quality filters.
- Approved Sprint 8 Context and Polish Gate 1 with one wording revision: sidebar badge label should use "active context items" because selected regimes are counted alongside filters.
- Smith initialized on 2026-04-27 via `$bob-protocol init smith`; no new UX review or testing task was requested.
- Approved Morpheus's architecture for Relative Control Weighting
- Approved Framework Switcher + Tag Filtering sprint (Gate 1) with 4 notes
- Approved Gate 2 architecture (Gate 2) — 4 impl notes
- Approved Sprint 5 UX Polish stories (Gate 1) with 2 AC revisions (hint re-appears on deselect; SCRM tag_cols bug)
- Sprint 5 Gate 2: approved. OQ-1 resolved: use opacity-80 not opacity-60 for hint; use module-level let not window._var

## Key Screenshot Findings (2026-04-24)
Full report: `agents/smith.docs/ux_screenshot_review_2026_04_24.md`
- C1+C2: Breadcrumb dupe + passive description — FIXED in Sprint 5
- M1+M2+M3+M4: Onboarding hint, tag empty state, root label, tooltips — FIXED in Sprint 5

---
*Last updated: 2026-04-27*
