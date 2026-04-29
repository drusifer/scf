import test from "node:test";
import assert from "node:assert/strict";
import { buildRegimeTreeOptions } from "../../regime_grouping.js";

test("regimes are grouped by first word when count >= 2", () => {
    const regimes = [
        { id: 1, name: "CRI 1.0" },
        { id: 2, name: "CRI 2.0" },
        { id: 3, name: "SCF 1" }
    ];
    
    const options = buildRegimeTreeOptions(regimes);
    
    // CRI prefix appears twice -> Grouped
    const criGroup = options.find(o => o.value === "grp-CRI");
    assert.ok(criGroup);
    assert.equal(criGroup.children.length, 2);
    
    // SCF prefix appears once -> Flat leaf
    const scfLeaf = options.find(o => o.value === 3);
    assert.ok(scfLeaf);
    assert.equal(scfLeaf.name, "SCF 1");
});
