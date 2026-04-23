(function (global, factory) {
    const api = factory();

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    global.SCFSizing = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    const SIZE_BY_WEIGHT = "weight";
    const SIZE_BY_UNIFORM = "uniform";
    const LEAF_WEIGHT_MULTIPLIER = 5;
    const MIN_LEAF_VALUE = 1;

    function getLeafSizeValue(data, currentSizeBy) {
        if (data.children && data.children.length > 0) {
            return 0;
        }

        if (currentSizeBy === SIZE_BY_UNIFORM) {
            return 1;
        }

        const numericWeight = Number(data.weight);
        if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
            return MIN_LEAF_VALUE;
        }

        return Math.max(numericWeight * LEAF_WEIGHT_MULTIPLIER, MIN_LEAF_VALUE);
    }

    function getControlSizeBudget(controlData, currentSizeBy) {
        return getLeafSizeValue(controlData, currentSizeBy);
    }

    function getVisibleMappingLeafCount(mappings, selectedRegimeIds) {
        return Object.entries(mappings || {}).reduce((count, [regimeId, identifiers]) => {
            const rid = Number.parseInt(regimeId, 10);
            if (!selectedRegimeIds.has(rid)) {
                return count;
            }

            return count + identifiers.length;
        }, 0);
    }

    function getMappedLeafValue(controlData, totalVisibleLeaves, currentSizeBy) {
        if (!Number.isFinite(totalVisibleLeaves) || totalVisibleLeaves <= 0) {
            return getControlSizeBudget(controlData, currentSizeBy);
        }

        return getControlSizeBudget(controlData, currentSizeBy) / totalVisibleLeaves;
    }

    return {
        LEAF_WEIGHT_MULTIPLIER,
        MIN_LEAF_VALUE,
        SIZE_BY_UNIFORM,
        SIZE_BY_WEIGHT,
        getControlSizeBudget,
        getLeafSizeValue,
        getMappedLeafValue,
        getVisibleMappingLeafCount
    };
});
