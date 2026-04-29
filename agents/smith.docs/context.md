# Agent Local Context

## Panel Layout & Spacing Fixes (2026-04-28)
- Fixed "messy" layouts by eliminating micro-gaps between headers and inputs.
- Integrated search inputs directly into headers (no top/side borders, 0 radius).
- Fixed "collapsed/empty" regression by restoring `flex: 1 1 auto` to open panels.
- Fixed CRI tag parsing regression in `app.js`.
- Enabled text wrapping for `.filter-item-label` to prevent column overflow, and wrapped mapping quality tags properly.
- Implemented `make lint-css` using `stylelint` and cleaned up `styles.css`.
- Removed standalone "Mapping Quality" header and integrated filters seamlessly into `#tag-filter-groups`.
- Reverted CSS hacks (`position: sticky`, `overflow: visible`) for `Treeselect` inputs. We now use flexbox on the `.panel-item-content` wrappers (`!flex !flex-col !overflow-hidden`) to naturally convey the height constraint down to the `Treeselect` component, allowing its internal list to scroll while keeping the search box fixed at the top (avoiding double scrollbars).

## Semantic UX & Design System Refactor (2026-04-28)
... (rest of previous context)