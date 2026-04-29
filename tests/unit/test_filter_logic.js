import test from "node:test";
import assert from "node:assert/strict";
import { FilterLogic } from "../../filter_logic.js";

/**
 * Mock D3-like node structure for testing FilterLogic.
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

test("FilterLogic - polymorphic matching and recursive visibility", () => {
    // Structure: Root(0) -> Domain(1) -> Control(4) -> RegimeGroup(5) -> Mapping(6)
    const data = {
        name: "Root",
        children: [{
            name: "Domain A",
            children: [{
                name: "Control A1", 
                tags: ["#architecture"],
                regimeQualityTags: {
                    1: { "MAP-1": "Relationship: Intersects; Type: Full" }
                },
                children: [{
                    name: "Regime 1",
                    regimeId: 1,
                    children: [{ name: "MAP-1" }] // depth 6
                }]
            }]
        }]
    };

    const root = createMockNode(data);
    const domain = root.children[0];
    const control = domain.children[0];
    const regime = control.children[0];
    const mapping = regime.children[0];

    // Fix depths
    root.depth = 0; domain.depth = 1; control.depth = 4; regime.depth = 5; mapping.depth = 6;

    // Case 1: Match everything
    let matchMap = FilterLogic.calculateMatchMap(root, null, new Set(["Subject Area: #architecture"]), null, new Set());
    assert.equal(matchMap.get(control), true, "Control matches tag");
    assert.equal(matchMap.get(domain), true, "Domain inherits visibility");

    // Case 2: Fail tag filter
    matchMap = FilterLogic.calculateMatchMap(root, null, new Set(["Subject Area: #wrong"]), null, new Set());
    assert.equal(matchMap.get(control), false, "Control fails tag");
    assert.equal(matchMap.get(domain), false, "Domain hidden when no visible children");

    // Case 3: Match labeled mapping metadata
    matchMap = FilterLogic.calculateMatchMap(root, null, new Set(["Relationship: Intersects"]), null, new Set());
    assert.equal(matchMap.get(mapping), true, "Mapping matches metadata");
    assert.equal(matchMap.get(control), true, "Control visible because mapping matches");

    // Case 4: AND logic between categories (Tag + Metadata)
    // Control has #architecture AND Mapping has Type: Full
    // Filters are passed to calculateMatchMap which combines them.
    matchMap = FilterLogic.calculateMatchMap(root, null, new Set(["Subject Area: #architecture"]), null, new Set(["Type: Full"]));
    assert.equal(matchMap.get(mapping), true, "Matches both");
    
    matchMap = FilterLogic.calculateMatchMap(root, null, new Set(["Subject Area: #wrong"]), null, new Set(["Type: Full"]));
    assert.equal(matchMap.get(mapping), false, "Fails because one category (Tag) fails");
});
