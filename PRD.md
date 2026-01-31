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

* **Requirement:** The system must process SCF 2025.4 CSV data, focusing on Control IDs, Domains, Descriptions, Weighting (1-15 scale), and Functional Groupings.  
* **Requirement:** Support static data imports to ensure zero-latency performance and offline availability.
* **Requirement:** use memoization/caching to ensure quick calcuation of bubble positions

### **4.2 Circle Packing Visualization Engine**

* **Requirement:** Render nested, translucent circles representing hierarchical groups. Use teh example at https://d3og.com/mbostock/7607535/ as a starting point.
* **Requirement:** Implement a "Packing" algorithm to ensure children are contained within parents.  
* **Requirement:** Smooth user controled Zooming  for navigating the the diagram.

### **4.3 Structured Hierarchy (Nesting)**

* **Requirement:** Show regime controls grouped together with similar controls from other regimes. Use SCF mappings for accuracy and organize controls under the following 6-level Hierarchy:
  * **Level 1: SCF Domain:** High-level security categories (e.g., Identification & Authentication).  
  * **Level 2: PPTDF:** People, Process, Technology, Data, Facility (Strategic categorization).
  * **Level 3: Functional Grouping:** Broad control functions (e.g., AC: Access Control).
  * **Level 4: SCF Control:** Specific SCF control name/ID (e.g., IAC-01).
  * **Level 5: Regime Group:** Grouping of mappings by regime name (e.g., "ISO 27001").
  * **Level 6: Mapping Node:** Individual regime-specific control identifiers.
* **Requirement:** Option to hide SCF controls with no displayed mappings

### **4.4 Regime Management**
* **Requirement:** User can search and check off multiple regimes from a searchable list (defaults to NIST CSF 2.0, EU DORA, and India SEBI CSCRF).
* **Requirement:** Selected regimes are persistently stored in `localStorage` for session continuity.
* **Requirement:** Selected regimes have visually distinct colors (Tableau10 palette) used across the Chart, Legend, and Sidebar.
* **Requirement:** Real-time legend displays the active regimes and their corresponding colors.


### **4.5 Search & Navigation**
* **Requirement:** **Hierarchy Navigator:** A sidebar treeselect that remains synced with the chart focus. Selecting a node in the treeselect zooms the chart; zooming in the chart updates the treeselect.
* **Requirement:** **Mouse-Driven Interaction:** Support intuitive mouse wheel zooming and drag-panning for fluid exploration.
* **Requirement:** **Labeling Strategy:** 
    - **Anti-Collision:** Container labels are top-anchored to prevent center stacking.
    - **Dynamic Visibility:** Labels are locked to a 2-level depth relative to focus for visual clarity.
    - **Hover Pop:** Individual labels enlarge significantly (28px Bold) on hover for instant inspection.
* **Requirement:** **Detail Panel:** Slide-out drawer displaying full descriptions, impact weights, and regime mappings with color-coded linkages.

## **5\. User Stories**

| ID | Persona | Requirement | Value |
| :---- | :---- | :---- | :---- |
| **US.1** | CISO | I want to see which domains have the highest "Control Weighting" | To prioritize resources toward high-impact security areas. |
| **US.2** | Auditor | I want to highlight only NIST 800-53 controls in the circle packing view | To visualize the footprint of my FedRAMP compliance program. |
| **US.3** | Architect | I want to group controls by PPTDF (People, Process, Tech) | To identify if my security program is over-reliant on technology vs. process. |
| **US.4** | Manager | I want to click a specific control bubble | To read its full description and understand its relationship to other controls. |
| **US.5** | User | I want to search for "Encryption" | To immediately find and zoom into all data protection related controls. |

## **6\. Technical Constraints & Standards**

* **Engine:** Browser-based D3.js v7 (Client-side rendering, no Node.js backend required).
* **Styling:** Tailwind CSS for layout; Vanilla CSS for glassmorphism and custom animation effects.
* **Persistence:** `localStorage` for regime selection and UI state.
* **Accessibility:** High-contrast text shadows for all labels; distinct Tableau10 colors for regimes; high-visibility focus states.

## **7\. Success Metrics**

* **Time to Insight:** A user should be able to identify the most "weighted" domain in under 5 seconds.  
* **Discovery:** A user should find a specific control via search in under 3 seconds.  
* **Engagement:** Successful rendering of 100% of mapped compliance regimes from the SCF dataset.