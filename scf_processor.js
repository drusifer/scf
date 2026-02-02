class SCFDataProcessor {
    constructor() {
        this.hierarchyColumns = [
            { id: "PPTDF_Applicability", raw: "PPTDF\nApplicability", name: "PPTDF Applicability" },
            { id: "NIST_CSF_Function_Grouping", raw: "NIST CSF\nFunction Grouping", name: "NIST CSF Function Grouping" },
            { id: "SCF_Domain", raw: "SCF Domain", name: "SCF Domain" },
            { id: "Conformity_Validation_Cadence", raw: "Conformity Validation\nCadence", name: "Conformity Validation Cadence" },
            { id: "Relative_Control_Weighting", raw: "Relative Control Weighting", name: "Relative Control Weighting" }
        ];
        this.currentHierarchy = [
            "PPTDF_Applicability",
            "NIST_CSF_Function_Grouping",
            "SCF_Domain"
        ];
        this.rawControls = [];
        this.domains = {};
        this.regimeCatalog = {};
        this.regimeList = [];
    }

    async loadCSV(url) {
        return new Promise((resolve, reject) => {
            Papa.parse(url, {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results),
                error: (error) => reject(error)
            });
        });
    }

    async init(controlsUrl, domainsUrl) {
        console.log("Initializing SCF Processor...");
        const [controlsData, domainsData] = await Promise.all([
            this.loadCSV(controlsUrl),
            this.loadCSV(domainsUrl)
        ]);

        this.rawControls = controlsData.data;
        this.header = controlsData.meta.fields;
        console.log("Raw CSV Headers:", this.header);
        if (this.rawControls.length > 0) {
            console.log("First Control Row Keys:", Object.keys(this.rawControls[0]));
        }

        // Process Domains
        domainsData.data.forEach(row => {
            const name = row['SCF Domain']?.trim();
            if (name) {
                this.domains[name] = row['Principle Intent']?.trim();
            }
        });

        // Identify Regime Columns (Starting from column 30 like the Python script)
        // Note: PapaParse includes all fields, so we find the start index
        const regimeStartIdx = 30;
        const rawRegimeHeaders = this.header.slice(regimeStartIdx);

        rawRegimeHeaders.forEach((h, i) => {
            if (!h) return;
            const lines = h.split('\n');
            const category = lines[0]?.trim() || "General";
            const name = lines.slice(1).map(l => l.trim()).filter(l => l).join(' ') || category;
            const fullName = h.trim().replace(/\n/g, ' ').replace(/\r/g, '');

            const regimeInfo = { id: i, category, name, fullName };
            this.regimeList.push(regimeInfo);
            if (!this.regimeCatalog[category]) {
                this.regimeCatalog[category] = [];
            }
            this.regimeCatalog[category].push(regimeInfo);
        });

        console.log(`Processed ${this.rawControls.length} controls.`);
        return this.buildTree(this.currentHierarchy);
    }

    buildTree(hierarchy) {
        const rootChildren = {};
        const seenControls = {};
        const regimeStartIdx = 30;

        this.rawControls.forEach(row => {
            const scfId = row['SCF #']?.trim();
            if (!scfId) return;

            const scfName = row['SCF Control']?.trim();
            const desc = row['Secure Controls Framework (SCF)\nControl Description']?.trim();
            const weightStr = row['Relative Control Weighting']?.trim();

            const pathValues = hierarchy.map(id => {
                const colInfo = this.hierarchyColumns.find(c => c.id === id);
                if (!colInfo) return "Uncategorized";

                // Robust normalization: lowercase and remove all non-alphanumeric
                const normalize = (s) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
                const targetKey = normalize(id.includes('_') ? colInfo.raw : id); // Handle both ID and raw fallback

                // Find matching key in row
                const actualKey = Object.keys(row).find(k => normalize(k) === targetKey);
                const val = actualKey ? row[actualKey] : undefined;

                if (val === undefined) {
                    console.warn(`Key mismatch: Could not find column for ${id} (target: ${targetKey})`);
                }

                return val?.trim() || "Uncategorized";
            });

            if (seenControls[scfId]) {
                const controlNode = seenControls[scfId];
                this.regimeList.forEach((rInfo, i) => {
                    const val = row[this.header[regimeStartIdx + i]]?.trim();
                    if (val) {
                        const identifiers = val.toLowerCase() === 'x' ? [scfId] : val.replace(/\n/g, ',').split(',').map(id => id.trim()).filter(id => id);
                        if (!controlNode.mappings[i]) controlNode.mappings[i] = [];
                        const existing = new Set(controlNode.mappings[i]);
                        identifiers.forEach(id => existing.add(id));
                        controlNode.mappings[i] = Array.from(existing);
                    }
                });
                return;
            }

            let currentLevel = rootChildren;
            pathValues.forEach(val => {
                if (!currentLevel[val]) {
                    currentLevel[val] = { name: val, children: {} };
                }
                currentLevel = currentLevel[val].children;
            });

            const controlNode = {
                name: `${scfId}: ${scfName}`,
                description: desc,
                weight: parseFloat(weightStr) || 1.0,
                mappings: {}
            };

            this.regimeList.forEach((rInfo, i) => {
                const val = row[this.header[regimeStartIdx + i]]?.trim();
                if (val) {
                    const identifiers = val.toLowerCase() === 'x' ? [scfId] : val.replace(/\n/g, ',').split(',').map(id => id.trim()).filter(id => id);
                    controlNode.mappings[i] = identifiers;
                }
            });

            currentLevel[scfId] = controlNode;
            seenControls[scfId] = controlNode;
        });

        const dictToList = (nodeDict) => {
            return Object.values(nodeDict).map(node => {
                if (node.children) {
                    node.children = dictToList(node.children);
                }
                return node;
            });
        };

        return {
            name: "SCF 2025.4",
            regimeCatalog: this.regimeCatalog,
            regimeList: this.regimeList,
            children: dictToList(rootChildren)
        };
    }
}
