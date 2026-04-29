import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Papa from "papaparse";
global.Papa = Papa;
import { FrameworkDataProcessor } from "../../framework_processor.js";
import { FRAMEWORK_CONFIGS } from "../../framework_configs.js";

// --- Minimal CSV fixtures ---

const SCF_CSV = [
    "SCF Domain,Base ID,SCF Control,SCF #,Secure Controls Framework (SCF) Control Description,SCRM TAGS,Conformity Validation Cadence,Evidence Request List (ERL) #,Col8,Col9,Col10,Col11,Col12,Col13,Relative Control Weighting,\"PPTDF\nApplicability\",NIST CSF Function Grouping,C17,C18,C19,C20,C21,C22,C23,C24,C25,C26,C27,C28,C29,REGIME_A,REGIME_B",
    "Cybersecurity,AC,Access Control,AC-1,Ensure access is controlled.,TIER 1 STRATEGIC,Annual,ERL-1,,,,,,,2.5,Applicable,IDENTIFY,,,,,,,,,,,,,,X,\"AC-1, AC-2\"",
    "Cybersecurity,AC,Access Control,AC-2,Manage accounts.,TIER 2 OPERATIONAL,Annual,ERL-2,,,,,,,1.0,Applicable,IDENTIFY,,,,,,,,,,,,,,,\"AC-2\""
].join("\n");

const CRI_CSV = [
    "Profile Id,Outline Id,Function,Category,Subcategory,Weighting,CRI TIER TAGS,CRI Profile v2.1 Diagnostic Statement,CRI SUBJECT TAGS,NYDFS PART 500,NYDFS PART 500 TAGS,FFIEC CAT,FFIEC CAT TAGS",
    "GV.OC-01.01,3.001,GOVERN,Organizational Context,Organizational Mission,10.0,\"Tier: 1\",\"Org has a mission statement.\",\"#governance\",I.2.2,Foundational,A.1,Core",
    "GV.OC-01.02,3.002,GOVERN,Organizational Context,Organizational Mission,5.0,\"Tier: 2\",\"Org reviews mission annually.\",\"#governance\n#strategy\",,N/A,A.2,Core"
].join("\n");

const DOMAINS_CSV = [
    "SCF Domain,Principle Intent",
    "Cybersecurity,Protect systems"
].join("\n");

const CRI_DOMAINS_CSV = [
    "Function,Profile Id,Diagnostic Statement",
    "GOVERN,GV,Governs the org"
].join("\n");

function makeProcessor(config, controlsCsv, domainsCsv) {
    const proc = new FrameworkDataProcessor(config);
    proc.loadCSV = async (url) => {
        const csv = url.includes("domains") || url.includes("cri_domains") ? domainsCsv : controlsCsv;
        return Papa.parse(csv, { header: true, skipEmptyLines: true });
    };
    return proc;
}

function makeFileProcessor(config) {
    const proc = new FrameworkDataProcessor(config);
    proc.loadCSV = async (url) => {
        const filePath = path.join(__dirname, "..", "..", url);
        const csv = fs.readFileSync(filePath, "utf8");
        return Papa.parse(csv, { header: true, skipEmptyLines: true });
    };
    return proc;
}

// --- S4-1: Config structure tests ---

test("FRAMEWORK_CONFIGS has scf and cri entries", () => {
    assert.ok(FRAMEWORK_CONFIGS.scf, "scf config missing");
    assert.ok(FRAMEWORK_CONFIGS.cri, "cri config missing");
});

test("SCF config has required schema fields", () => {
    const s = FRAMEWORK_CONFIGS.scf.schema.controls;
    assert.ok(s.domain_col);
    assert.ok(s.control_id_col);
    assert.ok(Array.isArray(s.tag_cols));
    assert.equal(s.mapping_tag_suffix, null);
    assert.equal(typeof s.regime_start_col, "number");
});

test("CRI config has required schema fields", () => {
    const s = FRAMEWORK_CONFIGS.cri.schema.controls;
    assert.ok(s.domain_col);
    assert.ok(s.control_id_col);
    assert.ok(Array.isArray(s.tag_cols));
    assert.equal(s.mapping_tag_suffix, " TAGS");
    assert.equal(s.regime_start_col, null);
});

test("both configs have empty default_regimes", () => {
    assert.deepEqual(FRAMEWORK_CONFIGS.scf.default_regimes, []);
    assert.deepEqual(FRAMEWORK_CONFIGS.cri.default_regimes, []);
});

// --- S4-2: FrameworkDataProcessor tests ---

test("SCF processor: _detectRegimes uses positional slicing", async () => {
    const proc = makeProcessor(FRAMEWORK_CONFIGS.scf, SCF_CSV, DOMAINS_CSV);
    await proc.init();
    // SCF_CSV has regime_start_col=30; our fixture only has 31 cols (0-30), regime is at 30 and 31
    // With regime_start_col=30, indices 30 and 31 are REGIME_A and REGIME_B
    assert.equal(proc.regimeList.length, 2);
    assert.ok(proc.regimeList.some(r => r.fullName === "REGIME_A"));
    assert.ok(proc.regimeList.some(r => r.fullName === "REGIME_B"));
});

test("CRI processor: _detectRegimes uses TAGS suffix detection", async () => {
    const config = { ...FRAMEWORK_CONFIGS.cri, files: { controls: "controls.csv", domains: "domains.csv" } };
    const proc = makeProcessor(config, CRI_CSV, CRI_DOMAINS_CSV);
    await proc.init();
    assert.ok(proc.regimeList.some(r => r.fullName === "NYDFS PART 500"));
    assert.ok(proc.regimeList.some(r => r.fullName === "FFIEC CAT"));
    // tag cols themselves must not appear as regimes
    assert.ok(!proc.regimeList.some(r => r.fullName === "CRI TIER TAGS"));
    assert.ok(!proc.regimeList.some(r => r.fullName === "CRI SUBJECT TAGS"));
});

test("SCF processor: control nodes have tags[] (empty — tag_cols: [])", async () => {
    // SCF tag_cols is [] because SCRM columns are binary flags not suitable for categorical filter.
    const proc = makeProcessor(FRAMEWORK_CONFIGS.scf, SCF_CSV, DOMAINS_CSV);
    const tree = await proc.init();
    const leaves = [];
    const walk = (node) => {
        if (!node.children || node.children.length === 0) leaves.push(node);
        else node.children.forEach(walk);
    };
    tree.children.forEach(walk);
    assert.ok(leaves.length > 0, "no leaf nodes");
    leaves.forEach(leaf => assert.ok(Array.isArray(leaf.tags), `leaf missing tags: ${leaf.name}`));
    const ac1 = leaves.find(l => l.name.startsWith("AC-1"));
    assert.ok(ac1, "AC-1 not found");
    assert.equal(ac1.tags.length, 0, "SCF tags should be empty (no tag_cols configured)");
});

test("CRI processor: control nodes have tags[] with both tag_cols", async () => {
    const config = { ...FRAMEWORK_CONFIGS.cri, files: { controls: "controls.csv", domains: "domains.csv" } };
    const proc = makeProcessor(config, CRI_CSV, CRI_DOMAINS_CSV);
    const tree = await proc.init();
    const leaves = [];
    const walk = (node) => {
        if (!node.children || node.children.length === 0) leaves.push(node);
        else node.children.forEach(walk);
    };
    tree.children.forEach(walk);
    const gv1 = leaves.find(l => l.name.includes("GV.OC-01.01"));
    assert.ok(gv1, "GV.OC-01.01 not found");
    assert.ok(gv1.tags.includes("#governance"), "CRI SUBJECT TAGS not included");
    assert.ok(gv1.tags.includes("Tier: 1"), "CRI TIER TAGS not included");
});

test("processor warns on missing schema column", async () => {
    const badConfig = JSON.parse(JSON.stringify(FRAMEWORK_CONFIGS.scf));
    badConfig.schema.controls.description_col = "NONEXISTENT COLUMN";
    const proc = makeProcessor(badConfig, SCF_CSV, DOMAINS_CSV);
    const warnings = [];
    const orig = console.warn;
    console.warn = (...args) => warnings.push(args.join(" "));
    await proc.init();
    console.warn = orig;
    assert.ok(warnings.some(w => w.includes("NONEXISTENT COLUMN")), "no warning for missing column");
});

test("SCF init returns tree with name from config", async () => {
    const proc = makeProcessor(FRAMEWORK_CONFIGS.scf, SCF_CSV, DOMAINS_CSV);
    const tree = await proc.init();
    assert.equal(tree.name, FRAMEWORK_CONFIGS.scf.name);
    assert.ok(Array.isArray(tree.children));
    assert.ok(tree.regimeList);
    assert.ok(tree.regimeCatalog);
});

test("hierarchyColumns and currentHierarchy come from config", () => {
    const proc = new FrameworkDataProcessor(FRAMEWORK_CONFIGS.scf);
    assert.deepEqual(proc.currentHierarchy, FRAMEWORK_CONFIGS.scf.default_hierarchy);
    assert.equal(proc.hierarchyColumns.length, FRAMEWORK_CONFIGS.scf.hierarchy_cols.length);
});

test("S8-1: SCF default hierarchy uses real PPTDF groups from CSV", async () => {
    const proc = makeFileProcessor(FRAMEWORK_CONFIGS.scf);
    const tree = await proc.init();
    const depthOneNames = tree.children.map(child => child.name).sort();
    ["Data", "Facility", "N/A", "People", "Process", "Technology"].forEach(group => {
        assert.ok(depthOneNames.includes(group), `missing PPTDF group: ${group}`);
    });
    assert.notDeepEqual(depthOneNames, ["Uncategorized"], "PPTDF hierarchy collapsed to Uncategorized");
});
