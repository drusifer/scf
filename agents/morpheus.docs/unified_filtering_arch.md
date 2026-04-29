# Unified Filtering Architecture

**Last Updated:** 2026-04-27
**Architect:** Morpheus

## Overview

The filtering system in the SCF Visualizer uses a **Unified Matcher Pattern** to decouple predicate logic from the recursive tree traversal. This allows the visualization to filter complex, multi-layered data (Tags, Tiers, Mapping Relationships) while maintaining a clean, orphaned-node-free visual hierarchy.

## Core Components

### 1. Matchers
A Matcher is a specialized object that encapsulates the filtering logic for a specific node type.
- **`TagMatcher`**: Matches controls based on global tags.
- **`MappingTagMatcher`**: Matches individual mappings (depth 6) based on metadata parsed from the CRI mapping columns (Relationship, Type, etc.).

Every Matcher implements:
- `appliesTo(node)`: Determines if the matcher should evaluate this specific node.
- `matches(node)`: Returns `true` if the node meets the filter criteria (strict OR logic).

### 2. FilterEvaluator
The orchestrator that executes the filtering across the D3 hierarchy using a **two-pass traversal**:
- **Pass 1 (Bottom-Up / `eachAfter`)**: Bubbles up "Potential Visibility". A node is potential if it passes all applicable matchers AND (if a container) has at least one potential child.
- **Pass 2 (Top-Down / `each`)**: Cascades final visibility. A node is visible only if it is potential AND its parent is also visible. This prevents "orphaned" nodes (e.g., a regime group appearing without its parent control).

## Data Structure: CRI Labeled Tags

To support granular filtering, the CRI mapping data is refactored from a flat string into a nested mapping during the processing phase:
```json
{
  "regimeId": {
    "targetControlId": "Relationship: Intersects; Type: Full; Level: Advanced"
  }
}
```
The `MappingTagMatcher` splits these strings by `;` and then by `:` to perform precise matching against the unified active filter set.

## Scalability

New filters (e.g., Risk Score, Weight Range) can be added by:
1. Creating a new Matcher class in `filter_logic.js`.
2. Pushing the new matcher into the evaluator list in `FilterLogic.calculateMatchMap`.

---
*TL;DR: Unified filtering uses a two-pass Matcher Pattern to recursively hide empty containers and prevent orphaned nodes.*
