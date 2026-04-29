# Smith Gate 2 Review — Sprint 6: Framework UX Fixes & Interaction Depth

**Reviewer:** Smith (HCI Expert)
**Date:** 2026-04-25
**Architecture reviewed:** `agents/morpheus.docs/sprint6_ux_feedback_arch.md`
**Verdict:** ✅ APPROVED

---

## OQ-1 Resolution — Regime Emoji

**Decision:** Keep `🛡️` hardcoded for both SCF and CRI. Do NOT add a `regime_icon` config field.

**Rationale:** We have two frameworks. No user feedback has indicated the `🛡️` icon is wrong for CRI. Adding per-config emoji at this point would be premature abstraction. The `regime_label` config field (introduced by S6-1) already differentiates the text content — that is sufficient for now. A `regime_icon` field can be added if a third framework is onboarded with a different domain metaphor.

---

## Architecture Assessment

### Phase A (S6-1 + S6-2)

`container.innerHTML = ""` fix: correct and minimal. Matches existing `initHierarchyFieldsTreeselect()` pattern exactly — no learning curve for Neo.

`updateRegimeLabel()` approach: clean. A simple DOM mutation on a single `id="regime-label"` span is the right choice over a more complex binding. No UX concern.

`max-height: 30vh`: straightforward. The outer `#regime-selector` div already has `overflow-y: auto` — no library concerns.

**Verdict:** ✅ No UX issues. Implement as specified.

### Phase B (S6-3)

`tagGroupMap: Map<tag, col>` approach: correct. Keeps `activeTagFilters` (flat Set) unchanged — all chip list, badge count, and localStorage code continues working without modification. The group membership is a separate orthogonal concern.

`controlPassesFilter()` per-group subset logic: mathematically sound. The AC7 edge case (empty `tags` array → pass all groups) and AC5 (no tags in a filtered group → pass that group) are both handled.

The `tagGroupMap.clear()` in `initTagFilterPanel()` before rebuilding groups is critical — Morpheus correctly identified this must precede `groupsContainer.innerHTML = ""`.

**UX note for implementation:** The new exclusive behavior is a behavior change for existing users who have saved tag filters. On framework switch, `clearTagFilters()` already runs — so persisted filters are cleared on switch. Within a session on the same framework, if a user had previously selected a filter under the old OR behavior and reloads, they'll now see the new exclusive behavior. This is acceptable — the old behavior was incorrect for CRI tiers.

**Verdict:** ✅ No UX issues. Implement as specified.

### Phase C (S6-4)

`#node-tooltip` HTML-over-SVG pattern: correct. Follows `#onboarding-hint` and `#tag-zero-result` precedents.

Tooltip positioning with viewport clamping: the `display: block` before `offsetWidth` read is the critical sequence — Morpheus flagged this in the risk register. Neo must implement in that order.

`getNodeTooltipPath()` with AC9 root-edge case: clean. Returning `processor.config.name` for depth-0 is the right choice — it gives the user meaningful orientation ("this is the SCF 2026.1 root") rather than an empty tooltip.

`pointer-events: none` on the tooltip div: essential. The tooltip must not interfere with mouseover/mouseout events on the D3 nodes underneath. Morpheus included this in the HTML snippet (`pointer-events-none` Tailwind class). Neo must confirm this is present.

**Verdict:** ✅ No UX issues. Implement as specified.

---

## Implementation Notes for Neo (non-blocking)

1. **Phase A:** After `switchFramework()` calls `updateRegimeLabel()`, also confirm the label updates correctly when the page first loads (initial framework). Call `updateRegimeLabel()` from the initial setup code path.
2. **Phase B:** Add a `// group-aware subset filter` comment on the `controlPassesFilter` closure to explain the non-obvious invariant to future readers.
3. **Phase C:** The `mousemove` handler should guard against calling `positionNodeTooltip` when the tooltip is hidden (display: none) — avoids unnecessary DOM reads on every mousemove.

---

*Review by Smith — 2026-04-25*
