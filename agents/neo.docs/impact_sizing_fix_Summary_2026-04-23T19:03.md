# Impact Sizing Fix Summary

## Bug
Mapped controls were larger than unmapped controls with higher relative weight because each mapping identifier leaf added `value: 1` to the pack layout.

## Fix
- Kept the control's own weight as the total size budget
- Distributed that budget across the visible mapping leaves
- Left unmapped controls sized directly by their own control weight

## Verification
- Math smoke check passed:
  - mapped `7%` control with `14` visible identifiers totals `35`
  - unmapped `21%` control totals `105`
  - unmapped remains larger, as intended
- `node --check` passed on the extracted inline script from `index.html`
