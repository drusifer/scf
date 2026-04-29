
export class FrameworkDataProcessor {
    constructor(config) {
        this.config = config;
        this.hierarchyColumns = config.hierarchy_cols;
        this.currentHierarchy = [...config.default_hierarchy];
        this.rawControls = [];
        this.domains = {};
        this.regimeCatalog = {};
        this.regimeList = [];
        this.header = [];
    }

    async loadCSV(url) {
        const parser = typeof Papa !== "undefined" ? Papa : null;
        if (!parser) {
            throw new Error("PapaParse (Papa) is not loaded. Please ensure papaparse.min.js is included.");
        }
        return new Promise((resolve, reject) => {
            parser.parse(url, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results),
                error: (error) => reject(error)
            });
        });
    }

    async init() {
        const cfg = this.config;
        let controlsResult, domainsResult;
        try {
            [controlsResult, domainsResult] = await Promise.all([
                this.loadCSV(cfg.files.controls),
                this.loadCSV(cfg.files.domains)
            ]);
        } catch (err) {
            throw new Error(`Failed to load framework "${cfg.name}": ${err.message}`);
        }

        this.rawControls = controlsResult.data;
        this.header = controlsResult.meta.fields;

        this._validateSchemaColumns();
        this._processDomains(domainsResult.data);
        this._detectRegimes(this.header);

        return this.buildTree(this.currentHierarchy);
    }

    _validateSchemaColumns() {
        const cs = this.config.schema.controls;
        const headerSet = new Set(this.header);
        const checkCol = (col) => {
            if (col && !headerSet.has(col)) {
                console.warn(`[FrameworkDataProcessor] Column not found in CSV: "${col}" (framework: ${this.config.name})`);
            }
        };
        checkCol(cs.domain_col);
        checkCol(cs.category_col);
        checkCol(cs.subcategory_col);
        checkCol(cs.weight_col);
        checkCol(cs.control_id_col);
        checkCol(cs.description_col);
        cs.tag_cols.forEach(checkCol);
    }

    _processDomains(rows) {
        const { name_col, intent_col } = this.config.schema.domains;
        rows.forEach(row => {
            const name = row[name_col]?.trim();
            if (name) this.domains[name] = row[intent_col]?.trim();
        });
    }

    _detectRegimes(headers) {
        this.regimeCatalog = {};
        this.regimeList = [];
        const cs = this.config.schema.controls;

        if (cs.mapping_tag_suffix) {
            // CRI-style: find TAGS columns, exclude framework tag_cols, infer regime from stripped name
            const tagColSet = new Set(cs.tag_cols);
            headers.forEach(h => {
                if (h.endsWith(cs.mapping_tag_suffix) && !tagColSet.has(h)) {
                    const regimeName = h.slice(0, h.length - cs.mapping_tag_suffix.length);
                    const regimeInfo = {
                        id: this.regimeList.length,
                        category: regimeName,
                        name: regimeName,
                        fullName: regimeName,
                        col: regimeName,
                        tagsCol: h
                    };
                    this.regimeList.push(regimeInfo);
                    if (!this.regimeCatalog[regimeName]) this.regimeCatalog[regimeName] = [];
                    this.regimeCatalog[regimeName].push(regimeInfo);
                }
            });
        } else {
            // SCF-style: positional slice from regime_start_col
            const rawRegimeHeaders = headers.slice(cs.regime_start_col);
            rawRegimeHeaders.forEach((h, i) => {
                if (!h) return;
                const lines = h.split("\n");
                const category = lines[0]?.trim() || "General";
                const name = lines.slice(1).map(l => l.trim()).filter(l => l).join(" ") || category;
                const fullName = h.trim().replace(/\n/g, " ").replace(/\r/g, "");
                const regimeInfo = { id: i, category, name, fullName };
                this.regimeList.push(regimeInfo);
                if (!this.regimeCatalog[category]) this.regimeCatalog[category] = [];
                this.regimeCatalog[category].push(regimeInfo);
            });
        }
    }

    _buildTagsForRow(row) {
        const tags = [];
        this.config.schema.controls.tag_cols.forEach(col => {
            const val = row[col]?.trim();
            if (!val) return;
            val.split("\n").forEach(t => {
                const trimmed = t.trim();
                if (trimmed) tags.push(trimmed);
            });
        });
        return tags;
    }

    buildTree(hierarchy) {
        const cs = this.config.schema.controls;
        const rootChildren = {};
        const seenControls = {};

        this.rawControls.forEach(row => {
            const controlId = row[cs.control_id_col]?.trim();
            if (!controlId) return;

            const controlName = row[cs.subcategory_col]?.trim();
            const desc = row[cs.description_col]?.trim();
            const weightStr = row[cs.weight_col]?.trim();

            const pathValues = hierarchy.map(id => {
                const colInfo = this.hierarchyColumns.find(c => c.id === id);
                if (!colInfo) return "Uncategorized";

                const normalize = (s) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
                const targetKey = normalize(colInfo.raw);
                const actualKey = Object.keys(row).find(k => normalize(k) === targetKey);
                const val = actualKey ? row[actualKey]?.trim() : undefined;

                return val || "Uncategorized";
            });

            if (seenControls[controlId]) {
                const controlNode = seenControls[controlId];
                this._mergeRegimeMappings(row, controlNode, controlId);
                return;
            }

            let currentLevel = rootChildren;
            pathValues.forEach(val => {
                if (!currentLevel[val]) {
                    currentLevel[val] = { 
                        name: val, 
                        children: {},
                        nodeType: "container" 
                    };
                }
                currentLevel = currentLevel[val].children;
            });

            const controlNode = {
                name: `${controlId}: ${controlName}`,
                description: desc,
                weight: parseFloat(weightStr) || 1.0,
                mappings: {},
                tags: this._buildTagsForRow(row),
                nodeType: "control"
            };

            this._mergeRegimeMappings(row, controlNode, controlId);
            currentLevel[controlId] = controlNode;
            seenControls[controlId] = controlNode;
        });

        const dictToList = (nodeDict) =>
            Object.values(nodeDict).map(node => {
                if (node.children) node.children = dictToList(node.children);
                return node;
            });

        return {
            name: this.config.name,
            regimeCatalog: this.regimeCatalog,
            regimeList: this.regimeList,
            children: dictToList(rootChildren)
        };
    }

    _mergeRegimeMappings(row, controlNode, controlId) {
        const cs = this.config.schema.controls;

        if (cs.mapping_tag_suffix) {
            // CRI: pairing Nth control ID with Nth tag set
            this.regimeList.forEach((rInfo, i) => {
                const idVal = row[rInfo.col]?.trim();
                if (!idVal) return;

                const tagVal = rInfo.tagsCol ? row[rInfo.tagsCol]?.trim() : "";
                const identifiers = idVal.toLowerCase() === "x"
                    ? [controlId]
                    : idVal.split("\n").map(s => s.trim()).filter(s => s);

                // Use empty string for tags if tags column has fewer lines than IDs column
                const tags = tagVal ? tagVal.split("\n").map(s => s.trim()) : [];

                if (!controlNode.mappings[i]) controlNode.mappings[i] = [];
                const existingIds = new Set(controlNode.mappings[i]);

                if (!controlNode.regimeQualityTags) controlNode.regimeQualityTags = {};
                if (!controlNode.regimeQualityTags[i]) controlNode.regimeQualityTags[i] = {};

                identifiers.forEach((id, idx) => {
                    if (!existingIds.has(id)) {
                        controlNode.mappings[i].push(id);
                        existingIds.add(id);
                    }
                    // Pair ID with its specific quality tag set (semicolon-delimited string)
                    controlNode.regimeQualityTags[i][id] = tags[idx] || "";
                });
            });
        } else {
            // SCF: regime columns are at header[regime_start_col + i]
            this.regimeList.forEach((rInfo, i) => {
                const val = row[this.header[cs.regime_start_col + i]]?.trim();
                if (!val) return;
                const identifiers = val.toLowerCase() === "x"
                    ? [controlId]
                    : val.replace(/\n/g, ",").split(",").map(s => s.trim()).filter(s => s);
                if (!controlNode.mappings[i]) controlNode.mappings[i] = [];
                const existing = new Set(controlNode.mappings[i]);
                identifiers.forEach(id => existing.add(id));
                controlNode.mappings[i] = Array.from(existing);
            });
        }
    }
}
