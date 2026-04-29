import { FRAMEWORK_CONFIGS } from "./framework_configs.js";
import { FrameworkDataProcessor } from "./framework_processor.js";
import { SCFSizing } from "./viz_sizing.js";

const SIZE_BY_STORAGE_KEY = "scf_size_by";
const FRAMEWORK_STORAGE_KEY = "scf_active_framework";
const { SIZE_BY_WEIGHT, SIZE_BY_UNIFORM } = SCFSizing;

export const StateManager = {
    currentFrameworkKey: localStorage.getItem(FRAMEWORK_STORAGE_KEY) || "scf",
    processor: null,
    selectedRegimeIds: new Set(),
    currentSizeBy: localStorage.getItem(SIZE_BY_STORAGE_KEY) || SIZE_BY_WEIGHT,
    showUnmapped: true,
    _regimeWasActiveThisSession: false,
    scfData: null,
    activeTagFilters: new Set(),
    tagGroupMap: new Map(),
    activeMappingQualityFilters: new Set(),
    mappingQualityRegimeId: null,

    init() {
        this.processor = new FrameworkDataProcessor(FRAMEWORK_CONFIGS[this.currentFrameworkKey]);
    },

    getRegimeSaveKey(fwKey) {
        return `scf_selected_regimes_${fwKey}`;
    },

    saveSelectedRegimes() {
        if (!this.scfData) return;
        const names = Array.from(this.selectedRegimeIds).map(id => {
            const r = this.scfData.regimeList[id];
            return r ? r.fullName : null;
        }).filter(Boolean);
        localStorage.setItem(this.getRegimeSaveKey(this.currentFrameworkKey), JSON.stringify(names));
    },

    loadSelectedRegimes() {
        const saved = localStorage.getItem(this.getRegimeSaveKey(this.currentFrameworkKey));
        if (saved) {
            try {
                const names = JSON.parse(saved);
                if (Array.isArray(names) && names.every(n => typeof n === "string")) {
                    return this.resolveRegimeNames(names);
                }
            } catch {}
        }
        return new Set();
    },

    resolveRegimeNames(names) {
        const result = new Set();
        if (!this.scfData) return result;
        names.forEach(name => {
            const regime = this.scfData.regimeList.find(r => r.fullName === name);
            if (regime !== undefined) result.add(regime.id);
        });
        return result;
    },

    getTagFilterKey(fwKey) {
        return `scf_tag_filters_${fwKey}`;
    },

    saveTagFilters() {
        localStorage.setItem(this.getTagFilterKey(this.currentFrameworkKey), JSON.stringify(Array.from(this.activeTagFilters)));
    },

    loadTagFilters() {
        try {
            const saved = localStorage.getItem(this.getTagFilterKey(this.currentFrameworkKey));
            if (!saved) return;
            const parsed = JSON.parse(saved);
            const tags = Array.isArray(parsed) ? parsed : Object.values(parsed).flat();
            tags.forEach(t => { if (typeof t === "string") this.activeTagFilters.add(t); });
        } catch {}
    },

    setSizeBy(value) {
        const { SIZE_BY_WEIGHT, SIZE_BY_UNIFORM, SIZE_BY_AS, SIZE_BY_FCS } = SCFSizing;
        const validValues = [SIZE_BY_WEIGHT, SIZE_BY_UNIFORM, SIZE_BY_AS, SIZE_BY_FCS];
        this.currentSizeBy = validValues.includes(value) ? value : SIZE_BY_WEIGHT;
        localStorage.setItem(SIZE_BY_STORAGE_KEY, this.currentSizeBy);
    },

    setFramework(key) {
        this.currentFrameworkKey = key;
        localStorage.setItem(FRAMEWORK_STORAGE_KEY, key);
        this.processor = new FrameworkDataProcessor(FRAMEWORK_CONFIGS[key]);
    }
};
