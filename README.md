# SCF Circle Packing Relationship Visualizer

A sophisticated, browser-based GRC visualization tool for the **Secure Controls Foundation (SCF) 2025.4** dataset. This tool transforms complex control mappings into an intuitive, zoomable circle packing diagram, allowing compliance professionals to visualize the density, weighting, and cross-framework applicability of their security controls.

## 🚀 Features

- **Interactive Circle Packing:** Navigate a 6-level hierarchy from SCF Domains down to individual regime mappings.
- **Dynamic Regime Comparison:** Select multiple compliance frameworks (NIST CSF, ISO 27001, GDPR, etc.) and see them color-coded in real-time.
- **Smart Navigation:** 
  - **Mouse-Driven:** Fluid zoom (mouse wheel) and pan (drag) interactions.
  - **Treeselect Sidebar:** Deeply synced hierarchy navigator for precision jumping.
- **Anti-Collision Labeling:** Container labels are top-anchored to prevent visual stacking, with a high-contrast shadow for readability.
- **Detail Extraction:** Interactive slide-out panel showing full control descriptions, impact weights, and cross-regime linkages.
- **Persistent State:** Your selected regimes and navigation focus are saved via `localStorage`.

## 🛠️ Technology Stack

- **D3.js (v7):** Core visualization engine for circle packing and transitions.
- **Tailwind CSS:** Modern, responsive UI/UX framework.
- **Treeselect.js:** Hierarchical selection and navigation.
- **HTML5/ES6:** Pure client-side implementation (no backend required).

## 📂 Project Structure

- `index.html`: The main visual application (HTML/CSS/JS).
- `scf_data.js`: The processed SCF hierarchy data.
- `process_data.py`: (Internal) Python script used to transform SCF CSV data into the visual-ready JSON format.
- `PRD.md`: Product Requirements Document.
- `USER_GUIDE.md`: Detailed instructions for end-users.

## 🏃 Getting Started

Simply open `index.html` in any modern web browser. No installation or server setup is required.

---

*Part of the SCF Visualization Project.*
