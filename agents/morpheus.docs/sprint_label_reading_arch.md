# Architecture Plan: Predictable Label Reading Mode

## Overview
This sprint should separate **reading logic** from raw zoom state so the active branch remains legible and predictable during navigation.

## 1. Reading Context Model
- Introduce a branch-scoped reading context derived from the current `focus`.
- The reading context should define:
  - `selectedDepth = 0`
  - `childDepth = 1`
  - `grandchildDepth = 2`
- Label eligibility should be computed from this reading context, not just from arbitrary viewport state.

## 2. Label Policy Helpers
- Extract label behavior into explicit helpers in `app.js` or a follow-up shared module:
  - `getLabelEligibility(node, focus, projectedRadius)`
  - `getLabelFontSize(node, focus, projectedRadius)`
  - `getLabelDensityTier(node, focus, projectedRadius)`
- Use projected bubble size and zoom scale to decide whether a label is readable.
- Enforce a minimum readable font floor instead of shrinking text indefinitely.

## 3. Density Management
- Preserve labels for the selected node and its immediate children by default.
- Grandchildren should be conditionally shown only if their projected radius is above a readability threshold.
- If density is too high, prune grandchildren before shrinking child labels below the minimum floor.

## 4. Navigation Semantics
- Treat click navigation, breadcrumb navigation, and hierarchy navigator selection as explicit entry into reading mode.
- Keep free pan/zoom available, but do not let it become the hidden authority for label readability.
- Maintain a canonical readable target view for the current focus so the user can return to it consistently.

## 5. Recovery UX
- Add a visible `Reset View` or `Return to Reading View` control near breadcrumbs or other navigation affordances.
- Optional but recommended:
  - a subtle status treatment when the user is in free overview mode instead of canonical reading mode.

## 6. Scope Guidance
- This sprint should improve predictability first.
- Avoid broad visual redesign.
- Prefer a minimal, explicit reading model over heuristic tweaks spread across unrelated functions.
