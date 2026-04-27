# **Product Requirements Document (PRD): SCF Circle Packing Relationship Visualizer**

**Version:** 1.0

**Status:** Draft

**Owner:** Drew (Lead Engineer) / Product Management

## **1\. Executive Summary**

The **SCF Zoomable Circle Packing Relationship Visualizer** is an interactive, browser-based tool designed to simplify the complexity of the Secure Controls Foundation (SCF) 2025.4 dataset. By representing controls as a zoomable circle packing chart, GRC professionals can intuitively understand the density, weighting, and cross-regime applicability of their security controls.

## **2\. Goals & Objectives**

* **Visualize Complexity:** Transform 1,000+ rows of spreadsheet data into a digestible visual topology.  
* **Multi-Dimensional Analysis:** Allow users to view controls and compare different compliange regimes or framwords by using SCF as the common baseline.  The viz will be nested by PPTDF and SCF Domain so that all controls mapped to the same SCF control group will be grouped togehter.  
* **Identify High-Impact Areas:** Use "Relative Control Weighting" to drive the visual scale of circles.  
* **Gap Analysis:** Highlight applicability for multiple selected compliance regimes (e.g., NIST CSF 2.0, ISO 27001, EU DORA) using distinct color coding.
* **Simplified Navigation:** Provide a unified "Source of Truth" through an interactive hierarchy sidebar.

## **3\. Target Audience**

* **CISOs:** High-level overview of security program health and weighting.  
* **Compliance Managers:** Mapping controls to specific regulatory frameworks.  
* **Security Architects:** Understanding the balance between People, Process, and Technology (PPTDF).

## **4\. Functional Requirements**

### **4.1 Data Processing**

* **Requirement:** The system must process SCF 2025.4 CSV data client-side, using `scf_processor.js` to handle Control IDs, Domains, Descriptions, Weighting, and Functional Groupings.
* **Requirement:** Support direct CSV loading to ensure easy updates and high performance without a backend.
* **Requirement:** Use client-side caching to ensure quick calculation of bubble positions and hierarchy transitions.

### **4.2 Circle Packing Visualization Engine**

* **Requirement:** Render nested, translucent circles representing hierarchical groups. Use teh example at https://d3og.com/mbostock/7607535/ as a starting point.
* **Requirement:** Implement a "Packing" algorithm to ensure children are contained within parents.  
* **Requirement:** Smooth user controled Zooming  for navigating the the diagram.

### **4.3 Structured Hierarchy (Nesting)**

* **Requirement:** Provide an **Adjustable Hierarchy** where users can reorder fields (e.g., Domain, PPTDF, NIST Timing) to redefine the visual nesting depth.
* **Requirement:** Organize controls under a dynamic n-level hierarchy based on user selection.
* **Requirement:** Option to hide SCF controls with no displayed mappings via the "Show Unmapped" toggle.

### **4.4 Regime Management**
* **Requirement:** User can search and check off multiple regimes from a searchable list (defaults to NIST CSF 2.0, EU DORA, and India SEBI CSCRF).
* **Requirement:** Selected regimes are persistently stored in `localStorage` for session continuity.
* **Requirement:** Selected regimes have visually distinct colors (Tableau10 palette) used across the Chart, Legend, and Sidebar.
* **Requirement:** Real-time legend displays the active regimes and their corresponding colors.


### **4.5 Search & Navigation**
* **Requirement:** **Collapsible Sidebars:** Both left (Regimes/Hierarchy) and right (Navigator/Details) sidebars are collapsible via handle toggles to maximize visualization area.
* **Requirement:** **Hierarchy Navigator:** A sidebar treeselect that remains synced with the chart focus. Selecting a node in the treeselect zooms the chart; zooming in the chart updates the treeselect.
* **Requirement:** **Mouse-Driven Interaction:** Support intuitive mouse wheel zooming and drag-panning for fluid exploration.
* **Requirement:** **Labeling Strategy:** 
    - **Anti-Collision:** Container labels are top-anchored to prevent center stacking.
    - **Dynamic Visibility:** Labels are locked to a 2-level depth relative to focus for visual clarity.
    - **Hover Pop:** Individual labels enlarge significantly (28px Bold) on hover for instant inspection.
* **Requirement:** **Detail Panel:** Slide-out drawer displaying full descriptions, impact weights, and regime mappings with color-coded linkages.

## **4.6 Framework Switching (NEW)**

* **Requirement:** A persistent **Framework Selector** (e.g., segmented toggle in the left sidebar header) allows users to switch between **SCF 2026.1** and **CRI Profile v2.1** as the active data source. The active framework is driven by its YAML config (`configs/scf.yaml` / `configs/cri.yaml`).
* **Requirement:** On switch, the visualization re-renders using the new framework's schema — hierarchy (domain → category → subcategory), control IDs, descriptions, weights, and available regime columns — all sourced from the YAML `schema` mapping, not hard-coded column names.
* **Requirement:** The regime selector list repopulates from the newly loaded dataset's available mapping columns. Previously selected regimes that do not exist in the new framework are silently dropped; any that do exist are preserved.
* **Requirement:** The active framework selection is persisted to `localStorage` so it survives page reload.
* **Requirement:** A framework badge (name from YAML `name` field) is visible in the chart area at all times so users always know which dataset is active.

## **4.7 Tag-Based Filtering (NEW)**

* **Requirement:** A **Tag Filter Panel** is available within the left sidebar, below the regime selector. It renders the distinct tag values from the active framework's `tag_cols` (defined in YAML) as a multi-select checklist.
* **Requirement:** For CRI, two tag groups are shown: **Subject Tags** (107 hashtag-style values, e.g. `#architecture`) and **Tier Tags** (Tier 1–4). For SCF, one tag group is shown: **SCRM Tier Tags** (TIER 1 STRATEGIC / TIER 2 OPERATIONAL / TIER 3 TACTICAL).
* **Requirement:** When one or more tags are selected, only controls whose tag columns contain at least one of the selected tags are **included** in the viz; all others are dimmed (opacity reduced) but not removed, preserving hierarchy context.
* **Requirement:** A **"Clear Tags"** action resets all tag filters to show all controls.
* **Requirement:** The Tag Filter Panel includes a search/filter input so users can find specific tag values without scrolling the full list (critical for CRI's 107-tag subject list).
* **Requirement:** Active tag filter state is persisted to `localStorage` alongside framework and regime selection.
* **Requirement:** When the framework switches, tag filter state is cleared and the panel repopulates with the new framework's tags.

## **5\. User Stories**

| ID | Persona | Requirement | Value |
| :---- | :---- | :---- | :---- |
| **US.1** | CISO | I want to see which domains have the highest "Control Weighting" | To prioritize resources toward high-impact security areas. |
| **US.2** | Auditor | I want to highlight only NIST 800-53 controls in the circle packing view | To visualize the footprint of my FedRAMP compliance program. |
| **US.3** | Architect | I want to group controls by PPTDF (People, Process, Tech) | To identify if my security program is over-reliant on technology vs. process. |
| **US.4** | Manager | I want to click a specific control bubble | To read its full description and understand its relationship to other controls. |
| **US.5** | User | I want to search for "Encryption" | To immediately find and zoom into all data protection related controls. |
| **US.6** | Compliance Manager | I want to switch from SCF to CRI Profile v2.1 with one click | To view my controls mapped to financial-sector-specific regimes (FFIEC, NYDFS, MAS) instead of the SCF baseline. |
| **US.7** | Risk Officer | I want to filter CRI controls to only "Tier 1" and "Tier 2" controls | To quickly see which foundational controls my program must prioritize for baseline compliance. |
| **US.8** | Security Architect | I want to filter SCF controls by SCRM TIER 1 STRATEGIC tag | To isolate the supply-chain controls relevant to my enterprise risk program. |
| **US.9** | CRI Analyst | I want to filter by subject tag `#authentication` | To see every CRI control related to authentication and understand its regime coverage in one view. |
| **US.10** | User | I want my framework choice and active tag filters to persist across sessions | So I don't have to re-configure the view every time I open the tool. |

## **6\. Technical Constraints & Standards**

* **Engine:** Browser-based D3.js v7 (Pure client-side rendering with `scf_processor.js`).
* **Styling:** Tailwind CSS for layout; Vanilla CSS for glassmorphism and custom animation effects.
* **Themes:** Full support for **Dark Mode**, **Light Mode**, and **System Sync**.
* **Persistence:** `localStorage` for regime selection, theme preference, and UI state.
* **Accessibility:** High-contrast text shadows for all labels; distinct Tableau10 colors for regimes; high-visibility focus states.

## **7\. Success Metrics**

* **Time to Insight:** A user should be able to identify the most "weighted" domain in under 5 seconds.  
* **Discovery:** A user should find a specific control via search in under 3 seconds.  
* **Engagement:** Successful rendering of 100% of mapped compliance regimes from the SCF dataset.