# UX Screenshot Review — 2026-04-24

**Reviewer:** Smith (HCI Expert)
**Source:** tests/e2e/screenshots/ (10 Playwright captures)
**Framework:** Nielsen's 10 Usability Heuristics

---

## Summary Verdict

| Severity | Count |
|----------|-------|
| Critical (block or fix this sprint) | 2 |
| Major (address next sprint) | 4 |
| Minor (backlog) | 4 |

---

## Critical Issues

### C1 — Double "Uncategorized" in Breadcrumb
**Screenshot:** 07-node-clicked.png
**Heuristic:** #2 Match Between System and Real World
**Evidence:** Breadcrumb reads: `SCF 2026.1 / Uncategorized / Uncategorized / Capacity & Performance Planning / CAP-06`

Two consecutive "Uncategorized" levels are exposed in the navigation breadcrumb. This looks like an internal data structure artifact leaking into the UI. Real users have no mental model for two layers of "Uncategorized" — it reads as broken.

**Fix:** Either collapse consecutive identical hierarchy labels in the breadcrumb renderer, or ensure the data pipeline assigns meaningful domain labels before reaching the hierarchy. Trin should confirm whether this is a data issue or a rendering issue.

---

### C2 — No Description Copy is Passive
**Screenshot:** 07-node-clicked.png
**Heuristic:** #9 Help Users Recognize, Diagnose, and Recover
**Evidence:** Right detail panel shows: `"No description provided."` in grey italic for CAP-06 (Impact Weight: 1).

"No description provided." tells the user something is missing but not why, not whether this is expected, and not what they can do about it. For a tool used by GRC practitioners making compliance decisions, a control with no description creates uncertainty: is this a data quality gap? A deliberate omission? Is this control even valid?

**Fix:** Replace with an actionable empty state — e.g. `"No description available for this control in the current framework."` or link to the source framework document. At minimum, distinguish between "SCF has no description" vs "this control is unmapped."

---

## Major Issues

### M1 — SCF Default View: No Visual Entry Point
**Screenshots:** 01-initial-light.png, 02-dark-mode.png, 10-size-by-uniform.png
**Heuristic:** #6 Recognition Rather Than Recall, #8 Aesthetic and Minimalist Design

The default SCF view shows hundreds of near-identical small grey circles with no visible labels, no colors, and no clear call-to-action. Compare to the CRI view (04-framework-switched.png) which loads with 7 large, clearly labeled circles (DETECT, EXTEND, GOVERN, RESPOND, PROTECT, RECOVER, IDENTIFY). The experiential gap between these two is extreme.

A new user landing on SCF for the first time will not understand what they're looking at, what the circles represent, or what to do next. Nothing in the initial state communicates "select a regime from the left sidebar to see compliance coverage."

**Fix:** Add a subtle onboarding nudge — either a short instructional overlay on first visit, or a persistent hint in the empty visualization area ("Select a compliance regime to see framework coverage"). The treeselect placeholder text could also be improved from the current blank to "Search or select a regime...".

---

### M2 — Tag Filter Empty State: No Explanation
**Screenshot:** 05-tag-filter-panel.png
**Heuristic:** #1 Visibility of System Status

The Tag Filters section appears empty (no tag groups rendered). Based on the code, tag filters likely only populate when a regime is selected — but the UI shows nothing to explain this. A user who scrolls down to Tag Filters expecting filtering options will see a blank section with no explanation.

**Fix:** Show a contextual empty state inside the tag filter section: `"Select a regime above to see available tag filters."` This maintains status visibility and guides the user toward the correct action.

---

### M3 — "SCF Uncategorized Level" Center Label
**Screenshots:** 01, 02, 03, 05, 06, 10
**Heuristic:** #2 Match Between System and Real World

The center label of the circle-packing visualization reads **"SCF Uncategorized Level"** in every screenshot where no node is focused. This is an internal data taxonomy term, not a human-readable description of the visualization's root.

**Fix:** The root node label should either be hidden (the user already knows which framework they're in from the badge and header), or replaced with the framework's human-readable name (e.g., "Secure Controls Framework 2026.1"). "Uncategorized Level" as a visible label should never appear in a production UI.

---

### M4 — Framework Selector Buttons: No Explanatory Context
**Screenshot:** 03-framework-selector.png
**Heuristic:** #6 Recognition Rather Than Recall

The framework selector shows two toggle buttons: `SCF 2026.1` and `CRI Profile v2.1`. No tooltip, no subtitle, no description. Domain experts will recognize these immediately, but the tool is positioned for GRC practitioners of varying levels of familiarity. New users won't know what "CRI Profile v2.1" means or how it differs from SCF.

**Fix:** Add `title` attributes to the buttons for tooltip-on-hover (low effort). Optionally, add a one-line subtitle below the selector explaining the distinction (e.g., "SCF: comprehensive controls | CRI: CISA incident response framework").

---

## Minor Issues

### N1 — Breadcrumb Arrows Unlabeled
**Screenshot:** 07-node-clicked.png
**Heuristic:** #4 Consistency and Standards

The left `◀` and right `▶` chevrons on either side of the visualization area appear to be navigation controls but have no label or tooltip. Their function (navigate prev/next sibling node?) is not discoverable without experimentation.

**Fix:** Add `aria-label` and `title` attributes. Consider a short hover label: "Previous sibling" / "Next sibling".

---

### N2 — Collapsed Sidebar Loses Regime Context
**Screenshot:** 08-sidebar-collapsed.png
**Heuristic:** #1 Visibility of System Status

When the left sidebar is collapsed, the framework badge at the bottom left shows `SCF 2026.1` — but there's no indicator of which regimes are active. A user who collapses the sidebar while AICPA is selected has no visible confirmation that a filter is in effect.

**Fix:** The existing `#tag-filter-badge` badge pattern (the small counter badge on the sidebar toggle) could be extended — show a small regime count badge on the collapsed toggle (e.g., `•` or a numeric indicator when any regimes are active).

---

### N3 — Screenshot 06 (Treeselect Open) Did Not Capture Dropdown
**Screenshot:** 06-regime-treeselect-open.png
**Note for Trin:** The test clicked the treeselect input but the dropdown did not appear in the screenshot — the capture looks identical to the initial state. Likely a timing issue (dropdown renders asynchronously). Trin should add a `waitForSelector('.treeselect-list')` before the screenshot call.

---

### N4 — Dark Mode Regime View: Legend Off-Screen
**Screenshot:** 09-dark-regime-selected.png
**Heuristic:** #1 Visibility of System Status

The regime legend (expected at bottom right per `#regime-legend`) is not visible in the dark-mode-with-regime screenshot. If the legend is rendering outside the visible viewport at 1440×900 it may be inaccessible to some users. Worth confirming the legend is always visible when a regime is active.

---

## Positive Findings

- **Dark mode** (02): Visually polished. Contrast between background and circle borders is appropriate. Orange regime-colored dots on dark background (09) have excellent pre-attentive pop — the color coding immediately communicates coverage.
- **Framework switch** (04): CRI Profile view is dramatically more readable than SCF default. Large labeled domain circles with visible text at every level. This is the gold standard state for first-time user comprehension.
- **Node detail panel** (07): The `CAP-06 / Regional Delivery` panel is well structured. Impact Weight and Domain Focus use clear metric cards. The `INSPECT & NAVIGATE` label and `HIERARCHY NAVIGATOR` section are appropriately named. The breadcrumb at top is a strong wayfinding element (aside from the "Uncategorized" issue).
- **Sidebar collapse** (08): Smooth, visualization expands to use full width. Clean execution.
- **Size-by toggle** (10): Switching to uniform mode visually reorganizes the layout. The change is immediately perceptible — no ambiguity about whether the toggle did anything.

---

*Review completed: 2026-04-24*
*Next action: Post summary to CHAT.md → Cypher for C1/C2 story creation, Neo for C1 investigation.*
