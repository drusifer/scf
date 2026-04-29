import test from "node:test";
import assert from "node:assert/strict";
import { buildTagFilterPredicate } from "../../tag_filter.js";

test("tag filter predicate - strict OR logic across all selected tags", () => {
    const tagGroupMap = new Map([
        ["TagA", "Group1"],
        ["TagB", "Group1"],
        ["TagC", "Group2"]
    ]);

    // Scenario 1: No active filters
    let predicate = buildTagFilterPredicate(tagGroupMap, new Set());
    assert.equal(predicate(["TagA"]), true, "Passes when no filters active");
    assert.equal(predicate([]), true, "Empty tags pass when no filters active");

    // Scenario 2: Single filter active
    predicate = buildTagFilterPredicate(tagGroupMap, new Set(["TagA"]));
    assert.equal(predicate(["TagA"]), true, "Matches exact tag");
    assert.equal(predicate(["TagB"]), false, "Filters OUT non-matching tag");
    assert.equal(predicate(["TagC"]), false, "Filters OUT tag from different group");
    assert.equal(predicate([]), false, "Filters OUT nodes with no tags");

    // Scenario 3: Multiple filters active (OR logic)
    predicate = buildTagFilterPredicate(tagGroupMap, new Set(["TagA", "TagC"]));
    assert.equal(predicate(["TagA"]), true, "Matches first tag");
    assert.equal(predicate(["TagC"]), true, "Matches second tag");
    assert.equal(predicate(["TagA", "TagC"]), true, "Matches both tags");
    assert.equal(predicate(["TagB"]), false, "Filters OUT tag not in selection");
});
