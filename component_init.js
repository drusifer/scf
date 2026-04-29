/**
 * Component initialization logic for Treeselect and Tag Panels.
 */
export const ComponentInit = {
    initTreeselect(containerId, options, initialValue, callback) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        container.innerHTML = "";
        
        const TS = window.Treeselect;
        if (!TS) {
            console.error("Treeselect is not loaded.");
            return null;
        }

        return new TS({
            parentHtmlContainer: container,
            value: initialValue,
            options,
            isMultiple: true,
            isSearchable: true,
            placeholder: "Search or select...",
            clearable: true,
            alwaysOpen: true,
            staticList: true,
            inputCallback: callback
        });
    },

    initSingleTreeselect(containerId, options, placeholder, callback) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        container.innerHTML = "";

        const TS = window.Treeselect;
        if (!TS) {
            console.error("Treeselect is not loaded.");
            return null;
        }

        return new TS({
            parentHtmlContainer: container,
            options,
            value: "",
            isSingleSelect: true,
            isSearchable: true,
            isIndependentNodes: true,
            isBranchSelectable: true,
            placeholder,
            clearable: true,
            alwaysOpen: true,
            showCheckbox: false,
            showTags: false,
            staticList: true,
            openLevel: 10,
            inputCallback: callback
        });
    }
};
