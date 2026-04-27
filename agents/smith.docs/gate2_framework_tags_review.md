# Smith Gate 2 Review: Framework Switcher + Tag Filtering Architecture

**Doc reviewed:** agents/morpheus.docs/sprint_framework_tags_arch.md  
**Date:** 2026-04-24  
**Verdict:** APPROVED WITH NOTES (2 implementation notes for Neo)

---

## UX-Impact Assessment by Decision

### 1. Framework Selector (segmented toggle) — PASS
Segmented control at the top of the left sidebar is the correct pattern. It is discoverable (Nielsen #6 — recognition), persistent (it doesn't disappear), and matches the mental model of "choose one from a small set." No concerns.

**Note for Neo:** The arch specifies the HTML structure but not the active/inactive visual state. The active button must have a clearly distinct fill (e.g. `bg-[var(--accent-blue)] text-white`) vs. the inactive button (`bg-transparent text-[var(--text-muted)]`). Without this, both buttons look identical and the user cannot tell which framework is active. This is a pre-attentive processing requirement — must not be color-only (also needs weight or background change).

---

### 2. Framework Badge — PASS WITH NOTE

**HEURISTIC: #1 Visibility of System Status + Accessibility**  
SURFACE: `bg-black/30 text-white/70` badge positioned absolute over chart.  
CONCERN: In light mode, the chart background is `--bg-deep: #f8fafc` (near-white). `bg-black/30` over a light background produces a light gray pill with `text-white/70` — near-invisible white text on a translucent gray background. Contrast ratio will fail WCAG AA.  
**Note for Neo:** Badge style must adapt to theme. In dark mode `bg-black/30 text-white/70` is fine. In light mode, invert: `bg-white/70 text-[var(--text-primary)]` or use a fully opaque theme-aware background. Simplest fix: `bg-[var(--sidebar-color)]/90 text-[var(--text-primary)] border border-[var(--border-muted)]`.

---

### 3. Loading Overlay — PASS
Spinner over chart area with `bg-[var(--bg-deep)]/80` backdrop is the correct pattern. Appears immediately on click, covers the chart so the user doesn't interact with stale data during re-render. Matches Nielsen #1 and Nielsen #5 (prevents accidental double-clicks on stale nodes). No concerns.

---

### 4. Container Node Opacity During Tag Filtering — NOTE (non-blocking)

**HEURISTIC: #8 Aesthetic and Minimalist Design**  
SURFACE: The arch specifies "container nodes → always opacity 1.0" when tag filters are active.  
CONCERN: If a container (e.g. the "GOVERN" domain bubble) contains only dimmed leaf children, it will appear fully opaque and prominent while all its children are ghosted at 0.2. This creates a visual contradiction — the container signals "active area" while its contents signal "nothing here."  

**Note for Neo (implementation refinement, not a story change):** When applying tag filter opacity, propagate dimming upward: if ALL leaf descendants of a container node are dimmed, apply `opacity 0.5` to the container (not 0.2 — it should remain navigable, just visually subdued). Containers with at least one matching descendant stay at 1.0. This is a single recursive pass during `applyTagFilter()`.

---

### 5. Regime ID Migration (index → name) — PASS WITH NOTE

**HEURISTIC: #1 Visibility of System Status**  
SURFACE: The arch describes silent migration of saved regime index arrays to name-based storage on first load.  
CONCERN: A user who had carefully saved specific regime selections will have their selection silently migrated. If the migration maps correctly (likely for SCF→SCF first load), no visible difference. But if the migration maps incorrectly or partially (regime name not found), regimes are silently dropped and the user sees a different state than they saved, with no explanation.  

**Note for Neo:** If regime migration drops any regime IDs (regime name not found in current list), display a one-time dismissible notification: *"Your saved regime selection has been updated for compatibility."* This is a low-traffic event (first load after the update) and takes less than a minute to implement. Use a toast or the existing status-bar pattern.

---

### 6. Hierarchy Customizer Hidden for CRI — PASS
Hiding the hierarchy customizer for CRI (rather than disabling/greying it) is the correct call. Nielsen #5: don't offer options that can't be used. No affordance → no confusion. No concerns.

---

### 7. `framework_configs.js` as Source of Truth — PASS
Internal architecture — not user-visible. No UX concerns.

---

## Gate Decision

**APPROVED WITH NOTES**

2 notes for Neo (implementation refinements — do not require story changes or a re-review):
1. **Segmented toggle active state**: must use background fill + text color change, not color-only
2. **Framework badge contrast**: use theme-aware styling in light mode

2 notes that Neo should address during implementation but do not block the sprint:
3. **Container opacity propagation**: dim containers whose all-children are dimmed (0.5, not 1.0)
4. **Regime migration toast**: one-time notification if migration drops any saved regimes

Proceed to Mouse for sprint breakdown.
