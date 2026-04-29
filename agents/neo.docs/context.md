# Neo Context

## Robust Parser & Spacing Fixes (2026-04-28)
- Fixed "Uncategorized" regression by implementing robust column normalization in `framework_processor.js`.
- Fixed vertical spacing issues by removing internal `flex-col`/`flex-1` from panel content.
- Panels now use natural block flow while maintaining independent scrolling.

## Compact Panel Layout & Regression Fix (2026-04-28)
- Fixed "wacky heights" by changing `.panel-item.open` to `flex: 0 1 auto`, allowing panels to hug content.
- Added `max-height: 60vh` constraint to open panels for better viewport distribution.
- Tightened UI by reducing margins (`6px 12px` -> `4px 8px`) and internal padding (`p-4` -> `p-3`).
- Resolved tag filter regression by restoring functional `.tag-checkbox` classes to inputs.

## Engineering Mandates (Updated 2026-04-28)
- **Surgical Execution**: Prioritize targeted changes over broad refactors. Never modify functional classes or data-matching logic unless explicitly requested.
- **Regression Prevention**: Verify JS dependencies before any HTML/CSS class renaming.
