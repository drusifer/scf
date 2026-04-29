import test from "node:test";
import assert from "node:assert/strict";
import { SCFSizing } from "../../viz_sizing.js";

const {
    getLeafSizeValue,
    getMappedLeafValue,
    getVisibleMappingLeafCount
} = {
    getLeafSizeValue: (d, s) => SCFSizing.getLeafSizeValue(d, s),
    getMappedLeafValue: (n, v, s) => SCFSizing.getMappedLeafValue(n, v, s),
    getVisibleMappingLeafCount: (m, s) => SCFSizing.getVisibleMappingLeafCount(m, s)
};

test("leaf sizing uses weight by default and 1 for uniform", () => {
    const d = { weight: "2.5" };
    assert.equal(getLeafSizeValue(d, "weight"), 2.5);
    assert.equal(getLeafSizeValue(d, "uniform"), 1);
    assert.equal(getLeafSizeValue({}, "weight"), 1.0);
});

test("mapped leaf value is proportional to weight and shared among visible identifiers", () => {
    const nodeData = { weight: "3.0" };
    // Weight mode: 3.0 / 2 = 1.5
    assert.equal(getMappedLeafValue(nodeData, 2, "weight"), 1.5);
    // Uniform mode: 1 / 2 = 0.5
    assert.equal(getMappedLeafValue(nodeData, 2, "uniform"), 0.5);
});

test("visible mapping leaf count only includes selected regimes", () => {
    const mappings = {
        "1": ["ID1", "ID2"],
        "2": ["ID3"]
    };
    const selected = new Set([1]);
    assert.equal(getVisibleMappingLeafCount(mappings, selected), 2);
    
    selected.add(2);
    assert.equal(getVisibleMappingLeafCount(mappings, selected), 3);
    
    assert.equal(getVisibleMappingLeafCount(mappings, new Set([3])), 0);
    assert.equal(getVisibleMappingLeafCount(null, selected), 0);
});
