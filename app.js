import { FRAMEWORK_CONFIGS } from "./framework_configs.js";
import { SCFSizing } from "./viz_sizing.js";
import { SCFReadingMode } from "./reading_mode.js";
import { buildRegimeTreeOptions } from "./regime_grouping.js";
import { VizUtils } from "./viz_utils.js";
import { StateManager } from "./state_manager.js";
import { URLSync } from "./url_sync.js";
import { UIComponents } from "./ui_components.js";
import { FilterLogic } from "./filter_logic.js";
import { ComponentInit } from "./component_init.js";
import { VizEngine } from "./viz_engine.js";

// Initialize state
StateManager.init();
let vizEngine;
let root;
let node;
let label;
let focus;
let view;

let isReadingView = true;
let suppressPanZoomState = false;

// --- Framework helpers ---

function refreshHierarchyAliases() {
    StateManager.hierarchyAliases = StateManager.processor.config.hierarchy_aliases || {};
    StateManager.reverseAliases = Object.fromEntries(Object.entries(StateManager.hierarchyAliases).map(([k, v]) => [v, k]));
}
refreshHierarchyAliases();

function migrateOldRegimeStorage() {
    const oldKey = "scf_selected_regimes";
    const old = localStorage.getItem(oldKey);
    if (!old || localStorage.getItem(StateManager.getRegimeSaveKey("scf"))) return;
    try {
        const indices = JSON.parse(old);
        if (!Array.isArray(indices) || !indices.every(v => typeof v === "number")) return;
        if (!StateManager.scfData) return;
        const names = indices.map(idx => {
            const r = StateManager.scfData.regimeList[idx];
            return r ? r.fullName : null;
        }).filter(Boolean);
        const dropped = indices.length - names.length;
        localStorage.setItem(StateManager.getRegimeSaveKey("scf"), JSON.stringify(names));
        localStorage.removeItem(oldKey);
        if (dropped > 0) {
            UIComponents.showToast("Your saved regime selection has been updated for compatibility.");
        }
    } catch {}
}

const showVizError = UIComponents.showVizError;

// --- Tag Filter ---

function clearTagFilters(event) {
    if (event) event.stopPropagation();
    StateManager.activeTagFilters.clear();
    localStorage.removeItem(StateManager.getTagFilterKey(StateManager.currentFrameworkKey));
    document.querySelectorAll(".tag-checkbox").forEach(cb => { cb.checked = false; });
    document.getElementById("tag-clear-btn")?.classList.add("hidden");
    StateManager.activeMappingQualityFilters.clear();
    initMappingQualityFilter();
    updateFilterBadge();
    applyTagFilter();
    updateChipList();
}

function updateFilterBadge() {
    const filterCount = StateManager.activeTagFilters.size + StateManager.activeMappingQualityFilters.size;
    const activityCount = StateManager.selectedRegimeIds.size + filterCount;
    const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;
    const badge = document.getElementById("tag-filter-badge");
    if (badge) {
        badge.textContent = activityCount > 0 ? `${activityCount}` : "";
        badge.classList.toggle("hidden", activityCount === 0);
        const label = `${pluralize(activityCount, "active context item", "active context items")}: ${pluralize(StateManager.selectedRegimeIds.size, "regime")}, ${pluralize(StateManager.activeTagFilters.size, "tag filter")}, ${pluralize(StateManager.activeMappingQualityFilters.size, "mapping quality filter")}`;
        badge.setAttribute("title", label);
        badge.setAttribute("aria-label", label);
    }
    document.getElementById("tag-clear-btn")?.classList.toggle("hidden", filterCount === 0);
}

function showTagZeroResultOverlay() {
    let overlay = document.getElementById("tag-zero-result");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "tag-zero-result";
        overlay.className = "absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none z-10";
        overlay.innerHTML = `
            <p class="text-sm text-[var(--text-muted)]">No controls match the selected tags.</p>
            <button class="pointer-events-auto text-xs text-[var(--accent-blue)] underline" onclick="clearTagFilters()">Clear Filters</button>
        `;
        document.getElementById("viz-container")?.appendChild(overlay);
    }
    overlay.classList.remove("hidden");
}

function hideTagZeroResultOverlay() {
    document.getElementById("tag-zero-result")?.classList.add("hidden");
}
function applyTagFilter() {
    if (!root || !node) return;

    const matchMap = FilterLogic.calculateMatchMap(
        root,
        StateManager.tagGroupMap,
        StateManager.activeTagFilters,
        StateManager.mappingQualityRegimeId,
        StateManager.activeMappingQualityFilters
    );

    let matchCount = 0;
    node.style("visibility", d => {
        const visibility = FilterLogic.getFilteredVisibility(d, matchMap);
        if (d.data.tags && visibility === "visible") matchCount++;
        return visibility;
    });

    label.style("visibility", d => FilterLogic.getFilteredVisibility(d, matchMap));

    if (matchCount === 0 && (StateManager.activeTagFilters.size > 0 || StateManager.activeMappingQualityFilters.size > 0)) showTagZeroResultOverlay();
    else hideTagZeroResultOverlay();

    updateFilterBadge();
}

function initMappingQualityFilter() {
    const groupsContainer = document.getElementById("tag-filter-groups");
    if (!groupsContainer) return;

    // Clear previously injected mapping quality groups
    groupsContainer.querySelectorAll(".mapping-quality-group").forEach(el => el.remove());

    const selectedRegimeIds = StateManager.selectedRegimeIds;
    const isCRI = !!StateManager.processor.config.schema.controls.mapping_tag_suffix;

    if (!isCRI || selectedRegimeIds.size !== 1) {
        StateManager.mappingQualityRegimeId = null;
        StateManager.activeMappingQualityFilters.clear();
        return;
    }

    const rid = Array.from(selectedRegimeIds)[0];
    StateManager.mappingQualityRegimeId = rid;
    const rInfo = StateManager.scfData.regimeList[rid];
    
    const labeledTags = new Map();

    StateManager.processor.rawControls.forEach(row => {
        const val = row[rInfo.tagsCol];
        if (!val) return;
        val.split("\n").forEach(line => {
            line.split(";").forEach(segment => {
                const parts = segment.split(":");
                if (parts.length >= 2) {
                    const label = parts[0].trim() + ":";
                    const value = parts.slice(1).join(":").trim();
                    if (!labeledTags.has(label)) labeledTags.set(label, new Set());
                    labeledTags.get(label).add(value);
                }
            });
        });
    });

    Array.from(labeledTags.keys()).sort().forEach(label => {
        const values = Array.from(labeledTags.get(label)).sort();
        const group = document.createElement("div");
        group.className = "filter-group mapping-quality-group";
        const groupLabel = document.createElement("div");
        groupLabel.className = "filter-group-label";
        groupLabel.textContent = label;
        group.appendChild(groupLabel);

        const list = document.createElement("div");
        list.className = "filter-list";
        values.forEach(val => {
            const fullTag = `${label} ${val}`;
            const item = document.createElement("label");
            item.className = "filter-item";
            item.dataset.val = val.toLowerCase();
            item.dataset.tag = fullTag;
            
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.className = "checkbox-ui mapping-quality-checkbox tag-checkbox";
            cb.dataset.label = label;
            cb.dataset.value = val;
            cb.checked = StateManager.activeMappingQualityFilters.has(fullTag);
            cb.addEventListener("change", () => {
                if (cb.checked) StateManager.activeMappingQualityFilters.add(fullTag);
                else StateManager.activeMappingQualityFilters.delete(fullTag);
                updateFilterBadge();
                applyTagFilter();
            });

            const span = document.createElement("span");
            span.className = "filter-item-label";
            span.textContent = val;

            item.appendChild(cb);
            item.appendChild(span);
            list.appendChild(item);
        });
        group.appendChild(list);
        groupsContainer.appendChild(group);
    });
}

function updateChipList() {
    const chipContainer = document.getElementById("tag-chip-list");
    if (!chipContainer) return;
    chipContainer.innerHTML = "";
    StateManager.activeTagFilters.forEach(tag => {
        const chip = document.createElement("span");
        chip.className = "chip-ui";
        const tagText = document.createElement("span");
        tagText.textContent = tag;
        const removeBtn = document.createElement("button");
        removeBtn.className = "opacity-60 hover:opacity-100";
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", () => removeTagFilter(tag));
        chip.appendChild(tagText);
        chip.appendChild(removeBtn);
        chipContainer.appendChild(chip);
    });
    chipContainer.classList.toggle("hidden", StateManager.activeTagFilters.size === 0);
}

function removeTagFilter(tag) {
    StateManager.activeTagFilters.delete(tag);
    const cb = document.querySelector(`.tag-checkbox[data-tag="${CSS.escape(tag)}"]`);
    if (cb) cb.checked = false;
    StateManager.saveTagFilters();
    updateFilterBadge();
    applyTagFilter();
    updateChipList();
}

function buildTagGroup(labelStr, values) {
    const group = document.createElement("div");
    group.className = "filter-group";
    group.dataset.label = labelStr;

    const label = document.createElement("div");
    label.className = "filter-group-label";
    label.textContent = labelStr;
    group.appendChild(label);

    const list = document.createElement("div");
    list.className = "filter-list";

    values.forEach(val => {
        const fullTag = `${labelStr} ${val}`;
        const item = document.createElement("label");
        item.className = "filter-item";
        item.dataset.tag = fullTag;
        item.dataset.val = val.toLowerCase();

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "checkbox-ui tag-checkbox";
        cb.dataset.label = labelStr;
        cb.dataset.value = val;
        cb.checked = StateManager.activeTagFilters.has(fullTag);

        cb.addEventListener("change", () => {
            if (cb.checked) StateManager.activeTagFilters.add(fullTag);
            else StateManager.activeTagFilters.delete(fullTag);
            StateManager.saveTagFilters();
            updateFilterBadge();
            applyTagFilter();
            updateChipList();
        });

        const span = document.createElement("span");
        span.className = "filter-item-label";
        span.textContent = val;

        item.appendChild(cb);
        item.appendChild(span);
        list.appendChild(item);
    });

    group.appendChild(list);
    return group;
}

function initTagFilterPanel(config) {
    StateManager.tagGroupMap.clear();
    const groupsContainer = document.getElementById("tag-filter-groups");
    if (!groupsContainer) return;
    groupsContainer.innerHTML = "";
    updateChipList();

    const tagCols = config.schema.controls.tag_cols || [];
    const mappingSuffix = config.schema.controls.mapping_tag_suffix;

    const tagAccordion = document.getElementById("tag-filter-container")?.closest(".panel-item");
    if (tagAccordion) tagAccordion.classList.toggle("hidden", tagCols.length === 0 && !mappingSuffix);

    if (tagCols.length === 0 && !mappingSuffix) return;

    const rawControls = StateManager.processor.rawControls;
    const selectedRegimeIds = StateManager.selectedRegimeIds;
    const labeledTags = new Map(); // label -> Set of values

    // Determine which controls are visible based on selected regimes
    const activeControls = selectedRegimeIds.size === 0 
        ? rawControls 
        : rawControls.filter(row => {
            return StateManager.processor.regimeList.some(rInfo => {
                if (!selectedRegimeIds.has(rInfo.id)) return false;
                const val = row[rInfo.col]?.trim();
                return val && val.toLowerCase() !== "";
            });
        });

    function parseAndAddTags(val) {
        if (!val) return;
        val.split("\n").forEach(line => {
            line.split(";").forEach(segment => {
                const parts = segment.split(":");
                if (parts.length >= 2) {
                    const label = parts[0].trim() + ":";
                    const value = parts.slice(1).join(":").trim();
                    if (label && value) {
                        if (!labeledTags.has(label)) labeledTags.set(label, new Set());
                        labeledTags.get(label).add(value);
                    }
                } else {
                    const tag = segment.trim();
                    if (tag) {
                        if (!labeledTags.has("Subject Area:")) labeledTags.set("Subject Area:", new Set());
                        labeledTags.get("Subject Area:").add(tag);
                    }
                }
            });
        });
    }

    tagCols.forEach(col => {
        activeControls.forEach(row => parseAndAddTags(row[col]));
    });

    if (mappingSuffix) {
        StateManager.processor.regimeList.forEach(rInfo => {
            if (selectedRegimeIds.size > 0 && !selectedRegimeIds.has(rInfo.id)) return;
            activeControls.forEach(row => parseAndAddTags(row[rInfo.tagsCol]));
        });
    }

    Array.from(labeledTags.keys()).sort().forEach(label => {
        const values = Array.from(labeledTags.get(label)).sort((a, b) => {
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
        });
        groupsContainer.appendChild(buildTagGroup(label, values));
    });

    // Wire up global search
    const globalSearchInput = document.getElementById("tag-global-search");
    if (globalSearchInput) {
        // Reset search on framework switch
        globalSearchInput.value = "";
        globalSearchInput.addEventListener("input", () => {
            const q = globalSearchInput.value.toLowerCase();
            const groups = groupsContainer.querySelectorAll(".tag-group-container");
            groups.forEach(group => {
                const items = group.querySelectorAll(".tag-item");
                let visibleCount = 0;
                items.forEach(item => {
                    const visible = !q || item.dataset.val.includes(q);
                    item.classList.toggle("hidden", !visible);
                    if (visible) visibleCount++;
                });
                // Hide entire group if no items match
                group.classList.toggle("hidden", visibleCount === 0 && q !== "");
            });
        });
    }

    if (groupsContainer.querySelectorAll(".tag-checkbox").length === 0) {
        groupsContainer.innerHTML = "";
        const empty = document.createElement("p");
        empty.className = "text-xs text-[var(--text-muted)] italic mt-1";
        empty.textContent = "No tag filters are available for this framework.";
        groupsContainer.appendChild(empty);
    }

    StateManager.loadTagFilters();
    document.querySelectorAll(".tag-checkbox").forEach(cb => {
        const fullTag = cb.dataset.label + " " + cb.dataset.value;
        cb.checked = StateManager.activeTagFilters.has(fullTag);
    });
    updateFilterBadge();
    updateChipList();
}

function updateFrameworkBadge() {
    const badge = document.getElementById("framework-badge");
    if (badge) badge.textContent = StateManager.processor.config.name;

    const isCRI = StateManager.currentFrameworkKey === "cri";
    document.getElementById("size-by-as")?.classList.toggle("hidden", !isCRI);
    document.getElementById("size-by-fcs")?.classList.toggle("hidden", !isCRI);
    
    // Reset to 'weight' if current sizing is not available for this framework
    if (!isCRI && (StateManager.currentSizeBy === "alignment" || StateManager.currentSizeBy === "functional")) {
        setSizeBy("weight");
    }
}

// --- Node Tooltip ---

function getNodeTooltipPath(d) {
    if (d.depth === 0) return StateManager.processor.config.name;
    return d.ancestors().reverse().filter(a => a.depth > 0).map(a => a.data.name).join(" › ");
}

function positionNodeTooltip(event, el) {
    const pad = 16;
    let x = event.clientX + 12;
    let y = event.clientY + 8;
    if (x + el.offsetWidth > window.innerWidth - pad) x = event.clientX - el.offsetWidth - 12;
    if (y + el.offsetHeight > window.innerHeight - pad) y = event.clientY - el.offsetHeight - 8;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
}

function showNodeTooltip(event, d) {
    const el = document.getElementById("node-tooltip");
    if (!el) return;
    el.textContent = getNodeTooltipPath(d);
    el.style.display = "block";
    positionNodeTooltip(event, el);
}

function hideNodeTooltip() {
    const el = document.getElementById("node-tooltip");
    if (el) el.style.display = "none";
}

function updateRegimeLabel() {
    const el = document.getElementById("regime-label");
    if (el) el.textContent = StateManager.processor.config.regime_label || "Compliance Regimes";
}

function updateOnboardingHint() {
    const hint = document.getElementById("onboarding-hint");
    if (!hint) return;
    const noRegimes = StateManager.selectedRegimeIds.size === 0;
    const isSCF = StateManager.currentFrameworkKey === "scf";
    const hasEverSelected = localStorage.getItem("scf_hint_dismissed") === "true";
    // Show on page load only if user has never selected; always re-show on deselect-to-empty (AC2).
    const shouldShow = noRegimes && isSCF && (!hasEverSelected || StateManager._regimeWasActiveThisSession);
    hint.classList.toggle("hidden", !shouldShow);
}

function updateFrameworkToggle() {
    document.querySelectorAll(".framework-btn").forEach(btn => {
        const isActive = btn.dataset.fw === StateManager.currentFrameworkKey;
        btn.classList.toggle("bg-[var(--accent-blue)]", isActive);
        btn.classList.toggle("text-white", isActive);
        btn.classList.toggle("font-semibold", isActive);
        btn.classList.toggle("bg-transparent", !isActive);
        btn.classList.toggle("text-[var(--text-muted)]", !isActive);
        const cfg = FRAMEWORK_CONFIGS[btn.dataset.fw];
        if (cfg?.description) btn.title = cfg.description;
    });
}

async function switchFramework(key) {
    if (key === StateManager.currentFrameworkKey) return;

    const overlay = document.getElementById("framework-loading");
    if (overlay) overlay.classList.remove("hidden");

    StateManager.saveSelectedRegimes();
    StateManager.setFramework(key);
    refreshHierarchyAliases();

    try {
        StateManager.scfData = await StateManager.processor.init();
    } catch (err) {
        showVizError(`Failed to load ${FRAMEWORK_CONFIGS[key].name}: ${err.message}`);
        if (overlay) overlay.classList.add("hidden");
        return;
    }

    StateManager.selectedRegimeIds = StateManager.loadSelectedRegimes();
    clearTagFilters();
    initTreeselect();
    initHierarchyFieldsTreeselect();
    initTagFilterPanel(StateManager.processor.config);
    initMappingQualityFilter();
    updateVisualization();
    updateFrameworkBadge();
    updateRegimeLabel();
    updateFrameworkToggle();
    updateLegend();

    if (overlay) overlay.classList.add("hidden");
}

function setSizeBy(value) {
    StateManager.setSizeBy(value);

    const select = document.getElementById("size-by-select");
    if (select) {
        select.value = StateManager.currentSizeBy;
    }

    updateVisualization();
    updateURL();
}

function setReadingViewState(nextState) {
    isReadingView = nextState;
    UIComponents.updateReadingViewUI(isReadingView);
}

function resetPanZoomTransform(duration = 0) {
    if (!vizEngine.svg || !vizEngine.d3Zoom) {
        return;
    }

    suppressPanZoomState = true;

    if (duration > 0) {
        vizEngine.svg.transition().duration(duration).call(vizEngine.d3Zoom.transform, d3.zoomIdentity);
        window.setTimeout(() => {
            suppressPanZoomState = false;
        }, duration + 50);
        return;
    }

    vizEngine.svg.call(vizEngine.d3Zoom.transform, d3.zoomIdentity);
    vizEngine.g.attr("transform", null);
    suppressPanZoomState = false;
}

function returnToReadingView() {
    resetPanZoomTransform(250);
    if (focus) {
        zoom({ stopPropagation() {} }, focus, { keepReadingView: true });
        return;
    }

    setReadingViewState(true);
}

// Helper functions for dynamic labeling (Relative to focus)
const getLabelSize = (d, currentFocus, targetView, isHovered = false) => {
    if (isHovered) {
        return "16px";
    }

    const fontSize = SCFReadingMode.getLabelFontSize(VizUtils.getLabelMetrics(d, currentFocus, vizEngine.width, targetView));
    return `${fontSize}px`;
};

const getLabelOpacity = (d, currentFocus, targetView, isHovered = false) => {
    if (isHovered) {
        return 1;
    }

    const densityTier = SCFReadingMode.getLabelDensityTier(VizUtils.getLabelMetrics(d, currentFocus, vizEngine.width, targetView));
    if (densityTier === "focus") {
        return 0.82;
    }

    if (densityTier === "child") {
        return 0.74;
    }

    if (densityTier === "grandchild") {
        return 0.68;
    }

    return 0;
};

const getLabelDisplay = (d, currentFocus, targetView) => {
    if (d.depth === 0) return "none";
    return SCFReadingMode.getLabelEligibility(VizUtils.getLabelMetrics(d, currentFocus, vizEngine.width, targetView)) ? "inline" : "none";
};

function refreshLabelContent(currentFocus, targetView) {
    if (!label) {
        return;
    }

    label.each(function updateSingleLabel(d) {
        const currentLabel = d3.select(this);
        const depthDiff = d.depth - currentFocus.depth;
        const name = d.data.name.split(":")[0];

        currentLabel.text(""); // Clear existing content

        if (depthDiff === 1 && getLabelDisplay(d, currentFocus, targetView) === "inline") {
            // Children: Show % + Name
            const pct = Math.round((d.value / currentFocus.value) * 100);
            currentLabel.append("tspan")
                .style("opacity", "0.7")
                .style("font-weight", "400")
                .text(`${pct}% `);
            currentLabel.append("tspan").text(name);
            return;
        }

        // Focus, Ancestors, and other levels: Show Name only
        currentLabel.append("tspan").text(name);
    });
}

// --- D3 Initialization ---
function initViz() {
    vizEngine.init();
    vizEngine.svg.on("click", (event) => {
        zoom(event, root);
        closeDetails(); // Close panel when clicking background
    });
    updateVisualization();
}

function updateVisualization() {
    if (!StateManager.scfData) {
        return;
    }

    const previousFocusName = focus?.data?.name;
    const previousLayout = root ? new Map(root.descendants().map((d) => [VizUtils.getNodeKey(d), { x: d.x, y: d.y, r: d.r }])) : new Map();

    // Re-build hierarchy based on selection
    const filteredData = filterData(JSON.parse(JSON.stringify(StateManager.scfData)));

    if (!filteredData || !filteredData.children || filteredData.children.length === 0) {
        vizEngine.g.selectAll("*").remove();
        vizEngine.g.append("text")
            .attr("text-anchor", "middle")
            .attr("fill", "rgba(255,255,255,0.2)")
            .style("font-size", "14px")
            .text("No regimes selected or no matching controls found.");
        updateOnboardingHint();
        return;
    }

    root = vizEngine.pack(filteredData, (d) => SCFSizing.getLeafSizeValue(d, StateManager.currentSizeBy));
    focus = previousFocusName ? root.descendants().find((d) => d.data.name === previousFocusName) || root : root;
    const targetView = VizUtils.getTargetView(focus);

    // Assign unique persistent IDs for this render to ensure Treeselect values are stable
    root.descendants().forEach((d, index) => {
        d.id = `node-${index}`;
    });

    // Re-sync the navigator options
    if (typeof initHierarchyNavigatorTreeselect === "function") {
        initHierarchyNavigatorTreeselect();
    }

    setupPanZoom();
    setupHierarchyNavigator();

    vizEngine.g.selectAll("*").remove();

    node = vizEngine.g.append("g")
        .selectAll("circle")
        .data(root.descendants().slice(1))
        .join("circle")
        .attr("class", (d) => `node node--${d.depth} ${d.children ? "" : "node--leaf"}`)
        .style("fill", (d) => {
            if (d.depth === 1) return "var(--scf-depth-1)";
            if (d.depth === 2) return "var(--scf-depth-2)";
            if (d.depth === 3) return "var(--scf-depth-3)";
            if (d.depth === 4) return "var(--scf-depth-4)";
            if (d.depth === 5 || d.depth === 6) return vizEngine.getRegimeColor(d.data.regimeId);
            return "var(--node-fill-default)";
        })
        .style("fill-opacity", (d) => {
            if (d.depth === 5) return 0.2; // Manual opacity for regime groups
            return d.children ? 0.4 : 0.8;
        })
        .style("stroke", (d) => d.children ? "var(--node-stroke)" : "transparent")
        .style("stroke-width", 0.5)
        .on("mouseover", function handleMouseOver(event, d) {
            d3.select(this)
                .style("stroke", "var(--node-stroke-hover)")
                .style("stroke-width", d.depth === 4 ? "3px" : "2px");

            label.filter((labelNode) => labelNode === d)
                .transition().duration(200)
                .style("display", "inline")
                .style("fill-opacity", 1)
                .style("font-size", getLabelSize(d, focus, targetView, true))
                .style("font-weight", 700);

            showNodeTooltip(event, d);
        })
        .on("mousemove", function handleMouseMove(event) {
            const el = document.getElementById("node-tooltip");
            if (el && el.style.display !== "none") positionNodeTooltip(event, el);
        })
        .on("mouseout", function handleMouseOut(_event, d) {
            d3.select(this)
                .style("stroke", d.children ? "var(--node-stroke)" : "transparent")
                .style("stroke-width", "0.5px");

            label.filter((labelNode) => labelNode === d)
                .transition().duration(200)
                .style("display", getLabelDisplay(d, focus, targetView))
                .style("fill-opacity", getLabelOpacity(d, focus, targetView))
                .style("font-size", getLabelSize(d, focus, targetView))
                .style("font-weight", (currentNode) => {
                    const depthDiff = currentNode.depth - focus.depth;
                    return depthDiff === 0 ? "700" : "400";
                });

            hideNodeTooltip();
        })
        .on("click", (event, d) => {
            if (focus !== d) {
                zoom(event, d);
                event.stopPropagation();
            }

            const controlNode = d.ancestors().find((ancestor) => ancestor.data.mappings);
            if (controlNode) {
                showDetails(controlNode.data);
                return;
            }

            closeDetails();
        });

    label = vizEngine.g.append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(root.descendants().sort((a, b) => b.depth - a.depth))
        .join("text")
        .attr("class", "label");

    refreshLabelContent(focus, targetView);

    const getInitialLayout = (d) => previousLayout.get(VizUtils.getNodeKey(d)) || { x: focus.x, y: focus.y, r: 0 };

    node.attr("transform", (d) => {
        const initial = getInitialLayout(d);
        return VizUtils.getProjectedTransform(initial.x, initial.y, vizEngine.width, targetView);
    }).attr("r", (d) => {
        const initial = getInitialLayout(d);
        return VizUtils.getProjectedRadius(initial.r, vizEngine.width, targetView);
    });

    label.attr("transform", (d) => {
        const initial = getInitialLayout(d);
        return VizUtils.getProjectedTransform(
            initial.x,
            initial.y,
            vizEngine.width,
            targetView,
            VizUtils.getLabelOffset(d, VizUtils.getProjectedRadius(initial.r, vizEngine.width, targetView), focus)
        );
    });

    label.style("font-size", (d) => getLabelSize(d, focus, targetView))
        .style("fill-opacity", (d) => getLabelOpacity(d, focus, targetView))
        .style("display", (d) => getLabelDisplay(d, focus, targetView));

    updateNodeStyles(focus);

    const transition = vizEngine.svg.transition().duration(previousLayout.size > 0 ? 300 : 0);
    node.transition(transition)
        .attr("transform", (d) => VizUtils.getProjectedTransform(d.x, d.y, vizEngine.width, targetView))
        .attr("r", (d) => VizUtils.getProjectedRadius(d.r, vizEngine.width, targetView));
    label.transition(transition)
        .attr("transform", (d) => VizUtils.getProjectedTransform(d.x, d.y, vizEngine.width, targetView, VizUtils.getLabelOffset(d, VizUtils.getProjectedRadius(d.r, vizEngine.width, targetView), focus)));

    view = targetView;
    setReadingViewState(true);
    updateBreadcrumbs(focus);
    if (previousLayout.size === 0) {
        zoomTo(targetView);
    }

    window.externalZoom = (d) => {
        zoom({ stopPropagation() {} }, d);
    };

    applyTagFilter();
    updateOnboardingHint();
}

function setupPanZoom() {
    vizEngine.d3Zoom = d3.zoom()
        .scaleExtent([0.1, 40])
        .on("zoom", (event) => {
            vizEngine.g.attr("transform", event.transform);
            if (!suppressPanZoomState) {
                setReadingViewState(event.transform.k === 1 && event.transform.x === 0 && event.transform.y === 0);
            }
        });

    vizEngine.svg.call(vizEngine.d3Zoom).on("dblclick.zoom", null);
    window.zoomReset = () => {
        returnToReadingView();
    };
}

function updateNodeStyles(focusNode) {
    if (!node) {
        return;
    }

    node.each(function updateSingleNode(d) {
        const element = d3.select(this);
        const isFocused = d === focusNode && d !== root;

        if (isFocused) {
            element.style("fill", "var(--node-focus-fill)")
                .style("stroke", "var(--node-focus-stroke)")
                .style("stroke-width", "2.5px");
        } else {
            element.style("fill", (currentNode) => {
                if (currentNode.depth === 1) return "var(--scf-depth-1)";
                if (currentNode.depth === 2) return "var(--scf-depth-2)";
                if (currentNode.depth === 3) return "var(--scf-depth-3)";
                if (currentNode.depth === 4) return "var(--scf-depth-4)";
                if (currentNode.depth === 5 || currentNode.depth === 6) return vizEngine.getRegimeColor(currentNode.data.regimeId);
                return "var(--node-fill-default)";
            })
                .style("stroke", (currentNode) => currentNode.children ? "var(--node-stroke)" : "transparent")
                .style("stroke-width", "0.5px");
        }

        element.style("fill-opacity", (currentNode) => {
            if (currentNode.depth === 5) return 0.2;
            return currentNode.children ? 0.4 : 0.8;
        });
    });
}

function zoomTo(v) {
    if (!label || !node) {
        return;
    }

    const k = vizEngine.width / v[2];
    view = v;
    label.attr("transform", (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k + VizUtils.getLabelOffset(d, d.r * k, focus)})`);
    node.attr("transform", (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("r", (d) => d.r * k);
}

function zoom(_event, d, options = {}) {
    if (!options.keepReadingView) {
        resetPanZoomTransform();
    }

    focus = d;
    const targetView = VizUtils.getTargetView(focus);
    const transition = vizEngine.svg.transition()
        .duration(400)
        .tween("zoom", () => {
            const interpolation = d3.interpolateZoom(view, targetView);
            return (t) => zoomTo(interpolation(t));
        });

    refreshLabelContent(focus, targetView);
    updateNodeStyles(focus);
    setReadingViewState(true);
    updateURL();

    label.transition(transition)
        .style("fill-opacity", (currentNode) => getLabelOpacity(currentNode, focus, targetView))
        .style("font-size", (currentNode) => getLabelSize(currentNode, focus, targetView))
        .on("start", function handleStart(currentNode) {
            if (getLabelDisplay(currentNode, focus, targetView) === "inline") {
                this.style.display = "inline";
            }
        })
        .on("end", function handleEnd(currentNode) {
            if (getLabelDisplay(currentNode, focus, targetView) === "none") {
                this.style.display = "none";
            }
        });

    updateBreadcrumbs(d);
}

function setupHierarchyNavigator() {
    if (!root) {
        return;
    }

    function buildOptions(d3Node) {
        const name = d3Node.data.name || "Uncategorized";
        const isControl = Boolean(d3Node.data.mappings);
        const option = {
            name,
            value: d3Node.id,
            children: null
        };

        if (!isControl && d3Node.children && d3Node.children.length > 0) {
            const mappedChildren = d3Node.children
                .map((child) => buildOptions(child))
                .filter((childOption) => childOption !== null);
            if (mappedChildren.length > 0) {
                option.children = mappedChildren;
            }
        }

        return option;
    }

    const options = [buildOptions(root)];
    ComponentInit.initSingleTreeselect(
        "hierarchy-navigator-treeselect",
        options,
        "Jump to Control or Domain...",
        (value) => {
            if (!value || Array.isArray(value)) {
                return;
            }

            const targetNode = root.descendants().find((d) => d.id === value);
            if (!targetNode) {
                return;
            }

            window.externalZoom(targetNode);
            const controlNode = targetNode.ancestors().find((ancestor) => ancestor.data.mappings);
            if (controlNode) {
                showDetails(controlNode.data);
                return;
            }

            closeDetails();
        }
    );
}

function filterData(data) {
    function recurse(nodeData, depth) {
        if (depth === 4 || nodeData.mappings) {
            const regimeGroups = {};

            for (const [regimeId, identifiers] of Object.entries(nodeData.mappings || {})) {
                const rid = Number.parseInt(regimeId, 10);
                if (!StateManager.selectedRegimeIds.has(rid)) {
                    continue;
                }

                const regInfo = StateManager.scfData.regimeList[rid];
                const regimeName = regInfo.name;

                if (!regimeGroups[regimeName]) {
                    regimeGroups[regimeName] = {
                        name: regimeName,
                        regimeId: rid,
                        children: [],
                        nodeType: "regime"
                    };
                }

                identifiers.forEach((id) => {
                    const qualityTag = nodeData.regimeQualityTags?.[rid]?.[id] || "";
                    regimeGroups[regimeName].children.push({
                        name: id,
                        regimeId: rid,
                        qualityTag: qualityTag,
                        nodeType: "mapping"
                    });
                });
            }

            const validRegimeNodes = Object.values(regimeGroups);
            if (validRegimeNodes.length === 0 && !StateManager.showUnmapped) {
                return null;
            }

            return {
                ...nodeData,
                children: validRegimeNodes
            };
        }

        if (nodeData.children) {
            nodeData.children = nodeData.children.map((child) => recurse(child, depth + 1)).filter((child) => child !== null);
            if (nodeData.children.length === 0) {
                return null;
            }

            return nodeData;
        }

        return nodeData;
    }

    return recurse(data, 0);
}

function handleResize() {
    vizEngine.handleResize();
    if (root && view) {
        zoomTo([view[0], view[1], view[2]]);
    }
}

window.addEventListener("resize", handleResize);

function toggleAccordion(id) {
    const content = document.getElementById(id);
    if (!content) return;
    const item = content.closest(".panel-item");
    if (!item) return;

    item.classList.toggle("open");
}

function updateURL() {
    URLSync.updateURL({
        selectedRegimeIds: StateManager.selectedRegimeIds,
        processor: StateManager.processor,
        hierarchyAliases: StateManager.hierarchyAliases,
        showUnmapped: StateManager.showUnmapped,
        currentSizeBy: StateManager.currentSizeBy,
        focus,
        root
    });
}

function applyURLState() {
    const state = URLSync.applyURLState({
        reverseAliases: StateManager.reverseAliases
    });
    if (!state) return;

    if (state.showUnmapped !== undefined) {
        StateManager.showUnmapped = state.showUnmapped;
        const toggle = document.getElementById("toggle-unmapped");
        if (toggle) {
            toggle.checked = StateManager.showUnmapped;
        }
    }

    if (state.currentSizeBy) {
        StateManager.currentSizeBy = state.currentSizeBy;
    }

    if (state.hierarchyFields) {
        StateManager.processor.currentHierarchy = state.hierarchyFields;
    }

    if (state.initialRegimeValue) {
        window._initialRegimeValue = state.initialRegimeValue;
    }
}

function applyURLFocus() {
    const target = URLSync.applyURLFocus(root);
    if (target) {
        setTimeout(() => {
            window.externalZoom(target);
            if (target.data.mappings) {
                showDetails(target.data);
            }
        }, 500);
    }
}

function initTreeselect() {
    let options;
    if (StateManager.processor.config.schema.controls.mapping_tag_suffix) {
        options = buildRegimeTreeOptions(StateManager.scfData.regimeList);
    } else {
        options = Object.keys(StateManager.scfData.regimeCatalog).sort().map((category) => ({
            name: category,
            value: `cat-${category}`,
            children: StateManager.scfData.regimeCatalog[category].map((regime) => ({
                name: regime.name,
                value: regime.id
            }))
        }));
    }

    ComponentInit.initTreeselect(
        "treeselect-container",
        options,
        window._initialRegimeValue || Array.from(StateManager.selectedRegimeIds),
        (value) => {
            const selectedIds = value.reduce((accumulator, currentValue) => {
                if (typeof currentValue === "number") {
                    accumulator.push(currentValue);
                } else if (typeof currentValue === "string" && currentValue.startsWith("cat-")) {
                    const categoryName = currentValue.replace("cat-", "");
                    const categoryRegimes = StateManager.scfData.regimeCatalog[categoryName];
                    if (categoryRegimes) {
                        categoryRegimes.forEach((regime) => accumulator.push(regime.id));
                    }
                } else if (typeof currentValue === "string" && currentValue.startsWith("grp-")) {
                    const prefix = currentValue.replace("grp-", "");
                    StateManager.scfData.regimeList.filter(r => r.name.split(" ")[0] === prefix)
                        .forEach(r => accumulator.push(r.id));
                }

                return accumulator;
            }, []);

            StateManager.selectedRegimeIds = new Set(selectedIds);
            updateFilterBadge();
            if (StateManager.selectedRegimeIds.size > 0) {
                localStorage.setItem("scf_hint_dismissed", "true");
                StateManager._regimeWasActiveThisSession = true;
            }
            StateManager.saveSelectedRegimes();
            updateVisualization();
            initTagFilterPanel(StateManager.processor.config);
            initMappingQualityFilter();
            updateLegend();
            updateURL();
        }
    );

    if (window._initialRegimeValue) {
        const selectedIds = window._initialRegimeValue.reduce((accumulator, currentValue) => {
            if (typeof currentValue === "number") {
                accumulator.push(currentValue);
            } else if (typeof currentValue === "string" && currentValue.startsWith("cat-")) {
                const categoryName = currentValue.replace("cat-", "");
                const categoryRegimes = StateManager.scfData.regimeCatalog[categoryName];
                if (categoryRegimes) {
                    categoryRegimes.forEach((regime) => accumulator.push(regime.id));
                }
            } else if (typeof currentValue === "string" && currentValue.startsWith("grp-")) {
                const prefix = currentValue.replace("grp-", "");
                StateManager.scfData.regimeList.filter(r => r.name.split(" ")[0] === prefix)
                    .forEach(r => accumulator.push(r.id));
            }

            return accumulator;
        }, []);
        StateManager.selectedRegimeIds = new Set(selectedIds);
        updateFilterBadge();
        window._initialRegimeValue = null;
    }
}

function initHierarchyFieldsTreeselect() {
    const container = document.getElementById("hierarchy-fields-treeselect");
    if (!container) {
        return;
    }

    const hierarchyAccordion = document.getElementById("hierarchy-fields-accordion");
    if (hierarchyAccordion) {
        hierarchyAccordion.style.display = StateManager.processor.config.show_hierarchy_customizer === false ? "none" : "";
    }

    if (StateManager.processor.config.show_hierarchy_customizer === false) {
        container.innerHTML = "";
        return;
    }

    const renderWidget = () => {
        container.innerHTML = "";
        const active = StateManager.processor.currentHierarchy || [];
        const allColumns = StateManager.processor.hierarchyColumns;

        const activeWrapper = document.createElement("div");
        activeWrapper.className = "flex flex-col gap-2 mb-4";

        if (active.length > 0) {
            activeWrapper.innerHTML = "<div class=\"text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1\">Active Hierarchy Order</div>";
            active.forEach((id, index) => {
                const column = allColumns.find((currentColumn) => currentColumn.id === id);
                if (!column) {
                    return;
                }

                const item = document.createElement("div");
                item.className = "flex items-center justify-between bg-blue-500/10 border border-blue-500/20 text-blue-300 px-3 py-2 rounded text-xs select-none hover:bg-blue-500/20 transition-colors group cursor-pointer";
                item.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="font-mono opacity-50 text-[10px]">${index + 1}</span>
                        <span class="font-bold">${column.name}</span>
                    </div>
                    <span class="text-xs opacity-50 group-hover:opacity-100 group-hover:text-red-400 transition-opacity">✕</span>
                `;
                item.onclick = () => {
                    StateManager.processor.currentHierarchy.splice(index, 1);
                    updateState();
                };
                activeWrapper.appendChild(item);
            });
        } else {
            activeWrapper.innerHTML = "<div class=\"text-xs text-gray-500 italic p-2 text-center border border-dashed border-white/10 rounded\">No hierarchy levels selected.<br>Select fields below to start.</div>";
        }
        container.appendChild(activeWrapper);

        const availableWrapper = document.createElement("div");
        availableWrapper.className = "flex flex-wrap gap-2";
        availableWrapper.innerHTML = "<div class=\"w-full text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1\">Available Fields</div>";

        const available = allColumns.filter((column) => !active.includes(column.id));
        if (available.length === 0) {
            availableWrapper.innerHTML += "<div class=\"text-xs text-gray-600 italic\">All fields selected.</div>";
        }

        available.forEach((column) => {
            const button = document.createElement("button");
            button.className = "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-2 py-1 rounded text-xs border border-white/5 transition-colors text-left";
            button.innerText = column.name;
            button.onclick = () => {
                StateManager.processor.currentHierarchy.push(column.id);
                updateState();
            };
            availableWrapper.appendChild(button);
        });
        container.appendChild(availableWrapper);
    };

    const updateState = () => {
        StateManager.scfData = StateManager.processor.buildTree(StateManager.processor.currentHierarchy);
        updateVisualization();
        updateURL();
        setTimeout(initHierarchyNavigatorTreeselect, 50);
        renderWidget();
    };

    renderWidget();
}

function initHierarchyNavigatorTreeselect() {
    const container = document.getElementById("hierarchy-navigator-treeselect");
    if (!container) {
        return;
    }

    container.innerHTML = "";

    function buildNestedOptions(currentNode) {
        if (!currentNode) {
            return [];
        }

        const option = {
            name: currentNode.data.name,
            value: currentNode.id,
            node: currentNode,
            children: []
        };

        if (currentNode.children) {
            option.children = currentNode.children.map((child) => buildNestedOptions(child)).flat();
        } else {
            delete option.children;
        }

        return option;
    }

    let nestedOptions = [];
    if (root) {
        if (root.children) {
            nestedOptions = root.children.map((child) => buildNestedOptions(child)).flat();
        } else {
            nestedOptions = [buildNestedOptions(root)];
        }
    }

    ComponentInit.initSingleTreeselect(
        "hierarchy-navigator-treeselect",
        nestedOptions,
        "Jump to Control or Domain...",
        (value) => {
            if (!value) {
                return;
            }

            const targetNode = root.descendants().find((d) => d.id === value);
            if (targetNode) {
                window.externalZoom(targetNode);
                if (targetNode.data.mappings) {
                    showDetails(targetNode.data);
                }
            }
        }
    );
}

function toggleUnmappedVisibility(checked) {
    StateManager.showUnmapped = checked;
    updateVisualization();
    updateURL();
}

function updateLegend() {
    const container = document.getElementById("regime-legend");
    if (!container) return;
    container.innerHTML = "";

    StateManager.selectedRegimeIds.forEach((rid) => {
        const regime = StateManager.scfData.regimeList[rid];
        if (!regime) {
            return;
        }

        const item = document.createElement("div");
        item.className = "bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-xl max-w-48";
        item.innerHTML = `
            <div class="w-2 h-2 rounded-full" style="background: ${vizEngine.getRegimeColor(rid)}"></div>
            <span class="text-[9px] font-bold text-white uppercase tracking-wider truncate">${regime.name}</span>
        `;
        container.appendChild(item);
    });
}

function showDetails(data) {
    if (!data || !data.mappings) {
        return;
    }

    const detailPanel = document.getElementById("detail-panel");
    if (detailPanel && !detailPanel.classList.contains("open")) {
        toggleAccordion("detail-panel-content");
    }

    const safeSetText = (id, text) => {
        const element = document.getElementById(id);
        if (element) element.innerText = text;
    };
    const cfg = StateManager.processor.config;

    safeSetText("detail-id", data.name.split(":")[0]);
    safeSetText("detail-title", data.name.split(":")[1]?.trim() || data.name);
    safeSetText("detail-desc", data.description || "No description available for this control in the current framework.");
    safeSetText("detail-weight", data.weight || "1.0");

    const descLabel = document.getElementById("detail-desc-label");
    if (descLabel) descLabel.textContent = cfg.schema.controls.description_col || "Description";

    const pptdf = Object.keys(StateManager.hierarchyAliases).find((key) => data[key]) || cfg.key.toUpperCase();
    safeSetText("detail-pptdf", pptdf.replace(/_/g, " "));

    // Tags section
    const tagsContainer = document.getElementById("detail-tags");
    if (tagsContainer) {
        if (data.tags && data.tags.length > 0) {
            tagsContainer.innerHTML = "";
            data.tags.forEach(tag => {
                const chip = document.createElement("span");
                chip.className = "chip-ui";
                chip.textContent = tag;
                tagsContainer.appendChild(chip);
            });
            tagsContainer.parentElement?.classList.remove("hidden");
        } else {
            tagsContainer.parentElement?.classList.add("hidden");
        }
    }

    const mapContainer = document.getElementById("detail-mappings");
    if (mapContainer) {
        mapContainer.innerHTML = "";

        const mappings = data.mappings || {};
        let hasMappings = false;

        Object.entries(mappings).forEach(([rid, ids]) => {
            hasMappings = true;
            const ridNum = Number.parseInt(rid, 10);
            const regimeInfo = StateManager.scfData.regimeList[ridNum];
            if (!regimeInfo || !StateManager.selectedRegimeIds.has(ridNum)) {
                return;
            }

            const element = document.createElement("div");
            element.className = "detail-card";

            const header = document.createElement("div");
            header.className = "flex items-center gap-2 mb-2";
            const dot = document.createElement("div");
            dot.className = "w-2 h-2 rounded-full flex-shrink-0";
            dot.style.background = vizEngine.getRegimeColor(rid);
            const nameSpan = document.createElement("span");
            nameSpan.className = "text-[10px] font-bold text-gray-400 uppercase tracking-widest";
            nameSpan.textContent = regimeInfo.name;
            header.appendChild(dot);
            header.appendChild(nameSpan);

            element.appendChild(header);

            const idWrap = document.createElement("div");
            idWrap.className = "flex flex-wrap gap-2";
            ids.forEach(id => {
                const chip = document.createElement("span");
                chip.className = "text-xs bg-black/40 px-2 py-1 rounded border border-white/10 text-gray-300 font-mono";
                chip.textContent = id;
                idWrap.appendChild(chip);
            });
            element.appendChild(idWrap);

            const qualityTagsForRegime = data.regimeQualityTags?.[rid];
            if (qualityTagsForRegime) {
                const qtSection = document.createElement("div");
                qtSection.className = "mt-2 pt-2 border-t border-white/5";
                const qtLabel = document.createElement("div");
                qtLabel.className = "text-[9px] text-gray-500 uppercase tracking-widest mb-1";
                qtLabel.textContent = "Mapping Quality / Metadata";
                qtSection.appendChild(qtLabel);
                const qtChips = document.createElement("div");
                qtChips.className = "flex flex-wrap gap-1";

                // qualityTagsForRegime is now { controlId: "Tag1: Val1; Tag2: Val2" }
                // Aggregate all unique tags for this regime + control combo
                const uniqueTags = new Set();
                Object.values(qualityTagsForRegime).forEach(tagStr => {
                    if (!tagStr) return;
                    tagStr.split(";").forEach(t => {
                        const trimmed = t.trim();
                        if (trimmed) uniqueTags.add(trimmed);
                    });
                });

                Array.from(uniqueTags).sort().forEach(tag => {
                    const qt = document.createElement("span");
                    qt.className = "text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300";
                    qt.textContent = tag;
                    qtChips.appendChild(qt);
                });
                qtSection.appendChild(qtChips);
                element.appendChild(qtSection);
            }

            mapContainer.appendChild(element);
        });

        if (!hasMappings) {
            mapContainer.innerHTML = "<div class=\"text-xs text-gray-600 italic p-2 dark:text-gray-500\">No active mappings for selected regimes.</div>";
        }
    }

    const empty = document.getElementById("detail-empty");
    const dataPanel = document.getElementById("detail-data");
    if (empty) {
        empty.classList.add("hidden");
    }
    if (dataPanel) {
        dataPanel.classList.remove("hidden");
    }

    const rightSidebar = document.getElementById("right-sidebar");
    if (rightSidebar && !rightSidebar.classList.contains("open")) {
        toggleSidebar("right");
    }
}

function closeDetails() {
    const empty = document.getElementById("detail-empty");
    const dataPanel = document.getElementById("detail-data");
    if (empty) {
        empty.classList.remove("hidden");
    }
    if (dataPanel) {
        dataPanel.classList.add("hidden");
    }
}

function updateBreadcrumbs(d) {
    UIComponents.updateBreadcrumbs(d, zoom);
}

// --- Theme Management ---
window.setTheme = (theme) => {
    localStorage.setItem("scf_theme", theme);

    if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }

    const select = document.getElementById("theme-select");
    if (select) {
        select.value = theme;
    }
};
window.setSizeBy = setSizeBy;
window.switchFramework = switchFramework;
window.removeTagFilter = removeTagFilter;
window.clearTagFilters = clearTagFilters;
window.returnToReadingView = returnToReadingView;
window.toggleSidebar = (side) => UIComponents.toggleSidebar(side, handleResize);
window.toggleAccordion = toggleAccordion;
window.toggleUnmappedVisibility = toggleUnmappedVisibility;

const storedTheme = localStorage.getItem("scf_theme") || "system";
window.setTheme(storedTheme);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (localStorage.getItem("scf_theme") === "system") {
        window.setTheme("system");
    }
});

async function initialize() {
    try {
        vizEngine = new VizEngine("viz-container", StateManager);
        applyURLState();

        StateManager.scfData = await StateManager.processor.init();

        migrateOldRegimeStorage();
        StateManager.selectedRegimeIds = StateManager.loadSelectedRegimes();

        initViz();
        setSizeBy(StateManager.currentSizeBy);
        initTreeselect();
        initHierarchyFieldsTreeselect();
        initHierarchyNavigatorTreeselect();
        initTagFilterPanel(StateManager.processor.config);
        initMappingQualityFilter();

        updateFrameworkBadge();
        updateRegimeLabel();
        updateFrameworkToggle();
        UIComponents.updateSidebarToggleA11y("left");
        UIComponents.updateSidebarToggleA11y("right");
        updateFilterBadge();
        updateLegend();
        applyURLFocus();
    } catch (error) {
        console.error("Failed to initialize visualizer:", error);
        showVizError(`Failed to load ${StateManager.processor.config.name}. Please ensure data files are accessible.`);
    }
}

initialize();
