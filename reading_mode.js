(function (global, factory) {
    const api = factory();

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    global.SCFReadingMode = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    const MIN_LABEL_FONT_SIZE = 12;
    const FOCUS_LABEL_FONT_SIZE = 18;
    const CHILD_LABEL_MAX_FONT_SIZE = 16;
    const GRANDCHILD_LABEL_MAX_FONT_SIZE = 13;
    const GRANDCHILD_MIN_PROJECTED_RADIUS = 24;
    const GRANDCHILD_DENSITY_DIVISOR = 48;

    function clamp(value, minimum, maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }

    function getRelativeDepth(nodeDepth, focusDepth) {
        return nodeDepth - focusDepth;
    }

    function getGrandchildQuota(focusProjectedRadius) {
        if (!Number.isFinite(focusProjectedRadius) || focusProjectedRadius <= 0) {
            return 0;
        }

        return Math.max(0, Math.floor(focusProjectedRadius / GRANDCHILD_DENSITY_DIVISOR));
    }

    function getLabelDensityTier({
        nodeDepth,
        focusDepth,
        projectedRadius,
        siblingIndex = 0,
        focusProjectedRadius = 0
    }) {
        const relativeDepth = getRelativeDepth(nodeDepth, focusDepth);

        if (relativeDepth < 0 || relativeDepth > 2) {
            return "hidden";
        }

        if (relativeDepth === 0) {
            return "focus";
        }

        if (relativeDepth === 1) {
            return "child";
        }

        const grandchildQuota = getGrandchildQuota(focusProjectedRadius);
        if (projectedRadius < GRANDCHILD_MIN_PROJECTED_RADIUS || siblingIndex >= grandchildQuota) {
            return "hidden";
        }

        return "grandchild";
    }

    function getLabelEligibility(metrics) {
        return getLabelDensityTier(metrics) !== "hidden";
    }

    function getLabelFontSize(metrics) {
        const tier = getLabelDensityTier(metrics);

        if (tier === "focus") {
            return FOCUS_LABEL_FONT_SIZE;
        }

        if (tier === "child") {
            return clamp(metrics.projectedRadius * 0.32, MIN_LABEL_FONT_SIZE, CHILD_LABEL_MAX_FONT_SIZE);
        }

        if (tier === "grandchild") {
            return clamp(metrics.projectedRadius * 0.28, MIN_LABEL_FONT_SIZE, GRANDCHILD_LABEL_MAX_FONT_SIZE);
        }

        return 0;
    }

    return {
        CHILD_LABEL_MAX_FONT_SIZE,
        FOCUS_LABEL_FONT_SIZE,
        GRANDCHILD_DENSITY_DIVISOR,
        GRANDCHILD_LABEL_MAX_FONT_SIZE,
        GRANDCHILD_MIN_PROJECTED_RADIUS,
        MIN_LABEL_FONT_SIZE,
        getGrandchildQuota,
        getLabelDensityTier,
        getLabelEligibility,
        getLabelFontSize,
        getRelativeDepth
    };
});
