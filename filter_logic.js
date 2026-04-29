/**
 * Unified Polymorphic Filtering System.
 * All domain-specific matching and filter-parsing logic is encapsulated within derived types.
 */

class NodeMatcher {
    /**
     * @param {Set<string>} activeFilters - The raw set of all active filter strings.
     */
    constructor(activeFilters) {
        this.activeFilters = activeFilters;
    }

    /** @returns {boolean} True if this matcher applies to the given node. */
    appliesTo(d) { return false; }

    /** @returns {boolean} True if the node passes this matcher's criteria. */
    matches(d) { return true; }
}

/**
 * Encapsulates matching logic for global Control tags.
 * Handles "Other:" labeled filters and simple tag matching.
 */
class ControlTagMatcher extends NodeMatcher {
    constructor(activeFilters) {
        super(activeFilters);
        // Identify which filters this specific matcher cares about
        this.relevantFilters = Array.from(activeFilters).map(f => {
            if (f.startsWith("Subject Area: ")) return { isOther: true, val: f.substring(14) };
            if (!f.includes(":")) return { isOther: true, val: f };
            return null;
        }).filter(f => f && f.isOther).map(f => f.val);
    }

    appliesTo(d) {
        return d.data.nodeType === "control";
    }

    matches(d) {
        if (this.relevantFilters.length === 0) return true;
        const nodeTags = d.data.tags || [];
        // Match if ANY of the control's tags are in our relevant filter set
        return nodeTags.some(tag => this.relevantFilters.includes(tag));
    }
}

/**
 * Encapsulates matching logic for Mapping Metadata (Depth 6).
 * Handles labeled filters like "Relationship:", "Type:", "Level:".
 */
class MappingMetadataMatcher extends NodeMatcher {
    constructor(activeFilters) {
        super(activeFilters);
        // Parse raw filters into a local map for efficient metadata matching
        this.filterMap = new Map();
        activeFilters.forEach(f => {
            if (!f.includes(":")) return;
            const parts = f.split(":");
            const label = parts[0].trim() + ":";
            if (label === "Subject Area:") return;
            const value = parts.slice(1).join(":").trim();
            if (!this.filterMap.has(label)) this.filterMap.set(label, new Set());
            this.filterMap.get(label).add(value);
        });
    }

    appliesTo(d) {
        return d.data.nodeType === "mapping";
    }

    matches(d) {
        if (this.filterMap.size === 0) return true;

        const mappingId = d.data.name;
        const regimeGroupNode = d.parent;
        const controlNode = regimeGroupNode?.parent;
        const regimeId = regimeGroupNode?.data?.regimeId;
        
        const rawTags = controlNode?.data?.regimeQualityTags?.[regimeId]?.[mappingId];
        if (!rawTags) return false;

        // Parse node's metadata segments
        const segments = rawTags.split(";").map(s => s.trim()).filter(Boolean);
        
        // Match if ANY segment matches one of our active labeled filters (Global OR behavior)
        return segments.some(seg => {
            if (!seg.includes(":")) return false;
            const parts = seg.split(":");
            const label = parts[0].trim() + ":";
            const value = parts.slice(1).join(":").trim();
            
            const allowedValues = this.filterMap.get(label);
            return allowedValues && allowedValues.has(value);
        });
    }
}

/**
 * Orchestrates multiple matchers and performs recursive visibility calculation.
 * Pure orchestrator: unaware of specific tag or metadata formats.
 */
class FilterEvaluator {
    constructor(activeFilters) {
        this.matchers = [
            new ControlTagMatcher(activeFilters),
            new MappingMetadataMatcher(activeFilters)
        ];
    }

    evaluate(root) {
        const potentialMatchMap = new Map();
        
        // Pass 1: Bottom-Up (Identify potential visibility)
        root.eachAfter(d => {
            const applicableMatchers = this.matchers.filter(m => m.appliesTo(d));
            const passesSelf = applicableMatchers.length === 0 || applicableMatchers.some(m => m.matches(d));

            if (d.children) {
                const anyChildPotential = d.children.some(c => potentialMatchMap.get(c));
                potentialMatchMap.set(d, passesSelf && anyChildPotential);
            } else {
                potentialMatchMap.set(d, passesSelf);
            }
        });

        // Pass 2: Top-Down (Cascade final visibility)
        const finalMatchMap = new Map();
        root.each(d => {
            if (d.depth === 0) {
                finalMatchMap.set(d, true); 
                return;
            }
            const parentVisible = finalMatchMap.get(d.parent);
            const isPotential = potentialMatchMap.get(d) || false;
            finalMatchMap.set(d, parentVisible && isPotential);
        });

        return finalMatchMap;
    }
}

export const FilterLogic = {
    calculateMatchMap(root, tagGroupMap, activeTagFilters, mappingQualityRegimeId, activeMappingQualityFilters) {
        const allActiveFilters = new Set([...activeTagFilters, ...activeMappingQualityFilters]);
        if (allActiveFilters.size === 0) return null;

        const evaluator = new FilterEvaluator(allActiveFilters);
        return evaluator.evaluate(root);
    },

    getFilteredVisibility(d, matchMap) {
        if (!matchMap) return "visible";
        return matchMap.get(d) ? "visible" : "hidden";
    }
};
