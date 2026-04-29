# Sprint: UX Polish — Breadcrumb, Empty States & Discoverability

**Sprint Goal:** Eliminate confusing internal terminology from the UI, add contextual empty states, and improve first-run discoverability — so GRC practitioners can orient themselves quickly and trust the data they see.

**Source:** Smith UX screenshot review 2026-04-24 (`agents/smith.docs/ux_screenshot_review_2026_04_24.md`)
**Priority order:** C1 → C2 → M3 → M1 → M2 → M4

---

## US-UX-1 — Deduplicate Consecutive Breadcrumb Labels (Critical)

**As a** GRC practitioner navigating the visualization,
**I want** the breadcrumb trail to show a meaningful, non-repetitive path,
**So that** I can trust the navigation to accurately reflect where I am in the control hierarchy.

**Background:** The breadcrumb currently renders `SCF 2026.1 / Uncategorized / Uncategorized / Capacity & Performance Planning / CAP-06` when a leaf node is focused. Two consecutive "Uncategorized" labels look broken and erode user trust.

**Acceptance Criteria:**
- [ ] AC1: When two or more consecutive breadcrumb segments have identical text, they are collapsed into a single segment (e.g., `Uncategorized / Uncategorized` → `Uncategorized`).
- [ ] AC2: Collapsing applies to the rendered breadcrumb only — the underlying D3 hierarchy data is not modified.
- [ ] AC3: After collapsing, clicking a collapsed segment navigates to the shallowest node of that label (consistent with current click-to-zoom behavior).
- [ ] AC4: If the root cause is a data issue (the hierarchy genuinely has two distinct levels both named "Uncategorized"), Neo investigates and flags it to Cypher before implementing the collapse workaround.
- [ ] AC5: The fix applies to both SCF and CRI frameworks.
- [ ] AC6: Playwright screenshot test 07 (`07-node-clicked.png`) is regenerated; the breadcrumb no longer shows consecutive identical labels.

**Heuristic:** #2 Match Between System and Real World

---

## US-UX-2 — Actionable Empty State for Control Descriptions (Critical)

**As a** GRC practitioner viewing a control detail panel,
**I want** a clear, context-aware message when a control has no description,
**So that** I understand whether the absence of a description is a data gap, a framework limitation, or expected behavior — and know what to do next.

**Background:** The detail panel currently shows `"No description provided."` in grey italic with no context. GRC practitioners rely on descriptions to assess control applicability; a passive placeholder creates uncertainty about data validity.

**Acceptance Criteria:**
- [ ] AC1: When `data.description` is empty or absent, the detail panel shows: `"No description available for this control in the current framework."` instead of `"No description provided."`.
- [ ] AC2: The empty state copy is displayed in the same position and style as the current placeholder — no layout changes required.
- [ ] AC3: If the framework config provides a `source_url` or `docs_url` field, a "View source" link is appended to the empty state message. (If no such field exists in the current configs, AC3 is deferred to a future story — Neo confirms before implementing.)
- [ ] AC4: Controls that DO have a description are unaffected.
- [ ] AC5: Playwright screenshot test 07 is regenerated and the detail panel shows the new copy for a no-description control.

**Heuristic:** #9 Help Users Recognize, Diagnose, and Recover from Errors

---

## US-UX-3 — Replace Internal Root Node Label (Major)

**As a** GRC practitioner looking at the visualization,
**I want** the central circle label to show a human-readable framework name (or no label at all),
**So that** internal data taxonomy terms never appear in the interface.

**Background:** The root node of the D3 circle-packing visualization renders `"SCF Uncategorized Level"` as its label — an internal category name from the data pipeline. This appears prominently in the center of the viz on every default-state screenshot.

**Acceptance Criteria:**
- [ ] AC1: The root node label (depth === 0) is suppressed from rendering in the D3 label layer — it is never shown to the user.
- [ ] AC2: OR, if hiding the root label creates visual ambiguity, replace it with `processor.config.name` (the framework's human-readable name, e.g., `"Secure Controls Framework 2026.1"`).
- [ ] AC3: The fix applies at all zoom levels — the root label does not re-appear when the user zooms out to the top level.
- [ ] AC4: "Uncategorized Level" or any string containing "Uncategorized" does not appear as a node label in any rendered state. (Other legitimate node names that happen to contain the word "uncategorized" in data are evaluated case by case.)
- [ ] AC5: All 10 Playwright screenshot tests are regenerated; no screenshot shows "Uncategorized Level" as a visible label.

**Heuristic:** #2 Match Between System and Real World

---

## US-UX-4 — Onboarding Hint on Empty Visualization (Major)

**As a** first-time user opening the SCF framework,
**I want** a visible hint that tells me what to do to activate the visualization,
**So that** I don't mistake the empty grey circle-packing for a broken or empty tool.

**Background:** The SCF default state shows hundreds of identical small grey circles with no regime-colored nodes, no labels, and no call-to-action. The CRI view loads with 7 large labeled circles by contrast. New users have no path to "what do I do first?"

**Acceptance Criteria:**
- [ ] AC1: When no regime is selected, the regime treeselect input shows placeholder text: `"Search or select a compliance regime…"` (replaces the current `"Search frameworks…"` placeholder which is ambiguous — "frameworks" vs "regimes").
- [ ] AC2: When no regime is selected, a subtle hint is displayed inside the visualization area: `"Select a compliance regime from the left panel to see coverage."` The hint disappears when any regime is selected and **re-appears if all regimes are subsequently deselected**. The localStorage persistence (AC3) governs first-page-load behavior only — the hint always re-appears on deselect-to-empty regardless of localStorage.
- [ ] AC3: The hint does NOT appear on first page load if the user previously selected a regime in a prior session (use localStorage consistent with the existing `scf_selected_regimes_*` pattern).
- [ ] AC4: The hint does not appear for the CRI framework (which has meaningful labels at default zoom and does not need the nudge).
- [ ] AC5: Playwright screenshot test 01 is regenerated and shows the onboarding hint visible in the empty state.

**Heuristic:** #6 Recognition Rather Than Recall, #8 Aesthetic and Minimalist Design

---

## US-UX-5 — Tag Filter Empty State (Major)

**As a** user browsing the left sidebar before selecting a regime,
**I want** the Tag Filters section to explain why it's empty,
**So that** I understand that tag filters become available after I select a compliance regime.

**Background:** The tag filter section renders with no tag groups when the SCF framework's tag columns return no content (or when no regime is selected and tag state is empty). Users who scroll to this section see a blank area with no guidance.

**Root cause note (Smith Gate 1 finding):** The SCF `framework_configs.js` lists `tag_cols: ["SCRM TAGS"]` but the actual CSV column header is `"SCRM Focus\n\nTIER 1\nSTRATEGIC"` (multi-line). Column lookup returns `undefined`, producing zero tags. This is a config bug, not a UI state issue. Neo must investigate the column name mismatch before implementing the empty state copy.

**Acceptance Criteria:**
- [ ] AC0 *(new — config bug fix)*: Neo inspects the SCF CSV column headers and corrects `tag_cols` in `framework_configs.js` to reference the actual existing column names. If SCRM tag columns exist but are unpopulated in the data, AC0 is documented and AC1 becomes the visible fallback.
- [ ] AC1 *(revised)*: When `tag-filter-groups` renders with no items (empty `tag_cols` OR all referenced columns return zero unique tags), show: `"No tag filters are available for this framework."` — muted small text. Do NOT reference regime selection; tag filters are framework-scoped, not regime-scoped.
- [ ] AC2: The empty state message is hidden as soon as at least one tag group renders.
- [ ] AC3 *(revised)*: If `tag_cols: []` in config, hide the entire Tag Filters accordion. If `tag_cols` has entries but all return zero unique tags after the config fix, show the AC1 message but keep the accordion visible.
- [ ] AC4: The Playwright screenshot test for the tag filter state is regenerated and shows the correct state (empty message, or populated tags if the config fix reveals data).

**Heuristic:** #1 Visibility of System Status

---

## US-UX-6 — Framework Selector Button Tooltips (Major)

**As a** GRC practitioner unfamiliar with framework acronyms,
**I want** to see a brief description of each framework when I hover over the selector buttons,
**So that** I can make an informed choice without needing prior domain knowledge.

**Background:** The framework selector shows `SCF 2026.1` and `CRI Profile v2.1` as toggle buttons with no additional context. The tool targets a broad GRC audience; not all users will know what "CRI Profile" refers to.

**Acceptance Criteria:**
- [ ] AC1: Each framework button in `#framework-selector` has a `title` attribute populated from `FRAMEWORK_CONFIGS[key].description` (or a new `description` field added to each config entry).
- [ ] AC2: The `description` field is added to `framework_configs.js` for each framework. Minimum content: `SCF: "Secure Controls Framework — comprehensive security and privacy controls"` and `CRI: "CISA Cyber Resilience Review Profile — incident response-focused controls"`.
- [ ] AC3: The tooltip appears on hover via standard browser `title` behavior — no custom tooltip library required.
- [ ] AC4: The button labels themselves (`SCF 2026.1`, `CRI Profile v2.1`) are unchanged.
- [ ] AC5: Playwright screenshot 03 is regenerated (tooltip not capturable by screenshot, but the `title` attribute is verified present via a DOM assertion in the test).

**Heuristic:** #6 Recognition Rather Than Recall

---

## Deferred to Backlog (Minor Issues — not in this sprint)

- **N1:** Breadcrumb nav arrows (◀ ▶) `aria-label` and `title` attributes
- **N2:** Regime-active indicator badge on collapsed sidebar toggle
- **N3:** Playwright test 06 timing fix (`waitForSelector('.treeselect-list')`) — Trin owns
- **N4:** Regime legend viewport clipping at 1440×900

---

## Sprint Sizing Notes for Morpheus

- US-UX-1 and US-UX-3 touch `updateBreadcrumbs()` and the D3 label render respectively — both in `app.js`. Low architectural risk.
- US-UX-2 is a one-line copy change in `app.js:1409` with a possible AC3 extension.
- US-UX-4 requires a new hint element in `index.html` and JS logic to show/hide it — small DOM addition.
- US-UX-5 requires a conditional empty state inside `initTagFilterPanel()` — small.
- US-UX-6 requires adding a `description` field to `framework_configs.js` and `title` attributes in `index.html`.

---

*Written by Cypher — 2026-04-24*
*Awaiting Smith Gate 1 approval before Morpheus architecture.*
