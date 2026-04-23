const test = require("node:test");
const assert = require("node:assert/strict");

const {
    SIZE_BY_UNIFORM,
    SIZE_BY_WEIGHT,
    getControlSizeBudget,
    getLeafSizeValue,
    getMappedLeafValue,
    getVisibleMappingLeafCount
} = require("../../viz_sizing.js");

test("weighted controls use relative control weight", () => {
    assert.equal(getLeafSizeValue({ weight: 7 }, SIZE_BY_WEIGHT), 35);
    assert.equal(getLeafSizeValue({ weight: 21 }, SIZE_BY_WEIGHT), 105);
});

test("uniform sizing ignores weight differences", () => {
    assert.equal(getLeafSizeValue({ weight: 7 }, SIZE_BY_UNIFORM), 1);
    assert.equal(getLeafSizeValue({ weight: 21 }, SIZE_BY_UNIFORM), 1);
});

test("mapped controls keep the same total weight budget regardless of mapping count", () => {
    const controlData = { weight: 7 };
    const totalVisibleLeaves = 14;
    const mappedLeafValue = getMappedLeafValue(controlData, totalVisibleLeaves, SIZE_BY_WEIGHT);

    assert.equal(mappedLeafValue, 2.5);
    assert.equal(mappedLeafValue * totalVisibleLeaves, getControlSizeBudget(controlData, SIZE_BY_WEIGHT));
});

test("higher-weight unmapped controls remain larger than lower-weight mapped controls", () => {
    const mappedControlTotal = getMappedLeafValue({ weight: 7 }, 14, SIZE_BY_WEIGHT) * 14;
    const unmappedControlTotal = getControlSizeBudget({ weight: 21 }, SIZE_BY_WEIGHT);

    assert.equal(mappedControlTotal, 35);
    assert.equal(unmappedControlTotal, 105);
    assert.ok(unmappedControlTotal > mappedControlTotal);
});

test("visible mapping leaf count only includes selected regimes", () => {
    const mappings = {
        1: ["A", "B", "C"],
        2: ["D"],
        3: ["E", "F"]
    };

    assert.equal(getVisibleMappingLeafCount(mappings, new Set([1, 3])), 5);
    assert.equal(getVisibleMappingLeafCount(mappings, new Set([2])), 1);
    assert.equal(getVisibleMappingLeafCount(mappings, new Set()), 0);
});
