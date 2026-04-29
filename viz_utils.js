/**
 * Pure utility functions for D3 visualization transforms and metrics.
 */
export const VizUtils = {
    getNodeKey: (d) => d.ancestors().map((currentNode) => currentNode.data.name).reverse().join(" > "),
    
    getProjectedScale: (width, targetView) => width / targetView[2],
    
    getProjectedRadius: (radius, width, targetView) => radius * (width / targetView[2]),
    
    getTargetView: (targetNode) => [targetNode.x, targetNode.y, targetNode.r * 2],
    
    getProjectedTransform: (x, y, width, targetView, yOffset = 0) => {
        const k = width / targetView[2];
        return `translate(${(x - targetView[0]) * k},${(y - targetView[1]) * k + yOffset})`;
    },

    getLabelMetrics: (d, currentFocus, width, targetView) => {
        const siblingIndex = d.parent?.children ? d.parent.children.indexOf(d) : 0;
        const k = width / targetView[2];
        return {
            nodeDepth: d.depth,
            focusDepth: currentFocus.depth,
            projectedRadius: d.r * k,
            siblingIndex,
            focusProjectedRadius: currentFocus.r * k
        };
    },

    getLabelOffset: (d, radius, currentFocus) => {
        const depthDiff = d.depth - (currentFocus?.depth || 0);
        // Only top-anchor the Focus node (Header) to keep center clear for primary children
        if (depthDiff === 0 && d.children && d.children.length > 0) {
            return -radius * 0.9;
        }
        return 0;
    }
};
