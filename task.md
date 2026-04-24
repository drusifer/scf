# Task Board

## Sprint 1: Core Visualization & Data

- [ ] [S1-1] Verify client-side CSV loading in `scf_processor.js`
- [ ] [S1-2] Ensure `index.html` correctly triggers `SCFDataProcessor.init()`
- [ ] [S1-3] Implement/Verify Zoomable Circle Packing logic in `index.html`
- [ ] [S1-4] Implement Regime Selection Sidebar
- [ ] [S1-5] Implement Hierarchy Adjustment Sidebar
- [ ] [S1-6] Implement Search & Navigation
- [ ] [S1-7] Detail Panel for Control Info
- [ ] [S1-8] Dark/Light Mode toggle and persistence

## Sprint 2: Relative Control Weighting

- [x] [S2-1] Add `currentSizeBy` global state and local storage logic
- [x] [S2-2] Update `d3.pack().sum()` and `.sort()` to use `d.weight` or `1`
- [x] [S2-3] Add UI selector for Size By (Weight/Uniform) near Theme toggle
- [x] [S2-4] Test sizing toggle animations and label rendering

## Sprint 3: Predictable Label Reading

- [ ] [S3-1] Define branch reading mode for selected node plus two levels below
- [ ] [S3-2] Replace depth-only label rules with readable font floor and projected-radius thresholds
- [ ] [S3-3] Add reset-to-reading-view control and clear recovery from free zoom/pan
- [ ] [S3-4] Verify label readability across click navigation, breadcrumbs, navigator, and manual zoom

## Backlog

- [ ] [B-1] Export visualization to PDF/PNG
- [ ] [B-2] Shareable links (state in URL)
- [ ] [B-3] Offline support (PWA)
