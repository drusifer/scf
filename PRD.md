# **Product Requirements Document (PRD): SCF Circle Packing Relationship Visualizer**

**Version:** 1.0

**Status:** Draft

**Owner:** Drew (Lead Engineer) / Product Management

## **1\. Executive Summary**

The **SCF Zoomable Circle Packing Relationship Visualizer** is an interactive, browser-based tool designed to simplify the complexity of the Secure Controls Foundation (SCF) 2025.4 dataset. By representing controls as a zoomable circle packing chart, GRC professionals can intuitively understand the density, weighting, and cross-regime applicability of their security controls.

## **2\. Goals & Objectives**

* **Visualize Complexity:** Transform 1,000+ rows of spreadsheet data into a digestible visual topology.  
* **Multi-Dimensional Analysis:** Allow users to view controls and compare different compliange regimes or framwords by using SCF as the common baseline.  The viz will be nested by PPTDF and SCF Domain so that all controls mapped to the same SCF control group will be grouped togehter.  
* **Identify High-Impact Areas:** Use "Relative Control Weighting" to drive visual scale.  
* **Gap Analysis:** Highlight applicability for selected compliance regimes (e.g., NIST 800-53, ISO 27001).

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

* **Requirement:** Show regime controls grouped togeher with the simialr controls from other regimes.  Use SCF mappings for accuracy and organize controls under teh following Hierarchy:
  * **SCF Domain:** High-level security categories.  
    *  **PPTDF:** People Process etc..
      * **SCF Control:** The scf control name/id
        *  **Regime name or framework name**: the name of the frame work or regulation that has controls mapped to this SCF control
          * **Regime specific control identifier** : 1 per frame work control (if multiple then devide the space evenly)
* **Requirement:** Option to hide SCF controls with no displayed mappings

### ** Catalog **
* **Requirement:** Show a catalog of all regimes Opposite the details display.
* **Requirement:** User can search and checkoff multiple frameworks that they want to see in the display (defaults to NIST-CSF-2.0).  Select / deselct automatically updates the display.
* **Requirement:** Selected regimes have visually distinct colors for all their displayed circles.
* **Requirement:** The selected Regimes are always displayed at the top of the selection list with an indication of what color they are presented as.


### **4.4 Search & Inspection**
* **Requirement:** Navigation via sidebar menu with heircahy matching the circle pack chart.  Selecting in this menu zooms directly to that node in the buble graph and selecting in the chart navigates the sidebar meue to the selected node.
* **Requirement:** Navigation via sidebar Responsive to the selected node 
* **Requirement:** Real-time search to filter controls by ID, Domain, or keyword.  
* **Requirement:** "Detail Panel" displaying full control descriptions, scf domain descriptions, exact weighting, and all mapped control identiferies with the scf control that is selected

## **5\. User Stories**

| ID | Persona | Requirement | Value |
| :---- | :---- | :---- | :---- |
| **US.1** | CISO | I want to see which domains have the highest "Control Weighting" | To prioritize resources toward high-impact security areas. |
| **US.2** | Auditor | I want to highlight only NIST 800-53 controls in the circle packing view | To visualize the footprint of my FedRAMP compliance program. |
| **US.3** | Architect | I want to group controls by PPTDF (People, Process, Tech) | To identify if my security program is over-reliant on technology vs. process. |
| **US.4** | Manager | I want to click a specific control bubble | To read its full description and understand its relationship to other controls. |
| **US.5** | User | I want to search for "Encryption" | To immediately find and zoom into all data protection related controls. |

## **6\. Technical Constraints & Standards**

* **Engine:** Browser running D3 and other needed libs (client side no node components).  
* **Performance:** Must maintain 60 FPS for up to 2,000 nodes using optimized geometries.  okay to use dodechahedrions if that helps with performance.
* **Styling:** Tailwind CSS for the HUD/UI overlay.  \
  * **Interaction:** click to (visually) zoom into a bubble and hide the non selected bubbles. 
  * **Labels:** are wrapped around the bubbles so they don't overlap with eachother.  only the highest level of labels is visisble.  hover on bubble causes label to gradually rotate around the bubble until I zoom (click) or stop hovering.
* **Accessibility:** Provide visual feedback for hover states; ensure high-contrast UI for text overlays.

## **7\. Success Metrics**

* **Time to Insight:** A user should be able to identify the most "weighted" domain in under 5 seconds.  
* **Discovery:** A user should find a specific control via search in under 3 seconds.  
* **Engagement:** Successful rendering of 100% of mapped compliance regimes from the SCF dataset.