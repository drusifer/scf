# **Product Requirements Document (PRD): SCF 3D Relationship Visualizer**

**Version:** 1.0

**Status:** Draft

**Owner:** Drew (Lead Engineer) / Product Management

## **1\. Executive Summary**

The **SCF 3D Relationship Visualizer** is an interactive, browser-based tool designed to simplify the complexity of the Secure Controls Foundation (SCF) 2025.4 dataset. By representing controls as a 3D hierarchical bubble chart, GRC professionals can intuitively understand the density, weighting, and cross-regime applicability of their security controls.

## **2\. Goals & Objectives**

* **Visualize Complexity:** Transform 1,000+ rows of spreadsheet data into a digestible 3D topology.  
* **Multi-Dimensional Analysis:** Allow users to view controls through different lenses (Domain, PPTDF, NIST CSF).  
* **Identify High-Impact Areas:** Use "Relative Control Weighting" to drive visual scale.  
* **Gap Analysis:** Highlight applicability for specific compliance regimes (e.g., NIST 800-53, ISO 27001).

## **3\. Target Audience**

* **CISOs:** High-level overview of security program health and weighting.  
* **Compliance Managers:** Mapping controls to specific regulatory frameworks.  
* **Security Architects:** Understanding the balance between People, Process, and Technology (PPTDF).

## **4\. Functional Requirements**

### **4.1 Data Processing**

* **Requirement:** The system must process SCF 2025.4 CSV data, focusing on Control IDs, Domains, Descriptions, Weighting (1-15 scale), and Functional Groupings.  
* **Requirement:** Support static data imports to ensure zero-latency performance and offline availability.

### **4.2 3D Visualization Engine**

* **Requirement:** Render nested, translucent bubbles representing hierarchical groups.  
* **Requirement:** Implement a "Packing" algorithm (D3-Hierarchy) to ensure children are contained within parents.  
* **Requirement:** Smooth camera controls (Orbit, Pan, Zoom) for navigating the 3D space.

### **4.3 Dynamic Hierarchy (Nesting)**

* **Requirement:** Users must be able to toggle the primary grouping between:  
  * **SCF Domain:** High-level security categories.  
  * **PPTDF:** People, Process, Technology, Data, and Facility.  
  * **NIST CSF:** Functional areas (Identify, Protect, Detect, Respond, Recover).

### **4.4 Search & Inspection**

* **Requirement:** Real-time search to filter controls by ID, Domain, or keyword.  
* **Requirement:** "Detail Panel" displaying full control descriptions, exact weighting, and all applicable regimes upon selection.

## **5\. User Stories**

| ID | Persona | Requirement | Value |
| :---- | :---- | :---- | :---- |
| **US.1** | CISO | I want to see which domains have the highest "Control Weighting" | To prioritize resources toward high-impact security areas. |
| **US.2** | Auditor | I want to highlight only NIST 800-53 controls in the 3D view | To visualize the footprint of my FedRAMP compliance program. |
| **US.3** | Architect | I want to group controls by PPTDF (People, Process, Tech) | To identify if my security program is over-reliant on technology vs. process. |
| **US.4** | Manager | I want to click a specific control bubble | To read its full description and understand its relationship to other controls. |
| **US.5** | User | I want to search for "Encryption" | To immediately find and zoom into all data protection related controls. |

## **6\. Technical Constraints & Standards**

* **Engine:** React \+ Three.js (React Three Fiber).  
* **Performance:** Must maintain 60 FPS for up to 2,000 nodes using optimized geometries.  
* **Styling:** Tailwind CSS for the HUD/UI overlay.  
* **Accessibility:** Provide visual feedback for hover states; ensure high-contrast UI for text overlays.

## **7\. Success Metrics**

* **Time to Insight:** A user should be able to identify the most "weighted" domain in under 5 seconds.  
* **Discovery:** A user should find a specific control via search in under 3 seconds.  
* **Engagement:** Successful rendering of 100% of mapped compliance regimes from the SCF dataset.