# Sprint Weighting Neo Summary

## Changes
- Added a persisted `Size By` selector near the theme control
- Added weighted vs. uniform leaf sizing helpers
- Updated `d3.hierarchy().sum()` and `.sort()` to use the active sizing mode
- Preserved the current zoom focus during sizing changes
- Added URL-state support for the sizing mode
- Marked Sprint 2 tasks complete in `task.md`

## Verification
- `make test` fails for a pre-existing repo issue: `ImportError: Start directory is not importable: 'tests'`
- `node --check` passed on the extracted inline script from `index.html`
