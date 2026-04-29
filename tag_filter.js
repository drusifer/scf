// Pure tag-filter predicate builder.
// Returns a function(tags[]) → boolean that passes controls where 
// at least one of the control's tags is in the active filter set.
// If no filters are active, all controls pass.
export function buildTagFilterPredicate(tagGroupMap, activeTagFilters) {
    if (activeTagFilters.size === 0) {
        return () => true;
    }

    return function controlPassesFilter(tags) {
        if (!tags || tags.length === 0) {
            return false;
        }
        return tags.some(tag => activeTagFilters.has(tag));
    };
}
