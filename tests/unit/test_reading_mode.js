const test = require("node:test");
const assert = require("node:assert/strict");

const {
    FOCUS_LABEL_FONT_SIZE,
    MIN_LABEL_FONT_SIZE,
    getGrandchildQuota,
    getLabelDensityTier,
    getLabelEligibility,
    getLabelFontSize
} = require("../../reading_mode.js");

test("focus and first two descendant levels are the only eligible reading tiers", () => {
    assert.equal(getLabelDensityTier({ nodeDepth: 4, focusDepth: 4, projectedRadius: 120 }), "focus");
    assert.equal(getLabelDensityTier({ nodeDepth: 5, focusDepth: 4, projectedRadius: 40 }), "child");
    assert.equal(
        getLabelDensityTier({
            nodeDepth: 6,
            focusDepth: 4,
            projectedRadius: 28,
            siblingIndex: 1,
            focusProjectedRadius: 144
        }),
        "grandchild"
    );
    assert.equal(getLabelDensityTier({ nodeDepth: 7, focusDepth: 4, projectedRadius: 40 }), "hidden");
    assert.equal(getLabelDensityTier({ nodeDepth: 3, focusDepth: 4, projectedRadius: 80 }), "hidden");
});

test("child labels keep a readable font floor", () => {
    const fontSize = getLabelFontSize({
        nodeDepth: 5,
        focusDepth: 4,
        projectedRadius: 18,
        focusProjectedRadius: 160
    });

    assert.ok(fontSize >= MIN_LABEL_FONT_SIZE);
    assert.equal(
        getLabelEligibility({
            nodeDepth: 5,
            focusDepth: 4,
            projectedRadius: 18,
            focusProjectedRadius: 160
        }),
        true
    );
});

test("grandchild labels require projected size and available density budget", () => {
    assert.equal(
        getLabelEligibility({
            nodeDepth: 6,
            focusDepth: 4,
            projectedRadius: 20,
            siblingIndex: 0,
            focusProjectedRadius: 200
        }),
        false
    );

    assert.equal(
        getLabelEligibility({
            nodeDepth: 6,
            focusDepth: 4,
            projectedRadius: 28,
            siblingIndex: 5,
            focusProjectedRadius: 192
        }),
        false
    );

    assert.equal(
        getLabelEligibility({
            nodeDepth: 6,
            focusDepth: 4,
            projectedRadius: 28,
            siblingIndex: 2,
            focusProjectedRadius: 192
        }),
        true
    );
});

test("focus labels stay prominent while descendants cap at readable bounds", () => {
    assert.equal(
        getLabelFontSize({ nodeDepth: 4, focusDepth: 4, projectedRadius: 140, focusProjectedRadius: 140 }),
        FOCUS_LABEL_FONT_SIZE
    );
    assert.equal(getGrandchildQuota(192), 4);
    assert.equal(getGrandchildQuota(47), 0);
});
