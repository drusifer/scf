import test from "node:test";
import assert from "node:assert/strict";
import { SCFReadingMode } from "../../reading_mode.js";

const {
    FOCUS_LABEL_FONT_SIZE,
    getGrandchildQuota,
    getLabelDensityTier,
    getLabelEligibility,
    getLabelFontSize
} = {
    FOCUS_LABEL_FONT_SIZE: SCFReadingMode.FOCUS_LABEL_FONT_SIZE,
    getGrandchildQuota: (v) => SCFReadingMode.getGrandchildQuota(v),
    getLabelDensityTier: (m) => SCFReadingMode.getLabelDensityTier(m),
    getLabelEligibility: (m) => SCFReadingMode.getLabelEligibility(m),
    getLabelFontSize: (m) => SCFReadingMode.getLabelFontSize(m)
};

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
    assert.equal(getLabelDensityTier({ nodeDepth: 7, focusDepth: 4, projectedRadius: 10 }), "off");
});

test("eligibility follows radius and sibling quota rules", () => {
    // Focus always eligible
    assert.equal(getLabelEligibility({ nodeDepth: 4, focusDepth: 4, projectedRadius: 10 }), true);

    // Child needs radius > 20
    assert.equal(getLabelEligibility({ nodeDepth: 5, focusDepth: 4, projectedRadius: 25 }), true);
    assert.equal(getLabelEligibility({ nodeDepth: 5, focusDepth: 4, projectedRadius: 15 }), false);

    // Grandchild needs radius > 25 AND sibling index < quota
    // At focusProjectedRadius 144, quota is 2
    assert.equal(
        getLabelEligibility({
            nodeDepth: 6,
            focusDepth: 4,
            projectedRadius: 28,
            siblingIndex: 1,
            focusProjectedRadius: 144
        }),
        true
    );
    assert.equal(
        getLabelEligibility({
            nodeDepth: 6,
            focusDepth: 4,
            projectedRadius: 28,
            siblingIndex: 2,
            focusProjectedRadius: 144
        }),
        false
    );

    // At focusProjectedRadius 192, quota is 4
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
