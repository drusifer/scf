Status: Approved by User on 2026-01-29

User Review Required
IMPORTANT

Data Parsing: I will use PapaParse (an existing JS library) to handle the complex Excel-formatted CSV data, ensuring correct handling of multi-line headers and quoted cells.

IMPORTANT

Control Weighting: I will use the values from the "Relative Control Weighting" column to drive the visual scale of the bubbles, as requested.

IMPORTANT

3D Layout: I will implement a 3D Force-Directed Layout (using d3-force-3d) to achieve the required 3D packing without a "pancake" look.

NOTE

Unit Testing: I will include unit tests using a simple, browser-based framework (like Mocha/Chai via CDN) that does not require Node.js.

Proposed Changes
Environment & Core
[NEW] 
index.html
: Main entry point with HUD layout.
[NEW] 
index.css
: Tailwind CSS and global styles (Glassmorphism, HUD).
[NEW] 
main.js
: Main application logic, scene initialization.
[NEW] 
src/components/Navbar.js
: Breadcrumb navigation (Root > Domain > PPTDF > Control) and browser history support.
Data Layer
[NEW] 
src/data-processor.js
:
CSV parser (optimized for large file).
Hierarchy aggregator (Domain -> PPTDF -> SCF Control -> Regime -> ID).
Memoization for bubble positions.
Visualization Engine
[NEW] 
src/viz-engine.js
:
Three.js scene setup with 3D Force-Directed Layout.
Bubble Labels: Rendered as if written on a "globe" (following surface curvature).
Label Visibility: Highest level visible by default, others appear on zoom/hover (flexible design).
Navigation: Zoom-to-node; hide non-selected nodes (visible = false).
Performance: High/Low Poly toggle (Dodecahedrons for low-poly).
Coloring: SCF nodes white/transparent; Selected Regime controls use distinct generated colors.
UI Components (HUD)
[NEW] 
src/components/Sidebar.js
: Hierarchy navigation and auto-zoom.
[NEW] 
src/components/DetailPanel.js
: Selected node inspector.
[NEW] 
src/components/RegimeCatalog.js
: Checkbox list of regimes with color coding.
Verification Plan
Automated Tests
[NEW] 
tests/index.html
: Browser-based test runner.
[NEW] 
tests/data-processor.test.js
: Unit tests for CSV parsing and hierarchy construction.
Manual Verification
Initial Load: Verify the app loads ~10MB CSV smoothly (using memoization).
Hierarchy Navigation: Click a Domain in the sidebar and verify the camera zooms to the correct cluster.
Regime Filtering: Select "NIST 800-53" in the catalog and verify that those bubbles are colored and others are updated according to PRD rules.
Performance: Verify 60 FPS in Chrome/Edge during camera movement.
Aesthetics: Ensure the "Glassmorphism" and HUD feel premium as per requirements.
Finalized Decisions
Regime Headers: Split headers merged (e.g., "NIST CSF 2.0").
Control Weighting: Driven by the "Relative Control Weighting" column.
Hierarchy: Domain -> PPTDF -> SCF Control -> Regime -> Control ID (Flexible PPTDF layer).
Color Palette: High-contrast, maximally distinct generated colors for selected regimes.
Bubble Labels:
Physically follow the "globe" (sphere surface) curvature.
Highest level labels visible by default; deeper levels appear progressively.
Navigation / Zoom:
Breadcrumb Navbar at the top for jumping between levels.
Respects Browser Back/Forward navigation.
Hiding nodes sets visible = false or removes them from state.
Performance: Added a "Low Poly" checkbox to toggle between high-quality spheres and low-poly dodecahedrons.