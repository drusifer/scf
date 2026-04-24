# Agent Local Context

> ## Recent Decisions
> - Implement `sprint_weighting` entirely in `index.html`, preserving `scf_processor.js`.
> - Preserve the current zoom focus when size mode changes so the page does not reset context for the user.
> - Implement `sprint_label_reading` in `app.js` plus a small overlay change in `index.html`, with label policy extracted to `reading_mode.js`.
>
> ## Key Findings
> - Weight parsing already exists:
>   - `scf_processor.js` exposes `weight` on each control node, so no data pipeline changes were required.
> - Footer controls are the right integration point:
>   - The approved UX location near the theme selector already exists in `index.html`.
> - Repo test target is not currently a feature-validating signal:
>   - `make test` fails because the repo lacks an importable `tests` package.
> - Mapped control sizing bug source:
>   - In `filterData()`, each visible mapping identifier contributed `value: 1`, so mapped controls grew with mapping count instead of staying proportional to the control's own weight.
> - Current label logic lived in `app.js`:
>   - The prior behavior only considered relative depth and ignored projected readability.
> - Manual pan/zoom already existed through `d3.zoom()`:
>   - The missing piece was explicit state that distinguishes canonical reading view from free zoom.
> - `make lint` did not cover the new shared helper by default:
>   - The lint target now includes `reading_mode.js`.
>
> ## Important Notes
> Implemented a persisted `Size By` selector with `Impact` and `Uniform` modes.
> Updated pack sizing/sorting, URL state, and layout refresh behavior to retain zoom focus across sizing changes.
> Verified the inline app script with `node --check` after extracting it from `index.html`.
> Follow-up fix: mapped controls now distribute their total size budget across visible mapping leaves, so mapped and unmapped controls remain comparable under impact sizing.
> `sprint_label_reading` now enforces a branch-scoped reading window of focus + children + readable grandchildren, adds a visible recovery control, and keeps manual pan/zoom from becoming the authority for label eligibility.
> QA follow-up fixed the remaining policy mismatch:
> immediate children are always eligible in reading mode now, and grandchildren remain the first density-pruning tier.
>
>---
>*Last updated: 2026-04-23T20:03*
