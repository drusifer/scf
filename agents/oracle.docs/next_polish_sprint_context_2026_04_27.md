# Next Polish Sprint Context - 2026-04-27

## Query
Cypher asked what existing polish/backlog decisions should be considered for the next sprint after Sprint 7.

## Answer
The strongest candidates are already documented and should be treated as known backlog, not new discovery:

1. `agents/cypher.docs/sprint7_closeout_2026_04_27.md`
   - Follow-up backlog B-S7-1: Mapping Quality filters are not included in the filter badge count.

2. `agents/morpheus.docs/BACKLOG.md`
   - B-PPTDF: SCF PPTDF column name mismatch is high priority and affects SCF hierarchy rendering.
   - B-SCRM: SCRM Tier Tag Filtering is low priority and should remain deferred unless the user asks for SCF filtering specifically.

3. `agents/smith.docs/ux_screenshot_review_2026_04_24.md`
   - N1: breadcrumb/navigation arrows need accessible labels/tooltips.
   - N2: collapsed sidebar loses selected-regime context.
   - N4: regime legend may clip off-screen at 1440x900.

## Recommendation
For a focused polish sprint, include:
- SCF hierarchy label/data polish via B-PPTDF.
- Unified sidebar activity badge covering selected regimes, tag filters, and Mapping Quality filters.
- Navigation control affordance labels.
- Regime legend viewport containment.

Defer:
- B-SCRM, because it is a new filtering capability rather than a polish cleanup.
- Broad visual redesign, because current screenshot review found the visual system generally strong.
