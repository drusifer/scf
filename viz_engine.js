import { VizUtils } from "./viz_utils.js";

/**
 * Main D3 Rendering Engine for the SCF Visualizer.
 */
export class VizEngine {
    constructor(containerId, state) {
        this.containerId = containerId;
        this.state = state;
        this.svg = null;
        this.g = null;
        this.width = 0;
        this.height = 0;
        this.d3Zoom = null;
        const D3 = window.d3;
        if (!D3) {
            console.error("D3 is not loaded.");
            return;
        }
        this.colors = D3.scaleOrdinal(D3.schemeTableau10);
    }

    init() {
        const container = document.getElementById(this.containerId);
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        const D3 = window.d3;
        if (!D3) return;

        D3.select(`#${this.containerId}`).selectAll("svg").remove();

        this.svg = D3.select(`#${this.containerId}`).append("svg")
            .attr("viewBox", `-${this.width / 2} -${this.height / 2} ${this.width} ${this.height}`)
            .style("display", "block")
            .style("background", "transparent")
            .style("cursor", "pointer");

        this.g = this.svg.append("g");
    }

    getRegimeColor(rid) {
        return this.colors(rid);
    }

    handleResize() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        this.width = container.clientWidth;
        this.height = container.clientHeight;

        if (this.svg) {
            this.svg.attr("viewBox", `-${this.width / 2} -${this.height / 2} ${this.width} ${this.height}`);
        }
    }

    pack(data, sizingValueFn) {
        const D3 = window.d3;
        if (!D3) return null;
        return D3.pack()
            .size([this.width, this.height])
            .padding((d) => d.depth === 1 ? 5 : 2)(
                D3.hierarchy(data)
                    .sum(sizingValueFn)
                    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0) || D3.ascending(a.data.name, b.data.name))
            );
    }
}
