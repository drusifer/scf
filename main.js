import { DataProcessor } from './src/data-processor.js';
import { VizEngine } from './src/viz-engine.js';
import { Navbar } from './src/components/Navbar.js';
import { Sidebar } from './src/components/Sidebar.js';
import { RegimeCatalog } from './src/components/RegimeCatalog.js';
import { DetailPanel } from './src/components/DetailPanel.js';

const processor = new DataProcessor();
const engine = new VizEngine('canvas-container');
const navbar = new Navbar('navbar');
const sidebar = new Sidebar('sidebar');
const catalog = new RegimeCatalog('regime-list');
const detailPanel = new DetailPanel('detail-panel');

const controlsUrl = './data/scf_controls.csv';
const domainsUrl = './data/scf_domains.csv';

let currentPath = [];

async function init() {
    const loadingText = document.getElementById('loading-text');
    try {
        console.log('--- SCF INITIALIZATION START ---');

        console.log('Step 1: Fetching CSV Data...');
        loadingText.innerText = 'Downloading SCF 2025.4 Data...';
        const hierarchy = await processor.loadData(controlsUrl, domainsUrl);
        console.log('Data Loaded & Parsed. Total Nodes mapped:', processor.idMap.size);

        console.log('Step 2: Initializing 3D Scene...');
        loadingText.innerText = 'Creating 3D Scene...';
        // Initial render: show top-level Domains nested in Root
        engine.renderHierarchy(hierarchy, 1);

        console.log('Step 3: Building HUD Components...');
        loadingText.innerText = 'Finalizing Interface...';
        sidebar.render(hierarchy);
        catalog.render(processor.regimes);

        setupEventListeners(hierarchy);

        // Default selection
        console.log('Step 4: Setting Default Regime (NIST CSF 2.0)');
        catalog.onToggle(['NIST CSF 2.0']);

        // Show UI
        console.log('Step 5: Transitioning UI...');
        document.getElementById('loader').style.display = 'none';

        ['navbar', 'sidebar', 'catalog', 'detail-panel', 'physics-panel'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('hidden');
        });

        // Seed the default regime filter in the engine BEFORE rendering
        engine.currentRegimes = ['NIST CSF 2.0'];

        // Initial view - Start OUTSIDE the top-level SCF bubble
        engine.renderHierarchy(hierarchy, 1, false);

        console.log('--- SCF INITIALIZATION COMPLETE ---');
    } catch (error) {
        console.error('CRITICAL INITIALIZATION ERROR:', error);
        loadingText.className = 'font-outfit text-xl font-bold text-red-500';
        loadingText.innerText = `Error: ${error.message}. Open Console for details.`;
        const spinner = document.querySelector('.animate-spin');
        if (spinner) spinner.style.display = 'none';
    }
}

function setupEventListeners(hierarchy) {
    document.getElementById('poly-toggle').addEventListener('change', (e) => {
        engine.setLowPoly(e.target.checked);
    });

    // 3D Node Click (Drilling)
    engine.onNodeClick = (node) => {
        console.log('Interaction: Drilling into', node.name);
        handleDrillDown(node);
    };

    // Sidebar Selection
    sidebar.onSelect = (nodeId, type) => {
        const node = processor.lookupNodeById(parseInt(nodeId));
        if (node) {
            handleDrillDown(node);
        }
    };

    // Regime Catalog Toggle
    catalog.onToggle = (selectedRegimes) => {
        engine.highlightRegimes(selectedRegimes, catalog.colors);
    };

    // Navbar Breadcrumbs
    navbar.onBreadcrumbClick = (target, index) => {
        if (!target) {
            // Zoom out to Root
            engine.renderHierarchy(hierarchy, 1);
            currentPath = [];
            navbar.update([]);
        } else {
            const node = processor.lookupNodeById(target.id);
            if (node) {
                handleDrillDown(node);
            }
        }
    };

    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        if (term.length < 3) return;

        const match = processor.findNodeByName(term);
        if (match) {
            handleDrillDown(match);
        }
    });

    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.nodeId) {
            const node = processor.lookupNodeById(e.state.nodeId);
            if (node) handleDrillDown(node, false);
        }
    });

    // Physics Controls
    const repSlider = document.getElementById('repulsion-slider');
    const linkSlider = document.getElementById('link-dist-slider');
    const boundSlider = document.getElementById('bounds-scale-slider');

    repSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        document.getElementById('repulsion-val').innerText = val;
        engine.updatePhysics({ repulsion: val });
    });

    linkSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        document.getElementById('link-dist-val').innerText = val;
        engine.updatePhysics({ linkDist: val });
    });

    boundSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        document.getElementById('bounds-scale-val').innerText = val.toFixed(1);
        engine.updatePhysics({ boundsScale: val });
    });

    const depthSlider = document.getElementById('view-depth-slider');
    depthSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        document.getElementById('view-depth-val').innerText = val;
        // Re-render current view with new depth
        if (engine.currentViewRoot) {
            handleDrillDown(engine.currentViewRoot, false);
        }
    });
}

async function handleDrillDown(node, pushHistory = true) {
    if (!node) return;

    // Determine level to show. If it's a leaf (mapping), drill to parent (control)
    const target = node.type === 'mapping' ? node.parent : node;

    // Use current depth from slider
    const depthSlider = document.getElementById('view-depth-slider');
    const maxDepth = depthSlider ? parseInt(depthSlider.value) : 1;

    // NAVIGATION LOGIC - Fly into the node if we are outside it
    if (!engine.isInside || engine.currentViewRoot.id !== target.id) {
        console.log(`Transitioning inside: ${target.name}`);
        await engine.transitionToNode(target, maxDepth);
    } else {
        // Already inside this node, just refresh (e.g. depth slider move)
        engine.renderHierarchy(target, maxDepth, true);
    }

    if (pushHistory) {
        window.history.pushState({ nodeId: target.id }, '', `#${target.id}`);
    }

    updateBreadcrumbs(target);
    detailPanel.update(target);
}

function updateBreadcrumbs(node) {
    const path = [];
    let current = node;
    while (current && current.type !== 'root') {
        path.unshift({ id: current.id, name: current.name, type: current.type });
        current = current.parent;
    }
    currentPath = path;
    navbar.update(currentPath);
}

init();
