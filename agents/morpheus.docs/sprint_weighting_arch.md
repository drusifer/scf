# Architecture Plan: Relative Control Weighting Visualization

## Overview
This document outlines the technical changes required to support dynamic bubble sizing based on SCF control weighting, as defined in `agents/cypher.docs/sprint_weighting.md`.

## 1. State Management
- Introduce a global variable in `index.html` to track the current sizing metric.
  ```javascript
  let currentSizeBy = localStorage.getItem('sizeBy') || 'weight';
  ```

## 2. D3 Visualization Updates
- Update the `d3.pack().sum()` accessor in `updateVisualization()`.
  - **If `currentSizeBy === 'weight'`:** use `d.weight ? d.weight * 5 : 1` (the multiplier ensures visual distinction).
  - **If `currentSizeBy === 'uniform'`:** use `1` for all leaf nodes.
- Update the `d3.pack().sort()` accessor similarly to ensure deterministic layout based on the active metric.

## 3. UI Integration
- Add a new `<select>` element (or toggle) to the footer controls in `index.html`, next to the Theme selector.
- Bind the `onchange` event to a new function `setSizeBy(value)`.
- `setSizeBy(value)` will:
  1. Update `currentSizeBy`.
  2. Persist the value to `localStorage`.
  3. Call `updateVisualization()` to trigger the D3 transition.

## 4. Animation & Transitions
- Ensure that `updateVisualization()` handles transitions smoothly when the `.sum()` value changes, utilizing D3's `.transition().duration()` on the existing nodes rather than fully recreating the SVG if possible (though recreating is acceptable for Sprint 1 if standard transitions are complex).

## 5. Backward Compatibility
- `scf_processor.js` already extracts and parses `Relative Control Weighting` into `node.weight`. No changes to the data processor are required.
