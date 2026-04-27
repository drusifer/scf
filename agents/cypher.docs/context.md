# Agent Local Context

## Recent Decisions
- **2026-04-27:** Planned Sprint 8: Context and Polish. Scope: SCF PPTDF hierarchy polish, unified sidebar activity badge, navigation control labels, and regime legend viewport containment. Deferred SCRM tier filtering as feature expansion.
- **2026-04-27:** Closed Sprint 7 from product. S7-1 through S7-5 are complete; verification passed; remaining work is backlog polish only. Closeout artifact: `agents/cypher.docs/sprint7_closeout_2026_04_27.md`.
- **2026-04-27:** Reviewed `$bloop plan bug fix sprint`. BUG-1, BUG-2, and BUG-3 are already fixed and verified in Sprint 7; no new bug-fix sprint is recommended. Planning artifact: `agents/cypher.docs/bug_fix_sprint_plan_2026_04_27.md`.
- Defined "Relative Control Weighting Visualization" epic.
- Added user stories for default weighting and a toggle mechanism.
- Defined sprint for predictable label reading behavior using Smith's recommendation.
- **2026-04-24:** Defined "Framework Switcher + Tag Filtering" epic. PRD sections 4.6 and 4.7 added. User stories US.6–US.10 added. Sprint stories in `sprint_framework_tags.md`.
- **2026-04-24:** Defined "UX Polish" sprint. 6 stories (US-UX-1 through US-UX-6) written from Smith's screenshot review. Stored in `sprint_ux_polish.md`.

## Key Findings
- Weighting is critical for user "impact" mental models (supported by Smith's prior feedback).
- Label readability needs explicit user-facing rules.
- Both frameworks (SCF + CRI) are now YAML-configured with shared schema abstraction — the processor must be refactored to be config-driven (open architecture risk flagged for Morpheus).
- CRI has 107 unique subject tags + Tier 1–4 tags; SCF has 3 SCRM tier tags. Tag panel must handle groups and search for large tag sets.
- CRI exposes 22+ regime mapping columns; regime selector must repopulate dynamically on framework switch.

## Sprint 7 — CRI UX Remediation (2026-04-25)
- Product closeout complete on 2026-04-27
- Stories written from Smith's CRI live session feedback
- Phase A: BUG-1+BUG-2 (S7-1: predicate OR logic `every→some`), BUG-3 (S7-2: tooltip wrap)
- Phase B: FEATURE-1 (S7-3: regime grouping by first-word prefix, count≥2)
- Phase C: FEATURE-2 (S7-4: relationship tags in detail panel, S7-5: mapping quality filter)
- Key design correction: Sprint 6 subset predicate invalid for CRI data; OR is correct for all current tag groups
- Morpheus open questions resolved: no YAML `filter_mode` now; Treeselect grouping works; Mapping Quality filters reset with regime context
- Backlog polish: active Mapping Quality filters are not included in the filter badge count

## Important Notes
- Sprint 8 source artifact: `agents/cypher.docs/sprint8_polish.md`
- S-FT-1 (config-driven loader) is the critical blocker for all other framework stories — flag for Morpheus.
- Tag filtering uses opacity dimming (not node removal) to preserve hierarchy context. Whether dimmed nodes also shrink radius is an open question for Morpheus.

---
*Last updated: 2026-04-27*
