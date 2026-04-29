/**
 * Logic for synchronizing application state with the URL fragment.
 */
export const URLSync = {
    updateURL(state) {
        const params = new URLSearchParams();

        if (state.selectedRegimeIds.size > 0) {
            params.set("r", Array.from(state.selectedRegimeIds).join(","));
        }

        if (state.processor.currentHierarchy.length > 0) {
            const aliased = state.processor.currentHierarchy.map((id) => state.hierarchyAliases[id] || id);
            params.set("h", aliased.join(","));
        }

        if (state.showUnmapped) {
            params.set("u", "1");
        }

        if (state.currentSizeBy !== "uniform") { // Assuming "uniform" is the alternative to weight
            params.set("s", state.currentSizeBy);
        }

        if (state.focus && state.focus !== state.root) {
            params.set("f", state.focus.data.name);
        }

        const newHash = params.toString();
        if (window.location.hash.substring(1) !== newHash) {
            window.history.replaceState(null, null, `#${newHash}`);
        }
    },

    applyURLState(state) {
        const hash = window.location.hash.substring(1);
        if (!hash) return null;

        const params = new URLSearchParams(hash);
        const result = {};

        if (params.has("u")) {
            result.showUnmapped = params.get("u") === "1";
        }

        if (params.has("s")) {
            result.currentSizeBy = params.get("s");
        }

        if (params.has("h")) {
            const aliased = params.get("h").split(",");
            result.hierarchyFields = aliased.map((alias) => state.reverseAliases[alias] || alias);
        }

        if (params.has("r")) {
            const rawValues = params.get("r").split(",");
            result.initialRegimeValue = rawValues.map((value) => value.startsWith("cat-") ? value : (value.startsWith("grp-") ? value : Number(value)));
        }

        return result;
    },

    applyURLFocus(root) {
        const hash = window.location.hash.substring(1);
        if (!hash) return null;

        const params = new URLSearchParams(hash);
        const focusName = params.get("f");

        if (focusName && root) {
            return root.descendants().find((d) => d.data.name === focusName);
        }
        return null;
    }
};
