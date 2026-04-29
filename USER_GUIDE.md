# User Guide: SCF Circle Packing Visualizer

Welcome to the **SCF Visualizer**! This guide will help you navigate the complex world of security controls using our interactive circle packing tool.

## 🧭 Navigation Basics

### 1. Zooming & Panning
- **Zoom In/Out:** Use your **mouse wheel** or trackpad scroll gesture.
- **Pan/Move:** **Click and drag** the background or any circle to move the view.
- **Focus Zoom:** **Click** on any circle to zoom directly into that category or control.
- **Toggle Sidebars:** Click the **◀ / ▶ handles** on the center-edges of the screen to collapse or expand the left and right sidebars.
- **Reset View:** Click the background or the root node (e.g., "SCF 2026.1" or "CRI Profile v2.1") to reset the visualization.

### 2. Labels & Interaction
- **Hover:** Move your mouse over a circle to **enlarge** its label (28px Bold) and see its border highlight.
- **Top Labels:** Notice that group titles (like "Identify") stay at the top of their circles. This is to keep the center clear for child elements.
- **Detail Panel:** Click any **Control Circle** (the ones with IDs like IAC-01) to open a slide-out panel on the right with full details.

## 📂 Sidebar Controls

### 📦 Control Hierarchy (Navigator)
The hierarchy navigator (located in the **Right Sidebar**) lets you search or jump directly to any part of the SCF.
- Selecting a node in the tree will zoom the chart to that location.
- As you zoom in the chart, this tree will automatically update to show your current location.

### 🏗️ Hierarchy Fields
Located in the **Left Sidebar**, this section allows you to define the depth of the visualization.
- **Reorder Fields:** Drag or select fields like "PPTDF Applicability" or "SCF Domain" to change how controls are grouped.
- **Dynamic Grouping:** The visualization updates immediately to reflect your chosen hierarchy.

### 🏷️ Tag Filters
Customize the visualization by filtering for specific control attributes.
- **Labeled Groups:** Tags are automatically grouped by their label (e.g., **RELATIONSHIP:**, **TYPE:**).
- **Strict Filtering:** Selecting a value (like "Full") will hide all nodes that do not match that specific criteria.
- **Recursive Hiding:** If a Domain or Category has no matching controls after filtering, it is hidden entirely from the view to keep the workspace clean.

### 🛡️ Compliance Regimes
Choose which frameworks you want to visualize.
- **Search:** Type in the box to find frameworks like "ISO", "GDPR", or "SOC2".
- **Color Coding:** Each selected regime is assigned a unique color, shown in the **Legend** at the bottom right.
- **Persistence:** The tool remembers your selections even after you refresh the page.

## 💡 Pro Tips

- **Themes:** Use the dropdown in the bottom-left footer to switch between **Dark**, **Light**, or **System** themes.
- **Unmapped Controls:** In the left footer, toggle **"Show Unmapped"** to hide controls that don't have mappings for your selected regimes.
- **Breadcrumbs:** Use the path at the top left to track your location in the hierarchy.
- **Detail Panel:** Click any control bubble to see full data in the **Right Sidebar**.

---

*For technical support, please refer to the README.md or the Product Requirements Document.*
