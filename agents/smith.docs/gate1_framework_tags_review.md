# Smith Gate 1 Review: Framework Switcher + Tag Filtering

**Sprint:** sprint_framework_tags.md  
**Date:** 2026-04-24  
**Verdict:** APPROVED WITH NOTES

---

## Summary

Stories S-FT-1 through S-FT-6 are well-structured and grounded in real data. The approach of dimming (not removing) filtered nodes correctly preserves hierarchy context. The localStorage persistence model is consistent with existing patterns in `app.js`. Approved to proceed to Morpheus architecture — with 4 notes that MUST be addressed as acceptance criteria additions before implementation begins.

---

## Story-by-Story Findings

### S-FT-1 (Config-Driven Loader) — PASS
No HCI concerns with the developer story itself. One note:  
> `NOTE-1`: The "console warning" for missing columns (AC-3) is developer-only feedback. Add one criterion: if the config fails to load (missing file, parse error), the user must see a visible error message, not a blank chart. Pattern: the existing "No regimes selected" text at `app.js:247` can be adapted. **Add to ACs:** `If loadFramework() fails, display an inline error message where the viz would appear, citing which framework failed to load.`

---

### S-FT-2 (Framework Selector UI) — PASS WITH NOTES

**HEURISTIC: #1 Visibility of System Status**  
SURFACE: Framework switch triggers up to a 2-second re-render (per DoD).  
EXPECTED: User sees a clear "loading" signal during re-render.  
ACTUAL: No acceptance criterion for a loading indicator.  
IMPACT: At 2s, users will click the toggle a second time assuming it didn't register — causing a second re-render and further delay.  
**Add to ACs:** `During framework switch re-render, display a loading indicator (spinner or progress bar) on the chart area. It must appear immediately on toggle click and disappear when the viz is ready.`

**HEURISTIC: #3 User Control and Freedom**  
SURFACE: `localStorage` tag filter state is keyed to — unclear whether it is keyed per-framework or globally.  
CONCERN: If tag filter state in localStorage is global (not per-framework), a reload after a framework switch will load the wrong framework's filter state silently.  
**Add to ACs:** `Tag filter localStorage state is namespaced per framework (e.g., \`scf_tag_filters\` vs \`cri_tag_filters\`). On page load, load only the tag filter state for the currently active framework.`

---

### S-FT-3 (Regime Selector Repopulation) — PASS WITH NOTE

**HEURISTIC: #2 Match Between System and Real World**  
SURFACE: Regime names exposed from CRI CSV columns are raw internal names: "NYDFS PART 500", "FFIEC CAT", "MAS CHN AND TRMG", etc.  
CONCERN: GRC professionals know these as full names ("NY Department of Financial Services Part 500", "FFIEC Cybersecurity Assessment Tool"). The raw column names are internal codes.  
**Note (non-blocking, flag for Morpheus):** Consider whether a regime display-name mapping (separate from the column-lookup) is in scope. If not in this sprint, note it as a follow-on story. Approving as-is — this is existing behavior for SCF too.

---

### S-FT-4 (Tag Filter Panel) — PASS WITH NOTES

**HEURISTIC: #1 Visibility of System Status**  
SURFACE: The tag filter panel is below the regime selector in the sidebar — which can be collapsed.  
CONCERN: When the sidebar is collapsed (or the user has scrolled past the panel), there is no persistent indication that tag filters are active. The user sees a partially-dimmed chart with no obvious explanation.  
**Add to ACs:** `When one or more tags are active, a badge showing the count of active tag filters (e.g. "3 tags") appears on the sidebar collapse/expand handle and/or on the left sidebar header. Badge disappears when filters are cleared.`

**HEURISTIC: #9 Help Users Recognize, Diagnose, and Recover from Errors**  
SURFACE: S-FT-4 specifies opacity dimming for non-matching controls. If a selected tag combination matches zero controls, the entire chart is at 0.15–0.25 opacity with no explanatory text.  
CONCERN: This looks like a crash or broken state to a user unfamiliar with the filter logic.  
**Add to ACs:** `If the active tag filter(s) match zero controls, display a message overlay on the chart: "No controls match the selected tags. [Clear Filters]." Use the same visual pattern as the existing "No regimes selected" message.`

---

### S-FT-5 (Tag Search Input) — PASS WITH NOTES

**HEURISTIC: #6 Recognition Rather Than Recall**  
SURFACE: When a user searches the Subject Tags list, selected tags that don't match the search query are hidden from view but remain active.  
CONCERN: The user cannot see which tags are active without clearing the search. They must *recall* their selections rather than *recognizing* them.  
**Add to ACs:** `A compact "X selected" badge or chip list (showing selected tag names, not just a count) appears above the search input when tags are selected. This remains visible regardless of what is typed in the search box. Each chip has an ×/remove affordance.`

**HEURISTIC: #9 Recover from Errors**  
SURFACE: Tag search with no matching results leaves the checklist area empty.  
**Add to ACs:** `If the search input yields no matching tags, display "No tags match '…'" in the list area.`

---

### S-FT-6 (Detail Panel Framework Awareness) — PASS
All acceptance criteria are clear and testable. No concerns.

---

## Gate Decision

**APPROVED WITH NOTES**

All 4 note items above must be added as acceptance criteria in `sprint_framework_tags.md` before Neo begins implementation. They do not require a re-review — Cypher or Morpheus can fold them in. Proceed to Morpheus architecture.

Items to fold in:
- S-FT-1 AC: user-visible config load failure message
- S-FT-2 AC: loading indicator during framework switch + per-framework localStorage namespace for tag filters  
- S-FT-4 AC: active filter badge on sidebar handle + zero-result empty state message  
- S-FT-5 AC: selected-tag chip list above search + empty search results message
