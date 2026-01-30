import Papa from 'papaparse';

/**
 * Data Processor for SCF CSV data.
 * Handles parsing, hierarchy construction, and memoization.
 */
export class DataProcessor {
    constructor() {
        this.rawControls = null;
        this.domains = null;
        this.hierarchy = null;
        this.regimes = [];
        this.idMap = new Map();
    }

    lookupNodeById(id) {
        return this.idMap.get(id);
    }

    async loadData(controlsUrl, domainsUrl) {
        const [controlsRes, domainsRes] = await Promise.all([
            fetch(controlsUrl).then(res => res.text()),
            fetch(domainsUrl).then(res => res.text())
        ]);

        this.domains = Papa.parse(domainsRes, { header: true, skipEmptyLines: true }).data;

        return new Promise((resolve) => {
            Papa.parse(controlsRes, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    this.rawControls = results.data;
                    this.identifyRegimes(results.meta.fields);
                    this.buildHierarchy();
                    resolve(this.hierarchy);
                }
            });
        });
    }

    identifyRegimes(fields) {
        const nonRegimeColumns = [
            'SCF Domain', 'SCF Control', 'SCF #', 'Secure Controls Framework (SCF)',
            'Control Description', 'Conformity Validation', 'Cadence',
            'Evidence Request List (ERL) #', 'Possible Solutions & Considerations',
            'SCF Control Question', 'Relative Control Weighting', 'PPTDF',
            'Applicability', 'Function Grouping', 'SCRM Focus'
        ];

        this.regimes = fields.filter(f => {
            const cleanField = f.replace(/\r?\n|\r/g, ' ').trim();
            return !nonRegimeColumns.some(nr => cleanField.includes(nr)) && cleanField.length > 0;
        });
    }

    buildHierarchy() {
        const root = { id: 0, name: 'SCF 2025.4', type: 'root', children: [], value: 0 };
        const domainMap = new Map();
        const pptdfMaps = new Map();
        const controlMaps = new Map();

        let idCounter = 1;
        this.idMap.clear();
        this.idMap.set(root.id, root);

        console.time('HierarchyBuild');
        this.rawControls.forEach(ctrl => {
            const domainName = ctrl['SCF Domain'];
            if (!domainName) return;

            // 1. Domain
            let domainNode = domainMap.get(domainName);
            if (!domainNode) {
                domainNode = {
                    id: idCounter++,
                    name: domainName,
                    type: 'domain',
                    children: [],
                    value: 0,
                    parent: root,
                    description: this.getDomainDescription(domainName)
                };
                domainMap.set(domainName, domainNode);
                this.idMap.set(domainNode.id, domainNode);
                root.children.push(domainNode);
                pptdfMaps.set(domainNode, new Map());
            }

            // 2. PPTDF
            const pptdfType = (ctrl['PPTDF\nApplicability'] || ctrl['PPTDF'] || 'Uncategorized').trim();
            const domainPptdfs = pptdfMaps.get(domainNode);
            let pptdfNode = domainPptdfs.get(pptdfType);
            if (!pptdfNode) {
                pptdfNode = { id: idCounter++, name: pptdfType, type: 'pptdf', children: [], value: 0, parent: domainNode };
                this.idMap.set(pptdfNode.id, pptdfNode);
                domainPptdfs.set(pptdfType, pptdfNode);
                domainNode.children.push(pptdfNode);
                controlMaps.set(pptdfNode, new Map());
            }

            // 3. Control
            const controlId = ctrl['SCF #'];
            if (!controlId) return;

            const pptdfControls = controlMaps.get(pptdfNode);
            let controlNode = pptdfControls.get(controlId);
            const weighting = parseInt(ctrl['Relative Control Weighting']) || 1;

            if (!controlNode) {
                controlNode = {
                    id: idCounter++,
                    name: controlId,
                    fullName: ctrl['SCF Control'],
                    type: 'control',
                    children: [],
                    value: weighting,
                    parent: pptdfNode,
                    description: ctrl['Secure Controls Framework (SCF)\nControl Description'] || ''
                };
                this.idMap.set(controlNode.id, controlNode);
                pptdfControls.set(controlId, controlNode);
                pptdfNode.children.push(controlNode);

                pptdfNode.value += weighting;
                domainNode.value += weighting;
                root.value += weighting;
            }

            // 4. Mappings
            this.regimes.forEach(regime => {
                const mapping = ctrl[regime];
                if (mapping && mapping.trim().length > 0) {
                    mapping.split(/\r?\n|\r|,/).map(s => s.trim()).filter(s => s.length > 0).forEach(id => {
                        const mappingNode = {
                            id: idCounter++,
                            name: id,
                            regime: regime.replace(/\r?\n|\r/g, ' ').trim(),
                            type: 'mapping',
                            parent: controlNode,
                            value: 1
                        };
                        this.idMap.set(mappingNode.id, mappingNode);
                        controlNode.children.push(mappingNode);
                    });
                }
            });
        });
        console.timeEnd('HierarchyBuild');

        this.hierarchy = root;
    }

    getDomainDescription(name) {
        if (!this.domains) return '';
        const domain = this.domains.find(d => d['SCF Domain'] === name);
        return domain ? domain['Principle Intent'] : '';
    }

    findNodeByName(name) {
        const term = name.toLowerCase();
        for (const node of this.idMap.values()) {
            if (node.name.toLowerCase().includes(term) || (node.fullName && node.fullName.toLowerCase().includes(term))) {
                return node;
            }
        }
        return null;
    }
}
