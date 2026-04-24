# Agent Local Context

> ## Recent Decisions
> - `sprint_weighting` verification should use the sprint story as the source of truth.
> - Because `make test` is currently broken at the repo level, syntax validation plus code/spec review is the available QA gate in this session.
> - `sprint_label_reading` QA should use the sprint story plus architecture doc as the expected-result source of truth.
>
> ## Key Findings
> - Acceptance criteria coverage is present in code:
>   - `index.html` now contains a persisted `Size By` control, weighted/uniform sizing logic, and focus-preserving updates.
> - Verification limits are environmental:
>   - `make test` fails before reaching feature checks because `tests/` is not importable.
> - Direct JavaScript syntax validation passed:
>   - The extracted inline script from `index.html` passes `node --check`.
> - QA tooling is now real and runnable:
>   - `make test`, `make test-unit`, `make lint`, `make lint-js`, and `make lint-inline-js` are configured and pass in this repo.
> - Testable logic was extracted:
>   - Shared sizing behavior now lives in `viz_sizing.js`, which is covered by `tests/unit/test_viz_sizing.js`.
> - Reading-mode policy is testable:
>   - `reading_mode.js` now contains the branch reading helper logic and has unit coverage.
> - The initial Sprint 3 QA failure was corrected:
>   - `reading_mode.js` now keeps immediate children eligible in reading mode while grandchildren remain the first density-pruning tier.
>
> ## Important Notes
> QA reviewed the feature against `agents/cypher.docs/sprint_weighting.md`.
> Residual risk remains around browser-only behavior such as visual smoothness and label overlap because no browser automation or manual browser session was run here.
> Added `eslint.config.js` plus `agents/tools/extract_inline_script.py` so static analysis can cover both shared JS modules and the main inline app script in `index.html`.
> For `sprint_label_reading`, automated gates pass (`make test`, `make lint`) and the helper logic now matches the approved child/grandchild rules.
> Residual risk is still browser-only behavior:
> no live browser session or automation was run for visual transitions and pan/zoom feel.
>
>---
>*Last updated: 2026-04-23T20:03*
