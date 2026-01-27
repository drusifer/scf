import { create } from 'zustand'

export const useAppStore = create((set) => ({
    data: [], // Changed from controls to data to match component usage
    loadData: async () => {
        try {
            const response = await fetch('/data/scf_controls.json');
            const data = await response.json();
            set({ data });
        } catch (error) {
            console.error("Failed to load data:", error);
        }
    },

    grouping: 'domain', // 'domain', 'pptdf', 'nist_csf'
    setGrouping: (grouping) => set({ grouping }),

    searchQuery: '',
    setSearchQuery: (searchQuery) => set({ searchQuery }),

    selectedControlId: null,
    setSelectedControlId: (id) => set({ selectedControlId: id }),

    hoveredNode: null,
    setHoveredNode: (id) => set({ hoveredNode: id }),

    // Zoom navigation - stores the path to the currently focused node
    // null = root view, ['domain-name'] = focused on domain, etc.
    focusedNodePath: [],
    setFocusedNodePath: (path) => set({ focusedNodePath: path }),

    // Navigate into a child node (zoom in one level)
    zoomIn: (nodeName) => set((state) => ({
        focusedNodePath: [...state.focusedNodePath, nodeName]
    })),

    // Navigate up one level (zoom out)
    zoomOut: () => set((state) => ({
        focusedNodePath: state.focusedNodePath.slice(0, -1)
    })),

    // Reset to root view
    zoomToRoot: () => set({ focusedNodePath: [] }),

    // Compliance Regime filtering
    selectedRegimes: ['EMEA EU DORA', 'NIST CSF 2.0'],
    toggleRegime: (regime) => set((state) => ({
        selectedRegimes: state.selectedRegimes.includes(regime)
            ? state.selectedRegimes.filter(r => r !== regime)
            : [...state.selectedRegimes, regime]
    })),
    setSelectedRegimes: (regimes) => set({ selectedRegimes: regimes }),

    // Toggle for showing only mapped controls
    onlyShowMapped: false,
    setOnlyShowMapped: (val) => set({ onlyShowMapped: val }),

    // Get all unique regimes available in the loaded data
    getAvailableRegimes: () => {
        const regimes = new Set();
        const data = useAppStore.getState().data;
        data.forEach(c => {
            c.mappings?.forEach(m => regimes.add(m.regime));
        });
        return Array.from(regimes).sort();
    },

    // Get a consistent color for a regime
    getRegimeColor: (regime) => {
        // Preset special colors for requested frameworks - HIGH CONTRAST
        const presets = {
            'EMEA EU DORA': '#ff0055', // Vibrant Magenta
            'NIST 800-63B': '#00ffee', // Bright Cyan
            'NIST CSF 2.0': '#5588ff', // Azure Blue
            'EMEA EU GDPR': '#ffaa00', // Amber
            'HIPAA Administrative Simplification 2013': '#00ff44', // Neon Green
            'PCI DSS 4.0.1': '#aa00ff' // Deep Purple
        };
        if (presets[regime]) return presets[regime];

        // Stable hash for others
        let hash = 0;
        for (let i = 0; i < regime.length; i++) {
            hash = regime.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        // Vary lightness and saturation as well to increase variety
        const saturation = 70 + (hash % 20);
        const lightness = 50 + (hash % 10);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
}))
