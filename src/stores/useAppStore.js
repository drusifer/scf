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

    collisionPadding: 10,
    setCollisionPadding: (padding) => set({ collisionPadding: padding }),

    cameraDistance: 3000,
    setCameraDistance: (distance) => set({ cameraDistance: distance }),

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
        const presets = {
            'EMEA EU DORA': '#ff0055',
            'NIST 800-63B': '#00ffee',
            'NIST CSF 2.0': '#5588ff',
            'EMEA EU GDPR': '#ffaa00',
            'HIPAA Administrative Simplification 2013': '#00ff44',
            'PCI DSS 4.0.1': '#aa00ff'
        };
        if (presets[regime]) return presets[regime];

        let hash = 0;
        for (let i = 0; i < regime.length; i++) {
            hash = regime.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = hash & hash;

        const GOLDEN_ANGLE = 137.5;
        const hue = (hash * GOLDEN_ANGLE) % 360;
        const saturation = 70 + (Math.abs(hash) % 10) * 3;
        const lightness = 45 + (Math.abs(hash) % 10) * 4;

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
}))
