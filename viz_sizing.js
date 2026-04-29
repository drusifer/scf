export const SCFSizing = (() => {
    const SIZE_BY_WEIGHT = "weight";
    const SIZE_BY_UNIFORM = "uniform";
    const SIZE_BY_AS = "alignment";
    const SIZE_BY_FCS = "functional";

    return {
        SIZE_BY_WEIGHT,
        SIZE_BY_UNIFORM,
        SIZE_BY_AS,
        SIZE_BY_FCS,

        getLeafSizeValue(d, currentSizeBy) {
            if (!d) return 0;
            if (currentSizeBy === SIZE_BY_UNIFORM) return 1;
            
            if (currentSizeBy === SIZE_BY_AS || currentSizeBy === SIZE_BY_FCS) {
                const label = currentSizeBy === SIZE_BY_AS ? "Alignment Strength:" : "Functional Coverage Strength:";
                
                // For mapping nodes, the qualityTag is passed down during filtering
                if (d.nodeType === "mapping" && d.qualityTag) {
                    const segments = d.qualityTag.split(";");
                    for (const seg of segments) {
                        if (seg.trim().startsWith(label)) {
                            const val = parseFloat(seg.split(":")[1]);
                            if (!isNaN(val)) return val;
                        }
                    }
                    // Default to 1 (uniform) if mapping exists but specific strength metric is missing
                    return 1.0;
                }
                
                // For unmapped controls or nodes without mapping data
                return 1.0;
            }

            return Number.parseFloat(d.weight) || 1.0;
        },

        // This method is now a thin wrapper for D3's hierarchy.sum
        getNodeValue(d, currentSizeBy) {
            return this.getLeafSizeValue(d, currentSizeBy);
        },

        getMappedLeafValue(nodeData, visibleMappingLeafCount, currentSizeBy) {
            if (currentSizeBy === SIZE_BY_UNIFORM) {
                return 1 / visibleMappingLeafCount;
            }
            const weight = Number.parseFloat(nodeData.weight) || 1.0;
            return weight / visibleMappingLeafCount;
        },

        getVisibleMappingLeafCount(mappings, selectedRegimeIds) {
            if (!mappings) return 0;
            let count = 0;
            for (const [regimeId, identifiers] of Object.entries(mappings)) {
                if (selectedRegimeIds.has(Number.parseInt(regimeId, 10))) {
                    count += identifiers.length;
                }
            }
            return count;
        }
    };
})();
