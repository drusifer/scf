export const SCFReadingMode = (() => {
    const MIN_LABEL_FONT_SIZE = 12;
    const FOCUS_LABEL_FONT_SIZE = 22;

    const getGrandchildQuota = (focusProjectedRadius) => {
        if (focusProjectedRadius > 180) return 4;
        if (focusProjectedRadius > 120) return 2;
        return 0;
    };

    return {
        MIN_LABEL_FONT_SIZE,
        FOCUS_LABEL_FONT_SIZE,
        getGrandchildQuota,

        getLabelDensityTier(metrics) {
            const { nodeDepth, focusDepth } = metrics;
            const depthDiff = nodeDepth - focusDepth;
            if (depthDiff === 0) return "focus";
            if (depthDiff === 1) return "child";
            if (depthDiff === 2) return "grandchild";
            return "off";
        },

        getLabelEligibility(metrics) {
            const tier = this.getLabelDensityTier(metrics);
            const { projectedRadius, siblingIndex, focusProjectedRadius } = metrics;

            if (tier === "focus") return true;
            if (tier === "child") return projectedRadius > 20;
            if (tier === "grandchild") {
                const quota = getGrandchildQuota(focusProjectedRadius);
                return projectedRadius > 25 && siblingIndex < quota;
            }
            return false;
        },

        getLabelFontSize(metrics) {
            const tier = this.getLabelDensityTier(metrics);
            if (tier === "focus") return FOCUS_LABEL_FONT_SIZE;
            if (tier === "child" || tier === "grandchild") return MIN_LABEL_FONT_SIZE;
            return 0;
        }
    };
})();
