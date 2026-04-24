# Sprint Weighting Oracle Summary

## Question
How should `sprint_weighting` be implemented, and what code already exists?

## Answer
- Implement the feature in `index.html`
- Keep the default sizing mode as weighted impact
- Persist the mode in `localStorage`
- Use `node.weight` for weighted leaf sizing and `1` for uniform sizing
- Preserve the existing hierarchy/data processor because `scf_processor.js` already parses `Relative Control Weighting`

## Sources
- `agents/cypher.docs/sprint_weighting.md`
- `agents/morpheus.docs/sprint_weighting_arch.md`
- `scf_processor.js`
