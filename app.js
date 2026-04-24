// State
const DEFAULT_REGIMES = [62, 167, 226]; // CSF 2.0, EU DORA, India SEBI CSCRF
const SIZE_BY_STORAGE_KEY = "scf_size_by";
const { SIZE_BY_WEIGHT, SIZE_BY_UNIFORM } = SCFSizing;
let selectedRegimeIds = new Set();
let currentSizeBy = localStorage.getItem(SIZE_BY_STORAGE_KEY) || SIZE_BY_WEIGHT;

// Load from localStorage or use defaults
const savedRegimes = localStorage.getItem("scf_selected_regimes");
if (savedRegimes) {
    try {
        selectedRegimeIds = new Set(JSON.parse(savedRegimes));
    } catch {
        selectedRegimeIds = new Set(DEFAULT_REGIMES);
    }
} else {
    selectedRegimeIds = new Set(DEFAULT_REGIMES);
}

let showUnmapped = true;
let root;
let regimeTreeselect;
let scfData; // Globally available after processing
const HIERARCHY_ALIASES = {
    PPTDF_Applicability: "pptd",
    NIST_CSF_Function_Grouping: "nist",
    SCF_Domain: "domain",
    Conformity_Validation_Cadence: "cadent",
    Relative_Control_Weighting: "weight"
};
const REVERSE_ALIASES = Object.fromEntries(Object.entries(HIERARCHY_ALIASES).map(([key, value]) => [value, key]));

const processor = new SCFDataProcessor();
let svg;
let g;
let node;
let label;
let width;
let height;
let d3Zoom;
let focus;
let view;
const colors = d3.scaleOrdinal(d3.schemeTableau10);
const getRegimeColor = (rid) => colors(rid);
const getNodeKey = (d) => d.ancestors().map((currentNode) => currentNode.data.name).reverse().join(" > ");
const getProjectedScale = (targetView) => width / targetView[2];
const getProjectedRadius = (radius, targetView) => radius * getProjectedScale(targetView);
const getTargetView = (targetNode) => [targetNode.x, targetNode.y, targetNode.r * 2];
const getProjectedTransform = (x, y, targetView, yOffset = 0) => {
    const k = getProjectedScale(targetView);
    return `translate(${(x - targetView[0]) * k},${(y - targetView[1]) * k + yOffset})`;
};
let isReadingView = true;
let suppressPanZoomState = false;

function setSizeBy(value) {
    currentSizeBy = value === SIZE_BY_UNIFORM ? SIZE_BY_UNIFORM : SIZE_BY_WEIGHT;
    localStorage.setItem(SIZE_BY_STORAGE_KEY, currentSizeBy);

    const select = document.getElementById("size-by-select");
    if (select) {
        select.value = currentSizeBy;
    }

    updateVisualization();
    updateURL();
}

function getLabelMetrics(d, currentFocus, targetView) {
    const siblingIndex = d.parent?.children ? d.parent.children.indexOf(d) : 0;
    return {
        nodeDepth: d.depth,
        focusDepth: currentFocus.depth,
        projectedRadius: getProjectedRadius(d.r, targetView),
        siblingIndex,
        focusProjectedRadius: getProjectedRadius(currentFocus.r, targetView)
    };
}

function updateReadingViewUI() {
    const status = document.getElementById("reading-view-status");
    const indicator = document.getElementById("reading-view-indicator");
    const labelText = document.getElementById("reading-view-label");
    const button = document.getElementById("return-to-reading-view");

    if (!status || !indicator || !labelText || !button) {
        return;
    }

    const inReadingView = isReadingView;
    status.classList.toggle("border-amber-500/30", !inReadingView);
    status.classList.toggle("text-amber-700", !inReadingView);
    status.classList.toggle("dark:text-amber-300", !inReadingView);
    indicator.classList.toggle("bg-emerald-500", inReadingView);
    indicator.classList.toggle("bg-amber-500", !inReadingView);
    labelText.textContent = inReadingView ? "Reading View" : "Free Zoom View";
    button.classList.toggle("hidden", inReadingView);
}

function setReadingViewState(nextState) {
    isReadingView = nextState;
    updateReadingViewUI();
}

function resetPanZoomTransform(duration = 0) {
    if (!svg || !d3Zoom) {
        return;
    }

    suppressPanZoomState = true;

    if (duration > 0) {
        svg.transition().duration(duration).call(d3Zoom.transform, d3.zoomIdentity);
        window.setTimeout(() => {
            suppressPanZoomState = false;
        }, duration + 50);
        return;
    }

    svg.call(d3Zoom.transform, d3.zoomIdentity);
    g.attr("transform", null);
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

    const fontSize = SCFReadingMode.getLabelFontSize(getLabelMetrics(d, currentFocus, targetView));
    return `${fontSize}px`;
};

const getLabelOffset = (d, radius, currentFocus) => {
    const depthDiff = d.depth - (currentFocus?.depth || 0);
    // Only top-anchor the Focus node (Header) to keep center clear for primary children
    if (depthDiff === 0 && d.children && d.children.length > 0) {
        return -radius * 0.9;
    }

    return 0;
};

const getLabelOpacity = (d, currentFocus, targetView, isHovered = false) => {
    if (isHovered) {
        return 1;
    }

    const densityTier = SCFReadingMode.getLabelDensityTier(getLabelMetrics(d, currentFocus, targetView));
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
    return SCFReadingMode.getLabelEligibility(getLabelMetrics(d, currentFocus, targetView)) ? "inline" : "none";
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
    const container = document.getElementById("viz-container");
    width = container.clientWidth;
    height = container.clientHeight;

    d3.select("#viz-container").selectAll("svg").remove();

    svg = d3.select("#viz-container").append("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .style("display", "block")
        .style("background", "transparent")
        .style("cursor", "pointer")
        .on("click", (event) => {
            zoom(event, root);
            closeDetails(); // Close panel when clicking background
        });

    g = svg.append("g");
    updateVisualization();
}

function updateVisualization() {
    if (!scfData) {
        return;
    }

    const previousFocusName = focus?.data?.name;
    const previousLayout = root ? new Map(root.descendants().map((d) => [getNodeKey(d), { x: d.x, y: d.y, r: d.r }])) : new Map();

    // Re-build hierarchy based on selection
    const filteredData = filterData(JSON.parse(JSON.stringify(scfData)));

    if (!filteredData || !filteredData.children || filteredData.children.length === 0) {
        g.selectAll("*").remove();
        g.append("text")
            .attr("text-anchor", "middle")
            .attr("fill", "rgba(255,255,255,0.2)")
            .style("font-size", "14px")
            .text("No regimes selected or no matching controls found.");
        return;
    }

    const pack = (data) => d3.pack()
        .size([width, height])
        .padding((d) => d.depth === 1 ? 5 : 2)(
            d3.hierarchy(data)
                .sum((d) => d.value ?? SCFSizing.getLeafSizeValue(d, currentSizeBy))
                .sort((a, b) => (b.value ?? 0) - (a.value ?? 0) || d3.ascending(a.data.name, b.data.name))
        );

    root = pack(filteredData);
    focus = previousFocusName ? root.descendants().find((d) => d.data.name === previousFocusName) || root : root;
    const targetView = getTargetView(focus);

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

    g.selectAll("*").remove();

    node = g.append("g")
        .selectAll("circle")
        .data(root.descendants().slice(1))
        .join("circle")
        .attr("class", (d) => `node node--${d.depth} ${d.children ? "" : "node--leaf"}`)
        .style("fill", (d) => {
            if (d.depth === 1) {
                return "var(--scf-depth-1)";
            }

            if (d.depth === 2) {
                return "var(--scf-depth-2)";
            }

            if (d.depth === 3) {
                return "var(--scf-depth-3)";
            }

            if (d.depth === 4) {
                return "var(--scf-depth-4)";
            }

            if (d.depth === 5 || d.depth === 6) {
                return getRegimeColor(d.data.regimeId);
            }

            return "var(--node-fill-default)";
        })
        .style("fill-opacity", (d) => {
            if (d.depth === 5) {
                return 0.2; // Manual opacity for regime groups
            }

            return d.children ? 0.4 : 0.8;
        })
        .style("stroke", (d) => d.children ? "var(--node-stroke)" : "transparent")
        .style("stroke-width", 0.5)
        .on("mouseover", function handleMouseOver(_event, d) {
            d3.select(this)
                .style("stroke", "var(--node-stroke-hover)")
                .style("stroke-width", d.depth === 4 ? "3px" : "2px");

            label.filter((labelNode) => labelNode === d)
                .transition().duration(200)
                .style("display", "inline")
                .style("fill-opacity", 1)
                .style("font-size", getLabelSize(d, focus, targetView, true))
                .style("font-weight", 700);
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

    label = g.append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(root.descendants().sort((a, b) => b.depth - a.depth))
        .join("text")
        .attr("class", "label");

    refreshLabelContent(focus, targetView);

    const getInitialLayout = (d) => previousLayout.get(getNodeKey(d)) || { x: focus.x, y: focus.y, r: 0 };

    node.attr("transform", (d) => {
        const initial = getInitialLayout(d);
        return getProjectedTransform(initial.x, initial.y, targetView);
    }).attr("r", (d) => {
        const initial = getInitialLayout(d);
        return getProjectedRadius(initial.r, targetView);
    });

    label.attr("transform", (d) => {
        const initial = getInitialLayout(d);
        return getProjectedTransform(
            initial.x,
            initial.y,
            targetView,
            getLabelOffset(d, getProjectedRadius(initial.r, targetView), focus)
        );
    });

    label.style("font-size", (d) => getLabelSize(d, focus, targetView))
        .style("fill-opacity", (d) => getLabelOpacity(d, focus, targetView))
        .style("display", (d) => getLabelDisplay(d, focus, targetView));

    updateNodeStyles(focus);

    const transition = svg.transition().duration(previousLayout.size > 0 ? 650 : 0);
    node.transition(transition)
        .attr("transform", (d) => getProjectedTransform(d.x, d.y, targetView))
        .attr("r", (d) => getProjectedRadius(d.r, targetView));
    label.transition(transition)
        .attr("transform", (d) => getProjectedTransform(d.x, d.y, targetView, getLabelOffset(d, getProjectedRadius(d.r, targetView), focus)));

    view = targetView;
    setReadingViewState(true);
    updateBreadcrumbs(focus);
    if (previousLayout.size === 0) {
        zoomTo(targetView);
    }

    window.externalZoom = (d) => {
        zoom({ stopPropagation() {} }, d);
    };
}

function setupPanZoom() {
    d3Zoom = d3.zoom()
        .scaleExtent([0.1, 40])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
            if (!suppressPanZoomState) {
                setReadingViewState(event.transform.k === 1 && event.transform.x === 0 && event.transform.y === 0);
            }
        });

    svg.call(d3Zoom).on("dblclick.zoom", null);
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
                if (currentNode.depth === 1) {
                    return "var(--scf-depth-1)";
                }

                if (currentNode.depth === 2) {
                    return "var(--scf-depth-2)";
                }

                if (currentNode.depth === 3) {
                    return "var(--scf-depth-3)";
                }

                if (currentNode.depth === 4) {
                    return "var(--scf-depth-4)";
                }

                if (currentNode.depth === 5 || currentNode.depth === 6) {
                    return getRegimeColor(currentNode.data.regimeId);
                }

                return "var(--node-fill-default)";
            })
                .style("stroke", (currentNode) => currentNode.children ? "var(--node-stroke)" : "transparent")
                .style("stroke-width", "0.5px");
        }

        element.style("fill-opacity", (currentNode) => {
            if (currentNode.depth === 5) {
                return 0.2;
            }

            return currentNode.children ? 0.4 : 0.8;
        });
    });
}

function zoomTo(v) {
    if (!label || !node) {
        return;
    }

    const k = width / v[2];
    view = v;
    label.attr("transform", (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k + getLabelOffset(d, d.r * k, focus)})`);
    node.attr("transform", (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("r", (d) => d.r * k);
}

function zoom(_event, d, options = {}) {
    if (!options.keepReadingView) {
        resetPanZoomTransform();
    }

    focus = d;
    const targetView = getTargetView(focus);
    const transition = svg.transition()
        .duration(750)
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
    const container = document.getElementById("hierarchy-navigator-treeselect");
    container.innerHTML = "";

    new Treeselect({
        parentHtmlContainer: container,
        options,
        value: "",
        isSingleSelect: true,
        isSearchable: true,
        isIndependentNodes: true,
        isBranchSelectable: true,
        placeholder: "Jump to Control or Domain...",
        clearable: true,
        alwaysOpen: true,
        showCheckbox: false,
        showTags: false,
        staticList: true,
        openLevel: 10,
        inputCallback: (value) => {
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
    });
}

function filterData(data) {
    function recurse(nodeData, depth) {
        if (depth === 4 || nodeData.mappings) {
            const regimeGroups = {};
            const visibleMappingLeafCount = SCFSizing.getVisibleMappingLeafCount(nodeData.mappings, selectedRegimeIds);

            for (const [regimeId, identifiers] of Object.entries(nodeData.mappings || {})) {
                const rid = Number.parseInt(regimeId, 10);
                if (!selectedRegimeIds.has(rid)) {
                    continue;
                }

                const regInfo = scfData.regimeList[rid];
                const regimeName = regInfo.name;

                if (!regimeGroups[regimeName]) {
                    regimeGroups[regimeName] = {
                        name: regimeName,
                        regimeId: rid,
                        children: []
                    };
                }

                identifiers.forEach((id) => {
                    regimeGroups[regimeName].children.push({
                        name: id,
                        regimeId: rid,
                        value: SCFSizing.getMappedLeafValue(nodeData, visibleMappingLeafCount, currentSizeBy)
                    });
                });
            }

            const validRegimeNodes = Object.values(regimeGroups);
            if (validRegimeNodes.length === 0 && !showUnmapped) {
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

function toggleSidebar(side) {
    const isLeft = side === "left";
    const sidebar = document.getElementById(isLeft ? "left-sidebar" : "right-sidebar");
    const icon = document.getElementById(isLeft ? "left-toggle-icon" : "right-toggle-icon");
    const main = document.querySelector("main");

    if (isLeft) {
        sidebar.classList.toggle("collapsed");
        const isCollapsed = sidebar.classList.contains("collapsed");
        icon.innerText = isCollapsed ? "▶" : "◀";
        main.style.marginLeft = isCollapsed ? "0" : "320px";
    } else {
        sidebar.classList.toggle("open");
        const isOpen = sidebar.classList.contains("open");
        icon.innerText = isOpen ? "▶" : "◀";
        main.style.marginRight = isOpen ? "384px" : "0";
    }

    setTimeout(() => {
        handleResize();
    }, 400);
}

function handleResize() {
    const container = document.getElementById("viz-container");
    if (!container) {
        return;
    }

    width = container.clientWidth;
    height = container.clientHeight;

    if (svg) {
        svg.attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`);
        if (root && view) {
            zoomTo([view[0], view[1], view[2]]);
        }
    }
}

window.addEventListener("resize", handleResize);

function toggleAccordion(id) {
    const content = document.getElementById(id);
    const item = content.parentElement;
    if (content.style.maxHeight && content.style.maxHeight !== "0px") {
        content.style.maxHeight = "0px";
        item.classList.remove("open");
        return;
    }

    content.style.maxHeight = "500px";
    item.classList.add("open");
}

function updateURL() {
    const params = new URLSearchParams();

    if (window.regimeTreeselect) {
        const value = regimeTreeselect.value;
        if (value && value.length > 0) {
            params.set("r", value.join(","));
        }
    } else if (selectedRegimeIds.size > 0) {
        params.set("r", Array.from(selectedRegimeIds).join(","));
    }

    if (processor.currentHierarchy.length > 0) {
        const aliased = processor.currentHierarchy.map((id) => HIERARCHY_ALIASES[id] || id);
        params.set("h", aliased.join(","));
    }

    if (showUnmapped) {
        params.set("u", "1");
    }

    if (currentSizeBy !== SIZE_BY_WEIGHT) {
        params.set("s", currentSizeBy);
    }

    if (focus && focus !== root) {
        params.set("f", focus.data.name);
    }

    const newHash = params.toString();
    if (window.location.hash.substring(1) !== newHash) {
        window.history.replaceState(null, null, `#${newHash}`);
    }
}

function applyURLState() {
    const hash = window.location.hash.substring(1);
    if (!hash) {
        return;
    }

    const params = new URLSearchParams(hash);

    if (params.has("u")) {
        showUnmapped = params.get("u") === "1";
        const toggle = document.getElementById("toggle-unmapped");
        if (toggle) {
            toggle.checked = showUnmapped;
        }
    }

    if (params.has("s")) {
        const sizeBy = params.get("s");
        currentSizeBy = sizeBy === SIZE_BY_UNIFORM ? SIZE_BY_UNIFORM : SIZE_BY_WEIGHT;
    }

    if (params.has("h")) {
        const aliased = params.get("h").split(",");
        const fields = aliased.map((alias) => REVERSE_ALIASES[alias] || alias);
        if (fields.length > 0) {
            processor.currentHierarchy = fields;
        }
    }

    if (params.has("r")) {
        const rawValues = params.get("r").split(",");
        window._initialRegimeValue = rawValues.map((value) => value.startsWith("cat-") ? value : Number(value));
    }
}

function applyURLFocus() {
    const hash = window.location.hash.substring(1);
    if (!hash) {
        return;
    }

    const params = new URLSearchParams(hash);
    const focusName = params.get("f");

    if (focusName && root) {
        const target = root.descendants().find((d) => d.data.name === focusName);
        if (target) {
            setTimeout(() => {
                window.externalZoom(target);
                if (target.data.mappings) {
                    showDetails(target.data);
                }
            }, 500);
        }
    }
}

function initTreeselect() {
    const options = Object.keys(scfData.regimeCatalog).sort().map((category) => ({
        name: category,
        value: `cat-${category}`,
        children: scfData.regimeCatalog[category].map((regime) => ({
            name: regime.name,
            value: regime.id
        }))
    }));

    const container = document.getElementById("treeselect-container");
    regimeTreeselect = new Treeselect({
        parentHtmlContainer: container,
        value: window._initialRegimeValue || Array.from(selectedRegimeIds),
        options,
        isMultiple: true,
        isSearchable: true,
        placeholder: "Search frameworks...",
        clearable: true,
        alwaysOpen: true,
        staticList: true,
        inputCallback: (value) => {
            const selectedIds = value.reduce((accumulator, currentValue) => {
                if (typeof currentValue === "number") {
                    accumulator.push(currentValue);
                } else if (typeof currentValue === "string" && currentValue.startsWith("cat-")) {
                    const categoryName = currentValue.replace("cat-", "");
                    const categoryRegimes = scfData.regimeCatalog[categoryName];
                    if (categoryRegimes) {
                        categoryRegimes.forEach((regime) => accumulator.push(regime.id));
                    }
                }

                return accumulator;
            }, []);

            selectedRegimeIds = new Set(selectedIds);
            localStorage.setItem("scf_selected_regimes", JSON.stringify(Array.from(selectedRegimeIds)));
            updateVisualization();
            updateLegend();
            updateURL();
        }
    });

    if (window._initialRegimeValue) {
        const selectedIds = window._initialRegimeValue.reduce((accumulator, currentValue) => {
            if (typeof currentValue === "number") {
                accumulator.push(currentValue);
            } else if (typeof currentValue === "string" && currentValue.startsWith("cat-")) {
                const categoryName = currentValue.replace("cat-", "");
                const categoryRegimes = scfData.regimeCatalog[categoryName];
                if (categoryRegimes) {
                    categoryRegimes.forEach((regime) => accumulator.push(regime.id));
                }
            }

            return accumulator;
        }, []);
        selectedRegimeIds = new Set(selectedIds);
    }
}

function initHierarchyFieldsTreeselect() {
    const container = document.getElementById("hierarchy-fields-treeselect");
    if (!container) {
        return;
    }

    const renderWidget = () => {
        container.innerHTML = "";
        const active = processor.currentHierarchy || [];
        const allColumns = processor.hierarchyColumns;

        const activeWrapper = document.createElement("div");
        activeWrapper.className = "flex flex-col gap-2 mb-4";

        if (active.length > 0) {
            activeWrapper.innerHTML = '<div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active Hierarchy Order</div>';
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
                    processor.currentHierarchy.splice(index, 1);
                    updateState();
                };
                activeWrapper.appendChild(item);
            });
        } else {
            activeWrapper.innerHTML = '<div class="text-xs text-gray-500 italic p-2 text-center border border-dashed border-white/10 rounded">No hierarchy levels selected.<br>Select fields below to start.</div>';
        }
        container.appendChild(activeWrapper);

        const availableWrapper = document.createElement("div");
        availableWrapper.className = "flex flex-wrap gap-2";
        availableWrapper.innerHTML = '<div class="w-full text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Available Fields</div>';

        const available = allColumns.filter((column) => !active.includes(column.id));
        if (available.length === 0) {
            availableWrapper.innerHTML += '<div class="text-xs text-gray-600 italic">All fields selected.</div>';
        }

        available.forEach((column) => {
            const button = document.createElement("button");
            button.className = "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-2 py-1 rounded text-xs border border-white/5 transition-colors text-left";
            button.innerText = column.name;
            button.onclick = () => {
                processor.currentHierarchy.push(column.id);
                updateState();
            };
            availableWrapper.appendChild(button);
        });
        container.appendChild(availableWrapper);
    };

    const updateState = () => {
        scfData = processor.buildTree(processor.currentHierarchy);
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

    new Treeselect({
        parentHtmlContainer: container,
        options: nestedOptions,
        value: null,
        isSingleSelect: true,
        isSearchable: true,
        placeholder: "Jump to Control or Domain...",
        clearable: true,
        alwaysOpen: true,
        staticList: true,
        showCheckbox: false,
        disableBranchNodes: false,
        expandSelected: true,
        inputCallback: (value) => {
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
    });
}

function toggleUnmappedVisibility(checked) {
    showUnmapped = checked;
    updateVisualization();
    updateURL();
}

function updateLegend() {
    const container = document.getElementById("regime-legend");
    container.innerHTML = "";

    selectedRegimeIds.forEach((rid) => {
        const regime = scfData.regimeList[rid];
        if (!regime) {
            return;
        }

        const item = document.createElement("div");
        item.className = "bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-xl";
        item.innerHTML = `
            <div class="w-2 h-2 rounded-full" style="background: ${getRegimeColor(rid)}"></div>
            <span class="text-[9px] font-bold text-white uppercase tracking-wider">${regime.name}</span>
        `;
        container.appendChild(item);
    });
}

function showDetails(data) {
    if (!data || !data.mappings) {
        return;
    }

    const safeSetText = (id, text) => {
        const element = document.getElementById(id);
        if (element) {
            element.innerText = text;
        }
    };

    safeSetText("detail-id", data.name.split(":")[0]);
    safeSetText("detail-title", data.name.split(":")[1]?.trim() || data.name);
    safeSetText("detail-desc", data.description || "No description provided.");
    safeSetText("detail-weight", data.weight || "1.0");

    const pptdf = Object.keys(HIERARCHY_ALIASES).find((key) => data[key]) || "Unspecified";
    safeSetText("detail-pptdf", pptdf.replace(/_/g, " "));

    const mapContainer = document.getElementById("detail-mappings");
    if (mapContainer) {
        mapContainer.innerHTML = "";

        const mappings = data.mappings || {};
        let hasMappings = false;

        Object.entries(mappings).forEach(([rid, ids]) => {
            hasMappings = true;
            const regimeInfo = scfData.regimeList[rid];
            if (!regimeInfo || !selectedRegimeIds.has(Number.parseInt(rid, 10))) {
                return;
            }

            const element = document.createElement("div");
            element.className = "bg-white/5 rounded-lg p-3 border border-white/5";
            element.innerHTML = `
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-2 h-2 rounded-full" style="background: ${getRegimeColor(rid)}"></div>
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${regimeInfo.name}</span>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${ids.map((id) => `<span class="text-xs bg-black/40 px-2 py-1 rounded border border-white/10 text-gray-300 font-mono">${id}</span>`).join("")}
                </div>
            `;
            mapContainer.appendChild(element);
        });

        if (!hasMappings) {
            mapContainer.innerHTML = '<div class="text-xs text-gray-600 italic p-2 dark:text-gray-500">No active mappings for selected regimes.</div>';
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
    const crumb = document.getElementById("breadcrumbs");
    if (!d) {
        return;
    }

    const ancestors = d.ancestors().reverse();
    crumb.innerHTML = "";

    ancestors.forEach((currentNode, index) => {
        const isLast = index === ancestors.length - 1;
        const span = document.createElement("span");
        span.textContent = currentNode.data.name.split(":")[0];
        span.className = isLast
            ? "font-bold text-slate-900 dark:text-white"
            : "cursor-pointer hover:text-blue-500 transition-colors duration-200 text-slate-500 dark:text-slate-400";

        if (!isLast) {
            span.onclick = (event) => {
                event.stopPropagation();
                zoom(event, currentNode);
            };
        }

        crumb.appendChild(span);

        if (!isLast) {
            const separator = document.createElement("span");
            separator.className = "mx-1 opacity-30 text-gray-500 dark:text-gray-400";
            separator.textContent = "/";
            crumb.appendChild(separator);
        }
    });
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
window.returnToReadingView = returnToReadingView;
window.toggleSidebar = toggleSidebar;
window.toggleAccordion = toggleAccordion;
window.toggleUnmappedVisibility = toggleUnmappedVisibility;

const storedTheme = localStorage.getItem("scf_theme") || "system";
setTheme(storedTheme);
setSizeBy(currentSizeBy);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (localStorage.getItem("scf_theme") === "system") {
        setTheme("system");
    }
});

window.addEventListener("load", async () => {
    try {
        applyURLState();

        scfData = await processor.init("data/scf_controls_2026_1.csv", "data/scf_domains_2026_1.csv");

        initViz();
        initTreeselect();
        initHierarchyFieldsTreeselect();
        initHierarchyNavigatorTreeselect();

        updateLegend();
        applyURLFocus();
    } catch (error) {
        console.error("Failed to initialize SCF Visualizer:", error);
        alert("Error loading SCF data. Please ensure CSV files are accessible.");
    }
});
