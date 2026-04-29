# SCF Circle Packing Relationship Visualizer

A sophisticated, browser-based GRC visualization tool for the **Secure Controls Framework (SCF) 2026.1** and **CRI Profile v2.1** datasets. This tool transforms complex control mappings into an intuitive, zoomable circle packing diagram, allowing compliance professionals to visualize the density, weighting, and cross-framework applicability of their security controls.

## 🚀 Features

- **Interactive Circle Packing:** Navigate a dynamic hierarchy from SCF Domains down to individual regime mappings.
- **Dynamic Regime Comparison:** Select multiple compliance frameworks (NIST CSF, ISO 27001, GDPR, etc.) and see them color-coded in real-time.
- **Adjustable Hierarchy:** Reorder hierarchy fields (PPTDF, Domain, NIST Timing, etc.) to customize the visual depth and grouping.
- **Smart Navigation:** 
  - **Mouse-Driven:** Fluid zoom (mouse wheel) and pan (drag) interactions.
  - **Treeselect Navigator:** Syncronized hierarchy navigator for precision jumping, now located in the right sidebar.
  - **Collapsible Sidebars:** Toggle sidebars to maximize visualization space.
- **Theme Support:** Switch between Dark, Light, and System themes.
- **Anti-Collision Labeling:** Container labels are top-anchored to prevent visual stacking, with a high-contrast shadow for readability.
- **Detail Extraction:** Interactive slide-out panel showing full control descriptions, impact weights, and cross-regime linkages.
- **Unified Labeled Filtering:** Advanced filtering that automatically groups tags by label (e.g., `Relationship:`, `Type:`, `Level:`). Features strict OR logic within groups and recursive visibility that hides empty parent containers.
- **Persistent State:** Your selected regimes, hierarchy order, theme, and navigation focus are saved via `localStorage`.

## 🛠️ Technology Stack

- **D3.js (v7):** Core visualization engine for circle packing and transitions.
- **Tailwind CSS:** Modern, responsive UI/UX framework.
- **Treeselect.js:** Hierarchical selection and navigation.
- **HTML5/ES6 Modules:** Pure client-side implementation (no backend required) built with modern ES modules.

## 📂 Project Structure

- `index.html`: The main visual application (HTML/CSS/JS).
- `app.js`: Main application entry point and orchestrator.
- `framework_processor.js`: Client-side engine that parses CSV data into the visual-ready hierarchy.
- `framework_configs.js`: Configuration for loaded frameworks (SCF, CRI).
- `viz_engine.js`: Core D3 rendering engine.
- `viz_utils.js`: Pure D3 mathematical transforms and metrics.
- `state_manager.js`: Centralized application state and persistence.
- `filter_logic.js`: Combined tag and mapping quality filtering predicates.
- `url_sync.js`: URL fragment state synchronization.
- `ui_components.js`: Shared UI logic (sidebars, breadcrumbs, toasts).
- `component_init.js`: Treeselect and panel initialization logic.
- `PRD.md`: Product Requirements Document.
- `USER_GUIDE.md`: Detailed instructions for end-users.

## 🏃 Getting Started

Simply open `index.html` in any modern web browser. No installation or server setup is required.

---

*Part of the SCF Visualization Project.*
