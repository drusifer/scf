# Sprint: Predictable Label Reading Mode

## Epic
Make label readability deterministic during visualization navigation so users can reliably read the selected branch and two levels below without getting stuck in tiny, unpredictable text states.

## User Stories

### Story 1: Selected Branch Reading Mode
**As an** analyst navigating the visualization,  
**I want** labels for the selected branch and two levels below to remain readable,  
**So that** I can inspect the active area of the hierarchy without guessing why text is tiny or missing.

**Acceptance Criteria:**
- Selecting a bubble, breadcrumb, or hierarchy navigator item enters a deterministic reading mode centered on that branch.
- In reading mode, labels are eligible for display only on:
  - the selected node
  - its children
  - its grandchildren
- Labels outside that reading window are hidden by default.
- Labels inside the reading window never render below a minimum readable font floor.

### Story 2: Predictable Density Rules
**As a** user exploring dense branches,  
**I want** the visualization to reduce label clutter predictably,  
**So that** readability is preserved without random-looking text overlap.

**Acceptance Criteria:**
- Label display within the selected branch is based on readable on-screen space, not just raw tree depth.
- If there is not enough room for all eligible labels, deeper labels are thinned before the font size drops below the readability floor.
- Grandchild labels are shown only when their projected bubble size can support readable text.
- Hover can temporarily emphasize a nearby label, but hover does not change the core reading-mode rules.

### Story 3: User Control Over View State
**As a** user mixing click navigation with manual zoom/pan,  
**I want** a clear way to return to a readable branch view,  
**So that** I do not get stuck in a confusing overview with tiny labels and no obvious recovery path.

**Acceptance Criteria:**
- The UI provides a visible reset or return-to-reading-view action.
- Manual zoom/pan does not silently redefine which labels should be readable for the selected branch.
- If the user leaves the canonical reading view through free zoom/pan, the system makes that state understandable and recoverable.
- Resetting returns the visualization to a readable branch view for the current selection.
