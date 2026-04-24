# Sprint Label Reading QA Summary

## QA Result
- Status: failed

## Checks Run
- `make test V=-vv`
- `make lint V=-vv`
- Spec review against:
  - `agents/cypher.docs/sprint_label_reading.md`
  - `agents/morpheus.docs/sprint_label_reading_arch.md`

## Finding
- `reading_mode.js` hides immediate child labels when `projectedRadius < 34`.
- This violates the approved sprint behavior:
  - immediate children should remain in the readable branch by default
  - grandchildren should be pruned first when density is too high

## Impact
- Dense branches can lose first-level child labels entirely, which breaks the deterministic reading model the sprint is supposed to introduce.

## Next QA Target
- Re-test after Neo changes child eligibility so children stay visible at the readable font floor while grandchildren remain the first density-pruning tier.
