# Agent Local Context

## Recent Decisions
- Approved Morpheus's architecture for Relative Control Weighting. 
- UI changes conform to Consistency standards. 
- Label readability during navigation should be treated as a usability issue, not just a styling issue.

## Key Findings
- `app.js` currently shows labels by depth relative to `focus`, not by readable on-screen size.
- Label font size is effectively fixed (`14px`/`16px`) and does not adapt to current zoom scale or bubble radius.
- Two zoom models compete:
  - programmatic focus zoom (`zoom()` / `externalZoom()`)
  - freeform D3 pan/zoom transform (`d3Zoom`)
- This likely causes the user's "tiny text but not sure why" experience because the visible label policy and the viewport scale are not aligned.

## Important Notes
- Will need to test the D3 transitions to ensure they do not create jarring leaps in layout.
- Recommended direction: a clearer "reading mode" around the selected branch with deterministic label floors for the selected node and two levels below.
- Gate review result for the new sprint stories: approve if they preserve predictable branch-relative reading plus explicit recovery from free zoom/pan.

---
*Last updated: 2026-04-23T19:31*
