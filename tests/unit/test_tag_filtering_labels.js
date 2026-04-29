import test from "node:test";
import assert from "node:assert/strict";
import { FilterLogic } from "../../filter_logic.js";

/**
 * Mock D3-like node structure.
 */
function createMockNode(data, parent = null, depth = 0) {
    const node = {
        data: {
            ...data,
            nodeType: data.nodeType || (data.tags ? "control" : (data.regimeId !== undefined ? (data.children ? "regime" : "mapping") : "container"))
        },
        parent,
        depth,
        children: null,
        descendants: function() {
            let results = [this];
            if (this.children) {
                this.children.forEach(c => {
                    results = results.concat(c.descendants());
                });
            }
            return results;
        },
        eachAfter: function(callback) {
            if (this.children) {
                this.children.forEach(c => c.eachAfter(callback));
            }
            callback(this);
        },
        each: function(callback) {
            callback(this);
            if (this.children) {
                this.children.forEach(c => c.each(callback));
            }
        }
    };
    if (data.children) {
        node.children = data.children.map(c => createMockNode(c, node, depth + 1));
    }
    return node;
}

test("TagMatcher - matches simple tags with 'Other:' label prefix", () => {
    // Structure: Root(0) -> Domain(1) -> Control(4)
    const data = {
        name: "Root",
        children: [{
            name: "Domain A",
            children: [{
                name: "Control 1",
                tags: ["#architecture"]
            }]
        }]
    };
    const root = createMockNode(data);
    const domain = root.children[0];
    const control = domain.children[0];
    
    // Set depths to match expectations in FilterLogic
    root.depth = 0;
    domain.depth = 1;
    control.depth = 4;

    const activeTags = new Set(["Subject Area: #architecture"]);
    const matchMap = FilterLogic.calculateMatchMap(root, null, activeTags, null, new Set());

    assert.equal(matchMap.get(control), true, "Should match '#architecture' when 'Subject Area: #architecture' filter is active");
    assert.equal(matchMap.get(domain), true, "Domain should be visible because child control matches");
});

test("TagMatcher - matches labeled tags correctly", () => {
    const data = {
        name: "Root",
        children: [{
            name: "Domain A",
            children: [{
                name: "Control 2",
                tags: ["CRI SUBJECT TAGS: #architecture"]
            }]
        }]
    };
    const root = createMockNode(data);
    const domain = root.children[0];
    const control = domain.children[0];
    
    root.depth = 0;
    domain.depth = 1;
    control.depth = 4;

    const activeTags = new Set(["CRI SUBJECT TAGS: #architecture"]);
    const matchMap = FilterLogic.calculateMatchMap(root, null, activeTags, null, new Set());

    assert.equal(matchMap.get(control), true, "Should match exactly labeled tag");
    assert.equal(matchMap.get(domain), true, "Domain should be visible");
});
