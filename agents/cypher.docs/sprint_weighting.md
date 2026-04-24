# Sprint: Relative Control Weighting Visualization

## Epic
Transform the static circle packing chart into a dynamic heat map of control impact by utilizing the "Relative Control Weighting" data from the SCF dataset.

## User Stories

### Story 1: Default Weighting View
**As a** GRC professional,
**I want** the circle packing chart to size bubbles based on "Relative Control Weighting" by default,
**So that** I can immediately identify the most impactful control domains upon opening the tool.

**Acceptance Criteria:**
- The D3 visualization utilizes the `weight` property of each control node to determine its bubble area during packing.
- The UI contains a clear visual indicator that the chart is currently sized by weight (impact).
- Extremely low-weight controls do not disappear or collide in ways that obscure labels or break hover interactions.
- Sizing applies correctly at all hierarchy levels (e.g., Domain bubbles reflect the sum of their weighted children).

### Story 2: Sizing Toggle (Weight vs. Uniform)
**As an** analyst,
**I want** to toggle the sizing metric between "Weighting" (Impact) and "Uniform" (Count),
**So that** I can switch from viewing pure risk impact to understanding raw control volume.

**Acceptance Criteria:**
- A dropdown, toggle switch, or segmented control exists in the sidebar or footer (near the Unmapped toggle/Theme selector).
- Selecting "Weighting" sizes by `weight`.
- Selecting "Uniform" sizes by a constant value of `1`.
- Changing the sizing selection smoothly animates the bubble transitions in D3 without reloading the page or losing current zoom focus.
- The user's preference is persisted across sessions (e.g., via `localStorage`).
