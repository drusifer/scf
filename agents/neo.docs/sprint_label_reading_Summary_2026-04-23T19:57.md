# Sprint Label Reading Summary

## Scope Completed
- Added `reading_mode.js` as a testable reading-policy module for branch reading mode.
- Updated `app.js` to use explicit reading metrics, projected-radius thresholds, and a canonical reading-view reset path.
- Added reading-view status and `Return to Reading View` UI near breadcrumbs in `index.html`.
- Extended unit coverage with `tests/unit/test_reading_mode.js`.
- Expanded lint coverage so `reading_mode.js` is included in `make lint`.

## Verification
- `make test V=-vv` passed with 9 tests.
- `make lint V=-vv` passed.
- `make lint-app-js V=-vv` passed.

## QA Focus
- Confirm click navigation, breadcrumb jumps, and hierarchy navigator selections restore canonical reading view.
- Confirm manual pan/zoom flips the status to free zoom and shows the recovery control.
- Confirm labels are limited to focus, children, and conditionally readable grandchildren.
